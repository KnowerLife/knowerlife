const root = document.documentElement;
const basePath = root.dataset.base || './';
const isEnglish = root.lang === 'en';
const ui = {
  themeLight: isEnglish ? 'Switch to light theme' : 'Включить светлую тему',
  themeDark: isEnglish ? 'Switch to dark theme' : 'Включить тёмную тему',
  required: isEnglish ? 'Please check the required fields.' : 'Проверьте обязательные поля.',
  openingMail: isEnglish ? 'Opening your email app. The message is sent only after your confirmation.' : 'Открываю почтовое приложение. Письмо будет отправлено только после вашего подтверждения.',
  copied: isEnglish ? 'Message copied.' : 'Текст обращения скопирован.',
  copyError: isEnglish ? 'Automatic copy failed. Please select and copy the message manually.' : 'Не удалось скопировать автоматически. Выделите текст сообщения вручную.'
};

function getPreferredTheme() {
  const stored = localStorage.getItem('knowerlife-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  const button = document.querySelector('[data-theme-toggle]');
  if (button) {
    const isDark = theme === 'dark';
    button.textContent = isDark ? '☀' : '☾';
    button.setAttribute('aria-label', isDark ? ui.themeLight : ui.themeDark);
    button.setAttribute('title', button.getAttribute('aria-label'));
  }
}

applyTheme(getPreferredTheme());
document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('knowerlife-theme', next);
  applyTheme(next);
});

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');

function closeMenu({ restoreFocus = false } = {}) {
  if (!nav || !menuButton) return;
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => {
  const willOpen = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', willOpen);
  menuButton.setAttribute('aria-expanded', String(willOpen));
});

nav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('click', (event) => {
  if (nav?.classList.contains('is-open') && !header?.contains(event.target)) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('is-open')) closeMenu({ restoreFocus: true });
});

const headerObserver = new IntersectionObserver(([entry]) => {
  header?.classList.toggle('is-scrolled', !entry.isIntersecting);
}, { threshold: 1 });
const headerSentinel = document.querySelector('[data-header-sentinel]');
if (headerSentinel) headerObserver.observe(headerSentinel);

const revealObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
const sections = [...document.querySelectorAll('main section[id]')];
if (sectionLinks.length && sections.length) {
  const activeObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${visible.target.id}`));
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.25, 0.5] });
  sections.forEach((section) => activeObserver.observe(section));
}


const projectCards = [...document.querySelectorAll('[data-project-card]')];
const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
const projectSearch = document.querySelector('[data-project-search]');
const projectCount = document.querySelector('[data-project-count]');
const projectEmpty = document.querySelector('[data-project-empty]');
let activeProjectFilter = 'all';

function getProjectCountLabel(count) {
  if (isEnglish) return `${count} ${count === 1 ? 'project' : 'projects'}`;
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} проектов`;
  if (last === 1) return `${count} проект`;
  if (last >= 2 && last <= 4) return `${count} проекта`;
  return `${count} проектов`;
}

