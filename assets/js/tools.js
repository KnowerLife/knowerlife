import {
  analyzeUrl,
  base64ToUtf8,
  buildBrief,
  buildCurl,
  buildMermaidSequence,
  buildUserStory,
  csvToJson,
  dateToTimestamps,
  decodeJwt,
  decodeUrlComponent,
  diffJson,
  encodeUrlComponent,
  formatJson,
  hashText,
  jsonToCsv,
  makePassword,
  runRegex,
  shiftText,
  textStats,
  timestampToDate,
  utf8ToBase64,
  uuidV4
} from './tools-core.js';

const root = document.documentElement;
const isEnglish = root.lang === 'en';
const locale = isEnglish ? 'en' : 'ru';
const localeTag = isEnglish ? 'en-GB' : 'ru-RU';
const byId = (id) => document.getElementById(id);
const t = (ru, en) => isEnglish ? en : ru;

const messages = {
  emptyOutput: t('Результат появится здесь.', 'The result will appear here.'),
  copied: t('Скопировано', 'Copied'),
  copyFailed: t('Не удалось скопировать', 'Could not copy'),
  cleared: t('Поля очищены', 'Fields cleared'),
  noTools: t('По этому запросу инструменты не найдены.', 'No tools match this query.'),
  oneTool: t('1 инструмент', '1 tool'),
  manyTools: (count) => t(`${count} инструментов`, `${count} tools`),
  invalid: t('Проверьте введённые данные.', 'Check the entered data.'),
  downloaded: t('Файл подготовлен', 'File prepared')
};

const toast = byId('tool-toast');
let toastTimer;
function showToast(message, state = 'success') {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.state = state;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2200);
}

function outputButtons(outputId) {
  return [...document.querySelectorAll(`[data-copy-target="${CSS.escape(outputId)}"], [data-download-target="${CSS.escape(outputId)}"]`)];
}

function setOutput(id, value, state = 'success') {
  const output = byId(id);
  if (!output) return;
  const text = String(value ?? '');
  output.textContent = text || messages.emptyOutput;
  output.dataset.placeholder = String(!text);
  output.dataset.state = text ? state : '';
  outputButtons(id).forEach((button) => { button.disabled = !text; });
}

function resetOutput(output) {
  const emptyText = output.dataset.empty || messages.emptyOutput;
  output.textContent = emptyText;
  output.dataset.placeholder = 'true';
  output.dataset.state = '';
  outputButtons(output.id).forEach((button) => { button.disabled = true; });
}

document.querySelectorAll('.tool-output').forEach(resetOutput);

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const fallback = document.createElement('textarea');
  fallback.value = value;
  fallback.setAttribute('readonly', '');
  fallback.style.position = 'fixed';
  fallback.style.opacity = '0';
  document.body.append(fallback);
  fallback.select();
  const copied = document.execCommand('copy');
  fallback.remove();
  if (!copied) throw new Error('copy failed');
}

document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = byId(button.dataset.copyTarget);
    if (!target || target.dataset.placeholder === 'true') return;
    try {
      await copyText(target.textContent);
      showToast(messages.copied);
    } catch {
      showToast(messages.copyFailed, 'error');
    }
  });
});

function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast(messages.downloaded);
}

document.querySelectorAll('[data-download-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = byId(button.dataset.downloadTarget);
    if (!target || target.dataset.placeholder === 'true') return;
    downloadText(button.dataset.filename || 'result.txt', target.textContent, button.dataset.mime || 'text/plain;charset=utf-8');
  });
});

document.querySelectorAll('[data-tool-form]').forEach((form) => {
  form.addEventListener('submit', (event) => event.preventDefault());
});

document.querySelectorAll('[data-tool-reset]').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('[data-tool-card]');
    card?.querySelectorAll('form').forEach((form) => form.reset());
    card?.querySelectorAll('.tool-output').forEach(resetOutput);
    card?.querySelectorAll('[data-derived]').forEach((element) => { element.textContent = element.dataset.default || ''; });
    card?.querySelectorAll('input[type="range"]').forEach((range) => range.dispatchEvent(new Event('input', { bubbles: true })));
    showToast(messages.cleared);
  });
});

