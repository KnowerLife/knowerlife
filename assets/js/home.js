const root = document.documentElement;
const isEnglish = root.lang === 'en';
const ui = {
  required: isEnglish ? 'Please check the required fields.' : 'Проверьте обязательные поля.',
  openingMail: isEnglish ? 'Opening your email app. The message is sent only after your confirmation.' : 'Открываю почтовое приложение. Письмо будет отправлено только после вашего подтверждения.',
  copied: isEnglish ? 'Message copied.' : 'Текст обращения скопирован.',
  copyError: isEnglish ? 'Automatic copy failed. Please select and copy the message manually.' : 'Не удалось скопировать автоматически. Выделите текст сообщения вручную.'
};
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const projectCards = [...document.querySelectorAll('[data-project-card]')];
const projectGrid = document.querySelector('[data-project-grid]');
const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
const projectSearch = document.querySelector('[data-project-search]');
const projectSort = document.querySelector('[data-project-sort]');
const projectCount = document.querySelector('[data-project-count]');
const projectEmpty = document.querySelector('[data-project-empty]');
let activeProjectFilter = 'all';
let activeProjectSort = 'default';
const originalProjectOrder = [...projectCards];

function getProjectCountLabel(count) {
  if (isEnglish) return `${count} ${count === 1 ? 'project' : 'projects'}`;
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} проектов`;
  if (last === 1) return `${count} проект`;
  if (last >= 2 && last <= 4) return `${count} проекта`;
  return `${count} проектов`;
}

function updatePortfolioUrl() {
  if (!projectCards.length) return;
  const url = new URL(window.location.href);
  const query = String(projectSearch?.value || '').trim();
  if (activeProjectFilter && activeProjectFilter !== 'all') url.searchParams.set('filter', activeProjectFilter);
  else url.searchParams.delete('filter');
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  if (activeProjectSort && activeProjectSort !== 'default') url.searchParams.set('sort', activeProjectSort);
  else url.searchParams.delete('sort');
  const view = projectGrid?.dataset.view;
  if (view === 'list') url.searchParams.set('view', 'list');
  else url.searchParams.delete('view');
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) history.replaceState(null, '', next);
}

function applyProjectSort() {
  if (!projectGrid || !projectCards.length) return;
  const sorted = [...originalProjectOrder].sort((a, b) => {
    if (activeProjectSort === 'title') {
      return (a.querySelector('h3')?.textContent || '').localeCompare(b.querySelector('h3')?.textContent || '', root.lang);
    }
    if (activeProjectSort === 'type') {
      return (a.querySelector('.project-type')?.textContent || '').localeCompare(b.querySelector('.project-type')?.textContent || '', root.lang)
        || (a.querySelector('h3')?.textContent || '').localeCompare(b.querySelector('h3')?.textContent || '', root.lang);
    }
    return originalProjectOrder.indexOf(a) - originalProjectOrder.indexOf(b);
  });
  sorted.forEach((card) => projectGrid.append(card));
}

function applyProjectFilters(syncUrl = true) {
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
  if (syncUrl) updatePortfolioUrl();
}

function initPortfolioFromUrl() {
  if (!projectCards.length) return;
  const params = new URLSearchParams(window.location.search);
  const filter = params.get('filter');
  const q = params.get('q');
  const view = params.get('view');
  const sort = params.get('sort');
  if (filter && projectFilters.some((button) => button.dataset.projectFilter === filter)) {
    activeProjectFilter = filter;
  }
  if (sort && ['default', 'title', 'type'].includes(sort)) {
    activeProjectSort = sort;
    if (projectSort) projectSort.value = sort;
  }
  projectFilters.forEach((button) => button.setAttribute('aria-pressed', String((button.dataset.projectFilter || 'all') === activeProjectFilter)));
  if (q && projectSearch) projectSearch.value = q;
  if (view === 'list' && projectGrid) {
    projectGrid.dataset.view = 'list';
    localStorage.setItem('knowerlife-portfolio-view', 'list');
  }
}

projectFilters.forEach((button) => {
  button.addEventListener('click', () => {
    activeProjectFilter = button.dataset.projectFilter || 'all';
    projectFilters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyProjectFilters();
  });
});
projectSearch?.addEventListener('input', () => applyProjectFilters());
projectSort?.addEventListener('change', () => {
  activeProjectSort = projectSort.value || 'default';
  applyProjectSort();
  applyProjectFilters();
});
initPortfolioFromUrl();
applyProjectSort();
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

// v6: compact/grid portfolio view, persisted locally.
const portfolioView = document.querySelector('[data-portfolio-view]');
if (portfolioView && projectGrid) {
  const viewButtons = [...portfolioView.querySelectorAll('[data-portfolio-view-option]')];
  const urlView = new URLSearchParams(window.location.search).get('view');
  const storedView = localStorage.getItem('knowerlife-portfolio-view');
  let currentView = urlView === 'list' || (!urlView && storedView === 'list') ? 'list' : 'grid';
  function applyPortfolioView(view) {
    currentView = view === 'list' ? 'list' : 'grid';
    projectGrid.dataset.view = currentView;
    viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.portfolioViewOption === currentView)));
    localStorage.setItem('knowerlife-portfolio-view', currentView);
    updatePortfolioUrl();
  }
  viewButtons.forEach((button) => button.addEventListener('click', () => applyPortfolioView(button.dataset.portfolioViewOption)));
  applyPortfolioView(currentView);
}
