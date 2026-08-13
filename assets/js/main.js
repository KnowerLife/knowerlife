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


function readAccessibilityMode() {
  try { return localStorage.getItem('knowerlife-accessibility') === 'enhanced'; }
  catch { return false; }
}
function applyAccessibility(enabled) {
  if (enabled) root.dataset.accessibility = 'enhanced';
  else delete root.dataset.accessibility;
  document.querySelectorAll('[data-accessibility-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(enabled));
    const label = isEnglish
      ? (enabled ? 'Use standard accessibility mode' : 'Enhanced accessibility')
      : (enabled ? 'Обычный режим отображения' : 'Версия для слабовидящих');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.textContent = enabled ? 'A' : 'A+';
  });
}
applyAccessibility(readAccessibilityMode());
document.querySelectorAll('[data-accessibility-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const enabled = root.dataset.accessibility !== 'enhanced';
    try { localStorage.setItem('knowerlife-accessibility', enabled ? 'enhanced' : 'standard'); } catch {}
    applyAccessibility(enabled);
  });
});

let installPromptEvent = null;
const installButtons = [...document.querySelectorAll('[data-install-app]')];
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPromptEvent = event;
  installButtons.forEach((button) => { button.hidden = false; });
});
installButtons.forEach((button) => button.addEventListener('click', async () => {
  if (!installPromptEvent) return;
  installPromptEvent.prompt();
  try { await installPromptEvent.userChoice; } catch {}
  installPromptEvent = null;
  installButtons.forEach((item) => { item.hidden = true; });
}));
window.addEventListener('appinstalled', () => {
  installPromptEvent = null;
  installButtons.forEach((button) => { button.hidden = true; });
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


function loadYandexMetrika() {
  if (window.ym) return;
  if (document.querySelector('script[data-yandex-metrika]')) return;
  window.ym = window.ym || function ymProxy() { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const script = document.createElement('script');
  script.async = true;
  script.dataset.yandexMetrika = '';
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
const scheduleIdle = (callback, timeout = 1600) => {
  if ('requestIdleCallback' in window) return window.requestIdleCallback(callback, { timeout });
  return window.setTimeout(callback, Math.min(timeout, 800));
};
if (consentChoice === 'accepted') {
  window.addEventListener('load', () => scheduleIdle(loadYandexMetrika, 2400), { once: true });
}
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
  window.addEventListener('load', () => {
    scheduleIdle(async () => {
      try {
        const workerUrl = new URL(`${basePath}service-worker.js`, location.href);
        const registration = await navigator.serviceWorker.register(workerUrl, { scope: new URL(basePath, location.href).pathname });
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }, 3000);
  }, { once: true });
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


if (document.body.classList.contains('home-page')) {
  let homePromise;
  const loadHomeEnhancements = () => {
    homePromise ||= import('./home.js').catch((error) => console.warn('Home enhancements failed:', error));
    return homePromise;
  };
  const homeIntentEvents = ['pointerdown', 'focusin', 'keydown', 'touchstart'];
  const loadHomeOnIntent = () => {
    homeIntentEvents.forEach((eventName) => document.removeEventListener(eventName, loadHomeOnIntent, true));
    loadHomeEnhancements();
  };
  homeIntentEvents.forEach((eventName) => document.addEventListener(eventName, loadHomeOnIntent, { capture: true, once: true, passive: eventName !== 'keydown' }));
  window.addEventListener('load', () => scheduleIdle(loadHomeEnhancements, 1200), { once: true });
}
