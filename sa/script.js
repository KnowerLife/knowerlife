(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const STORAGE = {
    theme: 'knowerlife-theme',
    font: 'knowerlife-accessibility',
    bookmarks: 'sa_bookmarks_v2',
    notes: 'sa_notes_v2',
    competency: 'sa_competency_v2',
    requirements: 'sa_requirements_v2',
    security: 'sa_security_v2',
    lastSection: 'sa_last_section_v3',
    risks: 'sa_risks_v3',
    traceability: 'sa_traceability_v3',
    decisions: 'sa_decisions_v3',
    courseProgress: 'sa_course_progress_v1'
  };

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function readJson(key, fallback) {
    try { return safeParse(localStorage.getItem(key), fallback); }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function readText(key, fallback = '') {
    try { return localStorage.getItem(key) || fallback; }
    catch { return fallback; }
  }

  function writeText(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch { return false; }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function normalizeIdentifier(value, fallback = 'field') {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_');
    const safe = normalized || fallback;
    return /^[0-9]/.test(safe) ? `_${safe}` : safe;
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function initTheme() {
    const root = document.documentElement;
    const saved = readText(STORAGE.theme);
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = saved || (systemDark ? 'dark' : 'light');
    const btn = $('#themeToggle');
    const render = () => {
      if (!btn) return;
      const dark = root.dataset.theme === 'dark';
      btn.textContent = dark ? '☀' : '☾';
      btn.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    };
    btn?.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      writeText(STORAGE.theme, root.dataset.theme);
      render();
    });
    render();
  }

  function initFontScale() {
    const root = document.documentElement;
    if (readText(STORAGE.font) === 'enhanced') { root.dataset.fontScale = 'large'; root.dataset.accessibility = 'enhanced'; }
    const btn = $('#accessibilityToggle');
    const render = () => {
      const large = root.dataset.fontScale === 'large';
      btn?.setAttribute('aria-pressed', String(large)); if(btn){ const label=large?'Обычный режим отображения':'Версия для слабовидящих'; btn.setAttribute('aria-label',label); btn.setAttribute('title',label); }
      if (btn) btn.textContent = large ? 'A' : 'A+';
    };
    btn?.addEventListener('click', () => {
      if (root.dataset.fontScale === 'large') {
        delete root.dataset.fontScale;
        writeText(STORAGE.font, 'standard'); delete root.dataset.accessibility;
      } else {
        root.dataset.fontScale = 'large';
        writeText(STORAGE.font, 'enhanced'); root.dataset.accessibility = 'enhanced';
      }
      render();
    });
    render();
  }

  function initHeader() {
    const header = $('[data-header]');
    const progress = $('[data-scroll-progress]');
    let ticking = false;
    const update = () => {
      const y = window.scrollY || 0;
      header?.classList.toggle('is-scrolled', y > 8);
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      if (progress) progress.style.width = `${Math.min(100, y / max * 100)}%`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function initMobileNav() {
    const dialog = $('#mobileNav');
    const menuBtn = $('#mobileMenuBtn');
    const closeBtn = $('[data-close-nav]');
    const target = $('[data-mobile-nav-links]');
    const sourceLinks = $$('#desktopNav a');
    if (target) {
      target.replaceChildren(...sourceLinks.map(link => {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        return a;
      }));
    }
    const open = () => {
      if (!dialog) return;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      menuBtn?.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      if (!dialog) return;
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    };
    menuBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    target?.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    dialog?.addEventListener('click', event => { if (event.target === dialog) close(); });
  }

  function initPrint() {
    $('#pdfExportBtn')?.addEventListener('click', () => window.print());
  }

  function getCards() { return $$('.searchable'); }

  function initSearch() {
    const input = $('#globalSearch');
    const status = $('#searchStatus');
    const empty = $('#noSearchResults');
    const clear = $('#clearSearchBtn');
    const cards = getCards();
    let activeCategory = 'all';
    const apply = () => {
      const term = (input?.value || '').trim().toLocaleLowerCase('ru');
      let shown = 0;
      cards.forEach(card => {
        const haystack = `${card.dataset.title || ''} ${card.dataset.search || ''} ${card.textContent}`.toLocaleLowerCase('ru');
        const textMatch = !term || haystack.includes(term);
        const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
        const match = textMatch && categoryMatch;
        card.hidden = !match;
        if (match) shown++;
      });
      const categoryLabel = activeCategory === 'all' ? '' : ` · ${activeCategory}`;
      if (status) status.textContent = (term || activeCategory !== 'all') ? `Найдено: ${shown} из ${cards.length}${categoryLabel}` : `Показаны все ${cards.length} разделов`;
      if (empty) empty.hidden = shown !== 0;
    };
    input?.addEventListener('input', apply);
    $$('[data-category-filter]').forEach(btn => btn.addEventListener('click', () => {
      activeCategory = btn.dataset.categoryFilter || 'all';
      $$('[data-category-filter]').forEach(item => {
        const pressed = item === btn;
        item.classList.toggle('is-active', pressed);
        item.setAttribute('aria-pressed', String(pressed));
      });
      apply();
    }));
    clear?.addEventListener('click', () => { if (input) { input.value = ''; apply(); input.focus(); } });
    document.addEventListener('keydown', event => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); input?.focus(); input?.select();
      } else if (event.key === '/' && !editing) {
        event.preventDefault(); input?.focus();
      } else if (event.key === 'Escape' && document.activeElement === input && input?.value) {
        input.value = ''; apply(); input.blur();
      }
    });
    apply();
  }

  function initActiveNav() {
    if (!('IntersectionObserver' in window)) return;
    const links = $$('#desktopNav a');
    const byId = new Map(links.map(a => [a.getAttribute('href')?.slice(1), a]));
    const sections = getCards();
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.remove('is-active'));
      byId.get(visible.target.id)?.classList.add('is-active');
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .1, .25] });
    sections.forEach(section => observer.observe(section));
  }

  function initBookmarks() {
    let bookmarks = readJson(STORAGE.bookmarks, []);
    if (!Array.isArray(bookmarks)) bookmarks = [];
    const validIds = new Set(getCards().map(card => card.id));
    bookmarks = bookmarks.filter(id => validIds.has(id));
    const list = $('#bookmarksList');
    const counter = $('#bookmarksCounter');

    const titleFor = id => $(`#${CSS.escape(id)}`)?.dataset.title || id;
    const render = () => {
      if (counter) counter.textContent = String(bookmarks.length);
      if (!list) return;
      list.replaceChildren();
      if (!bookmarks.length) {
        const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Пока пусто'; list.append(p); return;
      }
      bookmarks.forEach(id => {
        const row = document.createElement('div'); row.className = 'bookmark-row';
        const link = document.createElement('a'); link.href = `#${id}`; link.textContent = titleFor(id);
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bookmark-remove'; remove.textContent = '×'; remove.setAttribute('aria-label', `Удалить закладку ${titleFor(id)}`);
        remove.addEventListener('click', () => toggle(id, false));
        row.append(link, remove); list.append(row);
      });
      $$('.bookmark-toggle').forEach(btn => btn.setAttribute('aria-pressed', String(bookmarks.includes(btn.dataset.bookmark))));
    };
    const toggle = (id, announce = true) => {
      bookmarks = bookmarks.includes(id) ? bookmarks.filter(item => item !== id) : [...bookmarks, id];
      writeJson(STORAGE.bookmarks, bookmarks);
      render();
      if (announce) showToast(bookmarks.includes(id) ? 'Добавлено в закладки' : 'Удалено из закладок');
    };
    getCards().forEach(card => {
      const head = $('.card-head', card);
      if (!head) return;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'bookmark-toggle'; btn.dataset.bookmark = card.id; btn.textContent = '◆'; btn.title = 'Добавить в закладки'; btn.setAttribute('aria-label', `Закладка: ${card.dataset.title || card.id}`);
      btn.addEventListener('click', () => toggle(card.id));
      head.append(btn);
    });
    render();
  }

  function initTimer() {
    let interval = null;
    let remaining = 0;
    const display = $('#meetingTimerDisplay');
    const render = () => {
      const min = Math.floor(remaining / 60).toString().padStart(2,'0');
      const sec = (remaining % 60).toString().padStart(2,'0');
      if (display) display.textContent = `${min}:${sec}`;
    };
    const stop = (reset = false) => {
      if (interval) clearInterval(interval);
      interval = null;
      if (reset) { remaining = 0; render(); }
    };
    $$('[data-time]').forEach(btn => btn.addEventListener('click', () => {
      stop(); remaining = Number(btn.dataset.time) || 0; render();
      interval = setInterval(() => {
        remaining = Math.max(0, remaining - 1); render();
        if (remaining <= 0) { stop(); showToast('Таймер завершён'); }
      }, 1000);
    }));
    $('#stopMeetingTimer')?.addEventListener('click', () => stop(true));
  }

  function initDecisionTree() {
    const step1 = $('#tree-step1');
    const step2 = $('#tree-step2');
    const question = $('#step2-question');
    const options = $('#step2-options');
    const result = $('#tree-result');
    const resultText = $('#result-text');
    const resultDescription = $('#result-description');
    const recommendations = {
      scrum: ['Scrum', 'Подходит, когда полезны короткие итерации, цель спринта и регулярная обратная связь по продукту.'],
      kanban: ['Kanban', 'Подходит для непрерывного потока, поддержки и работы с меняющимся входящим приоритетом.'],
      waterfall: ['Predictive / Waterfall', 'Подходит, когда изменения дороги, этапы жестко зависят друг от друга, а требования можно стабилизировать заранее.'],
      hybrid: ['Hybrid', 'Комбинируйте управляемые этапы для обязательных контрольных точек с итеративной delivery-моделью внутри этапов.']
    };
    const showResult = key => {
      const [name, description] = recommendations[key] || recommendations.hybrid;
      if (step2) step2.hidden = true;
      if (result) result.hidden = false;
      if (resultText) resultText.textContent = name;
      if (resultDescription) resultDescription.textContent = description;
    };
    $$('[data-tree]').forEach(btn => btn.addEventListener('click', () => {
      const mode = btn.dataset.tree;
      if (step1) step1.hidden = true;
      if (step2) step2.hidden = false;
      if (!question || !options) return;
      options.replaceChildren();
      if (mode === 'iterative') {
        question.textContent = 'Работа поступает непрерывным потоком без естественной границы спринта?';
        [['Да','kanban'],['Нет','scrum']].forEach(([label,key]) => {
          const b = document.createElement('button'); b.type='button'; b.className='btn btn--secondary btn--small'; b.textContent=label; b.addEventListener('click',()=>showResult(key)); options.append(b);
        });
      } else {
        question.textContent = 'Есть обязательные фиксированные этапы или регуляторные контрольные точки?';
        [['Да','waterfall'],['Частично','hybrid']].forEach(([label,key]) => {
          const b = document.createElement('button'); b.type='button'; b.className='btn btn--secondary btn--small'; b.textContent=label; b.addEventListener('click',()=>showResult(key)); options.append(b);
        });
      }
    }));
    $('#resetTreeBtn')?.addEventListener('click', () => {
      if (step1) step1.hidden = false; if (step2) step2.hidden = true; if (result) result.hidden = true;
    });
  }

  function initDataModeler() {
    let entities = [];
    const container = $('#entitiesList');
    const preview = $('#sqlPreview');
    const render = () => {
      if (!container) return;
      container.replaceChildren();
      if (!entities.length) {
        const p = document.createElement('p'); p.className='muted'; p.textContent='Сущности еще не добавлены.'; container.append(p); return;
      }
      entities.forEach((entity,index) => {
        const row = document.createElement('div'); row.className='entity-row';
        const text = document.createElement('div');
        const strong = document.createElement('strong'); strong.textContent=entity.name;
        const small = document.createElement('small'); small.textContent=entity.attrs.join(', ');
        text.append(strong,small);
        const actions = document.createElement('div'); actions.className='entity-actions';
        const attr = document.createElement('button'); attr.type='button'; attr.textContent='+'; attr.title='Добавить атрибут';
        attr.addEventListener('click',()=>{
          const value = prompt('Название атрибута, например email');
          if (!value) return;
          const safe = normalizeIdentifier(value,'field');
          if (!entity.attrs.includes(safe)) entity.attrs.push(safe);
          render();
        });
        const rename = document.createElement('button'); rename.type='button'; rename.textContent='✎'; rename.title='Переименовать';
        rename.addEventListener('click',()=>{
          const value = prompt('Новое имя сущности',entity.name); if(!value)return; entity.name=normalizeIdentifier(value,'entity'); render();
        });
        const remove = document.createElement('button'); remove.type='button'; remove.textContent='×'; remove.title='Удалить';
        remove.addEventListener('click',()=>{entities.splice(index,1);render();});
        actions.append(attr,rename,remove); row.append(text,actions); container.append(row);
      });
    };
    $('#addEntityBtn')?.addEventListener('click',()=>{
      const value=prompt('Название сущности, например users'); if(!value)return;
      const name=normalizeIdentifier(value,'entity');
      if(entities.some(e=>e.name===name)){showToast('Такая сущность уже есть');return;}
      entities.push({name,attrs:['id','created_at']});render();
    });
    $('#clearEntitiesBtn')?.addEventListener('click',()=>{entities=[];render();if(preview)preview.textContent='-- Добавьте хотя бы одну сущность';});
    $('#genSqlBtn')?.addEventListener('click',()=>{
      if(!preview)return;
      if(!entities.length){preview.textContent='-- Добавьте хотя бы одну сущность';return;}
      preview.textContent=entities.map(entity=>`CREATE TABLE ${entity.name} (\n  ${entity.attrs.map((attr,index)=>`${attr} ${index===0 && attr==='id'?'BIGINT PRIMARY KEY':'VARCHAR(255)'}`).join(',\n  ')}\n);`).join('\n\n');
    });
    render();
  }

  const quizBank = {
    requirements:[
      {q:'Что относится к нефункциональным требованиям?',o:['Создание заказа','Время ответа API','Редактирование профиля'],a:1},
      {q:'Что делает требование тестируемым?',o:['Большой объем текста','Критерии приемки','Ссылка на макет'],a:1},
      {q:'Что лучше описывает хорошее требование?',o:['Однозначное, проверяемое и согласованное','Максимально подробное техническое решение','Только пожелание бизнеса без ограничений'],a:0},
      {q:'Когда полезнее Use Case, чем короткая User Story?',o:['Когда важна последовательность шагов, акторы и альтернативные потоки','Когда нужна только оценка в story points','Когда описывается цвет кнопки'],a:0}
    ],
    api:[
      {q:'Какой метод обычно используется для чтения ресурса?',o:['GET','POST','DELETE'],a:0},
      {q:'Какой код означает, что ресурс не найден?',o:['201','404','503'],a:1},
      {q:'Что важно явно описать в API-контракте?',o:['Только happy path','Запрос/ответ, ошибки, коды, auth и ограничения','Только название endpoint'],a:1},
      {q:'Какой подход помогает безопасно повторять запрос создания при сетевых сбоях?',o:['Идемпотентность / idempotency key','Увеличить таймаут до бесконечности','Игнорировать дубликаты на клиенте'],a:0}
    ],
    db:[
      {q:'Что означает атомарность значений в таблице?',o:['1NF','2NF','3NF'],a:0},
      {q:'Какой оператор связывает строки нескольких таблиц?',o:['JOIN','ORDER BY','TRUNCATE'],a:0},
      {q:'Что обычно означает внешний ключ (FK)?',o:['Ссылочную целостность между таблицами','Уникальный индекс на все столбцы','Тип данных JSON'],a:0},
      {q:'Зачем аналитик уточняет источник истины для данных?',o:['Чтобы понять, какая система владеет актуальным значением','Чтобы заменить документацию кодом','Чтобы убрать все интеграции'],a:0}
    ],
    bpmn:[
      {q:'Какой элемент BPMN используется для ветвления?',o:['Task','Gateway','Pool'],a:1},
      {q:'Что обычно разделяет ответственность участников?',o:['Lane','Timer','Message'],a:0},
      {q:'С чего лучше начинать моделирование процесса в BPMN?',o:['С цели, участников, триггера и основного потока','С выбора цвета фигур','С детальной реализации в коде'],a:0},
      {q:'Что важно добавить после happy path?',o:['Ключевые альтернативы, ошибки и таймеры/исключения','Только дополнительные задачи для красоты','Удалить все gateways'],a:0}
    ],
    security:[
      {q:'Что должно быть описано для авторизации?',o:['Только пароль','Роли и права','Только HTTPS'],a:1},
      {q:'Что помогает анализировать угрозы?',o:['STRIDE','CRUD','INVEST'],a:0},
      {q:'Что из перечисленного относится к безопасной работе с данными?',o:['Минимизация доступа и защита чувствительных данных','Хранить токены в открытых логах','Передавать секреты в URL без необходимости'],a:0},
      {q:'Что важно зафиксировать в требованиях к интеграции с точки зрения безопасности?',o:['Аутентификацию, авторизацию, аудит и обработку секретов','Только формат JSON','Только время ответа'],a:0}
    ],
    ddd:[
      {q:'Что задает границу применимости модели?',o:['Bounded Context','HTTP endpoint','Sprint Goal'],a:0},
      {q:'Что такое Ubiquitous Language?',o:['Единый язык домена','Язык SQL','Язык интерфейса'],a:0},
      {q:'Зачем выделять bounded context?',o:['Чтобы снизить неоднозначность модели и терминов в разных доменных областях','Чтобы увеличить количество микросервисов','Чтобы убрать согласование с бизнесом'],a:0},
      {q:'Что такое агрегат (aggregate) на практике?',o:['Граница согласованности связанных сущностей','Любая таблица в БД','HTTP-контроллер'],a:0}
    ],
    hr:[
      {q:'Как лучше отвечать на вопрос «Расскажите о себе» на интервью системного аналитика?',o:['Кратко: опыт/роль, ключевые компетенции, релевантные достижения и интерес к позиции','Подробно рассказать всю биографию с детства','Сразу назвать желаемую зарплату без контекста'],a:0},
      {q:'Что ожидает HR услышать в вопросе о конфликте со стейкхолдером?',o:['Конкретный пример, ваши действия, коммуникацию и результат (STAR)','Что виноваты другие участники','Что конфликтов никогда не бывает'],a:0},
      {q:'Как корректно отвечать о слабой стороне?',o:['Назвать реальную зону роста и шаги, которые вы делаете для улучшения','Сказать «у меня нет слабых сторон»','Назвать критичную для роли слабость без плана развития'],a:0},
      {q:'Что делать, если на вопросе не хватает данных для ответа?',o:['Уточнить контекст, обозначить допущения и предложить структурированный подход','Придумать цифры и детали','Отказаться отвечать'],a:0},
      {q:'Как показать мотивацию на HR-интервью?',o:['Связать интерес с задачами роли, продуктом/доменом и развитием компетенций','Сказать, что важна только удалёнка','Обсуждать только недостатки текущего места'],a:0},
      {q:'Какие вопросы кандидата работодателю обычно воспринимаются хорошо?',o:['О задачах роли, процессах, ожиданиях на 3–6 месяцев и команде','Только о скорейшем повышении без контекста','Вопросы, на которые ответы легко найти на сайте за минуту'],a:0},
      {q:'Как обсуждать ошибку в прошлой работе?',o:['Описать ситуацию, вклад, исправление и выводы/улучшения процесса','Переложить ответственность на коллег','Скрыть, что ошибки возможны'],a:0},
      {q:'Что важно при рассказе о достижениях?',o:['Факты, ваша роль, артефакты/решения и результат без нарушения NDA','Только общие слова «много работал»','Преувеличить вклад без подтверждений'],a:0}
    ],
    technical:[
      {q:'Чем функциональные требования отличаются от нефункциональных?',o:['FR описывают поведение/функции, NFR — качества системы (производительность, доступность, безопасность и т.д.)','FR всегда про UI, NFR всегда про БД','Разницы нет, это синонимы'],a:0},
      {q:'Что нужно уточнить при проектировании REST API для создания ресурса?',o:['Метод, контракт запроса/ответа, валидацию, коды ошибок, auth и идемпотентность при необходимости','Только URL','Только цвет кнопки в интерфейсе'],a:0},
      {q:'Когда стоит рассмотреть асинхронное взаимодействие (очередь/события)?',o:['При длительных операциях, развязке сервисов, пиках нагрузки или ненужности мгновенного ответа','Всегда, даже для простого чтения справочника','Никогда, синхронный вызов всегда лучше'],a:0},
      {q:'Что важно описать аналитиком для интеграции с внешней системой?',o:['Контракт, формат/маппинг данных, ошибки и ретраи, таймауты, безопасность, мониторинг','Только счастливый сценарий','Только имя системы-партнёра'],a:0},
      {q:'Какой артефакт лучше показывает жизненный цикл сущности (например, заказа)?',o:['State diagram (диаграмма состояний)','ER-диаграмма без статусов','Только текстовый чат'],a:0},
      {q:'Что такое трассировка требований (traceability)?',o:['Связь цели → требования → реализации/тесты → приёмка','Копирование требований в несколько документов','Удаление старых требований без анализа'],a:0},
      {q:'Как подойти к кейсу «сервис медленно отвечает» на собеседовании?',o:['Уточнить симптомы/метрики и NFR, локализовать узкое место, выдвинуть гипотезы и шаги проверки','Сразу переписать систему на микросервисы','Игнорировать метрики и менять случайные параметры'],a:0},
      {q:'Что важно при добавлении нового поля/статуса в существующий процесс?',o:['Совместимость, миграция данных, влияние на API/интеграции/отчёты, правила переходов и тесты','Изменить только UI','Не учитывать существующие данные'],a:0},
      {q:'Какую диаграмму уместно выбрать для показа взаимодействия сервисов во времени?',o:['Sequence diagram','Pie chart','Только mind map'],a:0},
      {q:'Что обязательно учитывать при конкурентном изменении одной сущности?',o:['Стратегию конкурентности (блокировки/версии), обработку конфликтов и ожидаемое поведение для пользователя','Считать, что конфликты невозможны','Разрешать тихо перезаписывать данные без правил'],a:0}
    ]
  };

  function initQuiz() {
    const area=$('#testArea'); const select=$('#testSection'); let questions=[]; let index=0; let answers=[];
    const render=()=>{
      if(!area||!questions.length)return;
      const q=questions[index]; area.replaceChildren();
      const card=document.createElement('div'); card.className='test-card';
      const meta=document.createElement('div'); meta.className='test-meta'; const progress=document.createElement('span'); progress.textContent=`Вопрос ${index+1}/${questions.length}`; const topic=document.createElement('span'); topic.textContent=select?.selectedOptions?.[0]?.textContent||''; meta.append(progress,topic);
      const title=document.createElement('h3'); title.textContent=q.q;
      const options=document.createElement('div'); options.className='test-options';
      q.o.forEach((text,i)=>{const label=document.createElement('label');label.className='checklist-item';const radio=document.createElement('input');radio.type='radio';radio.name='quizOption';radio.value=String(i);radio.checked=answers[index]===i;radio.addEventListener('change',()=>{answers[index]=i;});label.append(radio,document.createTextNode(text));options.append(label);});
      const actions=document.createElement('div');actions.className='button-row';
      const prev=document.createElement('button');prev.type='button';prev.className='btn btn--secondary btn--small';prev.textContent='← Назад';prev.disabled=index===0;prev.addEventListener('click',()=>{index--;render();});
      const next=document.createElement('button');next.type='button';next.className='btn btn--primary btn--small';next.textContent=index===questions.length-1?'Завершить':'Далее →';next.addEventListener('click',()=>{if(index<questions.length-1){index++;render();}else finish();});
      actions.append(prev,next);card.append(meta,title,options,actions);area.append(card);
    };
    const finish=()=>{if(!area)return;const correct=questions.reduce((sum,q,i)=>sum+(answers[i]===q.a?1:0),0);const percent=Math.round(correct/questions.length*100);area.replaceChildren();const result=document.createElement('div');result.className='decision-result';const label=document.createElement('span');label.textContent='Результат';const score=document.createElement('strong');score.textContent=`${correct}/${questions.length} · ${percent}%`;const text=document.createElement('p');text.textContent=percent>=80?'Хороший результат. Можно переходить к следующему разделу.':'Есть смысл повторить теорию и пройти тест еще раз.';const restart=document.createElement('button');restart.type='button';restart.className='btn btn--secondary btn--small';restart.textContent='Пройти заново';restart.addEventListener('click',start);result.append(label,score,text,restart);area.append(result);};
    const start=()=>{questions=[...(quizBank[select?.value]||[])];index=0;answers=new Array(questions.length).fill(null);render();};
    $('#startTestBtn')?.addEventListener('click',start);
  }


  function initDiagramTool() {
    const codeEl = document.getElementById('diagramCode');
    const preview = document.getElementById('diagramPreview');
    const status = document.getElementById('diagramStatus');
    const templateSel = document.getElementById('diagramTemplate');
    if (!codeEl || !preview) return;

    const STORAGE_CODE = 'sa_diagram_code_v1';
    const STORAGE_TEMPLATE = 'sa_diagram_template_v1';

    const templates = {
      flowchart: `flowchart TD
    A([Старт: заявка получена]) --> B[Проверить данные]
    B --> C{Данные корректны?}
    C -->|Да| D[Создать заказ]
    D --> E[Отправить уведомление]
    E --> F([Конец: успех])
    C -->|Нет| G[Вернуть ошибки валидации]
    G --> H([Конец: доработка])`,
      swimlane: `flowchart LR
    subgraph Customer[Клиент]
      A([Старт]) --> B[Отправить заявку]
      F[Получить результат]
    end
    subgraph Support[Поддержка]
      C{Данные полные?}
      D[Уточнить детали]
      E[Передать в обработку]
    end
    subgraph System[Система]
      G[Обработать заявку]
      H([Завершить])
    end
    B --> C
    C -->|Нет| D --> B
    C -->|Да| E --> G --> H --> F`,
      sequence: `sequenceDiagram
    autonumber
    actor User as Пользователь
    participant Web as Web/App
    participant API as API
    participant DB as БД

    User->>Web: Создать заказ
    Web->>API: POST /orders
    API->>DB: INSERT order
    DB-->>API: order_id
    API-->>Web: 201 Created
    Web-->>User: Показать номер заказа`,
      sequence_alt: `sequenceDiagram
    autonumber
    actor User as Пользователь
    participant Web as Web/App
    participant API as API
    participant Pay as Платёжный шлюз

    User->>Web: Оплатить заказ
    Web->>API: POST /payments
    API->>Pay: Create payment
    alt Успех
      Pay-->>API: payment_confirmed
      API-->>Web: 200 OK
      Web-->>User: Оплата успешна
    else Ошибка/таймаут
      Pay-->>API: error/timeout
      API-->>Web: 402/504 + retry info
      Web-->>User: Повторить оплату
    end`,
      class: `classDiagram
    class Order {
      +UUID id
      +String status
      +Decimal total
      +create()
      +pay()
      +cancel()
    }
    class OrderItem {
      +UUID id
      +UUID productId
      +int qty
      +Decimal price
    }
    class Customer {
      +UUID id
      +String name
      +String email
    }
    Customer "1" --> "*" Order
    Order "1" --> "1..*" OrderItem`,
      state: `stateDiagram-v2
    [*] --> Draft
    Draft --> PendingPayment: submit
    PendingPayment --> Paid: payment_success
    PendingPayment --> Cancelled: timeout/cancel
    Paid --> Shipped: ship
    Shipped --> Delivered: confirm
    Delivered --> [*]
    Cancelled --> [*]`,
      er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : included_in

    CUSTOMER {
      uuid id PK
      string email
      string name
    }
    ORDER {
      uuid id PK
      uuid customer_id FK
      string status
      datetime created_at
    }
    PRODUCT {
      uuid id PK
      string title
      decimal price
    }
    ORDER_ITEM {
      uuid id PK
      uuid order_id FK
      uuid product_id FK
      int qty
    }`,
      component: `flowchart TB
    user([Пользователь])
    subgraph Client[Клиент]
      web[Web SPA]
      mobile[Mobile App]
    end
    subgraph Platform[Платформа]
      gw[API Gateway]
      svc[Order Service]
      worker[Background Worker]
    end
    subgraph Data[Данные/интеграции]
      db[(PostgreSQL)]
      cache[(Redis)]
      mq[[Message Broker]]
      pay[Payment Provider]
    end
    user --> web
    user --> mobile
    web --> gw
    mobile --> gw
    gw --> svc
    svc --> db
    svc --> cache
    svc --> mq
    worker --> mq
    worker --> pay`,
      journey: `journey
    title Путь пользователя: оформление заказа
    section Выбор
      Открыть каталог: 5: Пользователь
      Найти товар: 4: Пользователь
    section Покупка
      Добавить в корзину: 5: Пользователь
      Оплатить: 3: Пользователь, Платёжный шлюз
    section Результат
      Получить подтверждение: 5: Пользователь, Система`,
      c4: `flowchart TB
    user([Пользователь])
    admin([Администратор])

    subgraph System[Система заказов]
      web[Web/Mobile UI]
      api[Backend API]
      db[(Database)]
    end

    pay[Платёжный провайдер]
    notify[Сервис уведомлений]

    user --> web
    admin --> web
    web --> api
    api --> db
    api --> pay
    api --> notify`
    };

    const readStorage = (key) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
    const writeStorage = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

    const savedTpl = readStorage(STORAGE_TEMPLATE);
    if (savedTpl && templates[savedTpl] && templateSel) templateSel.value = savedTpl;
    const savedCode = readStorage(STORAGE_CODE);
    if (savedCode && savedCode.trim()) codeEl.value = savedCode;
    else if (!codeEl.value.trim()) codeEl.value = templates[templateSel?.value] || templates.flowchart;

    let mermaidReady = null;
    const loadScript = (src) => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('load failed: ' + src));
      document.head.appendChild(script);
    });
    const loadMermaid = async () => {
      if (window.mermaid) return window.mermaid;
      if (mermaidReady) return mermaidReady;
      mermaidReady = (async () => {
        const sources = ['../assets/vendor/mermaid.min.js', 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'];
        let lastErr = null;
        for (const src of sources) {
          try {
            await loadScript(src);
            if (window.mermaid) {
              try { window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default' }); } catch {}
              return window.mermaid;
            }
          } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error('Не удалось загрузить Mermaid');
      })();
      try { return await mermaidReady; } catch (e) { mermaidReady = null; throw e; }
    };

    const setStatus = (msg) => { if (status) status.textContent = msg || ''; };
    const persist = () => { writeStorage(STORAGE_CODE, codeEl.value || ''); writeStorage(STORAGE_TEMPLATE, templateSel?.value || 'flowchart'); };

    const renderDiagram = async () => {
      const code = (codeEl.value || '').trim();
      if (!code) { preview.innerHTML = '<p class="muted">Введите код диаграммы.</p>'; return; }
      setStatus('Отрисовка диаграммы…');
      try {
        const mermaid = await loadMermaid();
        try { mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default' }); } catch {}
        const id = 'mermaid-' + Date.now();
        const { svg } = await mermaid.render(id, code);
        preview.innerHTML = svg;
        setStatus('Диаграмма обновлена. Код сохранён локально.');
      } catch (e) {
        preview.innerHTML = '';
        const pre = document.createElement('pre');
        pre.className = 'code-output';
        pre.textContent = 'Ошибка рендера/загрузки: ' + (e && e.message ? e.message : String(e)) + '\n\nПроверьте синтаксис Mermaid или интернет/локальный бандл (assets/vendor/mermaid.min.js). Код можно скопировать и открыть в diagrams.net/PlantUML.';
        preview.appendChild(pre);
        setStatus('Не удалось отрисовать. Код сохранён локально.');
      }
      persist();
    };

    let saveTimer = null;
    codeEl.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 300);
    });
    templateSel?.addEventListener('change', persist);

    document.getElementById('insertDiagramTemplateBtn')?.addEventListener('click', () => {
      const key = templateSel ? templateSel.value : 'flowchart';
      codeEl.value = templates[key] || templates.flowchart;
      persist();
      renderDiagram();
    });

    document.getElementById('renderDiagramBtn')?.addEventListener('click', renderDiagram);
    document.getElementById('copyDiagramCodeBtn')?.addEventListener('click', async () => {
      await copyText(codeEl.value || '');
      showToast('Код диаграммы скопирован');
    });
    document.getElementById('downloadDiagramSvgBtn')?.addEventListener('click', () => {
      const svgEl = preview.querySelector('svg');
      if (!svgEl) { showToast('Сначала отрисуйте диаграмму'); return; }
      const serializer = new XMLSerializer();
      let svgText = serializer.serializeToString(svgEl);
      if (!svgText.match(/^<\?xml/)) svgText = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgText;
      downloadText('diagram.svg', svgText, 'image/svg+xml;charset=utf-8');
      showToast('SVG скачан');
    });
    document.getElementById('downloadDiagramPngBtn')?.addEventListener('click', () => {
      const svgEl = preview.querySelector('svg');
      if (!svgEl) { showToast('Сначала отрисуйте диаграмму'); return; }
      try {
        const serializer = new XMLSerializer();
        let svgText = serializer.serializeToString(svgEl);
        if (!svgText.match(/^<\?xml/)) svgText = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgText;
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const scale = 2;
            const w = Math.max(1, (svgEl.viewBox?.baseVal?.width || img.width || 800));
            const h = Math.max(1, (svgEl.viewBox?.baseVal?.height || img.height || 600));
            canvas.width = Math.ceil(w * scale);
            canvas.height = Math.ceil(h * scale);
            const ctx = canvas.getContext('2d');
            const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(scale, 0, 0, scale, 0, 0);
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob((blob) => {
              if (!blob) { showToast('Не удалось создать PNG'); URL.revokeObjectURL(url); return; }
              const a = document.createElement('a');
              const pngUrl = URL.createObjectURL(blob);
              a.href = pngUrl; a.download = 'diagram.png'; document.body.append(a); a.click(); a.remove();
              URL.revokeObjectURL(pngUrl); URL.revokeObjectURL(url);
              showToast('PNG скачан');
            }, 'image/png');
          } catch (err) {
            URL.revokeObjectURL(url);
            showToast('Не удалось экспортировать PNG');
          }
        };
        img.onerror = () => { URL.revokeObjectURL(url); showToast('Не удалось подготовить PNG'); };
        img.src = url;
      } catch {
        showToast('Не удалось экспортировать PNG');
      }
    });
  }


  const docTemplates = {
    srs:'1. Введение\n1.1 Цель документа\n1.2 Область решения\n1.3 Термины\n\n2. Контекст\n2.1 Пользователи и роли\n2.2 Ограничения\n\n3. Функциональные требования\nFR-001 ...\n\n4. Нефункциональные требования\nNFR-001 ...\n\n5. Интеграции и данные\n\n6. Критерии приемки\n\n7. Открытые вопросы',
    'user-stories':'Как [роль], я хочу [возможность], чтобы [ценность].\n\nAcceptance Criteria\nGiven ...\nWhen ...\nThen ...\n\nОшибочные сценарии:\n- ...\n\nПриоритет: Must / Should / Could',
    'api-spec':'openapi: 3.0.3\ninfo:\n  title: Example API\n  version: 1.0.0\npaths:\n  /resource/{id}:\n    get:\n      summary: Get resource\n      parameters:\n        - in: path\n          name: id\n          required: true\n          schema:\n            type: string\n      responses:\n        \'200\':\n          description: Success\n        \'404\':\n          description: Not found',
    'test-cases':'Название: Успешный сценарий\nПредусловия:\n- ...\n\nШаги:\n1. ...\n2. ...\n\nОжидаемый результат:\n- ...\n\nПостусловия:\n- ...'
  };

  function initDocuments() {
    $$('[data-doc]').forEach(btn=>btn.addEventListener('click',()=>{const content=docTemplates[btn.dataset.doc]||'';const textarea=$('#docContent');if(textarea)textarea.value=content;const editor=$('#docEditor');if(editor)editor.hidden=false;}));
    $('#downloadDocBtn')?.addEventListener('click',()=>downloadText('sa-template.txt',$('#docContent')?.value||''));
    $('#generateDocBtn')?.addEventListener('click',()=>{const type=$('#docTypeSelect')?.value;const out=$('#generatedDoc');if(out)out.value=docTemplates[type]||'';});
    $('#downloadGeneratedDoc')?.addEventListener('click',()=>downloadText('sa-generated-document.txt',$('#generatedDoc')?.value||''));
  }

  const messageTemplates = {
    clarification:'Коллеги, добрый день.\n\nНужно уточнить несколько моментов по [задаче]:\n1. [вопрос]\n2. [вопрос]\n\nЭто необходимо, чтобы зафиксировать [решение / критерий / ограничение].\nСпасибо.',
    meeting:'Коллеги, предлагаю встречу по теме [тема].\n\nЦель: [какое решение нужно получить].\nВходные материалы: [ссылка].\nПовестка:\n1. ...\n2. ...\n\nОжидаемый результат встречи: [решение / список вопросов].',
    review:'Коллеги, прошу провести ревью [документа / схемы / API-контракта].\n\nЧто важно проверить:\n- полнота сценариев;\n- ошибки и ограничения;\n- согласованность с текущей системой.\n\nКомментарии прошу оставить до [дата].',
    update:'Статус по [задаче]\n\nГотово:\n- ...\n\nВ работе:\n- ...\n\nОткрытые вопросы / блокеры:\n- ...\n\nСледующий шаг:\n- ...'
  };

  function initMessages() {
    $$('[data-email]').forEach(btn=>btn.addEventListener('click',()=>{const area=$('#emailTemplateText');if(area)area.value=messageTemplates[btn.dataset.email]||'';}));
    $('#copyEmailBtn')?.addEventListener('click',async()=>showToast(await copyText($('#emailTemplateText')?.value||'')?'Скопировано':'Не удалось скопировать'));
  }

  function initConverter() {
    const factors={kb:1,mb:1024,gb:1024*1024};
    const run=()=>{const value=Number($('#conv-input')?.value);const from=$('#conv-from')?.value;const to=$('#conv-to')?.value;const out=$('#conv-output');if(!out)return;if(!Number.isFinite(value)){out.value='Введите число';return;}const result=value*factors[from]/factors[to];out.value=`${Number(result.toFixed(6))} ${to.toUpperCase()}`;};
    $('#convertBtn')?.addEventListener('click',run);['#conv-input','#conv-from','#conv-to'].forEach(selector=>$(selector)?.addEventListener('change',run));run();
  }

  function initApiTester() {
    $('#sendApiBtn')?.addEventListener('click',async()=>{
      const method=$('#apiMethod')?.value||'GET';const url=$('#apiUrl')?.value?.trim();const out=$('#apiResponse');const status=$('#apiStatus');if(!out||!url)return;
      let parsed;try{parsed=new URL(url);}catch{out.textContent='Ошибка: некорректный URL';return;}if(!/^https?:$/.test(parsed.protocol)){out.textContent='Ошибка: поддерживаются только http/https URL';return;}
      out.textContent='Отправка запроса…';if(status)status.textContent='Loading…';
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
      try{
        const options={method,signal:controller.signal,headers:{Accept:'application/json,text/plain;q=0.9,*/*;q=0.8'}};
        if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify({title:'Test request from SA Guide',body:'Browser demo',userId:1});}
        const response=await fetch(url,options);clearTimeout(timeout);
        const contentType=response.headers.get('content-type')||'';const raw=await response.text();let body=raw;
        if(contentType.includes('application/json')){try{body=JSON.stringify(JSON.parse(raw),null,2);}catch{}}
        out.textContent=body||'(пустой ответ)';if(status)status.textContent=`${response.status} ${response.statusText||''}`.trim();
      }catch(error){clearTimeout(timeout);const message=error?.name==='AbortError'?'таймаут 10 секунд':(error?.message||'неизвестная ошибка');out.textContent=`Ошибка запроса: ${message}\n\nВозможная причина — CORS-политика целевого API или отсутствие сети.`;if(status)status.textContent='Request failed';}
    });
    $$('[data-api-url]').forEach(btn=>btn.addEventListener('click',()=>{const input=$('#apiUrl');if(input)input.value=btn.dataset.apiUrl||'';}));
  }

  function initNotes() {
    let notes=readJson(STORAGE.notes,[]);if(!Array.isArray(notes))notes=[];
    const list=$('#notesList');
    const render=()=>{if(!list)return;list.replaceChildren();if(!notes.length){const p=document.createElement('p');p.className='muted';p.textContent='Заметок пока нет.';list.append(p);return;}notes.forEach(note=>{const card=document.createElement('article');card.className='note-card';const head=document.createElement('div');head.className='note-card-head';const title=document.createElement('strong');title.textContent=note.title;const del=document.createElement('button');del.type='button';del.className='note-delete';del.textContent='Удалить';del.addEventListener('click',()=>{notes=notes.filter(item=>item.id!==note.id);writeJson(STORAGE.notes,notes);render();});head.append(title,del);const time=document.createElement('time');time.dateTime=note.iso||'';time.textContent=note.date||'';const body=document.createElement('p');body.textContent=note.content;card.append(head,time,body);list.append(card);});};
    $('#addNoteBtn')?.addEventListener('click',()=>{const title=$('#noteTitle')?.value.trim();const content=$('#noteContent')?.value.trim();if(!title){showToast('Введите заголовок');$('#noteTitle')?.focus();return;}const now=new Date();notes.unshift({id:Date.now(),title,content,date:now.toLocaleString('ru-RU'),iso:now.toISOString()});notes=notes.slice(0,50);writeJson(STORAGE.notes,notes);if($('#noteTitle'))$('#noteTitle').value='';if($('#noteContent'))$('#noteContent').value='';render();showToast('Заметка сохранена локально');});render();
  }

  function initPersistentChecklist(ids,key,fillSelector,percentSelector,resetSelector) {
    if (!ids.some(id => $(`#${id}`))) return;
    const saved=readJson(key,{});ids.forEach(id=>{const input=$(`#${id}`);if(input&&saved[id])input.checked=true;});
    const update=()=>{const state={};let checked=0;ids.forEach(id=>{const input=$(`#${id}`);state[id]=Boolean(input?.checked);if(state[id])checked++;});writeJson(key,state);const percent=Math.round(checked/ids.length*100);const fill=$(fillSelector);if(fill)fill.style.width=`${percent}%`;const label=$(percentSelector);if(label)label.textContent=`${percent}%`;};
    ids.forEach(id=>$(`#${id}`)?.addEventListener('change',update));$(resetSelector)?.addEventListener('click',()=>{ids.forEach(id=>{const input=$(`#${id}`);if(input)input.checked=false;});update();});update();
  }

  function initCompetency() {
    const ids=$$('.comp-cb').map(cb=>cb.id);const saved=readJson(STORAGE.competency,{});ids.forEach(id=>{const cb=$(`#${id}`);if(cb&&saved[id])cb.checked=true;});
    const update=()=>{const checked=ids.filter(id=>$(`#${id}`)?.checked).length;const percent=Math.round(checked/ids.length*100);const fill=$('#compProgressFill');if(fill)fill.style.width=`${percent}%`;const label=$('#compProgressPercent');if(label)label.textContent=`${percent}%`;};
    ids.forEach(id=>$(`#${id}`)?.addEventListener('change',update));
    $('#saveCompBtn')?.addEventListener('click',()=>{const state=Object.fromEntries(ids.map(id=>[id,Boolean($(`#${id}`)?.checked)]));writeJson(STORAGE.competency,state);showToast('Прогресс сохранён');});
    $('#resetCompBtn')?.addEventListener('click',()=>{ids.forEach(id=>{const cb=$(`#${id}`);if(cb)cb.checked=false;});writeJson(STORAGE.competency,{});update();});update();
  }

  function initCopyButtons() {
    $$('[data-copy-target]').forEach(btn=>btn.addEventListener('click',async()=>{const target=$(`#${CSS.escape(btn.dataset.copyTarget)}`);const text='value' in (target||{})?target.value:target?.textContent||'';showToast(await copyText(text)?'Скопировано':'Не удалось скопировать');}));
  }


  function initGuideExport() {
    const btn = $('#exportVisibleMdBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const sections = $$('.searchable').filter((s) => !s.hidden);
      if (!sections.length) { showToast('Нет видимых разделов'); return; }
      const md = (node) => (node.textContent || '').replace(/\s+/g, ' ').trim();
      const lines = ['# SA Guide — экспорт', '', `Дата: ${new Date().toLocaleString('ru-RU')}`, `Разделов: ${sections.length}`, ''];
      sections.forEach((section) => {
        const code = section.querySelector('.section-code')?.textContent.trim();
        const title = section.querySelector('h2')?.textContent.trim() || section.dataset.title || section.id;
        lines.push(`## ${code ? code + ' — ' : ''}${title}`, '');
        const intro = [...section.children].find((el) => el.tagName === 'P' && !el.closest('.note') && !el.closest('.button-row') && !el.closest('.tool-workspace'));
        if (intro) lines.push(md(intro), '');
        section.querySelectorAll(':scope > h3, :scope > div > h3, :scope .two-columns h3').forEach((h3) => lines.push(`### ${md(h3)}`));
        section.querySelectorAll(':scope li, :scope .artifact-grid span, :scope .compact-grid p').forEach((li) => {
          const t = md(li); if (t && t.length < 240) lines.push(`- ${t}`);
        });
        section.querySelectorAll(':scope .code-card, :scope pre').forEach((pre) => {
          const t = (pre.textContent || '').trim();
          if (t && t.length < 1000 && !/^(Response|Ответ появится|—)/.test(t)) lines.push('', '```', t, '```');
        });
        section.querySelectorAll(':scope .note').forEach((note) => { const t = md(note); if (t) lines.push('', `> ${t}`); });
        lines.push('');
      });
      const out = lines.join('\n').replace(/\n{3,}/g, '\n\n');
      try {
        const blob = new Blob([out], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sa-guide-export.md'; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } catch {}
      const ok = await copyText(out);
      showToast(ok ? 'Markdown скачан и скопирован' : 'Markdown скачан');
    });
  }

  function initSectionUtilities() {
    const continueBlock = $('#continueBlock');
    const continueLink = $('#continueLink');
    const continueLabel = $('#continueLabel');
    const cards = getCards();
    const setContinue = id => {
      const card = id ? $(`#${CSS.escape(id)}`) : null;
      if (!card || !continueBlock || !continueLink || !continueLabel) return;
      continueLink.href = `#${id}`;
      continueLabel.textContent = card.dataset.title || id;
      continueBlock.hidden = false;
    };
    const saved = readText(STORAGE.lastSection);
    if (saved) setContinue(saved);

    cards.forEach(card => {
      const head = $('.card-head', card);
      if (!head || head.querySelector('.deep-link-copy')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'deep-link-copy';
      button.textContent = '↗';
      button.title = 'Копировать ссылку на раздел';
      button.setAttribute('aria-label', `Копировать ссылку: ${card.dataset.title || card.id}`);
      button.addEventListener('click', async () => {
        const url = `${location.origin}${location.pathname}#${card.id}`;
        showToast(await copyText(url) ? 'Ссылка скопирована' : 'Не удалось скопировать ссылку');
      });
      head.append(button);
    });

    if ('IntersectionObserver' in window) {
      let lastWrite = '';
      const observer = new IntersectionObserver(entries => {
        const current = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
        if (!current || current.intersectionRatio < 0.28) return;
        const id = current.target.id;
        if (!id || id === lastWrite) return;
        lastWrite = id;
        writeText(STORAGE.lastSection, id);
        setContinue(id);
      }, { rootMargin: '-15% 0px -55% 0px', threshold: [0.28,0.5,0.75] });
      cards.forEach(card => observer.observe(card));
    }
  }

  function initRequirementChecker() {
    const input = $('#requirementInput');
    const scoreBox = $('#requirementScore');
    const findings = $('#requirementFindings');
    const weakWords = ['быстро','удобно','просто','примерно','около','оптимально','корректно','по возможности','при необходимости','достаточно','минимально','максимально','современный','эффективно'];
    const renderFinding = (text, type='warn') => {
      if (!findings) return;
      const li = document.createElement('li'); li.className = `finding finding--${type}`; li.textContent = text; findings.append(li);
    };
    const analyze = () => {
      const text = input?.value.trim() || '';
      if (!scoreBox || !findings) return;
      findings.replaceChildren();
      if (!text) { scoreBox.querySelector('strong').textContent='—'; scoreBox.querySelector('span').textContent='Введите формулировку требования'; return; }
      let score = 100;
      const lower = text.toLocaleLowerCase('ru');
      const foundWeak = weakWords.filter(word => lower.includes(word));
      if (text.length < 30) { score -= 15; renderFinding('Формулировка слишком короткая: вероятно, не хватает условия, объекта или результата.'); }
      if (!/(система|сервис|пользователь|клиент|оператор|api|приложение|модуль)/i.test(text)) { score -= 8; renderFinding('Неочевиден субъект требования — кто именно должен выполнить действие.'); }
      if (!/(долж|необходимо|требуется|shall|must)/i.test(text)) { score -= 8; renderFinding('Нет явной обязательности: полезно использовать «должна/должен» или эквивалент.'); }
      if (foundWeak.length) { score -= Math.min(24, foundWeak.length*8); renderFinding(`Найдены неоднозначные слова: ${foundWeak.join(', ')}.`); }
      if (/и.+и/i.test(text) && text.length > 120) { score -= 10; renderFinding('Возможно, в одном требовании объединено несколько независимых условий — проверьте атомарность.'); }
      if (!/(\d|ms|мс|сек|мин|rps|%|не более|не менее|ровно|статус|код|given|when|then)/i.test(text)) { score -= 10; renderFinding('Не виден измеримый критерий или наблюдаемый результат. Добавьте acceptance criteria.', 'info'); }
      if (!/[.!?]$/.test(text)) { score -= 3; renderFinding('Добавьте завершенную пунктуацию — это мелочь, но помогает качеству документации.', 'info'); }
      score = Math.max(0, score);
      scoreBox.querySelector('strong').textContent = `${score}/100`;
      scoreBox.querySelector('span').textContent = score >= 85 ? 'Формулировка выглядит достаточно конкретной' : score >= 65 ? 'Нужны уточнения перед согласованием' : 'Высокий риск неоднозначного понимания';
      if (!findings.children.length) renderFinding('Явных эвристических проблем не найдено. Все равно проверьте контекст, исключения и критерии приемки.', 'ok');
    };
    $('#analyzeRequirementBtn')?.addEventListener('click', analyze);
    $('#clearRequirementBtn')?.addEventListener('click', () => { if(input)input.value=''; if(findings)findings.replaceChildren(); if(scoreBox){scoreBox.querySelector('strong').textContent='—';scoreBox.querySelector('span').textContent='Добавьте требование для проверки';}});
  }

  function initAcceptanceBuilder() {
    const build = () => {
      const given = $('#acGiven')?.value.trim() || '...';
      const when = $('#acWhen')?.value.trim() || '...';
      const then = $('#acThen')?.value.trim() || '...';
      const out = $('#acceptanceOutput');
      if (out) out.textContent = `Scenario: [название]\nGiven ${given}\nWhen ${when}\nThen ${then}`;
    };
    $('#buildAcceptanceBtn')?.addEventListener('click', build);
  }

  function formatDuration(totalMinutes) {
    const minutes = Math.max(0, totalMinutes);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes - Math.floor(minutes)) * 60);
    return [days ? `${days} д` : '', hours ? `${hours} ч` : '', mins ? `${mins} мин` : '', secs ? `${secs} сек` : ''].filter(Boolean).join(' ') || '0 сек';
  }

  function initSlaCalculator() {
    const run = () => {
      const availability = Number($('#slaPercent')?.value);
      const days = Number($('#slaPeriod')?.value || 30);
      const out = $('#slaResult');
      if (!out) return;
      if (!Number.isFinite(availability) || availability < 0 || availability > 100) { out.textContent='Введите значение от 0 до 100%'; return; }
      const downtime = days * 24 * 60 * (1 - availability / 100);
      out.replaceChildren();
      const strong=document.createElement('strong');strong.textContent=`${availability}%`;
      const span=document.createElement('span');span.textContent=`Допустимый простой за ${days} дней: ${formatDuration(downtime)}`;
      out.append(strong,span);
    };
    $('#calcSlaBtn')?.addEventListener('click',run); $('#slaPercent')?.addEventListener('input',run); $('#slaPeriod')?.addEventListener('change',run); run();
  }

  function initPertCalculator() {
    const run=()=>{
      const o=Number($('#pertO')?.value),m=Number($('#pertM')?.value),p=Number($('#pertP')?.value),out=$('#pertResult');if(!out)return;
      if (![o,m,p].every(Number.isFinite) || o<0 || m<0 || p<0 || o>m || m>p) { out.textContent='Ожидается O ≤ M ≤ P и неотрицательные значения.'; return; }
      const expected=(o+4*m+p)/6;const sigma=(p-o)/6;
      out.replaceChildren();const strong=document.createElement('strong');strong.textContent=`PERT ≈ ${Number(expected.toFixed(2))}`;const span=document.createElement('span');span.textContent=`σ ≈ ${Number(sigma.toFixed(2))}; диапазон ~95%: ${Number(Math.max(0,expected-2*sigma).toFixed(2))}–${Number((expected+2*sigma).toFixed(2))}`;out.append(strong,span);
    };
    $('#calcPertBtn')?.addEventListener('click',run);['#pertO','#pertM','#pertP'].forEach(sel=>$(sel)?.addEventListener('input',run));run();
  }

  const HTTP_STATUSES = [
    [200,'OK','Успешное чтение или обработка'],[201,'Created','Ресурс создан'],[202,'Accepted','Запрос принят в асинхронную обработку'],[204,'No Content','Успех без тела ответа'],
    [304,'Not Modified','Используйте закэшированную версию'],[400,'Bad Request','Некорректный запрос'],[401,'Unauthorized','Требуется аутентификация'],[403,'Forbidden','Аутентификация есть, доступа нет'],[404,'Not Found','Ресурс не найден'],[409,'Conflict','Конфликт состояния/версии'],[412,'Precondition Failed','Не выполнено условие запроса'],[415,'Unsupported Media Type','Неподдерживаемый Content-Type'],[422,'Unprocessable Content','Синтаксис валиден, бизнес-валидация не пройдена'],[429,'Too Many Requests','Превышен rate limit'],
    [500,'Internal Server Error','Необработанная ошибка сервера'],[502,'Bad Gateway','Ошибка upstream'],[503,'Service Unavailable','Сервис временно недоступен'],[504,'Gateway Timeout','Upstream не ответил вовремя']
  ];

  function initHttpReference() {
    const input=$('#httpSearch'), list=$('#httpStatusList');
    const render=()=>{if(!list)return;const term=(input?.value||'').trim().toLowerCase();list.replaceChildren();HTTP_STATUSES.filter(([code,name,desc])=>!term||`${code} ${name} ${desc}`.toLowerCase().includes(term)).forEach(([code,name,desc])=>{const row=document.createElement('div');row.className='http-status-row';const c=document.createElement('code');c.textContent=String(code);const body=document.createElement('div');const st=document.createElement('strong');st.textContent=name;const sp=document.createElement('span');sp.textContent=desc;body.append(st,sp);row.append(c,body);list.append(row);});if(!list.children.length){const p=document.createElement('p');p.className='muted';p.textContent='Совпадений нет.';list.append(p);}};
    input?.addEventListener('input',render);render();
  }

  function initRiskMatrix() {
    let risks=readJson(STORAGE.risks,[]);if(!Array.isArray(risks))risks=[];const list=$('#riskList');
    const render=()=>{if(!list)return;list.replaceChildren();if(!risks.length){const p=document.createElement('p');p.className='muted';p.textContent='Риски еще не добавлены.';list.append(p);return;}risks.sort((a,b)=>b.score-a.score).forEach(risk=>{const row=document.createElement('div');row.className='risk-row';const score=document.createElement('span');score.className=`risk-score risk-score--${risk.score>15?'critical':risk.score>10?'high':risk.score>5?'medium':'low'}`;score.textContent=String(risk.score);const body=document.createElement('div');const title=document.createElement('strong');title.textContent=risk.title;const meta=document.createElement('small');meta.textContent=`P${risk.p} × I${risk.i}`;body.append(title,meta);const del=document.createElement('button');del.type='button';del.className='note-delete';del.textContent='Удалить';del.addEventListener('click',()=>{risks=risks.filter(r=>r.id!==risk.id);writeJson(STORAGE.risks,risks);render();});row.append(score,body,del);list.append(row);});};
    $('#addRiskBtn')?.addEventListener('click',()=>{const title=$('#riskTitle')?.value.trim();const p=Number($('#riskProbability')?.value),i=Number($('#riskImpact')?.value);if(!title){showToast('Опишите риск');return;}if(![p,i].every(v=>Number.isInteger(v)&&v>=1&&v<=5)){showToast('Вероятность и влияние — от 1 до 5');return;}risks.push({id:Date.now(),title,p,i,score:p*i});writeJson(STORAGE.risks,risks);if($('#riskTitle'))$('#riskTitle').value='';render();});render();
  }

  function csvCell(value) { const text=String(value??''); return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text; }
  function initTraceabilityTool() {
    let rows=readJson(STORAGE.traceability,[]);if(!Array.isArray(rows))rows=[];const body=$('#traceTableBody');
    const render=()=>{if(!body)return;body.replaceChildren();rows.forEach(row=>{const tr=document.createElement('tr');[row.goal,row.requirement,row.acceptance].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});const actions=document.createElement('td');const del=document.createElement('button');del.type='button';del.className='table-delete';del.textContent='×';del.setAttribute('aria-label','Удалить строку');del.addEventListener('click',()=>{rows=rows.filter(r=>r.id!==row.id);writeJson(STORAGE.traceability,rows);render();});actions.append(del);tr.append(actions);body.append(tr);});};
    $('#addTraceRowBtn')?.addEventListener('click',()=>{const goal=$('#traceGoal')?.value.trim(),requirement=$('#traceRequirement')?.value.trim(),acceptance=$('#traceAcceptance')?.value.trim();if(!requirement){showToast('Укажите requirement');return;}rows.push({id:Date.now(),goal,requirement,acceptance});writeJson(STORAGE.traceability,rows);['#traceGoal','#traceRequirement','#traceAcceptance'].forEach(sel=>{if($(sel))$(sel).value='';});render();});
    $('#clearTraceBtn')?.addEventListener('click',()=>{rows=[];writeJson(STORAGE.traceability,rows);render();});
    $('#exportTraceCsvBtn')?.addEventListener('click',()=>{const csv=['Goal,Requirement,Acceptance/Test',...rows.map(r=>[r.goal,r.requirement,r.acceptance].map(csvCell).join(','))].join('\n');downloadText('traceability-matrix.csv',csv);});render();
  }

  function initDecisionLog() {
    let decisions=readJson(STORAGE.decisions,[]);if(!Array.isArray(decisions))decisions=[];const list=$('#decisionList');
    const render=()=>{if(!list)return;list.replaceChildren();if(!decisions.length){const p=document.createElement('p');p.className='muted';p.textContent='Локальных решений пока нет.';list.append(p);return;}decisions.forEach((d,index)=>{const card=document.createElement('article');card.className='decision-entry';const head=document.createElement('div');head.className='decision-entry-head';const title=document.createElement('strong');title.textContent=`ADR-${String(index+1).padStart(3,'0')} · ${d.title}`;const status=document.createElement('span');status.textContent=d.status;head.append(title,status);const context=document.createElement('p');context.textContent=d.context||'Контекст не указан';const consequences=document.createElement('small');consequences.textContent=`Последствия: ${d.consequences||'—'}`;const del=document.createElement('button');del.type='button';del.className='note-delete';del.textContent='Удалить';del.addEventListener('click',()=>{decisions=decisions.filter(item=>item.id!==d.id);writeJson(STORAGE.decisions,decisions);render();});card.append(head,context,consequences,del);list.append(card);});};
    $('#saveDecisionBtn')?.addEventListener('click',()=>{const title=$('#decisionTitle')?.value.trim();if(!title){showToast('Укажите решение');return;}decisions.push({id:Date.now(),title,status:$('#decisionStatus')?.value||'Accepted',context:$('#decisionContext')?.value.trim()||'',consequences:$('#decisionConsequences')?.value.trim()||'',date:new Date().toISOString()});writeJson(STORAGE.decisions,decisions);['#decisionTitle','#decisionContext','#decisionConsequences'].forEach(sel=>{if($(sel))$(sel).value='';});render();showToast('Решение сохранено локально');});
    $('#exportDecisionsBtn')?.addEventListener('click',()=>{const md=decisions.map((d,i)=>`# ADR-${String(i+1).padStart(3,'0')}: ${d.title}\n\nStatus: ${d.status}\nDate: ${d.date||''}\n\n## Context\n${d.context||'—'}\n\n## Consequences\n${d.consequences||'—'}\n`).join('\n---\n\n');downloadText('architecture-decisions.md',md);});render();
  }

  function initGlossaryFilter() {
    const input=$('#glossarySearch');const items=$$('#glossary .glossary-grid > div');input?.addEventListener('input',()=>{const term=input.value.trim().toLowerCase();items.forEach(item=>item.hidden=Boolean(term&&!item.textContent.toLowerCase().includes(term)));});
  }

  function initBackToTop() {
    const btn=$('#backToTopBtn');if(!btn)return;let ticking=false;const update=()=>{btn.hidden=window.scrollY<900;ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}}, {passive:true});btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));update();
  }

  function initPwaInstall() {
    let promptEvent=null;const btn=$('#installAppBtn');
    window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;if(btn)btn.hidden=false;});
    btn?.addEventListener('click',async()=>{if(!promptEvent)return;promptEvent.prompt();try{await promptEvent.userChoice;}catch{}promptEvent=null;btn.hidden=true;});
    window.addEventListener('appinstalled',()=>{if(btn)btn.hidden=true;showToast('SA Guide установлен');});
    if('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load',()=>navigator.serviceWorker.register('../service-worker.js',{scope:'../'}).catch(()=>{}),{once:true});
  }

  function initFooter() { const y=$('#currentYear'); if(y)y.textContent=String(new Date().getFullYear()); }

  document.addEventListener('DOMContentLoaded',()=>{
    initTheme();
    initFontScale();
    initHeader();
    initMobileNav();
    initPrint();
    initSearch();
    initActiveNav();
    initBookmarks();
    initSectionUtilities();
    initGuideExport();
    initCourseProgress();
    initTimer();
    initDecisionTree();
    initDataModeler();
    initQuiz();
    initDiagramTool();
    initDocuments();
    initMessages();
    initConverter();
    initApiTester();
    initRequirementChecker();
    initAcceptanceBuilder();
    initSlaCalculator();
    initPertCalculator();
    initHttpReference();
    initRiskMatrix();
    initTraceabilityTool();
    initDecisionLog();
    initGlossaryFilter();
    initBackToTop();
    initPwaInstall();
  
  function initCourseProgress() {
    const boxes = $$('.course-progress-cb[data-course-module]');
    const percent = $('#courseProgressPercent');
    const fill = $('#courseProgressFill');
    const text = $('#courseProgressText');
    const reset = $('#resetCourseProgressBtn');
    if (!boxes.length || !percent || !fill || !text) return;
    const total = boxes.length;
    const readProgress = () => {
      const data = readJson(STORAGE.courseProgress, []);
      return Array.isArray(data) ? data.map(String) : [];
    };
    const render = (save = false) => {
      const done = boxes.filter(box => box.checked).map(box => String(box.dataset.courseModule));
      if (save) writeJson(STORAGE.courseProgress, done);
      const count = done.length;
      const pct = total ? Math.round((count / total) * 100) : 0;
      percent.textContent = `${pct}%`;
      fill.style.width = `${pct}%`;
      text.textContent = `Пройдено модулей: ${count} из ${total}. Отмечайте завершённые этапы — прогресс сохраняется локально.`;
    };
    const saved = new Set(readProgress());
    boxes.forEach(box => { box.checked = saved.has(String(box.dataset.courseModule)); box.addEventListener('change', () => render(true)); });
    reset?.addEventListener('click', () => {
      boxes.forEach(box => { box.checked = false; });
      writeJson(STORAGE.courseProgress, []);
      render(false);
      if (typeof showToast === 'function') showToast('Прогресс курса сброшен');
    });
    render(false);
  }


  function initDataBackup() {
      const exportBtn = $('#exportSaDataBtn');
      const importBtn = $('#importSaDataBtn');
      const clearBtn = $('#clearSaDataBtn');
      const input = $('#importSaDataInput');
      if (!exportBtn || !importBtn || !input) return;
      const collect = () => {
        const data = { schema: 'knowerlife-sa-backup', version: 1, exportedAt: new Date().toISOString(), storage: {} };
        Object.values(STORAGE).forEach((key) => {
          try {
            const raw = localStorage.getItem(key);
            if (raw !== null) data.storage[key] = raw;
          } catch {}
        });
        return data;
      };
      exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(collect(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowerlife-sa-backup.json';
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Экспорт создан');
      });
      importBtn.addEventListener('click', () => input.click());
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          const storage = data && typeof data.storage === 'object' ? data.storage : null;
          if (!storage) throw new Error('Invalid backup format');
          if (!window.confirm('Импорт перезапишет текущие локальные данные SA Guide в этом браузере. Продолжить?')) return;
          Object.entries(storage).forEach(([key, value]) => {
            if (typeof value === 'string') {
              try { localStorage.setItem(key, value); } catch {}
            }
          });
          showToast('Данные импортированы, обновляю страницу…');
          window.setTimeout(() => window.location.reload(), 400);
        } catch {
          showToast('Не удалось импортировать файл');
        } finally {
          input.value = '';
        }
      });
      clearBtn?.addEventListener('click', () => {
        if (!window.confirm('Удалить все локальные данные SA Guide (заметки, закладки, прогресс, решения)?')) return;
        Object.values(STORAGE).forEach((key) => { try { localStorage.removeItem(key); } catch {} });
        showToast('Локальные данные SA очищены');
        window.setTimeout(() => window.location.reload(), 400);
      });
    }

    initNotes();
    initDataBackup();
    initPersistentChecklist(['sec1','sec2','sec3','sec4','sec5','sec6'],STORAGE.security,'#secChecklistProgress','#secChecklistPercent','#resetSecChecklist');
    initPersistentChecklist(['chStakeholders','chUserStories','chAcceptance','chNonFunctional','chTrace'],STORAGE.requirements,'#reqChecklistProgress','#reqChecklistPercent','#resetReqChecklist');
    initCompetency();
    initCopyButtons();
    initFooter();
  });
})();

/* KnowerLife v11.1 — unified ecosystem shell bootstrap. */
(() => {
  if (!window.__knowerlifeInstallCapture) {
    window.__knowerlifeInstallCapture = true;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      window.__knowerlifeInstallPrompt = event;
      window.dispatchEvent(new CustomEvent('knowerlife:installprompt', { detail: event }));
    });
    window.addEventListener('appinstalled', () => {
      window.__knowerlifeInstallPrompt = null;
    });
  }
  const boot = () => {
    if (window.__knowerlifeEcosystemShellBooted) return;
    window.__knowerlifeEcosystemShellBooted = true;
    const base = document.documentElement.dataset.base || './';
    const src = new URL(`${base}assets/js/ecosystem-shell.js`, location.href).href;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.ecosystemShellLoader = '';
    document.body.append(script);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else window.setTimeout(boot, 0);
})();