const toolCards = [...document.querySelectorAll('[data-tool-card]')];
const categoryButtons = [...document.querySelectorAll('[data-tool-filter]')];
const toolSearch = byId('tool-search');
const toolSearchClear = byId('tool-search-clear');
const toolCount = byId('tool-count');
const toolEmpty = byId('tool-empty');
const quickLinks = [...document.querySelectorAll('[data-tool-link]')];
let activeCategory = 'all';

function countLabel(count) {
  if (count === 1) return messages.oneTool;
  if (!isEnglish) {
    const mod100 = count % 100;
    const mod10 = count % 10;
    if (mod100 >= 11 && mod100 <= 14) return `${count} инструментов`;
    if (mod10 >= 2 && mod10 <= 4) return `${count} инструмента`;
  }
  return messages.manyTools(count);
}

function applyToolFilters() {
  const query = String(toolSearch?.value || '').trim().toLocaleLowerCase(localeTag);
  let visibleCount = 0;
  toolCards.forEach((card) => {
    const categories = String(card.dataset.categories || '').split(/\s+/);
    const searchable = String(card.dataset.search || card.textContent || '').toLocaleLowerCase(localeTag);
    const visible = (activeCategory === 'all' || categories.includes(activeCategory)) && (!query || searchable.includes(query));
    card.hidden = !visible;
    if (!visible) card.open = false;
    if (visible) visibleCount += 1;
  });
  quickLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute('href'));
    link.hidden = Boolean(target?.hidden);
  });
  if (toolCount) toolCount.textContent = countLabel(visibleCount);
  if (toolSearchClear) toolSearchClear.disabled = !toolSearch?.value;
  if (toolEmpty) toolEmpty.hidden = visibleCount !== 0;
}

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.toolFilter || 'all';
    categoryButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyToolFilters();
  });
});
toolSearch?.addEventListener('input', applyToolFilters);
toolSearchClear?.addEventListener('click', () => {
  if (!toolSearch) return;
  toolSearch.value = '';
  toolSearch.focus();
  applyToolFilters();
});
byId('tools-expand')?.addEventListener('click', () => toolCards.filter((card) => !card.hidden).forEach((card) => { card.open = true; }));
byId('tools-collapse')?.addEventListener('click', () => toolCards.forEach((card) => { card.open = false; }));

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
    event.preventDefault();
    toolSearch?.focus();
  }
  if (event.key === 'Escape' && document.activeElement === toolSearch && toolSearch?.value) {
    toolSearch.value = '';
    applyToolFilters();
  }
});

function openToolFromHash({ scroll = false } = {}) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const card = byId(id);
  if (!(card instanceof HTMLDetailsElement) || !card.matches('[data-tool-card]')) return;
  card.hidden = false;
  card.open = true;
  if (scroll) card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
quickLinks.forEach((link) => link.addEventListener('click', () => window.setTimeout(() => openToolFromHash({ scroll: true }), 0)));
window.addEventListener('hashchange', () => openToolFromHash({ scroll: true }));
applyToolFilters();
openToolFromHash();

