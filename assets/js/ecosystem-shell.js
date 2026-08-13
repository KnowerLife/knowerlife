(() => {
  'use strict';
  if (window.__knowerlifeEcosystemShellLoaded) return;
  window.__knowerlifeEcosystemShellLoaded = true;

  const root = document.documentElement;
  const isEnglish = (root.lang || '').toLowerCase().startsWith('en');
  const basePath = root.dataset.base || './';
  const rootUrl = new URL(basePath, location.href);
  const rootPath = rootUrl.pathname.endsWith('/') ? rootUrl.pathname : `${rootUrl.pathname}/`;
  const relativePath = location.pathname.startsWith(rootPath) ? location.pathname.slice(rootPath.length) : '';
  const normalizedPath = relativePath.replace(/^\/+|\/+$/g, '');

  const cssHref = new URL('assets/css/ecosystem-shell.css', rootUrl).href;
  if (!document.querySelector('link[data-ecosystem-shell]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.dataset.ecosystemShell = '';
    document.head.append(link);
  }

  const text = isEnglish ? {
    ecosystem: 'Ecosystem', home: 'Home', portfolio: 'Portfolio', cases: 'Cases', services: 'Services', process: 'Process', contact: 'Contact',
    sa: 'SA Guide', tools: 'Browser Tools', creative: 'Creative Corner', music: 'Music', about: 'About', knowledge: 'Knowledge', workbench: 'Workbench', resources: 'Resources',
    privacy: 'Privacy', sitemap: 'Site map', analytics: 'Analytics', principles: 'Principles', contacts: 'Contacts',
    language: 'Russian version', accessibilityOn: 'Use standard accessibility', accessibilityOff: 'Enhanced accessibility', themeLight: 'Switch to light theme', themeDark: 'Switch to dark theme',
    install: 'Install KnowerLife', installTitle: 'Install KnowerLife', installReady: 'The app is ready to install.', installFallback: 'Installation is managed by your browser.', installed: 'KnowerLife is already running as an installed app.',
    nav: 'Navigation', currentPage: 'On this page', settings: 'Appearance & app', close: 'Close', print: 'Print / PDF',
    footerLead: 'System analysis, practical browser tools and creative technology in one coherent ecosystem.', explore: 'Explore', connect: 'Connect',
    pwa: 'One PWA', bilingual: 'RU / EN', accessible: 'Accessibility A+', local: 'Local-first', copyright: 'One domain · one PWA · one ecosystem',
    installStep1: 'Open the browser menu.', installStep2: 'Choose “Install app” or “Add to Home Screen”.', installStepIos1: 'Open this page in Safari.', installStepIos2: 'Tap Share, then “Add to Home Screen”.',
    mainDesc: 'Portfolio, cases and services', saDesc: '64 topics + analyst workbench', toolsDesc: '17 local browser utilities', creativeDesc: 'Music, AI and Suno portfolio'
  } : {
    ecosystem: 'Экосистема', home: 'Главная', portfolio: 'Портфолио', cases: 'Кейсы', services: 'Услуги', process: 'Процесс', contact: 'Контакты',
    sa: 'SA Guide', tools: 'Browser Tools', creative: 'Creative Corner', music: 'Музыка', about: 'О проекте', knowledge: 'База знаний', workbench: 'Workbench', resources: 'Ресурсы',
    privacy: 'Конфиденциальность', sitemap: 'Карта сайта', analytics: 'Аналитика', principles: 'Принципы', contacts: 'Контакты',
    language: 'English version', accessibilityOn: 'Обычный режим отображения', accessibilityOff: 'Версия для слабовидящих', themeLight: 'Включить светлую тему', themeDark: 'Включить тёмную тему',
    install: 'Установить KnowerLife', installTitle: 'Установка KnowerLife', installReady: 'Приложение готово к установке.', installFallback: 'Установка управляется вашим браузером.', installed: 'KnowerLife уже открыт как установленное приложение.',
    nav: 'Навигация', currentPage: 'На этой странице', settings: 'Вид и приложение', close: 'Закрыть', print: 'Печать / PDF',
    footerLead: 'Системный анализ, практические browser tools и творческие технологии в одной цельной экосистеме.', explore: 'Разделы', connect: 'Связаться',
    pwa: 'Единый PWA', bilingual: 'RU / EN', accessible: 'Доступность A+', local: 'Local-first', copyright: 'Один домен · одна PWA · одна экосистема',
    installStep1: 'Откройте меню браузера.', installStep2: 'Выберите «Установить приложение» или «Добавить на главный экран».', installStepIos1: 'Откройте страницу в Safari.', installStepIos2: 'Нажмите «Поделиться», затем «На экран Домой».',
    mainDesc: 'Портфолио, кейсы и услуги', saDesc: '64 темы + Analyst Workbench', toolsDesc: '17 локальных browser-инструментов', creativeDesc: 'Музыка, AI и Suno-портфолио'
  };

  const urlFor = (path = '') => new URL(path, rootUrl).href;
  const langPrefix = isEnglish ? 'en/' : '';
  const productLinks = {
    home: urlFor(langPrefix),
    sa: urlFor(`${langPrefix}sa/`),
    tools: urlFor(`${langPrefix}tools/`),
    creative: urlFor(`${langPrefix}creative/`)
  };

  function currentProduct() {
    const p = normalizedPath.replace(/^en\//, '');
    if (p === 'sa' || p.startsWith('sa/')) return 'sa';
    if (p === 'creative' || p.startsWith('creative/')) return 'creative';
    if (p === 'tools' || p.startsWith('tools/')) return 'tools';
    if (p === 'privacy' || p.startsWith('privacy/')) return 'privacy';
    if (p === 'site-map' || p.startsWith('site-map/')) return 'sitemap';
    if (p.startsWith('cases/')) return 'case';
    if (p === '404.html') return '404';
    if (p === 'offline.html') return 'offline';
    return 'home';
  }
  const product = currentProduct();

  const productName = {
    home: isEnglish ? 'Ecosystem' : 'Экосистема', sa: 'SA Guide', tools: 'Browser Tools', creative: 'Creative Corner',
    privacy: text.privacy, sitemap: text.sitemap, case: isEnglish ? 'Case Study' : 'Кейс', '404': '404', offline: 'Offline'
  }[product] || 'KnowerLife';

  function languageHref() {
    if (isEnglish) {
      const stripped = normalizedPath.replace(/^en\/?/, '');
      return urlFor(stripped ? `${stripped}/`.replace(/\/\/$/, '/') : '');
    }
    if (normalizedPath.startsWith('cases/')) return `${urlFor('en/')}#cases`;
    if (product === '404' || product === 'offline') return urlFor('en/');
    return urlFor(normalizedPath ? `en/${normalizedPath}/`.replace(/\/\/$/, '/') : 'en/');
  }

  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined && content !== null) node.textContent = content;
    return node;
  }
  function link(label, href, className) {
    const node = el('a', className, label);
    node.href = href;
    return node;
  }
  function button(label, className) {
    const node = el('button', className, label);
    node.type = 'button';
    return node;
  }

  function contextLinks() {
    const home = productLinks.home;
    if (product === 'home') return [
      [text.services, `${home}#services`], [text.cases, `${home}#cases`], [text.portfolio, `${home}#portfolio`], [text.contact, `${home}#contact`]
    ];
    if (product === 'sa') return isEnglish ? [
      [text.knowledge, '#guide'], [text.workbench, '#workbench'], [text.resources, '#resources']
    ] : [
      [text.knowledge, '#guide'], [text.workbench, '#tools-zone'], [text.resources, '#resources']
    ];
    if (product === 'creative') return [[text.music, '#music'], [text.about, '#about'], [text.process, '#process']];
    if (product === 'tools') return [[text.tools, '#main'], ['JSON', '#json'], ['JWT', '#jwt'], [isEnglish ? 'Project brief' : 'Бриф', '#brief']];
    if (product === 'privacy') return [[text.principles, '#principles'], [text.analytics, '#analytics'], [text.contacts, '#contacts']];
    if (product === 'case') return [[text.cases, `${home}#cases`], [text.portfolio, `${home}#portfolio`], [text.contact, `${home}#contact`]];
    return [];
  }

  const ecosystemItems = [
    ['home', '<K>', 'KnowerLife', text.mainDesc],
    ['sa', 'SA', 'SA Guide', text.saDesc],
    ['tools', '{}', 'Browser Tools', text.toolsDesc],
    ['creative', '♫', 'Creative Corner', text.creativeDesc]
  ];

  function buildSwitcherItems(container, mobile = false) {
    ecosystemItems.forEach(([key, iconText, title, description]) => {
      const a = link('', productLinks[key], mobile ? '' : 'eco-switcher__item');
      if (key === product) a.setAttribute('aria-current', 'page');
      if (mobile) {
        const span = el('span', '', title);
        const small = el('small', '', description);
        a.append(span, small);
      } else {
        const icon = el('span', 'eco-switcher__icon', iconText);
        icon.setAttribute('aria-hidden', 'true');
        const copy = el('span', 'eco-switcher__copy');
        copy.append(el('strong', '', title), el('span', '', description));
        a.append(icon, copy);
      }
      container.append(a);
    });
  }

  function readStored(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function writeStored(key, value) { try { localStorage.setItem(key, value); } catch {} }

  function preferredTheme() {
    const saved = readStored('knowerlife-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll('[data-eco-theme]').forEach((b) => {
      const dark = theme === 'dark';
      const label = dark ? text.themeLight : text.themeDark;
      if (b.classList.contains('eco-action')) b.textContent = dark ? '☀' : '☾';
      else {
        const name = b.querySelector('span');
        const value = b.querySelector('small');
        if (name) name.textContent = isEnglish ? 'Color scheme' : 'Цветовая схема';
        if (value) value.textContent = dark ? (isEnglish ? 'Dark' : 'Тёмная') : (isEnglish ? 'Light' : 'Светлая');
      }
      b.setAttribute('aria-label', label);
      b.title = label;
    });
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.append(meta); }
    meta.content = theme === 'dark' ? '#0b0d14' : '#f5f6fa';
  }
  function applyAccessibility(enabled) {
    if (enabled) { root.dataset.accessibility = 'enhanced'; root.dataset.fontScale = 'large'; }
    else { delete root.dataset.accessibility; delete root.dataset.fontScale; }
    document.querySelectorAll('[data-eco-accessibility]').forEach((b) => {
      const label = enabled ? text.accessibilityOn : text.accessibilityOff;
      if (b.classList.contains('eco-action')) b.textContent = enabled ? 'A' : 'A+';
      else {
        const name = b.querySelector('span');
        const value = b.querySelector('small');
        if (name) name.textContent = label;
        if (value) value.textContent = enabled ? 'A' : 'A+';
      }
      b.setAttribute('aria-pressed', String(enabled));
      b.setAttribute('aria-label', label);
      b.title = label;
    });
  }

  let installPrompt = window.__knowerlifeInstallPrompt || null;
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function toast(message) {
    let node = document.querySelector('.eco-toast');
    if (!node) { node = el('div', 'eco-toast'); node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); document.body.append(node); }
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { node.hidden = true; }, 3200);
  }

  const installDialog = el('dialog', 'eco-install-dialog');
  installDialog.setAttribute('aria-label', text.installTitle);
  const installHead = el('div', 'eco-install-dialog__head');
  installHead.append(el('strong', '', text.installTitle));
  const installClose = button('×', 'eco-dialog-close');
  installClose.setAttribute('aria-label', text.close);
  installHead.append(installClose);
  const installBody = el('div', 'eco-install-dialog__body');
  const installLead = el('p');
  installLead.textContent = text.installFallback;
  const installSteps = el('ol', 'eco-install-steps');
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  [isiOS ? text.installStepIos1 : text.installStep1, isiOS ? text.installStepIos2 : text.installStep2].forEach((step) => installSteps.append(el('li', '', step)));
  installBody.append(installLead, installSteps);
  installDialog.append(installHead, installBody);
  document.body.append(installDialog);
  installClose.addEventListener('click', () => installDialog.close());
  installDialog.addEventListener('click', (event) => { if (event.target === installDialog) installDialog.close(); });

  async function requestInstall() {
    if (isStandalone()) { toast(text.installed); return; }
    installPrompt = installPrompt || window.__knowerlifeInstallPrompt || null;
    if (installPrompt && typeof installPrompt.prompt === 'function') {
      installPrompt.prompt();
      try { await installPrompt.userChoice; } catch {}
      installPrompt = null;
      window.__knowerlifeInstallPrompt = null;
      return;
    }
    installLead.textContent = text.installFallback;
    if (!installDialog.open) installDialog.showModal();
  }
  window.addEventListener('knowerlife:installprompt', (event) => { installPrompt = event.detail || window.__knowerlifeInstallPrompt || null; });
  window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; window.__knowerlifeInstallPrompt = event; });
  window.addEventListener('appinstalled', () => { installPrompt = null; window.__knowerlifeInstallPrompt = null; toast(text.installed); });

  const oldHeader = document.querySelector('body > header, header.site-header');
  const header = el('header', 'eco-header');
  const headerInner = el('div', 'eco-header__inner');
  const brand = link('', productLinks.home, 'eco-brand');
  brand.setAttribute('aria-label', isEnglish ? 'KnowerLife home' : 'KnowerLife — главная');
  const brandName = el('span', 'eco-brand__name', '<KnowerLife />');
  const brandProduct = el('span', 'eco-brand__product', productName);
  brand.append(brandName, brandProduct);

  const switcher = el('details', 'eco-switcher');
  const switcherSummary = el('summary', '', text.ecosystem);
  switcherSummary.setAttribute('aria-label', text.ecosystem);
  const switcherMenu = el('div', 'eco-switcher__menu');
  buildSwitcherItems(switcherMenu);
  switcher.append(switcherSummary, switcherMenu);

  const contextNav = el('nav', 'eco-context-nav');
  contextNav.setAttribute('aria-label', text.currentPage);
  contextLinks().forEach(([labelText, href]) => contextNav.append(link(labelText, href)));

  const actions = el('div', 'eco-actions');
  const language = link(isEnglish ? 'RU' : 'EN', languageHref(), 'eco-action');
  language.setAttribute('aria-label', text.language);
  language.hreflang = isEnglish ? 'ru' : 'en';
  language.lang = isEnglish ? 'ru' : 'en';
  const accessibility = button('A+', 'eco-action'); accessibility.dataset.ecoAccessibility = '';
  const install = button('⇩', 'eco-action eco-action--install'); install.dataset.ecoInstall = ''; install.setAttribute('aria-label', text.install); install.title = text.install;
  const theme = button('☾', 'eco-action'); theme.dataset.ecoTheme = '';
  actions.append(language, accessibility, install, theme);
  if (product === 'sa') {
    const print = button('⎙', 'eco-action'); print.setAttribute('aria-label', text.print); print.title = text.print; print.dataset.ecoPrint = ''; actions.append(print);
  }
  const menuButton = button('☰', 'eco-action eco-menu-button');
  menuButton.setAttribute('aria-label', text.nav);
  menuButton.setAttribute('aria-expanded', 'false');
  actions.append(menuButton);

  headerInner.append(brand, switcher, contextNav, actions);
  header.append(headerInner);
  if (oldHeader) oldHeader.replaceWith(header); else document.body.prepend(header);

  document.querySelectorAll('#mobileNav.mobile-nav-dialog, #mobileNav.mobile-nav').forEach((node) => node.remove());

  const mobileDialog = el('dialog', 'eco-mobile-menu');
  mobileDialog.setAttribute('aria-label', text.nav);
  const mobileHead = el('div', 'eco-mobile-menu__head');
  mobileHead.append(el('strong', '', `<KnowerLife /> · ${productName}`));
  const mobileClose = button('×', 'eco-dialog-close'); mobileClose.setAttribute('aria-label', text.close); mobileHead.append(mobileClose);
  const mobileBody = el('div', 'eco-mobile-menu__body');
  const ecosystemSection = el('section', 'eco-mobile-section');
  ecosystemSection.append(el('p', 'eco-mobile-kicker', text.ecosystem));
  const ecoMobileLinks = el('div', 'eco-mobile-links'); buildSwitcherItems(ecoMobileLinks, true); ecosystemSection.append(ecoMobileLinks);
  mobileBody.append(ecosystemSection);
  const currentLinks = contextLinks();
  if (currentLinks.length) {
    const currentSection = el('section', 'eco-mobile-section'); currentSection.append(el('p', 'eco-mobile-kicker', text.currentPage));
    const links = el('div', 'eco-mobile-links'); currentLinks.forEach(([labelText, href]) => links.append(link(labelText, href))); currentSection.append(links); mobileBody.append(currentSection);
  }
  const settingsSection = el('section', 'eco-mobile-section'); settingsSection.append(el('p', 'eco-mobile-kicker', text.settings));
  const settingsLinks = el('div', 'eco-mobile-links');
  const mobileInstall = button('', ''); mobileInstall.dataset.ecoInstall = ''; mobileInstall.append(el('span', '', text.install), el('small', '', 'PWA'));
  const mobileAccess = button('', ''); mobileAccess.dataset.ecoAccessibility = ''; mobileAccess.append(el('span', '', text.accessibilityOff), el('small', '', 'A+'));
  const mobileTheme = button('', ''); mobileTheme.dataset.ecoTheme = ''; mobileTheme.append(el('span', '', isEnglish ? 'Color scheme' : 'Цветовая схема'), el('small', '', root.dataset.theme || preferredTheme()));
  settingsLinks.append(mobileInstall, mobileAccess, mobileTheme, language.cloneNode(true));
  if (product === 'sa') { const mobilePrint = button(text.print, ''); mobilePrint.dataset.ecoPrint = ''; settingsLinks.append(mobilePrint); }
  settingsSection.append(settingsLinks); mobileBody.append(settingsSection);
  mobileDialog.append(mobileHead, mobileBody); document.body.append(mobileDialog);

  menuButton.addEventListener('click', () => { mobileDialog.showModal(); menuButton.setAttribute('aria-expanded', 'true'); });
  mobileClose.addEventListener('click', () => mobileDialog.close());
  mobileDialog.addEventListener('close', () => menuButton.setAttribute('aria-expanded', 'false'));
  mobileDialog.addEventListener('click', (event) => { if (event.target === mobileDialog) mobileDialog.close(); if (event.target.closest('a')) mobileDialog.close(); });

  document.addEventListener('click', (event) => { if (switcher.open && !switcher.contains(event.target)) switcher.removeAttribute('open'); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') switcher.removeAttribute('open'); });
  switcherMenu.addEventListener('click', () => switcher.removeAttribute('open'));

  const footer = el('footer', 'eco-footer');
  const footerInner = el('div', 'eco-footer__inner');
  const footerGrid = el('div', 'eco-footer__grid');
  const footerBrand = el('div', 'eco-footer__brand');
  footerBrand.append(el('strong', '', '<KnowerLife />'), el('p', '', text.footerLead));
  const status = el('div', 'eco-footer__status'); [text.pwa, text.bilingual, text.accessible, text.local].forEach((s) => status.append(el('span', 'eco-status-chip', s))); footerBrand.append(status);

  function footerColumn(title, entries) {
    const col = el('div', 'eco-footer__col'); col.append(el('h2', '', title)); const links = el('div', 'eco-footer__links');
    entries.forEach(([labelText, href, external]) => { const a = link(labelText, href); if (external) { a.target = '_blank'; a.rel = 'me noopener'; } links.append(a); }); col.append(links); return col;
  }
  footerGrid.append(
    footerBrand,
    footerColumn(text.ecosystem, [[text.home, productLinks.home], [text.sa, productLinks.sa], [text.tools, productLinks.tools], [text.creative, productLinks.creative]]),
    footerColumn(text.explore, [[text.portfolio, `${productLinks.home}#portfolio`], [text.cases, `${productLinks.home}#cases`], [text.privacy, urlFor(`${langPrefix}privacy/`)], [text.sitemap, urlFor(`${langPrefix}site-map/`)]]),
    footerColumn(text.connect, [['GitHub', 'https://github.com/KnowerLife', true], ['Telegram', 'https://t.me/knowerlife', true], ['VK', 'https://vk.com/knowerlife', true], ['Suno', 'https://suno.com/@knowerlife', true], ['Email', 'mailto:info@knowerlife.ru']])
  );
  const footerBottom = el('div', 'eco-footer__bottom');
  const copyright = el('span'); copyright.append(document.createTextNode('© '), el('span', '', String(new Date().getFullYear())), document.createTextNode(` KnowerLife · ${text.copyright}`));
  const repo = link(isEnglish ? 'Source on GitHub ↗' : 'Исходный код на GitHub ↗', 'https://github.com/KnowerLife/knowerlife'); repo.target = '_blank'; repo.rel = 'noopener'; footerBottom.append(copyright, repo);
  footerInner.append(footerGrid, footerBottom); footer.append(footerInner);
  const oldFooter = document.querySelector('body > footer, footer.site-footer');
  if (oldFooter) oldFooter.replaceWith(footer); else {
    const main = document.querySelector('main');
    if (main) main.insertAdjacentElement('afterend', footer); else document.body.append(footer);
  }

  document.querySelectorAll('[data-eco-theme]').forEach((b) => b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; writeStored('knowerlife-theme', next); applyTheme(next);
  }));
  document.querySelectorAll('[data-eco-accessibility]').forEach((b) => b.addEventListener('click', () => {
    const enabled = root.dataset.accessibility !== 'enhanced'; writeStored('knowerlife-accessibility', enabled ? 'enhanced' : 'standard'); applyAccessibility(enabled);
  }));
  document.querySelectorAll('[data-eco-install]').forEach((b) => b.addEventListener('click', async () => { if (mobileDialog.open) mobileDialog.close(); await requestInstall(); }));
  document.querySelectorAll('[data-eco-print]').forEach((b) => b.addEventListener('click', () => window.print()));

  applyTheme(preferredTheme());
  applyAccessibility(readStored('knowerlife-accessibility') === 'enhanced');

  root.classList.add('eco-shell-ready');
})();
