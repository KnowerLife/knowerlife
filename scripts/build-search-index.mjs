#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pages = [];
function walk(dir){
  for(const e of readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','assets','scripts','tests','.github'].includes(e.name)) continue;
    const p=join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(e.name==='index.html' || e.name==='404.html' || e.name==='offline.html') pages.push(p);
  }
}
function text(html){
  return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
}
function meta(html, name){
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? m[1] : '';
}
function titleOf(html){
  const m = html.match(/<title>([^<]*)<\/title>/i); return m ? m[1].trim() : '';
}
function h1Of(html){ const m=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); return m?text(m[1]).slice(0,140):''; }
function toUrl(file){
  let rel = relative(root,file).replace(/\\/g,'/');
  if(rel==='index.html') return '/';
  rel = rel.replace(/\/index\.html$/,'/').replace(/\.html$/,'');
  return '/' + rel;
}
walk(root);
for(const file of pages){
  const html = readFileSync(file,'utf8');
  const url = toUrl(file);
  if(url.includes('404') || url.includes('offline')) continue;
  const title = titleOf(html);
  const description = meta(html,'description') || h1Of(html);
  const lang = (html.match(/<html[^>]+lang=["']([^"']+)["']/i)||[])[1] || '';
  const body = text(html).slice(0, 1200);
  pages.length; // noop
}
const items = pages.map(file=>{
  const html=readFileSync(file,'utf8'); const url=toUrl(file); if(/404|offline/.test(url)) return null;
  const title=titleOf(html); const description=meta(html,'description') || h1Of(html);
  const lang=(html.match(/<html[^>]+lang=["']([^"']+)["']/i)||[])[1]||'';
  const body=text(html).slice(0,1500);
  return {url,title,description,lang,keywords: body.slice(0,800)};
}).filter(Boolean);
writeFileSync(join(root,'assets','search-index.json'), JSON.stringify({generatedAt:new Date().toISOString().slice(0,10),items}, null, 0));
console.log('Wrote assets/search-index.json with', items.length, 'items');
