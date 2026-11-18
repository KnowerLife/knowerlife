#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pages = [];

function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'assets', 'scripts', 'tests', '.github', '.gemini'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html' || e.name === '404.html' || e.name === 'offline.html') pages.push(p);
  }
}

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function text(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function meta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return '';
}

function titleOf(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : '';
}

function h1Of(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? text(m[1]).slice(0, 140) : '';
}

function toUrl(file) {
  let rel = relative(root, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  rel = rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return '/' + rel;
}

function extractSections(html) {
  const sections = [];
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    const body = m[2] || '';
    const id = (attrs.match(/\bid=["']([^"']+)["']/i) || [])[1] || '';
    if (!id) continue;
    const dataTitle = decodeEntities((attrs.match(/\bdata-title=["']([^"']*)["']/i) || [])[1] || '');
    const dataSearch = decodeEntities((attrs.match(/\bdata-search=["']([^"']*)["']/i) || [])[1] || '');
    const h2 = (body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1] || '';
    const heading = text(h2).trim() || dataTitle.trim();
    if (!heading) continue;
    const introP = (body.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '';
    const description = text(introP).slice(0, 180) || heading;
    const keywords = [heading, dataTitle, dataSearch, text(body).slice(0, 400)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 600);
    sections.push({ id, heading, description, keywords });
  }
  return sections;
}

function addSaSections(items, file, html, pageUrl, lang) {
  if (!(pageUrl === '/sa/' || pageUrl === '/en/sa/')) return;
  const include = new Set([
    'sa-course','sa-course-module-1','sa-course-module-2','sa-course-module-3','sa-course-module-4','sa-course-module-5','sa-course-module-6','sa-course-module-7','sa-course-module-8',
    'interview-hr','interview-technical','modeling-practice','diagram-tool','testing-system','wb-quiz','workbench',
    'requirement-checker','acceptance-builder','sla-calculator','pert-calculator','http-reference','risk-matrix','traceability-tool','quick-tools','external-integration','knowledge-base','interactive-checklists',
    'wb-requirement-checker','wb-acceptance-builder','wb-sla-calculator','wb-pert-calculator','wb-http-reference','wb-risk-matrix','wb-traceability','wb-quick-tools','wb-api-tester','wb-notes','competency-map','templates','document-generator','decision-records','security-checklist','bpmn','uml-c4','api','data-modeling','decision-tree'
  ]);
  // section cards
  for (const sec of extractSections(html)) {
    if (!include.has(sec.id)) continue;
    items.push({
      url: `${pageUrl}#${sec.id}`,
      title: `${sec.heading} — ${lang.startsWith('en') ? 'SA Guide' : 'SA-справочник'}`,
      description: sec.description,
      lang,
      keywords: sec.keywords,
    });
  }
  // course modules (divs with ids)
  const modRe = /<div[^>]*\bid=["'](sa-course-module-\d+)["'][^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi;
  let mm;
  while ((mm = modRe.exec(html))) {
    const id = mm[1];
    if (!include.has(id)) continue;
    const heading = text(mm[2]).trim();
    const desc = text(mm[3]).slice(0, 180);
    items.push({
      url: `${pageUrl}#${id}`,
      title: `${heading} — ${lang.startsWith('en') ? 'SA Course' : 'Курс SA'}`,
      description: desc,
      lang,
      keywords: `${heading} ${desc}`.slice(0, 500),
    });
  }
}

walk(root);

const items = [];
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const url = toUrl(file);
  if (/404|offline/.test(url)) continue;
  const title = titleOf(html);
  const description = meta(html, 'description') || h1Of(html);
  const lang = (html.match(/<html[^>]+lang=["']([^"']+)["']/i) || [])[1] || '';
  const body = text(html).slice(0, 1500);
  items.push({ url, title, description, lang, keywords: body.slice(0, 800) });
  addSaSections(items, file, html, url, lang);
}

// de-duplicate by url+title
const seen = new Set();
const deduped = [];
for (const item of items) {
  const key = `${item.url}|${item.title}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(item);
}

writeFileSync(join(root, 'assets', 'search-index.json'), JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), items: deduped }, null, 0));
console.log('Wrote assets/search-index.json with', deduped.length, 'items');
