const DEFAULT_LIMIT = 200;

export function randomInt(max) {
  if (!Number.isSafeInteger(max) || max <= 0 || max > 0x100000000) {
    throw new TypeError('max must be a positive safe integer no greater than 2^32');
  }
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function secureShuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function makePassword(options = {}) {
  const {
    length = 20,
    lower = true,
    upper = true,
    numbers = true,
    symbols = true,
    avoidAmbiguous = true,
    customSymbols = '!@#$%^&*()-_=+[]{}'
  } = options;

  if (!Number.isInteger(length) || length < 8 || length > 128) {
    throw new Error('Password length must be between 8 and 128.');
  }

  const pools = [];
  if (lower) pools.push(avoidAmbiguous ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz');
  if (upper) pools.push(avoidAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (numbers) pools.push(avoidAmbiguous ? '23456789' : '0123456789');
  if (symbols) {
    const uniqueSymbols = [...new Set(String(customSymbols))].join('');
    if (!uniqueSymbols) throw new Error('The symbol set cannot be empty.');
    pools.push(uniqueSymbols);
  }
  if (!pools.length) throw new Error('Select at least one character set.');
  if (length < pools.length) throw new Error(`Minimum length for the selected sets is ${pools.length}.`);

  const all = [...new Set(pools.join(''))].join('');
  const characters = pools.map((pool) => pool[randomInt(pool.length)]);
  while (characters.length < length) characters.push(all[randomInt(all.length)]);
  const value = secureShuffle(characters).join('');
  const entropy = Math.round(length * Math.log2(all.length));
  const rating = entropy >= 100 ? 'excellent' : entropy >= 75 ? 'strong' : entropy >= 50 ? 'medium' : 'weak';
  return { value, entropy, rating, alphabetSize: all.length };
}

export function uuidV4() {
  if (typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export function parseJson(input) {
  const source = String(input).trim();
  if (!source) throw new Error('JSON input is empty.');
  return JSON.parse(source);
}

export function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort((a, b) => a.localeCompare(b)).reduce((result, key) => {
      result[key] = sortJsonValue(value[key]);
      return result;
    }, Object.create(null));
  }
  return value;
}

export function formatJson(input, { mode = 'pretty', sortKeys = false } = {}) {
  const parsed = parseJson(input);
  const value = sortKeys ? sortJsonValue(parsed) : parsed;
  return JSON.stringify(value, null, mode === 'minify' ? 0 : 2);
}

function displayJsonValue(value) {
  const rendered = JSON.stringify(value);
  if (rendered === undefined) return String(value);
  return rendered.length > 180 ? `${rendered.slice(0, 177)}…` : rendered;
}

function keyPath(path, key) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

export function diffJson(leftInput, rightInput, limit = 1000) {
  const left = typeof leftInput === 'string' ? parseJson(leftInput) : leftInput;
  const right = typeof rightInput === 'string' ? parseJson(rightInput) : rightInput;
  const changes = [];

  const walk = (a, b, path, depth) => {
    if (changes.length >= limit) return;
    if (depth > 80) {
      changes.push(`! ${path}: maximum comparison depth reached`);
      return;
    }
    if (Object.is(a, b)) return;
    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLength = Math.max(a.length, b.length);
      for (let index = 0; index < maxLength; index += 1) {
        const nextPath = `${path}[${index}]`;
        if (index >= a.length) changes.push(`+ ${nextPath} = ${displayJsonValue(b[index])}`);
        else if (index >= b.length) changes.push(`- ${nextPath} = ${displayJsonValue(a[index])}`);
        else walk(a[index], b[index], nextPath, depth + 1);
        if (changes.length >= limit) break;
      }
      return;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => x.localeCompare(y));
      for (const key of keys) {
        const nextPath = keyPath(path, key);
        if (!Object.hasOwn(a, key)) changes.push(`+ ${nextPath} = ${displayJsonValue(b[key])}`);
        else if (!Object.hasOwn(b, key)) changes.push(`- ${nextPath} = ${displayJsonValue(a[key])}`);
        else walk(a[key], b[key], nextPath, depth + 1);
        if (changes.length >= limit) break;
      }
      return;
    }
    changes.push(`~ ${path}: ${displayJsonValue(a)} → ${displayJsonValue(b)}`);
  };

  walk(left, right, '$', 0);
  if (!changes.length) return [];
  if (changes.length >= limit) changes.push(`… comparison stopped after ${limit} changes`);
  return changes;
}

export function utf8ToBase64(value, urlSafe = false) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : encoded;
}