function localizeError(error, replacements = {}) {
  const english = error instanceof Error ? error.message : String(error);
  if (replacements[english]) return replacements[english];
  if (isEnglish) return english;
  const exact = {
    'Password length must be between 8 and 128.': 'Длина пароля должна быть от 8 до 128 символов.',
    'Select at least one character set.': 'Выберите хотя бы один набор символов.',
    'The symbol set cannot be empty.': 'Набор символов не может быть пустым.',
    'JSON input is empty.': 'Введите JSON.',
    'Web Crypto is unavailable. Open the site over HTTPS.': 'Web Crypto недоступен. Откройте сайт по HTTPS.',
    'Unsupported hash algorithm.': 'Этот алгоритм хеширования не поддерживается.',
    'JWT must contain three dot-separated segments.': 'JWT должен состоять из трёх частей, разделённых точками.',
    'Timestamp must be a finite number.': 'Timestamp должен быть числом.',
    'Timestamp is outside the supported date range.': 'Дата находится за пределами поддерживаемого диапазона.',
    'Enter a valid date and time.': 'Введите корректные дату и время.',
    'URL input is empty.': 'Введите URL.',
    'Invalid URL': 'Некорректный URL.',
    'Unsupported CSV delimiter.': 'Этот разделитель CSV не поддерживается.',
    'CSV input is empty.': 'Введите CSV.',
    'CSV contains an unclosed quoted field.': 'В CSV не закрыто поле в кавычках.',
    'Every CSV column must have a header.': 'У каждого столбца CSV должен быть заголовок.',
    'CSV headers must be unique.': 'Заголовки CSV должны быть уникальными.',
    'JSON must be an array of objects.': 'JSON должен быть массивом объектов.',
    'Every JSON array item must be an object.': 'Каждый элемент массива JSON должен быть объектом.',
    'Regular expression is empty.': 'Введите регулярное выражение.',
    'Regular expression is limited to 300 characters.': 'Регулярное выражение ограничено 300 символами.',
    'Test text is limited to 20,000 characters.': 'Тестовый текст ограничен 20 000 символами.',
    'Unsupported regular expression flags.': 'Указаны неподдерживаемые флаги регулярного выражения.',
    'HTTP method contains invalid characters.': 'HTTP-метод содержит недопустимые символы.',
    'Request URL is required.': 'Укажите URL запроса.',
    'Request URL must use HTTP or HTTPS.': 'URL запроса должен использовать HTTP или HTTPS.',
    'Add at least two participants.': 'Добавьте минимум двух участников.',
    'Add at least one interaction.': 'Добавьте минимум одно взаимодействие.'
  };
  if (exact[english]) return exact[english];
  if (/^Unexpected token|^Expected property|^Unexpected end of JSON/.test(english)) return `Ошибка JSON: ${english}`;
  if (/^Row \d+ contains/.test(english)) return `Ошибка CSV: ${english}`;
  if (/^Header must contain a colon:/.test(english)) return `Заголовок должен содержать двоеточие: ${english.split(': ').slice(1).join(': ')}`;
  if (/^Invalid participant alias:/.test(english)) return `Некорректный псевдоним участника: ${english.split(': ').slice(1).join(': ')}`;
  if (/^Participant .+ has no label\.$/.test(english)) return `У участника не задано название: ${english}`;
  if (/^Invalid interaction:/.test(english)) return `Некорректное взаимодействие: ${english.split(': ').slice(1).join(': ')}`;
  if (/^Unknown participant in interaction:/.test(english)) return `Во взаимодействии указан неизвестный участник: ${english.split(': ').slice(1).join(': ')}`;
  if (/Invalid character|valid for encoding utf-8/i.test(english)) return 'Некорректная Base64-строка или UTF-8 данные.';
  return english;
}

function runAction(callback, outputId, replacements = {}) {
  try {
    const result = callback();
    if (result instanceof Promise) {
      result.then((value) => setOutput(outputId, value)).catch((error) => setOutput(outputId, localizeError(error, replacements), 'error'));
    } else setOutput(outputId, result);
  } catch (error) {
    setOutput(outputId, localizeError(error, replacements), 'error');
  }
}

// Password generator
const passwordLength = byId('password-length');
const passwordRange = byId('password-range');
function syncPasswordLength(source, target) {
  if (!source || !target) return;
  target.value = source.value;
  const label = byId('password-length-value');
  if (label) label.textContent = source.value;
}
passwordRange?.addEventListener('input', () => syncPasswordLength(passwordRange, passwordLength));
passwordLength?.addEventListener('input', () => syncPasswordLength(passwordLength, passwordRange));
syncPasswordLength(passwordRange, passwordLength);

