import test from 'node:test';
import assert from 'node:assert/strict';
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
  diffJson,
  formatJson,
  hashText,
  jsonToCsv,
  makePassword,
  runRegex,
  shiftText,
  slugify,
  textStats,
  timestampToDate,
  utf8ToBase64,
  uuidV4
} from '../assets/js/tools-core.js';

test('password generator respects length and selected pools', () => {
  const result = makePassword({ length: 32, lower: true, upper: true, numbers: true, symbols: true, avoidAmbiguous: true });
  assert.equal(result.value.length, 32);
  assert.match(result.value, /[a-z]/);
  assert.match(result.value, /[A-Z]/);
  assert.match(result.value, /[2-9]/);
  assert.match(result.value, /[^A-Za-z0-9]/);
  assert.doesNotMatch(result.value, /[01lIO]/);
  assert.ok(result.entropy > 100);
});

test('UUID generator returns valid v4 identifiers', () => {
  assert.match(uuidV4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('JSON format and diff work recursively', () => {
  assert.equal(formatJson('{"b":1,"a":{"z":2,"y":3}}', { sortKeys: true }), '{\n  "a": {\n    "y": 3,\n    "z": 2\n  },\n  "b": 1\n}');
  assert.deepEqual(diffJson('{"a":1,"items":[1]}', '{"a":2,"items":[1,3]}'), ['~ $.a: 1 → 2', '+ $.items[1] = 3']);
  const special = formatJson('{"__proto__":{"safe":true},"toString":1}', { sortKeys: true });
  assert.equal(JSON.parse(special).__proto__.safe, true);
  assert.deepEqual(diffJson('{}', '{"toString":1}'), ['+ $.toString = 1']);
});

test('Base64 supports UTF-8 and URL-safe mode', () => {
  const value = 'Привет, API 👋';
  assert.equal(base64ToUtf8(utf8ToBase64(value)), value);
  assert.equal(base64ToUtf8(utf8ToBase64(value, true), true), value);
});

test('Caesar cipher supports Russian and English alphabets', () => {
  assert.equal(shiftText('Abc Яя', 1), 'Bcd Аа');
  assert.equal(shiftText(shiftText('Тест Test', 7), -7), 'Тест Test');
});

test('SHA hashing uses Web Crypto', async () => {
  assert.equal(await hashText('abc', 'SHA-256'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('JWT decoder reads payload without claiming verification', () => {
  const encode = (value) => utf8ToBase64(JSON.stringify(value), true);
  const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: '42', exp: 4102444800 })}.signature`;
  const decoded = decodeJwt(token);
  assert.equal(decoded.payload.sub, '42');
  assert.equal(decoded.status, 'active-or-unknown');
  assert.equal(decoded.timestamps.exp, '2100-01-01T00:00:00.000Z');
});

test('timestamp converters support seconds and local dates', () => {
  assert.equal(timestampToDate('0').toISOString(), '1970-01-01T00:00:00.000Z');
  const converted = dateToTimestamps('2026-08-03T10:00:00Z');
  assert.equal(converted.seconds, 1785751200);
  assert.equal(converted.iso, '2026-08-03T10:00:00.000Z');
});

test('URL analyzer preserves repeated query params', () => {
  const result = analyzeUrl('https://example.com/a?tag=one&tag=two#x');
  assert.deepEqual(result.query.tag, ['one', 'two']);
  assert.equal(result.hash, '#x');
});

test('CSV and JSON conversion handles quoted delimiters', () => {
  const json = csvToJson('id,name\n1,"A,B"');
  assert.deepEqual(JSON.parse(json), [{ id: '1', name: 'A,B' }]);
  assert.equal(jsonToCsv('[{"id":1,"name":"A,B"}]'), 'id,name\n1,"A,B"');
});

test('Regex tester returns matches, groups and replacement', () => {
  const result = runRegex({ pattern: '(\\d+)', flags: 'g', text: 'A12 B3', replacement: '[$1]' });
  assert.equal(result.matches.length, 2);
  assert.deepEqual(result.matches[0].groups, ['12']);
  assert.equal(result.replaced, 'A[12] B[3]');
});

test('Text stats and Russian transliteration are deterministic', () => {
  assert.equal(slugify('Системный анализ и API'), 'sistemnyy-analiz-i-api');
  const stats = textStats('Один два.\nThree');
  assert.equal(stats.words, 3);
  assert.equal(stats.lines, 2);
  assert.ok(stats.bytes >= stats.characters);
});

test('User Story builder includes checklist and BDD', () => {
  const story = buildUserStory({ role: 'аналитик', need: 'сравнить данные', value: 'найти ошибку', criteria: 'Показаны изменения', given: 'есть две версии', when: 'запущено сравнение', then: 'виден diff' }, 'ru');
  assert.match(story, /Как аналитик/);
  assert.match(story, /- \[ \] Показаны изменения/);
  assert.match(story, /## BDD/);
});

test('cURL builder quotes headers and JSON body', () => {
  const command = buildCurl({ method: 'POST', url: 'https://api.example.com/v1', headers: 'Content-Type: application/json', body: '{"name":"O\'Reilly"}' });
  assert.match(command, /^curl --request POST/);
  assert.match(command, /--header 'Content-Type: application\/json'/);
  assert.match(command, /O'"'"'Reilly/);
});

test('Mermaid builder validates participants and steps', () => {
  const diagram = buildMermaidSequence({ participants: 'U: User\nA: API', steps: 'U -> A: GET /profile\nA -->> U: 200 OK' });
  assert.match(diagram, /participant U as User/);
  assert.match(diagram, /U->>A: GET \/profile/);
  assert.match(diagram, /A-->>U: 200 OK/);
});

test('Brief builder creates all discovery sections', () => {
  const brief = buildBrief({ product: 'Portal', goal: 'Reduce manual work', questions: 'Who owns data?' }, 'en', new Date('2026-08-03T00:00:00Z'));
  assert.match(brief, /# Project brief/);
  assert.match(brief, /## Open questions/);
  assert.match(brief, /Who owns data\?/);
});
