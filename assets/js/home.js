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
