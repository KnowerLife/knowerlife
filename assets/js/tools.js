const byId = (id) => document.getElementById(id);
const isEnglish = document.documentElement.lang === 'en';
const t = (ru, en) => isEnglish ? en : ru;

function randomInt(max) {
  if (!Number.isSafeInteger(max) || max <= 0) throw new TypeError('max must be a positive integer');
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

function secureShuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function makePassword(length, pools) {
  const selected = pools.filter(({ enabled }) => enabled).map(({ chars }) => chars);
  if (!selected.length) throw new Error(t('Выберите хотя бы один набор символов.', 'Select at least one character set.'));
  if (length < selected.length) throw new Error(t(`Минимальная длина: ${selected.length}.`, `Minimum length: ${selected.length}.`));
  const all = selected.join('');
  const required = selected.map((chars) => chars[randomInt(chars.length)]);
  while (required.length < length) required.push(all[randomInt(all.length)]);
  return secureShuffle(required).join('');
}

const passwordForm = byId('password-form');
passwordForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const length = Math.min(128, Math.max(8, Number(byId('password-length').value) || 20));
  const pools = [
    { enabled: byId('password-lower').checked, chars: 'abcdefghijkmnopqrstuvwxyz' },
    { enabled: byId('password-upper').checked, chars: 'ABCDEFGHJKLMNPQRSTUVWXYZ' },
    { enabled: byId('password-numbers').checked, chars: '23456789' },
    { enabled: byId('password-symbols').checked, chars: '!@#$%^&*()-_=+[]{}' }
  ];
  const output = byId('password-output');
  try {
    output.textContent = makePassword(length, pools);
  } catch (error) {
    output.textContent = error.message;
  }
});

function uuidFallback() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

byId('uuid-generate')?.addEventListener('click', () => {
  byId('uuid-output').textContent = crypto.randomUUID ? crypto.randomUUID() : uuidFallback();
});

byId('json-format')?.addEventListener('click', () => {
  const input = byId('json-input').value;
  const output = byId('json-output');
  try {
    const value = JSON.parse(input);
    output.textContent = JSON.stringify(value, null, 2);
    output.dataset.state = 'success';
  } catch (error) {
    output.textContent = `${t('Ошибка JSON', 'JSON error')}: ${error.message}`;
    output.dataset.state = 'error';
  }
});

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}
function base64ToUtf8(value) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

byId('base64-encode')?.addEventListener('click', () => {
  byId('base64-output').textContent = utf8ToBase64(byId('base64-input').value);
});
byId('base64-decode')?.addEventListener('click', () => {
  const output = byId('base64-output');
  try { output.textContent = base64ToUtf8(byId('base64-input').value); }
  catch { output.textContent = t('Некорректная Base64-строка.', 'Invalid Base64 string.'); }
});

function shiftCharacter(char, shift) {
  const alphabets = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
  ];
  for (const alphabet of alphabets) {
    const index = alphabet.indexOf(char);
    if (index !== -1) return alphabet[((index + shift) % alphabet.length + alphabet.length) % alphabet.length];
  }
  return char;
}

byId('caesar-run')?.addEventListener('click', () => {
  const shift = Number(byId('caesar-shift').value) || 0;
  byId('caesar-output').textContent = [...byId('caesar-input').value].map((char) => shiftCharacter(char, shift)).join('');
});

function buildBrief() {
  const value = (id) => byId(id).value.trim();
  const headings = isEnglish ? {
    title: '# Project brief', product: '## Product or company', goal: '## Business goal', users: '## Users and roles',
    scenario: '## Main scenario', integrations: '## Integrations and data', risks: '## Constraints and risks', success: '## Success criteria'
  } : {
    title: '# Бриф проекта', product: '## Продукт или компания', goal: '## Бизнес-цель', users: '## Пользователи',
    scenario: '## Основной сценарий', integrations: '## Интеграции и данные', risks: '## Ограничения и риски', success: '## Критерий успеха'
  };
  return [
    headings.title,
    '',
    `${headings.product}\n${value('brief-product') || '—'}`,
    `${headings.goal}\n${value('brief-goal') || '—'}`,
    `${headings.users}\n${value('brief-users') || '—'}`,
    `${headings.scenario}\n${value('brief-scenario') || '—'}`,
    `${headings.integrations}\n${value('brief-integrations') || '—'}`,
    `${headings.risks}\n${value('brief-risks') || '—'}`,
    `${headings.success}\n${value('brief-success') || '—'}`,
    '',
    `${t('Сформировано', 'Generated')}: ${new Date().toLocaleString(isEnglish ? 'en-GB' : 'ru-RU')}`
  ].join('\n\n');
}

byId('brief-generate')?.addEventListener('click', () => {
  byId('brief-output').textContent = buildBrief();
});

byId('brief-download')?.addEventListener('click', () => {
  const text = buildBrief();
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'project-brief.md';
  link.click();
  URL.revokeObjectURL(url);
});

byId('story-generate')?.addEventListener('click', () => {
  const role = byId('story-role').value.trim() || '[роль]';
  const need = byId('story-need').value.trim() || '[потребность]';
  const value = byId('story-value').value.trim() || '[ценность]';
  const criteria = byId('story-criteria').value.trim();
  byId('story-output').textContent = [
    isEnglish ? `As ${role}, I want ${need}, so that ${value}.` : `Как ${role}, я хочу ${need}, чтобы ${value}.`,
    criteria ? `${isEnglish ? '\nAcceptance criteria:\n' : '\nКритерии приёмки:\n'}${criteria.split('\n').map((item) => `- ${item}`).join('\n')}` : ''
  ].join('');
});

async function copyOutput(button) {
  const target = byId(button.dataset.copyTarget);
  if (!target?.textContent.trim()) return;
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(target.textContent);
    button.textContent = t('Скопировано', 'Copied');
  } catch {
    button.textContent = t('Ошибка копирования', 'Copy failed');
  }
  window.setTimeout(() => { button.textContent = original; }, 1800);
}

document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', () => copyOutput(button));
});