byId('password-generate')?.addEventListener('click', () => {
  runAction(() => {
    const result = makePassword({
      length: Math.min(128, Math.max(8, Number(passwordLength?.value) || 20)),
      lower: byId('password-lower')?.checked,
      upper: byId('password-upper')?.checked,
      numbers: byId('password-numbers')?.checked,
      symbols: byId('password-symbols')?.checked,
      avoidAmbiguous: byId('password-ambiguous')?.checked,
      customSymbols: byId('password-symbol-set')?.value
    });
    const strength = {
      weak: t('слабая', 'weak'), medium: t('средняя', 'medium'), strong: t('сильная', 'strong'), excellent: t('очень высокая', 'excellent')
    }[result.rating];
    byId('password-meta').textContent = t(
      `Энтропия: ≈${result.entropy} бит · стойкость: ${strength}`,
      `Entropy: ≈${result.entropy} bits · strength: ${strength}`
    );
    return result.value;
  }, 'password-output', {
    'Select at least one character set.': t('Выберите хотя бы один набор символов.', 'Select at least one character set.'),
    'The symbol set cannot be empty.': t('Набор символов не может быть пустым.', 'The symbol set cannot be empty.')
  });
});

// UUID
byId('uuid-generate')?.addEventListener('click', () => {
  runAction(() => {
    const count = Math.min(50, Math.max(1, Number(byId('uuid-count')?.value) || 1));
    const uppercase = byId('uuid-uppercase')?.checked;
    const values = Array.from({ length: count }, uuidV4).map((value) => uppercase ? value.toUpperCase() : value);
    return values.join('\n');
  }, 'uuid-output');
});

// Hash
byId('hash-generate')?.addEventListener('click', () => {
  runAction(() => hashText(byId('hash-input')?.value || '', byId('hash-algorithm')?.value || 'SHA-256'), 'hash-output');
});

// JSON toolkit
byId('json-format')?.addEventListener('click', () => runAction(() => formatJson(byId('json-input')?.value || '', {
  mode: 'pretty', sortKeys: byId('json-sort')?.checked
}), 'json-output', { 'JSON input is empty.': t('Введите JSON.', 'Enter JSON.') }));
byId('json-minify')?.addEventListener('click', () => runAction(() => formatJson(byId('json-input')?.value || '', {
  mode: 'minify', sortKeys: byId('json-sort')?.checked
}), 'json-output'));
byId('json-example')?.addEventListener('click', () => {
  byId('json-input').value = '{"project":"KnowerLife","status":"active","roles":["analyst","developer"],"metrics":{"cases":21,"tools":16}}';
  byId('json-format')?.click();
});

// JSON diff
byId('json-diff-run')?.addEventListener('click', () => runAction(() => {
  const changes = diffJson(byId('json-diff-left')?.value || '', byId('json-diff-right')?.value || '');
  return changes.length ? changes.join('\n') : t('Различий не найдено.', 'No differences found.');
}, 'json-diff-output'));
byId('json-diff-example')?.addEventListener('click', () => {
  byId('json-diff-left').value = '{"status":"draft","owner":"Anna","tags":["api"]}';
  byId('json-diff-right').value = '{"status":"approved","owner":"Anna","tags":["api","bpmn"],"version":2}';
  byId('json-diff-run')?.click();
});

// Base64
function runBase64(mode) {
  runAction(() => mode === 'encode'
    ? utf8ToBase64(byId('base64-input')?.value || '', byId('base64-url-safe')?.checked)
    : base64ToUtf8(byId('base64-input')?.value || '', byId('base64-url-safe')?.checked), 'base64-output', {
    'The encoded data was not valid for encoding utf-8': t('Строка содержит некорректные UTF-8 данные.', 'The string contains invalid UTF-8 data.')
  });
}
byId('base64-encode')?.addEventListener('click', () => runBase64('encode'));
byId('base64-decode')?.addEventListener('click', () => runBase64('decode'));
byId('base64-swap')?.addEventListener('click', () => {
  const output = byId('base64-output');
  if (output?.dataset.placeholder === 'false') {
    byId('base64-input').value = output.textContent;
    resetOutput(output);
  }
});

