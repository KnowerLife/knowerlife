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
  parseIsoDuration,
  formatIsoDuration,
  describeIsoDuration,
  convertCase,
  convertNumberBase,
  diffDateTime,
  parseQueryString,
  buildQueryString,
  parseHttpHeaders,
  formatHttpHeaders,
  ndjsonToJson,
  jsonToNdjson,
  hmacText,
  parseUtcOffset,
  formatUtcOffset,
  convertTimeZoneOffset,
  flattenJson,
  unflattenJson,
  getJsonPath,
  checkJsonPaths,
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


test('parseIsoDuration and formatIsoDuration handle basic durations', () => {
  const parsed = parseIsoDuration('P1DT2H30M');
  assert.equal(parsed.parts.days, 1);
  assert.equal(parsed.parts.hours, 2);
  assert.equal(parsed.parts.minutes, 30);
  assert.equal(formatIsoDuration({ hours: 1, minutes: 5 }), 'PT1H5M');
  const desc = describeIsoDuration('PT90S', 'en');
  assert.equal(desc.iso, 'PT90S');
  assert.ok(desc.human.includes('90'));
});


test('convertCase produces common variants', () => {
  const result = convertCase('user_profile id');
  assert.equal(result.camel, 'userProfileId');
  assert.equal(result.pascal, 'UserProfileId');
  assert.equal(result.snake, 'user_profile_id');
  assert.equal(result.kebab, 'user-profile-id');
  assert.equal(result.constant, 'USER_PROFILE_ID');
  assert.equal(convertCase('OrderItemDTO', 'snake'), 'order_item_dto');
});


test('convertNumberBase converts between common bases', () => {
  assert.equal(convertNumberBase('255', 10, 16).result, 'ff');
  assert.equal(convertNumberBase('ff', 16, 10).result, '255');
  assert.equal(convertNumberBase('1010', 2, 10).result, '10');
  assert.equal(convertNumberBase('-10', 10, 2).result, '-1010');
  assert.throws(() => convertNumberBase('2', 2, 10), /Invalid digit/);
});


test('diffDateTime returns signed interval and ISO parts', () => {
  const diff = diffDateTime('2026-01-01T00:00:00Z', '2026-01-02T03:04:05Z');
  assert.equal(diff.absolute.days, 1);
  assert.equal(diff.absolute.hours, 3);
  assert.equal(diff.absolute.minutes, 4);
  assert.equal(diff.absolute.seconds, 5);
  assert.equal(diff.iso, 'P1DT3H4M5S');
  assert.equal(diff.direction, 'forward');
  const back = diffDateTime('2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z');
  assert.equal(back.direction, 'backward');
  assert.equal(back.iso, '-P1D');
});

test('parseQueryString and buildQueryString round-trip common cases', () => {
  const parsed = parseQueryString('https://example.com?a=1&b=hello%20world&tag=x&tag=y');
  assert.equal(parsed.params.a, '1');
  assert.equal(parsed.params.b, 'hello world');
  assert.deepEqual(parsed.params.tag, ['x', 'y']);
  assert.equal(parsed.count, 4);
  const qs = buildQueryString({ q: 'test value', page: 2, tags: ['a', 'b'] });
  assert.ok(qs.includes('q=test%20value'));
  assert.ok(qs.includes('tags=a') && qs.includes('tags=b'));
  const fromRaw = parseQueryString('?empty=&flag');
  assert.equal(fromRaw.params.empty, '');
  assert.equal(fromRaw.params.flag, '');
});


test('parseHttpHeaders and formatHttpHeaders handle common cases', () => {
  const parsed = parseHttpHeaders('HTTP/1.1 200 OK\nContent-Type: application/json\nX-Trace: a\nX-Trace: b\n\n');
  assert.equal(parsed.headers['Content-Type'], 'application/json');
  assert.deepEqual(parsed.headers['X-Trace'], ['a','b']);
  assert.equal(parsed.count, 3);
  assert.equal(parsed.ignored, 1);
  const formatted = formatHttpHeaders({ 'Accept': 'application/json', 'X-Multi': ['1','2'] });
  assert.ok(formatted.includes('Accept: application/json'));
  assert.ok(formatted.includes('X-Multi: 1') && formatted.includes('X-Multi: 2'));
});


