# `<KnowerLife />`

[![Website](https://img.shields.io/badge/website-knowerlife.ru-6757f5?style=for-the-badge&logo=google-chrome&logoColor=white)](https://knowerlife.ru/)
[![GitHub Pages](https://img.shields.io/badge/hosting-GitHub%20Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5a48e8?style=for-the-badge&logo=pwa&logoColor=white)](https://knowerlife.ru/)
[![Languages](https://img.shields.io/badge/languages-RU%20%7C%20EN-1f6feb?style=for-the-badge)](https://knowerlife.ru/en/)

<p align="center">
  <a href="https://knowerlife.ru/">
    <img src="assets/seo/og-home-ru.png" alt="KnowerLife — системный анализ, API, интеграции и цифровые продукты" width="100%">
  </a>
</p>

**KnowerLife** — технологичное портфолио системного аналитика и разработчика.
Проект объединяет услуги, подробные кейсы, полный каталог работ и набор локальных browser-инструментов для аналитики, проектирования API и повседневной разработки.

🌐 **Production:** [https://knowerlife.ru/](https://knowerlife.ru/)

---

## Содержание

- [О проекте](#о-проекте)
- [Ключевые возможности](#ключевые-возможности)
- [Структура сайта](#структура-сайта)
- [Подробные кейсы](#подробные-кейсы)
- [Browser Lab: 17 инструментов](#browser-lab-17-инструментов)
- [Технологии](#технологии)
- [Архитектура проекта](#архитектура-проекта)
- [PWA и offline-режим](#pwa-и-offline-режим)
- [SEO](#seo)
- [Производительность](#производительность)
- [Доступность](#доступность)
- [Приватность и безопасность](#приватность-и-безопасность)
- [Контакты](#контакты)
- [English summary](#english-summary)

---

## О проекте

Сайт показывает работу на стыке:

- системного и бизнес-анализа;
- проектирования API и интеграционных контрактов;
- моделирования процессов и данных;
- сопровождения реализации;
- разработки web-интерфейсов и автоматизации;
- SEO, e-commerce и цифровых коммуникаций.

Главная идея проекта — не просто перечислить технологии, а показать полный путь от бизнес-задачи до проверяемого инженерного решения:

```text
Business goal
     ↓
User scenario
     ↓
System behavior
     ↓
API / Data / Integration
     ↓
Acceptance and delivery
```

Проект работает как полностью статический сайт и не требует собственного backend или базы данных.

---

## Ключевые возможности

### Профессиональное портфолио

- 21 коммерческий, корпоративный, web-, SEO-, e-commerce- и SMM-проект;
- три подробных кейса с задачей, ролью, решением и результатом;
- фильтрация и полнотекстовый поиск по проектам;
- режимы отображения «сетка» и «компактный список»;
- отдельный блок open-source проектов;
- интерактивный навигатор по формату сотрудничества.

### Современный UX/UI

- адаптивная верстка для desktop, tablet и mobile;
- светлая и темная темы;
- bento-композиция компетенций;
- технологичные схемы процессов и интеграций;
- командная палитра `Ctrl/⌘ + K`;
- микроанимации без тяжелых UI-фреймворков;
- поддержка `prefers-reduced-motion`;
- нативные `dialog`, `details`, CSS Grid и container queries.

### Два языка

- русская версия: [`/`](https://knowerlife.ru/);
- английская версия: [`/en/`](https://knowerlife.ru/en/);
- взаимные `hreflang`;
- локализованные title, description, Open Graph и structured data.

### PWA

- установка сайта как приложения;
- standalone-режим;
- offline fallback;
- кэширование посещенных страниц и ресурсов;
- shortcuts к портфолио, навигатору проекта и инструментам;
- автоматическое удаление старых версий кэша.

---

## Структура сайта

| Раздел | URL | Назначение |
|---|---|---|
| Главная | [`/`](https://knowerlife.ru/) | Услуги, компетенции, кейсы, портфолио и контакты |
| English | [`/en/`](https://knowerlife.ru/en/) | Английская версия главной |
| Инструменты | [`/tools/`](https://knowerlife.ru/tools/) | 17 локальных browser-инструментов |
| Tools EN | [`/en/tools/`](https://knowerlife.ru/en/tools/) | Английская версия инструментов |
| Корпоративный кейс | [`/cases/roscosmos/`](https://knowerlife.ru/cases/roscosmos/) | Системный анализ и документооборот |
| Saunabani | [`/cases/saunabani/`](https://knowerlife.ru/cases/saunabani/) | Запуск сайта и SEO |
| Интеграции | [`/cases/integrations/`](https://knowerlife.ru/cases/integrations/) | E-commerce, 1С и логистика |
| Конфиденциальность | [`/privacy/`](https://knowerlife.ru/privacy/) | Обработка данных и аналитика |
| Privacy EN | [`/en/privacy/`](https://knowerlife.ru/en/privacy/) | English privacy policy |
| Карта сайта | [`/site-map/`](https://knowerlife.ru/site-map/) | Человекочитаемая навигация |
| Sitemap XML | [`/sitemap.xml`](https://knowerlife.ru/sitemap.xml) | Карта сайта для поисковых систем |

---

## Подробные кейсы

### Корпоративные системы и документооборот

**Фокус:** системный анализ, интеграции, BPMN, REST, 1С, безопасность.

Кейс показывает:

- анализ сложного корпоративного контура;
- проектирование взаимодействий интернет-магазина, 1С и логистики;
- моделирование маршрутов согласования документов;
- требования к ролям, доступам, ошибкам и аудиту;
- связь требований с критериями приемки.

[Открыть кейс →](https://knowerlife.ru/cases/roscosmos/)

### Saunabani: сайт и SEO

**Фокус:** web-разработка, структура контента, поисковая оптимизация и развитие продукта.

Кейс раскрывает:

- запуск сайта с нуля;
- проектирование структуры страниц;
- техническую и контентную SEO-оптимизацию;
- развитие органического трафика;
- сопровождение после публикации.

[Открыть кейс →](https://knowerlife.ru/cases/saunabani/)

### Интеграционный контур e-commerce

**Фокус:** API, события, модели данных, обработка ошибок и повторные попытки.

Кейс показывает:

- обмен между e-commerce платформой, 1С и службой доставки;
- контракты запросов и ответов;
- синхронизацию статусов заказа;
- обработку ошибок и идемпотентность;
- трассировку интеграционных сценариев.

[Открыть кейс →](https://knowerlife.ru/cases/integrations/)

---

## Browser Lab: 17 инструментов

Все вычисления выполняются локально в браузере. Введенные данные не отправляются на сервер KnowerLife.

<p align="center">
  <a href="https://knowerlife.ru/tools/">
    <img src="assets/seo/og-tools-ru.png" alt="17 browser-инструментов KnowerLife" width="100%">
  </a>
</p>

| № | Инструмент | Возможности |
|---:|---|---|
| 1 | Безопасный пароль | Генерация через Web Crypto и оценка энтропии |
| 2 | UUID v4 | Создание до 50 идентификаторов |
| 3 | SHA-хеш | SHA-256, SHA-384 и SHA-512 |
| 4 | JSON formatter | Проверка, форматирование, минификация и сортировка |
| 5 | JSON diff | Added, removed и changed paths |
| 6 | Base64 | UTF-8 encode/decode и URL-safe режим |
| 7 | Шифр Цезаря | Учебное преобразование RU/EN текста |
| 8 | URL toolkit | Разбор URL и query-параметров |
| 9 | JWT decoder | Header, payload и временные claims |
| 10 | Unix timestamp | Секунды, миллисекунды и локальная дата |
| 11 | CSV ↔ JSON | Двусторонняя конвертация |
| 12 | Regex tester | Совпадения, группы и replace preview |
| 13 | Текст и slug | Статистика текста и транслитерация |
| 14 | User Story + BDD | История, checklist и Given/When/Then |
| 15 | API request → cURL | Подготовка безопасно экранированной команды |
| 16 | Mermaid sequence | Генерация диаграммы последовательности |
| 17 | Проектный бриф | Структурированный Markdown для discovery |

[Открыть Browser Lab →](https://knowerlife.ru/tools/)

---

## Технологии

### Frontend

- semantic HTML5;
- modern CSS;
- CSS Grid и Flexbox;
- container queries;
- fluid typography;
- CSS custom properties;
- `color-mix()`;
- ES Modules;
- Web Crypto API;
- Local Storage;
- Intersection Observer;
- View Transitions как progressive enhancement.

### PWA

- Web App Manifest;
- Service Worker;
- Cache Storage API;
- offline fallback;
- network-first для навигации;
- stale-while-revalidate для CSS и JavaScript;
- cache-first для изображений и шрифтов.

### SEO

- canonical URL;
- `hreflang` RU/EN;
- Open Graph;
- Twitter Cards;
- JSON-LD;
- `WebSite`, `Organization`, `WebPage`, `Article`, `BreadcrumbList`, `ItemList` и `WebApplication`;
- XML sitemap;
- human-readable site map;
- robots.txt;
- отдельные social-preview изображения.

### Инфраструктура

- GitHub Pages;
- custom domain `knowerlife.ru`;
- HTTPS;
- статическая публикация без backend;
- Яндекс.Метрика только после явного согласия пользователя.

---

## Архитектура проекта

```text
.
├── index.html                     # Русская главная
├── en/
│   ├── index.html                 # English home
│   ├── tools/
│   ├── privacy/
│   └── site-map/
├── cases/
│   ├── roscosmos/
│   ├── saunabani/
│   └── integrations/
├── tools/
│   └── index.html                 # Browser Lab
├── privacy/
│   └── index.html
├── site-map/
│   └── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js               # Общий UI и PWA-регистрация
│   │   ├── home.js               # Логика главной страницы
│   │   ├── tools-loader.js       # Lazy loading Browser Lab
│   │   ├── tools.js              # UI инструментов
│   │   └── tools-core.js         # Чистые функции преобразований
│   ├── icons/
│   │   ├── favicon.svg
│   │   ├── favicon.ico
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── seo/
│       └── og-*.png               # Social-preview изображения
├── manifest.webmanifest
├── service-worker.js
├── offline.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── CNAME
└── README.md
```

---

## PWA и offline-режим

PWA-конфигурация находится в:

```text
manifest.webmanifest
service-worker.js
```

Manifest определяет:

- название приложения;
- `start_url`;
- `scope`;
- standalone-режим;
- theme и background colors;
- иконки 192×192 и 512×512;
- shortcuts.

Service Worker использует несколько кэшей:

```text
knowerlife-v10.0.0-static
knowerlife-v10.0.0-pages
knowerlife-v10.0.0-runtime
```

Стратегии:

| Ресурс | Стратегия |
|---|---|
| HTML-навигация | Network First |
| CSS и JavaScript | Stale While Revalidate |
| Изображения и шрифты | Cache First |
| Недоступная страница | `offline.html` |

## SEO

SEO-конфигурация индексируемых страниц включает:

- уникальные `<title>` и `meta description`;
- canonical URL;
- Open Graph metadata;
- Twitter Card metadata;
- корректный атрибут `lang`;
- structured data;
- включение canonical URL в `sitemap.xml`.

## Производительность

В проекте применяются:

- раздельная загрузка общего кода, главной и инструментов;
- lazy loading модулей Browser Lab;
- загрузка дополнительных скриптов после взаимодействия или в idle-период;
- небольшой PWA app shell;
- runtime caching только после посещения ресурса;
- `content-visibility` для длинных секций;
- системный стек шрифтов без внешней загрузки;
- отсутствие тяжелого frontend-фреймворка;
- отсутствие внешних UI- и animation-библиотек;
- отложенная загрузка аналитики.

---

## Доступность

Проект использует:

- semantic HTML;
- skip-link;
- видимый `:focus-visible`;
- клавиатурную навигацию;
- ARIA labels и live regions;
- нативные `button`, `dialog`, `details` и `summary`;
- touch targets около 44 px;
- поддержку `prefers-reduced-motion`;
- поддержку повышенного контраста;
- адаптивную типографику;
- корректное поведение на ширине 390 px.

---

## Приватность и безопасность

### Локальные инструменты

Browser Lab работает на устройстве пользователя:

- данные не отправляются на backend KnowerLife;
- результаты не сохраняются сервером;
- генерация файлов выполняется средствами браузера;
- пароль и UUID создаются через криптографический API.

### Контактная форма

Форма подготавливает `mailto:`-ссылку и открывает почтовое приложение.
Сообщение не отправляется автоматически без действия пользователя.

### Аналитика

Яндекс.Метрика загружается только после явного согласия.
Webvisor отключен.

### Важные ограничения

- JWT decoder не проверяет цифровую подпись;
- шифр Цезаря не является средством защиты данных;
- не вставляйте производственные секреты и реальные токены на чужом устройстве;
- SHA через Web Crypto требует безопасного контекста HTTPS или localhost.

Подробнее: [Политика конфиденциальности](https://knowerlife.ru/privacy/).

---

## Контакты

- 🌐 **Website:** [knowerlife.ru](https://knowerlife.ru/)
- 📧 **Email:** [info@knowerlife.ru](mailto:info@knowerlife.ru)
- 🐙 **GitHub:** [github.com/KnowerLife](https://github.com/KnowerLife)
- ✈️ **Telegram:** [@knowerlife](https://t.me/knowerlife)
- 📘 **VK:** [vk.com/knowerlife](https://vk.com/knowerlife)

---

## English summary

**KnowerLife** is a static, bilingual portfolio for a system analyst and developer.

The project includes:

- system analysis and integration services;
- 21 commercial and corporate projects;
- three detailed case studies;
- 17 privacy-friendly browser tools;
- RU and EN versions;
- installable PWA and offline fallback;
- dark and light themes;
- responsive and accessible UI;
- structured data, Open Graph, hreflang and XML sitemap;
- GitHub Pages deployment with the custom domain `knowerlife.ru`.

### Production

[https://knowerlife.ru/](https://knowerlife.ru/)

---

© 2026 KnowerLife. System analysis, integrations and digital product development.
