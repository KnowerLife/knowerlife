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

// Report
const summary = `Checked ${checked.js} JS, ${checked.json} JSON, ${checked.html} HTML files and ${checked.links} internal links.`;
if (failures.length) {
  console.error(`✗ ${failures.length} problem(s) found.\n`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`\n${summary}`);
  process.exit(1);
}
console.log(`✓ All checks passed. ${summary}`);
