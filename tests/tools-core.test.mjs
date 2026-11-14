import test from 'node:test';
import assert from 'node:assert/strict';

import {
  base64ToUtf8,
  csvToJson,
  decodeJwt,
  diffJson,
  diffText,
  explainCron,
  inferJsonSchema,
  jsonToCsv,
  makePassword,
  shiftText,
  textStats,
  utf8ToBase64,
  uuidV4
} from '../assets/js/tools-core.js';

test('makePassword respects length and selected pools', () => {
  const result = makePassword({ length: 24 });
  assert.equal(result.value.length, 24);
  assert.ok(/[a-z]/.test(result.value));
  assert.ok(/[A-Z]/.test(result.value));
  assert.ok(/[2-9]/.test(result.value));
  assert.ok(result.entropy > 0);
  assert.ok(['weak', 'medium', 'strong', 'excellent'].includes(result.rating));
});

test('makePassword validates the length', () => {
  assert.throws(() => makePassword({ length: 3 }), /between 8 and 128/);
  assert.throws(() => makePassword({ length: 8, lower: false, upper: false, numbers: false, symbols: false }), /at least one/);
});

test('uuidV4 returns a valid v4 uuid', () => {
  assert.match(uuidV4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('base64 helpers round-trip utf-8 text', () => {
  const source = 'KnowerLife — системный анализ 👋';
  assert.equal(base64ToUtf8(utf8ToBase64(source)), source);
  assert.equal(base64ToUtf8(utf8ToBase64(source, true), true), source);
});

test('shiftText is reversible for RU and EN alphabets', () => {
  const source = 'Привет, World!';
  assert.equal(shiftText(shiftText(source, 5), -5), source);
});

test('decodeJwt exposes header, payload and expiry status', () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjQxMDI0NDQ4MDB9.signature';
  const result = decodeJwt(token);
  assert.deepEqual(result.header, { alg: 'HS256' });
  assert.equal(result.payload.sub, '123');
  assert.equal(result.signature, 'signature');
  assert.ok(result.timestamps.exp);
});

test('csvToJson and jsonToCsv handle quoted values', () => {
  const parsed = JSON.parse(csvToJson('id,name\n1,"API, core"\n'));
  assert.deepEqual(parsed, [{ id: '1', name: 'API, core' }]);
  const csv = jsonToCsv('[{"id":1,"name":"API"}]');
  assert.match(csv, /id,name/);
  assert.match(csv, /1,API/);
});

test('diffJson reports changed fields', () => {
  const diff = diffJson('{"status":"draft","n":1}', '{"status":"done","n":1}').join('\n');
  assert.match(diff, /status/);
  assert.match(diff, /draft/);
  assert.match(diff, /done/);
});

test('textStats counts words and characters', () => {
  const stats = textStats('Привет мир. Это тест!');
  assert.equal(stats.words, 4);
  assert.equal(stats.characters, 21);
  assert.equal(stats.sentences, 2);
});


test('diffText compares lines with LCS', () => {
  const result = diffText('a\nb\nc', 'a\nc\nd');
  assert.equal(result.summary.same, 2);
  assert.equal(result.summary.removed, 1);
  assert.equal(result.summary.added, 1);
  assert.deepEqual(result.lines.map((l) => l.type), ['same', 'removed', 'same', 'added']);
});


test('explainCron parses common 5-field expressions', () => {
  const result = explainCron('*/15 9-17 1,15 JAN MON-FRI', 'en');
  assert.equal(result.fields.length, 5);
  assert.deepEqual(result.fields[0].values, [0,15,30,45]);
  assert.deepEqual(result.fields[1].values, [9,10,11,12,13,14,15,16,17]);
  assert.deepEqual(result.fields[2].values, [1,15]);
  assert.deepEqual(result.fields[3].values, [1]);
  assert.ok(result.summary.includes('minute'));
});

test('explainCron validates field count', () => {
  assert.throws(() => explainCron('* * * *', 'en'), /5 fields/);
});


test('inferJsonSchema infers basic object and array schema', () => {
  const schema = JSON.parse(inferJsonSchema('{"id":1,"name":"A","tags":["x"],"active":true,"meta":null}'));
  assert.equal(schema.type, 'object');
  assert.equal(schema.properties.id.type, 'integer');
  assert.equal(schema.properties.name.type, 'string');
  assert.equal(schema.properties.tags.type, 'array');
  assert.equal(schema.properties.tags.items.type, 'string');
  assert.equal(schema.properties.active.type, 'boolean');
  assert.equal(schema.properties.meta.type, 'null');
  assert.deepEqual(schema.required, ['id','name','tags','active','meta']);
});