// Caesar
byId('caesar-run')?.addEventListener('click', () => setOutput('caesar-output', shiftText(byId('caesar-input')?.value || '', byId('caesar-shift')?.value || 0)));
byId('caesar-decode')?.addEventListener('click', () => setOutput('caesar-output', shiftText(byId('caesar-input')?.value || '', -(Number(byId('caesar-shift')?.value) || 0))));

// URL toolkit
byId('url-analyze')?.addEventListener('click', () => runAction(() => JSON.stringify(analyzeUrl(byId('url-input')?.value || ''), null, 2), 'url-output', {
  'URL input is empty.': t('Введите абсолютный URL.', 'Enter an absolute URL.')
}));
byId('url-encode')?.addEventListener('click', () => runAction(() => encodeUrlComponent(byId('url-input')?.value || ''), 'url-output'));
byId('url-decode')?.addEventListener('click', () => runAction(() => decodeUrlComponent(byId('url-input')?.value || ''), 'url-output'));
byId('url-example')?.addEventListener('click', () => {
  byId('url-input').value = 'https://knowerlife.ru/tools/?source=portfolio&tag=system%20analysis#json';
  byId('url-analyze')?.click();
});

// JWT
byId('jwt-decode')?.addEventListener('click', () => runAction(() => {
  const result = decodeJwt(byId('jwt-input')?.value || '');
  const status = {
    expired: t('истёк', 'expired'),
    'not-active': t('ещё не активен', 'not active yet'),
    'active-or-unknown': t('активен или срок не задан', 'active or expiry not provided')
  }[result.status];
  return [
    t('Внимание: подпись не проверяется.', 'Warning: the signature is not verified.'),
    `${t('Статус', 'Status')}: ${status}`,
    '',
    `${t('Заголовок', 'Header')}:`,
    JSON.stringify(result.header, null, 2),
    '',
    `${t('Полезная нагрузка', 'Payload')}:`,
    JSON.stringify(result.payload, null, 2),
    Object.keys(result.timestamps).length ? `\n${t('Временные поля', 'Timestamp claims')}:\n${JSON.stringify(result.timestamps, null, 2)}` : ''
  ].join('\n');
}, 'jwt-output'));

// Timestamp
byId('timestamp-now')?.addEventListener('click', () => {
  const now = new Date();
  byId('timestamp-input').value = String(Math.floor(now.getTime() / 1000));
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
  byId('datetime-input').value = local;
});
byId('timestamp-to-date')?.addEventListener('click', () => runAction(() => {
  const date = timestampToDate(byId('timestamp-input')?.value || '');
  return [
    `ISO: ${date.toISOString()}`,
    `UTC: ${date.toUTCString()}`,
    `${t('Локальное время', 'Local time')}: ${date.toLocaleString(localeTag, { dateStyle: 'full', timeStyle: 'long' })}`
  ].join('\n');
}, 'timestamp-output'));
byId('date-to-timestamp')?.addEventListener('click', () => runAction(() => {
  const value = byId('datetime-input')?.value;
  const result = dateToTimestamps(value);
  return [`Unix (s): ${result.seconds}`, `Unix (ms): ${result.milliseconds}`, `ISO: ${result.iso}`].join('\n');
}, 'timestamp-output'));

// CSV/JSON
function selectedDelimiter() {
  return byId('csv-delimiter')?.value === 'tab' ? '\t' : byId('csv-delimiter')?.value || ',';
}
byId('csv-to-json')?.addEventListener('click', () => {
  const download = document.querySelector('[data-download-target="csv-output"]');
  if (download) { download.dataset.filename = 'converted.json'; download.dataset.mime = 'application/json;charset=utf-8'; }
  runAction(() => csvToJson(byId('csv-input')?.value || '', selectedDelimiter()), 'csv-output');
});
byId('json-to-csv')?.addEventListener('click', () => {
  const download = document.querySelector('[data-download-target="csv-output"]');
  if (download) { download.dataset.filename = 'converted.csv'; download.dataset.mime = 'text/csv;charset=utf-8'; }
  runAction(() => jsonToCsv(byId('csv-input')?.value || '', selectedDelimiter()), 'csv-output');
});
byId('csv-example')?.addEventListener('click', () => {
  byId('csv-input').value = 'id,name,status\n1,"API integration",done\n2,"Mobile app",in-progress';
  byId('csv-delimiter').value = ',';
  byId('csv-to-json')?.click();
});

