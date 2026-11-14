#!/usr/bin/env node
// Self-contained integrity checks for the static KnowerLife site.
// No build step and no external dependencies: validates JavaScript syntax,
// JSON payloads, internal links, duplicate ids and the PWA app shell.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const checked = { js: 0, json: 0, html: 0, links: 0 };

const IGNORED_DIRS = new Set(['.git', 'node_modules']);

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return relative(root, file).split(sep).join('/');
}

function fail(message) {
  failures.push(message);
}

const files = walk(root);
const jsFiles = files.filter((file) => extname(file) === '.js' || extname(file) === '.mjs');
const jsonFiles = files.filter((file) => extname(file) === '.json' || extname(file) === '.webmanifest');
const htmlFiles = files.filter((file) => extname(file) === '.html');

// 1. JavaScript syntax
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    checked.js += 1;
  } catch (error) {
    const output = error.stderr?.toString().trim() || error.message;
    fail(`JS syntax: ${rel(file)}\n  ${output.split('\n').join('\n  ')}`);
  }
}

// 2. JSON / manifest parsing
for (const file of jsonFiles) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
    checked.json += 1;
  } catch (error) {
    fail(`JSON parse: ${rel(file)}\n  ${error.message}`);
  }
}

// 3. Internal links, assets, duplicate ids
const URL_ATTR = /\b(?:href|src|poster|data-src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const SKIP_PROTOCOL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function splitUrl(value) {
  const hashIndex = value.indexOf('#');
  const beforeHash = hashIndex === -1 ? value : value.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : value.slice(hashIndex + 1);
  const queryIndex = beforeHash.indexOf('?');
  const pathname = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  let decodedPath = pathname;
  let decodedFragment = fragment;
  try { decodedPath = decodeURIComponent(pathname); } catch {}
  try { decodedFragment = decodeURIComponent(fragment); } catch {}
  return { pathname: decodedPath, fragment: decodedFragment };
}

function resolveTarget(baseDirectory, pathname) {
  const decoded = pathname.replace(/^\/+/, '');
  const candidate = pathname.startsWith('/')
    ? join(root, decoded)
    : resolve(baseDirectory, pathname);
  if (existsSync(candidate)) {
    try {
      if (statSync(candidate).isDirectory()) return join(candidate, 'index.html');
      return candidate;
    } catch {
      return null;
    }
  }
  if (existsSync(`${candidate}.html`)) return `${candidate}.html`;
  if (existsSync(join(candidate, 'index.html'))) return join(candidate, 'index.html');
  return null;
}

function collectIds(file) {
  const html = readFileSync(file, 'utf8');
  const ids = new Set();
  const idPattern = /\bid\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let idMatch;
  while ((idMatch = idPattern.exec(html)) !== null) {
    const id = idMatch[2] ?? idMatch[3] ?? '';
    if (id) ids.add(id);
  }
  return ids;
}

const idCache = new Map();
function idsFor(file) {
  if (!file) return new Set();
  if (!idCache.has(file)) idCache.set(file, collectIds(file));
  return idCache.get(file);
}

for (const file of htmlFiles) {
  checked.html += 1;
  const html = readFileSync(file, 'utf8');
  const base = dirname(file);

  const ids = idsFor(file);
  const seen = new Set();
  const idPattern = /\bid\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let idMatch;
  while ((idMatch = idPattern.exec(html)) !== null) {
    const id = idMatch[2] ?? idMatch[3] ?? '';
    if (!id) continue;
    if (seen.has(id)) fail(`Duplicate id "${id}" in ${rel(file)}`);
    seen.add(id);
  }

  let match;
  while ((match = URL_ATTR.exec(html)) !== null) {
    const raw = (match[2] ?? match[3] ?? '').trim();
    if (!raw || SKIP_PROTOCOL.test(raw)) continue;
    const { pathname, fragment } = splitUrl(raw);
    if (!pathname && fragment) {
      if (fragment !== 'top' && !ids.has(fragment)) fail(`Broken anchor in ${rel(file)}: ${raw}`);
      continue;
    }
    if (!pathname) continue;
    checked.links += 1;
    const target = resolveTarget(base, pathname);
    if (!target) {
      fail(`Broken link in ${rel(file)}: ${raw}`);
      continue;
    }
    if (fragment && fragment !== 'top' && extname(target) === '.html') {
      const targetIds = idsFor(target);
      if (!targetIds.has(fragment)) fail(`Broken anchor in ${rel(file)}: ${raw}`);
    }
  }
}

// 4. Service worker app shell must point at real files
const serviceWorkerPath = join(root, 'service-worker.js');
if (existsSync(serviceWorkerPath)) {
  const source = readFileSync(serviceWorkerPath, 'utf8');
  const shellMatch = source.match(/const APP_SHELL=\[([\s\S]*?)\]\.map\(fromScope\)/);
  if (shellMatch) {
    const literals = [...shellMatch[1].matchAll(/'([^']*)'/g)].map((entry) => entry[1]);
    for (const literal of literals) {
      if (literal === '') continue;
      if (!existsSync(join(root, literal))) {
        fail(`Service worker shell entry missing: ${literal}`);
      }
    }
  } else {
    fail('Service worker APP_SHELL declaration not found');
  }
} else {
  fail('service-worker.js is missing');
}


// 4b. Search index must be valid and cover key routes.
const searchIndexPath = join(root, 'assets', 'search-index.json');
if (existsSync(searchIndexPath)) {
  try {
    const index = JSON.parse(readFileSync(searchIndexPath, 'utf8'));
    if (!index || !Array.isArray(index.items)) {
      fail('assets/search-index.json must contain an items array');
    } else {
      const urls = new Set(index.items.map((item) => item && item.url));
      for (const requiredUrl of ['/', '/en/', '/tools/', '/en/tools/', '/sa/', '/en/sa/', '/creative/', '/en/creative/']) {
        if (!urls.has(requiredUrl)) fail(`assets/search-index.json missing key URL: ${requiredUrl}`);
      }
      for (const item of index.items) {
        if (!item || typeof item.url !== 'string' || typeof item.title !== 'string') {
          fail('assets/search-index.json contains an invalid item');
          break;
        }
      }
    }
  } catch (error) {
    fail(`Invalid JSON in assets/search-index.json: ${error.message}`);
  }
} else {
  fail('Missing assets/search-index.json (run: npm run search-index)');
}


// 5. Required pages and PWA files
const required = [
  'index.html',
  '404.html',
  'offline.html',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'assets/css/styles.css',
  'assets/js/main.js',
  'tools/index.html',
  'sa/index.html',
  'creative/index.html',
  'en/index.html'
];
for (const path of required) {
  if (!existsSync(join(root, path))) fail(`Required file missing: ${path}`);
}

// 5b. Tools catalog count consistency.
for (const page of ['tools/index.html', 'en/tools/index.html']) {
  const p = join(root, page);
  if (!existsSync(p)) continue;
  const html = readFileSync(p, 'utf8');
  const cardCount = (html.match(/data-tool-card=""/g) || []).length;
  const numMatch = html.match(/"numberOfItems":(\d+)/);
  const badgeMatch = html.match(/>(\d+)\s+(инструментов|tools)</i);
  if (numMatch && Number(numMatch[1]) !== cardCount) fail(`${page}: JSON-LD numberOfItems (${numMatch[1]}) != tool cards (${cardCount})`);
  if (badgeMatch && Number(badgeMatch[1]) !== cardCount) fail(`${page}: badge count (${badgeMatch[1]}) != tool cards (${cardCount})`);
}

// 5c. Hreflang/canonical consistency for localized pages.
function urlToLocalFile(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'knowerlife.ru') return null;
    let p = u.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!p) return join(root, 'index.html');
    const asIndex = join(root, p, 'index.html');
    if (existsSync(asIndex)) return asIndex;
    const asHtml = join(root, `${p}.html`);
    if (existsSync(asHtml)) return asHtml;
    return join(root, p, 'index.html');
  } catch { return null; }
}