test('ndjsonToJson and jsonToNdjson convert between formats', () => {
  const nd = '{"a":1}\n{"b":2}\n\n{"c":3}';
  const parsed = ndjsonToJson(nd);
  assert.equal(parsed.count, 3);
  assert.deepEqual(parsed.items, [{a:1},{b:2},{c:3}]);
  const back = jsonToNdjson(parsed.items);
  assert.equal(back, '{"a":1}\n{"b":2}\n{"c":3}');
  assert.throws(() => jsonToNdjson({a:1}), /JSON array/);
  assert.throws(() => ndjsonToJson('{"a":1}\n{bad}'), /line 2/);
});


test('hmacText computes deterministic HMAC signatures', async () => {
  const hex = await hmacText('hello', 'secret', 'SHA-256', 'hex');
  assert.match(hex, /^[0-9a-f]{64}$/);
  assert.equal(hex, await hmacText('hello', 'secret', 'SHA-256', 'hex'));
  assert.notEqual(hex, await hmacText('hello', 'other', 'SHA-256', 'hex'));
  const b64url = await hmacText('hello', 'secret', 'SHA-256', 'base64url');
  assert.match(b64url, /^[A-Za-z0-9_-]+$/);
  await assert.rejects(() => hmacText('a', 'b', 'MD5', 'hex'), /Unsupported/);
});


test('parseUtcOffset, formatUtcOffset and convertTimeZoneOffset work with fixed offsets', () => {
  assert.equal(parseUtcOffset('Z'), 0);
  assert.equal(parseUtcOffset('+03:00'), 180);
  assert.equal(parseUtcOffset('-0500'), -300);
  assert.equal(formatUtcOffset(180), '+03:00');
  assert.equal(formatUtcOffset(-300), '-05:00');

  const result = convertTimeZoneOffset('2026-05-10T14:30:00', '+03:00', '-04:00');
  assert.equal(result.source, '2026-05-10T14:30:00+03:00');
  assert.equal(result.utc, '2026-05-10T11:30:00+00:00');
  assert.equal(result.target, '2026-05-10T07:30:00-04:00');
  assert.equal(result.diffMinutes, -420);
  assert.equal(result.unixMs, Date.UTC(2026, 4, 10, 11, 30, 0));

  const z = convertTimeZoneOffset('2026-01-01T00:00', 'Z', '+09:30');
  assert.equal(z.target, '2026-01-01T09:30:00+09:30');
  assert.throws(() => convertTimeZoneOffset('2026-13-01T00:00', 'Z', 'Z'), /Invalid/);
  assert.throws(() => parseUtcOffset('+99:00'), /Invalid/);
});


test('flattenJson and unflattenJson transform nested structures', () => {
  const src = { user: { id: 1, name: 'Ada' }, tags: ['a', 'b'], meta: {} };
  const flat = flattenJson(src);
  assert.equal(flat['user.id'], 1);
  assert.equal(flat['user.name'], 'Ada');
  assert.equal(flat['tags.0'], 'a');
  assert.equal(flat['tags.1'], 'b');
  assert.deepEqual(flat['meta'], {});
  const nested = unflattenJson(flat);
  assert.deepEqual(nested, src);

  const custom = flattenJson({ a: { b: 1 } }, '/');
  assert.deepEqual(custom, { 'a/b': 1 });
  assert.deepEqual(unflattenJson(custom, '/'), { a: { b: 1 } });
  assert.throws(() => flattenJson('null'), /object or array/);
  assert.throws(() => unflattenJson([1, 2]), /flat JSON object/);
});


test('getJsonPath and checkJsonPaths validate required API/data paths', () => {
  const doc = { user: { id: 1, name: 'Ada' }, items: [{ sku: 'A1' }], ok: true, empty: null };
  assert.deepEqual(getJsonPath(doc, 'user.id'), { found: true, value: 1 });
  assert.deepEqual(getJsonPath(doc, 'items.0.sku'), { found: true, value: 'A1' });
  assert.deepEqual(getJsonPath(doc, 'items[0].sku'), { found: true, value: 'A1' });
  assert.equal(getJsonPath(doc, 'user.missing').found, false);

  const report = checkJsonPaths(doc, 'user.id\nitems.0.sku\nuser.email\n');
  assert.equal(report.ok, false);
  assert.equal(report.total, 3);
  assert.equal(report.found, 2);
  assert.deepEqual(report.missing, ['user.email']);

  const ok = checkJsonPaths('{"a":1}', 'a');
  assert.equal(ok.ok, true);
  assert.throws(() => checkJsonPaths(doc, ''), /at least one path/);
});