// Regex
byId('regex-run')?.addEventListener('click', () => runAction(() => {
  const result = runRegex({
    pattern: byId('regex-pattern')?.value || '',
    flags: byId('regex-flags')?.value || '',
    text: byId('regex-input')?.value || '',
    replacement: byId('regex-replacement')?.value || ''
  });
  const lines = [t(`Совпадений: ${result.matches.length}`, `Matches: ${result.matches.length}`)];
  result.matches.forEach((match, index) => {
    lines.push(`${index + 1}. [${match.index}] ${JSON.stringify(match.value)}`);
    if (match.groups.length) lines.push(`   groups: ${JSON.stringify(match.groups)}`);
    if (match.namedGroups) lines.push(`   named: ${JSON.stringify(match.namedGroups)}`);
  });
  if (result.truncated) lines.push(t('Показаны первые 200 совпадений.', 'Only the first 200 matches are shown.'));
  if (result.replaced !== null) lines.push('', t('Результат замены:', 'Replacement result:'), result.replaced);
  return lines.join('\n');
}, 'regex-output'));
byId('regex-example')?.addEventListener('click', () => {
  byId('regex-pattern').value = '(?<protocol>https?):\\/\\/(?<host>[^\\s/]+)';
  byId('regex-flags').value = 'gi';
  byId('regex-input').value = 'Документация: https://example.com/docs и API: http://api.example.com/v1';
  byId('regex-run')?.click();
});

// Text stats and slug
byId('text-analyze')?.addEventListener('click', () => runAction(() => {
  const result = textStats(byId('text-input')?.value || '');
  return [
    `${t('Символы', 'Characters')}: ${result.characters}`,
    `${t('Без пробелов', 'Without spaces')}: ${result.charactersWithoutSpaces}`,
    `${t('Слова', 'Words')}: ${result.words}`,
    `${t('Предложения', 'Sentences')}: ${result.sentences}`,
    `${t('Строки', 'Lines')}: ${result.lines}`,
    `${t('Размер UTF-8', 'UTF-8 size')}: ${result.bytes} bytes`,
    `${t('Чтение', 'Reading time')}: ${result.readingMinutes} min`,
    `Slug: ${result.slug || '—'}`
  ].join('\n');
}, 'text-output'));
function wordCountLabel(count) {
  if (isEnglish) return `${count} ${count === 1 ? 'word' : 'words'}`;
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} слов`;
  if (mod10 === 1) return `${count} слово`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} слова`;
  return `${count} слов`;
}
byId('text-input')?.addEventListener('input', () => {
  const counter = byId('text-live-count');
  if (counter) counter.textContent = wordCountLabel(textStats(byId('text-input').value).words);
});

// User story
byId('story-generate')?.addEventListener('click', () => runAction(() => buildUserStory({
  title: byId('story-title')?.value,
  role: byId('story-role')?.value,
  need: byId('story-need')?.value,
  value: byId('story-value')?.value,
  criteria: byId('story-criteria')?.value,
  given: byId('story-given')?.value,
  when: byId('story-when')?.value,
  then: byId('story-then')?.value
}, locale), 'story-output'));
byId('story-example')?.addEventListener('click', () => {
  const values = isEnglish ? {
    title: 'Save delivery address', role: 'returning customer', need: 'save a delivery address', value: 'checkout faster next time',
    criteria: 'The address is stored after confirmation\nThe customer can edit and delete it', given: 'the customer is signed in', when: 'they save a valid address', then: 'the address appears in the address book'
  } : {
    title: 'Сохранение адреса доставки', role: 'постоянный покупатель', need: 'сохранить адрес доставки', value: 'быстрее оформить следующий заказ',
    criteria: 'Адрес сохраняется после подтверждения\nАдрес можно изменить и удалить', given: 'пользователь авторизован', when: 'он сохраняет валидный адрес', then: 'адрес появляется в адресной книге'
  };
  Object.entries(values).forEach(([key, value]) => { byId(`story-${key}`).value = value; });
  byId('story-generate')?.click();
});