function applyProjectFilters() {
  if (!projectCards.length) return;
  const query = String(projectSearch?.value || '').trim().toLocaleLowerCase(root.lang);
  let visibleCount = 0;

  projectCards.forEach((card) => {
    const categories = String(card.dataset.categories || '').split(/\s+/);
    const searchable = String(card.dataset.search || card.textContent || '').toLocaleLowerCase(root.lang);
    const categoryMatches = activeProjectFilter === 'all' || categories.includes(activeProjectFilter);
    const queryMatches = !query || searchable.includes(query);
    const visible = categoryMatches && queryMatches;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  if (projectCount) projectCount.textContent = getProjectCountLabel(visibleCount);
  if (projectEmpty) projectEmpty.hidden = visibleCount !== 0;
}

projectFilters.forEach((button) => {
  button.addEventListener('click', () => {
    activeProjectFilter = button.dataset.projectFilter || 'all';
    projectFilters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyProjectFilters();
  });
});
projectSearch?.addEventListener('input', applyProjectFilters);
applyProjectFilters();

function getContactText(form) {
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const company = String(data.get('company') || '').trim();
  const message = String(data.get('message') || '').trim();
  const subject = isEnglish ? `Website inquiry — ${name}` : `Запрос с сайта KnowerLife — ${name}`;
  const body = [
    `${isEnglish ? 'Name' : 'Имя'}: ${name}`,
    `Email: ${email}`,
    company ? `${isEnglish ? 'Company/project' : 'Компания/проект'}: ${company}` : '',
    '',
    isEnglish ? 'Task:' : 'Задача:',
    message,
    '',
    `${isEnglish ? 'Source' : 'Источник'}: ${location.href}`
  ].filter(Boolean).join('\n');
  return { subject, body };
}

const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');

function setFormStatus(message, state = '') {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) {
    setFormStatus(ui.required, 'error');
    return;
  }
  const { subject, body } = getContactText(contactForm);
  const mailto = `mailto:info@knowerlife.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  setFormStatus(ui.openingMail, 'success');
  window.location.href = mailto;
});

document.querySelector('[data-copy-contact]')?.addEventListener('click', async () => {
  if (!contactForm?.reportValidity()) {
    setFormStatus(ui.required, 'error');
    return;
  }
  const { subject, body } = getContactText(contactForm);
  try {
    await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setFormStatus(ui.copied, 'success');
  } catch {
    setFormStatus(ui.copyError, 'error');
  }
});

function loadYandexMetrika() {
  if (window.ym) return;
  window.ym = window.ym || function ymProxy() { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(script);
  window.ym(97600908, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false
  });
}

const consent = document.querySelector('[data-consent]');
const consentStatus = document.querySelector('[data-consent-status]');

function readConsentChoice() {
  try { return localStorage.getItem('knowerlife-analytics-consent'); }
  catch { return null; }
}

function storeConsentChoice(value) {
  try { localStorage.setItem('knowerlife-analytics-consent', value); }
  catch { /* The site remains usable when storage is unavailable. */ }
}

function setConsentVisible(isVisible) {
  if (!consent) return;
  consent.hidden = !isVisible;
  document.body.classList.toggle('has-consent', isVisible);
}

const consentChoice = readConsentChoice();
if (consentChoice === 'accepted') loadYandexMetrika();
setConsentVisible(Boolean(consent && !consentChoice));

document.querySelector('[data-consent-accept]')?.addEventListener('click', () => {
  storeConsentChoice('accepted');
  setConsentVisible(false);
  loadYandexMetrika();
  if (consentStatus) consentStatus.textContent = isEnglish ? 'Analytics enabled.' : 'Аналитика разрешена.';
});
document.querySelector('[data-consent-decline]')?.addEventListener('click', () => {
  storeConsentChoice('declined');
  setConsentVisible(false);
  if (consentStatus) consentStatus.textContent = isEnglish ? 'Analytics remains disabled.' : 'Аналитика остаётся отключённой.';
});
document.querySelector('[data-consent-reset]')?.addEventListener('click', () => {
  try { localStorage.removeItem('knowerlife-analytics-consent'); } catch { /* Ignore storage restrictions. */ }
  if (consentStatus) consentStatus.textContent = isEnglish ? 'Choose an analytics option in the panel below.' : 'Выберите режим аналитики в панели ниже.';
  setConsentVisible(true);
  consent?.querySelector('button')?.focus();
});

document.querySelectorAll('[data-current-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', async () => {
    try {
      const workerUrl = new URL(`${basePath}service-worker.js`, location.href);
      const registration = await navigator.serviceWorker.register(workerUrl, { scope: new URL(basePath, location.href).pathname });
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  });
}

// v5: restrained motion and progress feedback.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.prepend(progressBar);

let progressFrame = 0;
function updateScrollProgress() {
  progressFrame = 0;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
  progressBar.style.transform = `scaleX(${progress})`;
}
function requestProgressUpdate() {
  if (progressFrame) return;
  progressFrame = window.requestAnimationFrame(updateScrollProgress);
}
window.addEventListener('scroll', requestProgressUpdate, { passive: true });
window.addEventListener('resize', requestProgressUpdate);
updateScrollProgress();

// Small stagger inside visual groups; capped so content never feels slow.
document.querySelectorAll('.cards, .portfolio-grid, .steps, .deliverables-grid, .service-bento, .case-showcase, .process-track, .deliverables-bento').forEach((group) => {
  [...group.children].forEach((child, index) => {
    if (child.classList.contains('reveal')) {
      child.style.setProperty('--reveal-delay', `${Math.min(index * 55, 220)}ms`);
    }
  });
});

function animateMetric(element) {
  const original = element.textContent.trim();
  const match = original.match(/^(\d+)(.*)$/);
  if (!match || prefersReducedMotion) return;
  const target = Number(match[1]);
  const suffix = match[2];
  const duration = 900;
  const start = performance.now();
  const formatter = new Intl.NumberFormat(root.lang || 'ru');

  function frame(now) {
    const elapsed = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - elapsed) ** 3;
    element.textContent = `${formatter.format(Math.round(target * eased))}${suffix}`;
    if (elapsed < 1) window.requestAnimationFrame(frame);
  }
  element.textContent = `0${suffix}`;
  window.requestAnimationFrame(frame);
}

const metricValues = [...document.querySelectorAll('.metric strong, .hero-stat strong')];
if (metricValues.length && !prefersReducedMotion) {
  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateMetric(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.65 });
  metricValues.forEach((metric) => metricObserver.observe(metric));
}

// v6: contextual project navigator.
const navigatorRoot = document.querySelector('[data-project-navigator]');
if (navigatorRoot) {
  const content = isEnglish ? {
    idea: {
      title: 'Discovery session',
      copy: 'Capture the goal, users and constraints, then define the solution scope.',
      list: ['Context map', 'System boundaries', 'Analysis roadmap'],
      cta: 'Discuss discovery'
    },
    requirements: {
      title: 'System analysis sprint',
      copy: 'Bring conflicting inputs into one model and prepare a team-ready specification.',
      list: ['Requirements map', 'Process and data models', 'Acceptance criteria'],
      cta: 'Discuss analysis sprint'
    },
    integration: {
      title: 'Integration design',
      copy: 'Define contracts, data flow, failure handling and ownership across systems.',
      list: ['Integration landscape', 'API or event contracts', 'Error and retry scenarios'],
      cta: 'Discuss integration'
    },
    delivery: {
      title: 'Delivery support',
      copy: 'Keep engineering decisions aligned with requirements while the product is being built.',
      list: ['Engineering Q&A', 'Change impact analysis', 'Acceptance support'],
      cta: 'Discuss delivery support'
    }
  } : {
    idea: {
      title: 'Discovery-сессия',
      copy: 'Зафиксируем цель, пользователей, ограничения и определим состав решения.',
      list: ['Карта контекста', 'Границы системы', 'План дальнейшего анализа'],
      cta: 'Обсудить discovery'
    },
    requirements: {
      title: 'Спринт системного анализа',
      copy: 'Сведём противоречивые вводные в одну модель и подготовим пакет для команды.',
      list: ['Карта требований', 'Модели процессов и данных', 'Критерии приёмки'],
      cta: 'Обсудить спринт анализа'
    },
    integration: {
      title: 'Проектирование интеграции',
      copy: 'Опишем контракты, потоки данных, ошибки и ответственность систем.',
      list: ['Интеграционный контур', 'API или event-контракты', 'Сценарии ошибок и повторов'],
      cta: 'Обсудить интеграцию'
    },
    delivery: {
      title: 'Сопровождение реализации',
      copy: 'Сохраним соответствие между требованиями и продуктом во время разработки.',
      list: ['Ответы команде', 'Анализ изменений', 'Поддержка приёмки'],
      cta: 'Обсудить сопровождение'
    }
  };

  const title = navigatorRoot.querySelector('[data-nav-title]');
  const copy = navigatorRoot.querySelector('[data-nav-copy]');
  const list = navigatorRoot.querySelector('[data-nav-list]');
  const link = navigatorRoot.querySelector('[data-nav-link]');
  const buttons = [...navigatorRoot.querySelectorAll('[data-nav-option]')];

  function selectNavigatorOption(key) {
    const item = content[key] || content.idea;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.navOption === key)));
    if (title) title.textContent = item.title;
    if (copy) copy.textContent = item.copy;
    if (list) {
      list.replaceChildren(...item.list.map((text) => {
        const entry = document.createElement('li');
        entry.textContent = text;
        return entry;
      }));
    }
    if (link) link.textContent = item.cta;
  }

  buttons.forEach((button) => button.addEventListener('click', () => selectNavigatorOption(button.dataset.navOption)));
}

// v6: lightweight command palette. It is progressive enhancement and has no external dependency.
const navActions = document.querySelector('[data-nav-actions]');
if (navActions && typeof HTMLDialogElement !== 'undefined') {
  const commandButton = document.createElement('button');
  commandButton.type = 'button';
  commandButton.className = 'command-button';
  commandButton.setAttribute('aria-label', isEnglish ? 'Open quick navigation' : 'Открыть быстрый поиск');
  commandButton.setAttribute('title', commandButton.getAttribute('aria-label'));
  const commandIcon = document.createElement('span');
  commandIcon.textContent = '⌕';
  commandIcon.setAttribute('aria-hidden', 'true');
  const commandText = document.createElement('span');
  commandText.textContent = isEnglish ? 'Navigate' : 'Навигация';
  const commandKey = document.createElement('kbd');
  commandKey.textContent = '⌘K';
  commandButton.append(commandIcon, commandText, commandKey);
  navActions.prepend(commandButton);

  const dialog = document.createElement('dialog');
  dialog.className = 'command-dialog';
  dialog.setAttribute('aria-label', isEnglish ? 'Quick navigation' : 'Быстрая навигация');
  const searchWrap = document.createElement('div');
  searchWrap.className = 'command-search';
  const prompt = document.createElement('span');
  prompt.textContent = '>';
  prompt.setAttribute('aria-hidden', 'true');
  const search = document.createElement('input');
  search.type = 'search';
  search.autocomplete = 'off';
  search.placeholder = isEnglish ? 'Search pages, cases and tools…' : 'Поиск по разделам, кейсам и инструментам…';
  search.setAttribute('aria-label', search.placeholder);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'command-close';
  close.textContent = 'Esc';
  close.setAttribute('aria-label', isEnglish ? 'Close' : 'Закрыть');
  searchWrap.append(prompt, search, close);
  const results = document.createElement('ul');
  results.className = 'command-results';
  dialog.append(searchWrap, results);
  document.body.append(dialog);

  const brandHref = document.querySelector('.brand')?.getAttribute('href') || `${basePath}index.html`;
  const toolsHref = [...document.querySelectorAll('.nav-links a')].find((item) => /tools/i.test(item.getAttribute('href') || ''))?.getAttribute('href') || `${basePath}tools/index.html`;
  const baseItems = [
    { title: isEnglish ? 'Services' : 'Компетенции', description: isEnglish ? 'System analysis, integrations and delivery' : 'Системный анализ, интеграции и реализация', href: `${brandHref}#services` },
    { title: isEnglish ? 'Selected cases' : 'Избранные кейсы', description: isEnglish ? 'Detailed project stories' : 'Подробные истории проектов', href: `${brandHref}#cases` },
    { title: isEnglish ? 'Full portfolio' : 'Полное портфолио', description: isEnglish ? 'All 21 projects' : 'Все 21 проекта', href: `${brandHref}#portfolio` },
    { title: isEnglish ? 'Process' : 'Процесс работы', description: isEnglish ? 'From discovery to delivery' : 'От discovery до сопровождения', href: `${brandHref}#process` },
    { title: isEnglish ? 'Project navigator' : 'Навигатор по задаче', description: isEnglish ? 'Find the right starting format' : 'Подобрать формат старта', href: `${brandHref}#navigator` },
    { title: isEnglish ? 'Browser tools' : 'Инструменты', description: isEnglish ? '17 local utilities' : '17 локальных утилит', href: toolsHref },
    { title: isEnglish ? 'Project brief builder' : 'Конструктор брифа', description: isEnglish ? 'Create a structured Markdown brief' : 'Собрать структурированный Markdown', href: `${toolsHref}#brief` },
    { title: isEnglish ? 'Contact' : 'Контакты', description: isEnglish ? 'Discuss a challenge' : 'Обсудить задачу', href: `${brandHref}#contact` }
  ];

  document.querySelectorAll('.case-feature, #cases a.card').forEach((item) => {
    const heading = item.querySelector('h3');
    if (!heading) return;
    baseItems.push({
      title: heading.textContent.trim(),
      description: isEnglish ? 'Case study' : 'Подробный кейс',
      href: item.getAttribute('href')
    });
  });

  let visibleItems = [];
  let selectedIndex = 0;

  function renderCommandResults() {
    const query = search.value.trim().toLocaleLowerCase(root.lang);
    visibleItems = baseItems.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase(root.lang).includes(query));
    selectedIndex = Math.min(selectedIndex, Math.max(0, visibleItems.length - 1));
    results.replaceChildren();
    if (!visibleItems.length) {
      const empty = document.createElement('li');
      empty.className = 'command-empty';
      empty.textContent = isEnglish ? 'Nothing found' : 'Ничего не найдено';
      results.append(empty);
      return;
    }
    visibleItems.forEach((item, index) => {
      const row = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = item.href;
      anchor.setAttribute('aria-selected', String(index === selectedIndex));
      const titleElement = document.createElement('strong');
      titleElement.textContent = item.title;
      const descriptionElement = document.createElement('small');
      descriptionElement.textContent = item.description;
      anchor.append(titleElement, descriptionElement);
      anchor.addEventListener('click', () => dialog.close());
      anchor.addEventListener('mousemove', () => {
        selectedIndex = index;
        [...results.querySelectorAll('a')].forEach((linkElement, linkIndex) => linkElement.setAttribute('aria-selected', String(linkIndex === selectedIndex)));
      });
      row.append(anchor);
      results.append(row);
    });
  }

  function openCommand() {
    renderCommandResults();
    dialog.showModal();
    window.requestAnimationFrame(() => search.focus());
  }

  commandButton.addEventListener('click', openCommand);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  search.addEventListener('input', () => {
    selectedIndex = 0;
    renderCommandResults();
  });
  search.addEventListener('keydown', (event) => {
    if (!visibleItems.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectedIndex = (selectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + visibleItems.length) % visibleItems.length;
      renderCommandResults();
      results.querySelector('a[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = visibleItems[selectedIndex];
      if (selected) window.location.href = selected.href;
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close(); else openCommand();
    }
  });
}

// v6: compact/grid portfolio view, persisted locally.
const portfolioView = document.querySelector('[data-portfolio-view]');
const portfolioGrid = document.querySelector('#portfolio .portfolio-grid');
if (portfolioView && portfolioGrid) {
  const viewButtons = [...portfolioView.querySelectorAll('[data-portfolio-view-option]')];
  const storedView = localStorage.getItem('knowerlife-portfolio-view');
  let currentView = storedView === 'list' ? 'list' : 'grid';
  function applyPortfolioView(view) {
    currentView = view === 'list' ? 'list' : 'grid';
    portfolioGrid.dataset.view = currentView;
    viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.portfolioViewOption === currentView)));
    localStorage.setItem('knowerlife-portfolio-view', currentView);
  }
  viewButtons.forEach((button) => button.addEventListener('click', () => applyPortfolioView(button.dataset.portfolioViewOption)));
  applyPortfolioView(currentView);
}