export function base64ToUtf8(value, urlSafe = false) {
  let normalized = String(value).replace(/\s/g, '');
  if (!normalized) return '';
  if (urlSafe) normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
  normalized += '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function shiftText(value, shift) {
  const alphabets = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
    'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
  ];
  const amount = Number.isFinite(Number(shift)) ? Math.trunc(Number(shift)) : 0;
  return [...String(value)].map((character) => {
    for (const alphabet of alphabets) {
      const index = alphabet.indexOf(character);
      if (index !== -1) return alphabet[((index + amount) % alphabet.length + alphabet.length) % alphabet.length];
    }
    return character;
  }).join('');
}

export async function hashText(value, algorithm = 'SHA-256') {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto is unavailable. Open the site over HTTPS.');
  const allowed = new Set(['SHA-256', 'SHA-384', 'SHA-512']);
  if (!allowed.has(algorithm)) throw new Error('Unsupported hash algorithm.');
  const digest = await globalThis.crypto.subtle.digest(algorithm, new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function decodeBase64Url(segment) {
  return base64ToUtf8(segment, true);
}

export function decodeJwt(token) {
  const segments = String(token).trim().split('.');
  if (segments.length !== 3) throw new Error('JWT must contain three dot-separated segments.');
  const header = parseJson(decodeBase64Url(segments[0]));
  const payload = parseJson(decodeBase64Url(segments[1]));
  const timestamps = {};
  for (const key of ['iat', 'nbf', 'exp']) {
    if (Number.isFinite(Number(payload[key]))) timestamps[key] = new Date(Number(payload[key]) * 1000).toISOString();
  }
  const now = Date.now() / 1000;
  const status = Number.isFinite(Number(payload.exp)) && Number(payload.exp) < now
    ? 'expired'
    : Number.isFinite(Number(payload.nbf)) && Number(payload.nbf) > now
      ? 'not-active'
      : 'active-or-unknown';
  return { header, payload, timestamps, status, signature: segments[2] };
}

export function timestampToDate(value) {
  const numeric = Number(String(value).trim());
  if (!Number.isFinite(numeric)) throw new Error('Timestamp must be a finite number.');
  const milliseconds = Math.abs(numeric) >= 100000000000 ? numeric : numeric * 1000;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new Error('Timestamp is outside the supported date range.');
  return date;
}

export function dateToTimestamps(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date and time.');
  return { seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime(), iso: date.toISOString() };
}

export function analyzeUrl(value) {
  const source = String(value).trim();
  if (!source) throw new Error('URL input is empty.');
  const url = new URL(source);
  const params = Object.create(null);
  for (const [key, paramValue] of url.searchParams) {
    if (Object.hasOwn(params, key)) {
      params[key] = Array.isArray(params[key]) ? [...params[key], paramValue] : [params[key], paramValue];
    } else params[key] = paramValue;
  }
  return {
    href: url.href,
    protocol: url.protocol,
    origin: url.origin,
    username: url.username,
    passwordPresent: Boolean(url.password),
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    query: params,
    hash: url.hash
  };
}

export function encodeUrlComponent(value) {
  return encodeURIComponent(String(value));
}

export function decodeUrlComponent(value) {
  return decodeURIComponent(String(value).replace(/\+/g, ' '));
}

function normalizeDelimiter(delimiter) {
  if (delimiter === '\\t') return '\t';
  if (![',', ';', '\t'].includes(delimiter)) throw new Error('Unsupported CSV delimiter.');
  return delimiter;
}

export function parseCsv(input, delimiter = ',') {
  const separator = normalizeDelimiter(delimiter);
  const source = String(input).replace(/^\uFEFF/, '');
  if (!source.trim()) throw new Error('CSV input is empty.');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += character;
      continue;
    }
    if (character === '"' && cell === '') quoted = true;
    else if (character === separator) {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(cell.replace(/\r$/, ''));
  if (row.length > 1 || row[0] !== '' || rows.length === 0) rows.push(row);
  return rows;
}

export function csvToJson(input, delimiter = ',') {
  const rows = parseCsv(input, delimiter);
  const headers = rows[0].map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error('Every CSV column must have a header.');
  if (new Set(headers).size !== headers.length) throw new Error('CSV headers must be unique.');
  const records = rows.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row, index) => {
    if (row.length !== headers.length) throw new Error(`Row ${index + 2} contains ${row.length} cells; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, column) => [header, row[column]]));
  });
  return JSON.stringify(records, null, 2);
}

function csvEscape(value, delimiter) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function jsonToCsv(input, delimiter = ',') {
  const separator = normalizeDelimiter(delimiter);
  const value = parseJson(input);
  if (!Array.isArray(value)) throw new Error('JSON must be an array of objects.');
  if (!value.length) return '';
  if (value.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) throw new Error('Every JSON array item must be an object.');
  const headers = [...new Set(value.flatMap((item) => Object.keys(item)))];
  const lines = [headers.map((header) => csvEscape(header, separator)).join(separator)];
  for (const item of value) lines.push(headers.map((header) => csvEscape(item[header], separator)).join(separator));
  return lines.join('\n');
}

export function runRegex({ pattern, flags = 'g', text = '', replacement = '' }) {
  const source = String(pattern);
  const input = String(text);
  if (!source) throw new Error('Regular expression is empty.');
  if (source.length > 300) throw new Error('Regular expression is limited to 300 characters.');
  if (input.length > 20000) throw new Error('Test text is limited to 20,000 characters.');
  const uniqueFlags = [...new Set(String(flags))].join('');
  if (!/^[dgimsuvy]*$/.test(uniqueFlags)) throw new Error('Unsupported regular expression flags.');
  const regex = new RegExp(source, uniqueFlags);
  const matchingRegex = new RegExp(source, uniqueFlags.includes('g') ? uniqueFlags : `${uniqueFlags}g`);
  const matches = [];
  let match;
  while ((match = matchingRegex.exec(input)) && matches.length < DEFAULT_LIMIT) {
    matches.push({ value: match[0], index: match.index, groups: match.slice(1), namedGroups: match.groups || null });
    if (match[0] === '') matchingRegex.lastIndex += 1;
  }
  const replaced = replacement === '' ? null : input.replace(regex, String(replacement));
  return { matches, replaced, truncated: matches.length >= DEFAULT_LIMIT };
}

const RU_TRANSLITERATION = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
};

export function slugify(value) {
  const transliterated = [...String(value).toLocaleLowerCase('ru')].map((character) => RU_TRANSLITERATION[character] ?? character).join('');
  return transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function textStats(value) {
  const text = String(value);
  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  const sentences = text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/gu)?.filter((item) => item.trim()) || [];
  return {
    characters: [...text].length,
    charactersWithoutSpaces: [...text.replace(/\s/gu, '')].length,
    words: words.length,
    sentences: text.trim() ? sentences.length : 0,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: new TextEncoder().encode(text).length,
    readingMinutes: words.length ? Math.max(1, Math.ceil(words.length / 180)) : 0,
    slug: slugify(text)
  };
}

function checklistLines(value) {
  return String(value).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function buildUserStory(fields, locale = 'ru') {
  const isEnglish = locale === 'en';
  const role = String(fields.role || '').trim() || (isEnglish ? '[role]' : '[роль]');
  const need = String(fields.need || '').trim() || (isEnglish ? '[need]' : '[потребность]');
  const value = String(fields.value || '').trim() || (isEnglish ? '[value]' : '[ценность]');
  const title = String(fields.title || '').trim();
  const criteria = checklistLines(fields.criteria);
  const given = String(fields.given || '').trim();
  const when = String(fields.when || '').trim();
  const then = String(fields.then || '').trim();
  const lines = [];
  if (title) lines.push(`# ${title}`, '');
  lines.push(isEnglish ? `As ${role}, I want ${need}, so that ${value}.` : `Как ${role}, я хочу ${need}, чтобы ${value}.`);
  if (criteria.length) {
    lines.push('', isEnglish ? '## Acceptance criteria' : '## Критерии приёмки', ...criteria.map((item) => `- [ ] ${item}`));
  }
  if (given || when || then) {
    lines.push('', '## BDD', isEnglish ? `Given ${given || '[context]'}` : `Допустим ${given || '[контекст]'}`,
      isEnglish ? `When ${when || '[action]'}` : `Когда ${when || '[действие]'}`,
      isEnglish ? `Then ${then || '[result]'}` : `Тогда ${then || '[результат]'}`);
  }
  return lines.join('\n');
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

export function buildCurl(fields) {
  const method = String(fields.method || 'GET').toUpperCase();
  const url = String(fields.url || '').trim();
  if (!/^[A-Z]+$/.test(method)) throw new Error('HTTP method contains invalid characters.');
  if (!url) throw new Error('Request URL is required.');
  const parsedUrl = new URL(url);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Request URL must use HTTP or HTTPS.');
  const headers = checklistLines(fields.headers).map((line) => {
    if (!line.includes(':')) throw new Error(`Header must contain a colon: ${line}`);
    return line;
  });
  const body = String(fields.body || '').trim();
  const parts = [`curl --request ${method} \\`, `  --url ${shellQuote(url)}`];
  headers.forEach((header, index) => {
    const hasMore = index < headers.length - 1 || body;
    parts[parts.length - 1] += ' \\';
    parts.push(`  --header ${shellQuote(header)}${hasMore ? '' : ''}`);
  });
  if (body) {
    parts[parts.length - 1] += ' \\';
    parts.push(`  --data-raw ${shellQuote(body)}`);
  }
  return parts.join('\n');
}

export function buildMermaidSequence(fields) {
  const participantLines = checklistLines(fields.participants);
  const stepLines = checklistLines(fields.steps);
  if (participantLines.length < 2) throw new Error('Add at least two participants.');
  if (!stepLines.length) throw new Error('Add at least one interaction.');
  const participants = new Map();
  participantLines.forEach((line) => {
    const separator = line.indexOf(':');
    const alias = (separator === -1 ? line : line.slice(0, separator)).trim();
    const label = (separator === -1 ? line : line.slice(separator + 1)).trim();
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(alias)) throw new Error(`Invalid participant alias: ${alias}`);
    if (!label) throw new Error(`Participant ${alias} has no label.`);
    participants.set(alias, label.replace(/[\r\n]/g, ' '));
  });
  const interactions = stepLines.map((line) => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*(-->>|->>|-->|->)\s*([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.+)$/);
    if (!match) throw new Error(`Invalid interaction: ${line}`);
    const [, from, arrow, to, message] = match;
    if (!participants.has(from) || !participants.has(to)) throw new Error(`Unknown participant in interaction: ${line}`);
    const mermaidArrow = arrow === '->' ? '->>' : arrow === '-->' ? '-->>' : arrow;
    return `  ${from}${mermaidArrow}${to}: ${message.replace(/[\r\n]/g, ' ')}`;
  });
  return [
    'sequenceDiagram',
    ...[...participants].map(([alias, label]) => `  participant ${alias} as ${label}`),
    ...interactions
  ].join('\n');
}

export function buildBrief(fields, locale = 'ru', generatedAt = new Date()) {
  const isEnglish = locale === 'en';
  const sections = isEnglish ? [
    ['Product or company', fields.product], ['Business goal', fields.goal], ['Users and roles', fields.users],
    ['Main scenario', fields.scenario], ['Integrations and data', fields.integrations], ['Constraints and risks', fields.risks],
    ['Success criteria', fields.success], ['Open questions', fields.questions]
  ] : [
    ['Продукт или компания', fields.product], ['Бизнес-цель', fields.goal], ['Пользователи и роли', fields.users],
    ['Основной сценарий', fields.scenario], ['Интеграции и данные', fields.integrations], ['Ограничения и риски', fields.risks],
    ['Критерий успеха', fields.success], ['Открытые вопросы', fields.questions]
  ];
  const title = isEnglish ? '# Project brief' : '# Бриф проекта';
  const body = sections.flatMap(([heading, value]) => [`## ${heading}`, String(value || '').trim() || '—', '']);
  const localeTag = isEnglish ? 'en-GB' : 'ru-RU';
  return [title, '', ...body, `${isEnglish ? 'Generated' : 'Сформировано'}: ${generatedAt.toLocaleString(localeTag)}`].join('\n');
}