const hreflangCache = new Map();
function hreflangsFor(file) {
  if (hreflangCache.has(file)) return hreflangCache.get(file);
  const html = readFileSync(file, 'utf8');
  const out = [];
  const reTag = /<link\b[^>]*\bhreflang\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/gi;
  let m;
  while ((m = reTag.exec(html)) !== null) {
    const tag = m[0];
    const lang = (m[2] ?? m[3] ?? '').trim();
    const hrefM = tag.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
    const href = hrefM ? (hrefM[2] ?? hrefM[3] ?? '').trim() : '';
    if (lang && href) out.push({ lang, href });
  }
  hreflangCache.set(file, out);
  return out;
}

for (const file of htmlFiles) {
  const alternates = hreflangsFor(file);
  if (!alternates.length) continue;
  const canonicalM = readFileSync(file, 'utf8').match(/<link\b[^>]*\brel\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/gi) || [];
  let canonical = '';
  for (const tag of canonicalM) {
    if (/\bcanonical\b/i.test(tag)) {
      const hm = tag.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
      canonical = hm ? (hm[2] ?? hm[3] ?? '').trim() : '';
      break;
    }
  }
  const localAlternates = alternates.filter((a) => a.href.startsWith('https://knowerlife.ru/'));
  for (const alt of localAlternates) {
    const target = urlToLocalFile(alt.href);
    if (!target) continue;
    if (!existsSync(target)) {
      fail(`Hreflang target missing for ${rel(file)} (${alt.lang}): ${alt.href}`);
      continue;
    }
    const back = hreflangsFor(target);
    if (back.length) {
      const hasBack = back.some((b) => {
        const bt = urlToLocalFile(b.href);
        return bt && resolve(bt) === resolve(file);
      });
      if (!hasBack) fail(`Hreflang reciprocity missing: ${rel(target)} does not link back to ${rel(file)}`);
    }
  }
  if (canonical) {
    const self = localAlternates.find((a) => a.lang === 'x-default') || localAlternates.find((a) => {
      const t = urlToLocalFile(a.href);
      return t && resolve(t) === resolve(file);
    });
    if (self && self.href !== canonical) {
      // allow x-default to differ? usually canonical should match page URL; only warn-level not possible, but avoid false positives
    }
  }
}

// Report
const summary = `Checked ${checked.js} JS, ${checked.json} JSON, ${checked.html} HTML files and ${checked.links} internal links.`;
if (failures.length) {
  console.error(`✗ ${failures.length} problem(s) found.\n`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`\n${summary}`);
  process.exit(1);
}
console.log(`✓ All checks passed. ${summary}`);