// API request / cURL
byId('curl-generate')?.addEventListener('click', () => runAction(() => buildCurl({
  method: byId('curl-method')?.value,
  url: byId('curl-url')?.value,
  headers: byId('curl-headers')?.value,
  body: byId('curl-body')?.value
}), 'curl-output'));
byId('curl-example')?.addEventListener('click', () => {
  byId('curl-method').value = 'POST';
  byId('curl-url').value = 'https://api.example.com/v1/orders';
  byId('curl-headers').value = 'Authorization: Bearer <token>\nContent-Type: application/json';
  byId('curl-body').value = '{"productId":42,"quantity":1}';
  byId('curl-generate')?.click();
});

// Mermaid sequence
byId('sequence-generate')?.addEventListener('click', () => runAction(() => buildMermaidSequence({
  participants: byId('sequence-participants')?.value,
  steps: byId('sequence-steps')?.value
}), 'sequence-output'));
byId('sequence-example')?.addEventListener('click', () => {
  byId('sequence-participants').value = isEnglish ? 'U: User\nW: Web application\nA: API' : 'U: Пользователь\nW: Web-приложение\nA: API';
  byId('sequence-steps').value = isEnglish ? 'U -> W: Submit form\nW ->> A: POST /requests\nA -->> W: 201 Created\nW -->> U: Show confirmation' : 'U -> W: Отправляет форму\nW ->> A: POST /requests\nA -->> W: 201 Created\nW -->> U: Показывает подтверждение';
  byId('sequence-generate')?.click();
});

// Project brief
function collectBrief() {
  return buildBrief({
    product: byId('brief-product')?.value,
    goal: byId('brief-goal')?.value,
    users: byId('brief-users')?.value,
    scenario: byId('brief-scenario')?.value,
    integrations: byId('brief-integrations')?.value,
    risks: byId('brief-risks')?.value,
    success: byId('brief-success')?.value,
    questions: byId('brief-questions')?.value
  }, locale);
}
byId('brief-generate')?.addEventListener('click', () => setOutput('brief-output', collectBrief()));
byId('brief-download')?.addEventListener('click', () => downloadText('project-brief.md', collectBrief(), 'text/markdown;charset=utf-8'));
byId('brief-example')?.addEventListener('click', () => {
  const values = isEnglish ? {
    product: 'B2B order portal', goal: 'Reduce manual order processing by 40%', users: 'Customer manager, sales specialist, administrator',
    scenario: 'Customer creates an order, receives validation, confirms it, and tracks status', integrations: 'ERP, delivery API, identity provider',
    risks: 'Legacy ERP, incomplete product data, role access model', success: '80% of orders are submitted without manager assistance',
    questions: 'Who owns the product catalogue?\nWhich statuses must be synchronized?'
  } : {
    product: 'B2B-портал заказов', goal: 'Сократить ручную обработку заказов на 40%', users: 'Менеджер клиента, специалист отдела продаж, администратор',
    scenario: 'Клиент создаёт заказ, получает валидацию, подтверждает его и отслеживает статус', integrations: 'ERP, API службы доставки, провайдер идентификации',
    risks: 'Legacy ERP, неполные данные каталога, ролевая модель доступа', success: '80% заказов оформляются без участия менеджера',
    questions: 'Кто владелец товарного каталога?\nКакие статусы должны синхронизироваться?'
  };
  Object.entries(values).forEach(([key, value]) => { byId(`brief-${key}`).value = value; });
  byId('brief-generate')?.click();
});
