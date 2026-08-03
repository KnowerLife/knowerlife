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
const consentChoice = localStorage.getItem('knowerlife-analytics-consent');
if (consentChoice === 'accepted') loadYandexMetrika();
if (consent && !consentChoice) consent.hidden = false;

document.querySelector('[data-consent-accept]')?.addEventListener('click', () => {
  localStorage.setItem('knowerlife-analytics-consent', 'accepted');
  consent.hidden = true;
  loadYandexMetrika();
});
document.querySelector('[data-consent-decline]')?.addEventListener('click', () => {
  localStorage.setItem('knowerlife-analytics-consent', 'declined');
  consent.hidden = true;
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
