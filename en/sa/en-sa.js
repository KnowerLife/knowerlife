const root=document.documentElement;const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
function read(k){try{return localStorage.getItem(k)||''}catch{return''}}function write(k,v){try{localStorage.setItem(k,v)}catch{}}
function theme(){const saved=read('knowerlife-theme');root.dataset.theme=(saved==='light'||saved==='dark')?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const b=$('#themeToggle');const render=()=>{const dark=root.dataset.theme==='dark';b.textContent=dark?'☀':'☾';b.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme')};b.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';write('knowerlife-theme',root.dataset.theme);render()});render()}
function access(){let on=read('knowerlife-accessibility')==='enhanced';const b=$('#accessibilityToggle');const render=()=>{if(on){root.dataset.accessibility='enhanced';root.dataset.fontScale='large'}else{delete root.dataset.accessibility;delete root.dataset.fontScale}b.textContent=on?'A':'A+';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Use standard accessibility mode':'Enhanced accessibility')};b.addEventListener('click',()=>{on=!on;write('knowerlife-accessibility',on?'enhanced':'standard');render()});render()}
function mobile(){const d=$('#mobileNav'),b=$('#mobileMenuBtn');b.addEventListener('click',()=>{d.showModal();b.setAttribute('aria-expanded','true')});$('[data-close-nav]').addEventListener('click',()=>d.close());d.addEventListener('close',()=>b.setAttribute('aria-expanded','false'));$$('#mobileNav a').forEach(a=>a.addEventListener('click',()=>d.close()))}
function search(){const input=$('#globalSearch'),cards=$$('.searchable'),status=$('#searchStatus'),filters=$$('[data-category-filter],[data-category]'),empty=$('#noSearchResults')||$('#emptyState'),clear=$('#clearSearchBtn');let cat='all';const apply=()=>{const q=(input?.value||'').trim().toLowerCase();let n=0;cards.forEach(c=>{const okCat=cat==='all'||c.dataset.category===cat;const hay=((c.dataset.title||'')+' '+(c.dataset.search||'')+' '+c.textContent).toLowerCase();const show=okCat&&(!q||hay.includes(q));c.hidden=!show;if(show)n++});if(status)status.textContent=(q||cat!=='all')?`Found: ${n} of ${cards.length}`:`${cards.length} topics`;if(empty)empty.hidden=n>0};input?.addEventListener('input',apply);filters.forEach(b=>b.addEventListener('click',()=>{cat=b.dataset.categoryFilter||b.dataset.category||'all';filters.forEach(x=>{const active=x===b;x.setAttribute('aria-pressed',String(active));x.classList.toggle('is-active',active);});apply()}));clear?.addEventListener('click',()=>{if(input)input.value='';cat='all';filters.forEach((x,i)=>{const active=i===0||(x.dataset.categoryFilter||x.dataset.category)==='all';x.setAttribute('aria-pressed',String(active));x.classList.toggle('is-active',active);});apply();input?.focus();});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input?.focus()}else if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){e.preventDefault();input?.focus()}});apply()}
function checker(){const btn=$('#requirementCheckBtn'),input=$('#requirementInput'),out=$('#requirementResult'),scoreBox=$('#requirementScore'),findings=$('#requirementFindings'),clearBtn=$('#clearRequirementBtn');if(!btn||!input)return;const run=()=>{const t=(input.value||'').trim();let score=100;const issues=[];if(!t){if(scoreBox)scoreBox.innerHTML='<strong>—</strong><span>Add a requirement to check</span>';if(findings)findings.replaceChildren();if(out&&!scoreBox)out.textContent='Enter a requirement to review ambiguity, measurability and testability.';return;}for(const word of ['fast','easy','user-friendly','convenient','quickly','etc.'])if(t.toLowerCase().includes(word)){score-=12;issues.push(`Ambiguous word: “${word}”`);}if(!/\d/.test(t)){score-=16;issues.push('Add a measurable threshold where applicable.');}if(!/shall|must|should/i.test(t)){score-=12;issues.push('Make the obligation explicit (shall/must).');}if(t.length<25){score-=12;issues.push('Add enough context to make the behavior testable.');}score=Math.max(0,score);if(scoreBox){scoreBox.innerHTML=`<strong>${score}/100</strong><span>${issues.length?'Needs refinement':'Looks clear and testable'}</span>`;}if(findings){findings.replaceChildren();(issues.length?issues:['Clear, measurable and testable wording.']).forEach(msg=>{const li=document.createElement('li');li.textContent=msg;findings.append(li);});}if(out){out.textContent=`Quality score: ${score}/100. ${issues.length?issues.join(' '):'Clear, measurable and testable wording.'}`;}};btn.addEventListener('click',run);clearBtn?.addEventListener('click',()=>{input.value='';run();});}
function acceptance(){$('#acceptanceBuildBtn').addEventListener('click',()=>{$('#acceptanceOutput').textContent=`Scenario: acceptance criterion\n\nGiven ${$('#givenInput').value||'…'}\nWhen ${$('#whenInput').value||'…'}\nThen ${$('#thenInput').value||'…'}`})}
function sla(){const btn=$('#slaCalcBtn');if(!btn)return;const calc=()=>{const periodSel=$('#slaPeriod');if(periodSel&&$('#slaDays'))$('#slaDays').value=periodSel.value;const a=Math.min(100,Math.max(0,Number($('#slaAvailability')?.value))),days=Math.max(1,Number(periodSel?periodSel.value:$('#slaDays')?.value)),sec=days*86400*(1-a/100),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=Math.round(sec%60);const out=$('#slaOutput');if(!out)return;const text=`${a}% over ${days} days allows ${h?h+' h ':''}${m} min ${s} sec of downtime.`;if(out.classList.contains('metric-output'))out.innerHTML=`<strong>${a}%</strong> over ${days} days allows <strong>${h?h+' h ':''}${m} min ${s} sec</strong> of downtime.`;else out.textContent=text;};btn.addEventListener('click',calc);$('#slaPeriod')?.addEventListener('change',calc);calc()}
function pert(){const btn=$('#pertCalcBtn');if(!btn)return;const calc=()=>{const o=Number($('#pertO')?.value),m=Number($('#pertM')?.value),p=Number($('#pertP')?.value);if([o,m,p].some(Number.isNaN))return;const e=(o+4*m+p)/6,s=(p-o)/6;const out=$('#pertOutput');if(!out)return;if(out.classList.contains('metric-output'))out.innerHTML=`<div><strong>Expected ≈ ${e.toFixed(2)}</strong></div><div>σ ≈ ${s.toFixed(2)}</div><div>Rough 95% range ≈ ${(e-2*s).toFixed(2)}–${(e+2*s).toFixed(2)}</div>`;else out.textContent=`Expected ≈ ${e.toFixed(2)} · σ ≈ ${s.toFixed(2)} · rough 95% range ≈ ${(e-2*s).toFixed(2)}–${(e+2*s).toFixed(2)}`;};btn.addEventListener('click',calc);calc()}
function pwa(){let ev=null,b=$('#installAppBtn');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;b.hidden=false});b.addEventListener('click',async()=>{if(!ev)return;ev.prompt();try{await ev.userChoice}catch{}ev=null;b.hidden=true});if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('../../service-worker.js',{scope:'../../'}).catch(()=>{}),{once:true})}
document.addEventListener('DOMContentLoaded',()=>{theme();access();mobile();search();checker();acceptance();sla();pert();pwa()});

/* KnowerLife v11.1 — unified ecosystem shell bootstrap. */
(() => {
  if (!window.__knowerlifeInstallCapture) {
    window.__knowerlifeInstallCapture = true;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      window.__knowerlifeInstallPrompt = event;
      window.dispatchEvent(new CustomEvent('knowerlife:installprompt', { detail: event }));
    });
    window.addEventListener('appinstalled', () => {
      window.__knowerlifeInstallPrompt = null;
    });
  }
  const boot = () => {
    if (window.__knowerlifeEcosystemShellBooted) return;
    window.__knowerlifeEcosystemShellBooted = true;
    const base = document.documentElement.dataset.base || './';
    const src = new URL(`${base}assets/js/ecosystem-shell.js`, location.href).href;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.ecosystemShellLoader = '';
    document.body.append(script);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else window.setTimeout(boot, 0);
})();






function showToast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.append(t)}t.textContent=msg;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>{t.hidden=true},2200)}
function readJson(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}}function writeJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
const STORAGE={notes:'sa_notes_v2',requirements:'sa_requirements_v2'};

const HTTP_STATUSES=[
  [200,'OK','Successful read or processing'],[201,'Created','Resource created'],[202,'Accepted','Request accepted for async processing'],[204,'No Content','Success without response body'],
  [304,'Not Modified','Use cached version'],[400,'Bad Request','Malformed request'],[401,'Unauthorized','Authentication required'],[403,'Forbidden','Authenticated but not allowed'],[404,'Not Found','Resource not found'],[409,'Conflict','State/version conflict'],[412,'Precondition Failed','Request precondition not met'],[415,'Unsupported Media Type','Unsupported Content-Type'],[422,'Unprocessable Content','Syntax valid but business validation failed'],[429,'Too Many Requests','Rate limit exceeded'],
  [500,'Internal Server Error','Unhandled server error'],[502,'Bad Gateway','Upstream error'],[503,'Service Unavailable','Service temporarily unavailable'],[504,'Gateway Timeout','Upstream timeout']
];
function initHttpReference(){
  const input=document.getElementById('httpSearch'), list=document.getElementById('httpStatusList'); if(!list) return;
  const render=()=>{const term=(input?.value||'').trim().toLowerCase();list.replaceChildren();HTTP_STATUSES.filter(([code,name,desc])=>!term||`${code} ${name} ${desc}`.toLowerCase().includes(term)).forEach(([code,name,desc])=>{const row=document.createElement('div');row.className='http-status-row';const c=document.createElement('code');c.textContent=String(code);const body=document.createElement('div');const st=document.createElement('strong');st.textContent=name;const sp=document.createElement('span');sp.textContent=desc;body.append(st,sp);row.append(c,body);list.append(row);});if(!list.children.length){const p=document.createElement('p');p.className='muted';p.textContent='No matches.';list.append(p);}};
  input?.addEventListener('input',render);render();
}
function initConverter(){
  const factors={kb:1,mb:1024,gb:1024*1024};
  const run=()=>{const value=Number(document.getElementById('conv-input')?.value);const from=document.getElementById('conv-from')?.value;const to=document.getElementById('conv-to')?.value;const out=document.getElementById('conv-output');if(!out)return;if(!Number.isFinite(value)){out.value='Enter a number';return;}const result=value*factors[from]/factors[to];out.value=`${Number(result.toFixed(6))} ${String(to||'').toUpperCase()}`;};
  document.getElementById('convertBtn')?.addEventListener('click',run);['conv-input','conv-from','conv-to'].forEach(id=>document.getElementById(id)?.addEventListener('change',run));run();
}
function initNotes(){
  let notes=readJson(STORAGE.notes,[]);if(!Array.isArray(notes))notes=[];
  const list=document.getElementById('notesList'); if(!list) return;
  const render=()=>{list.replaceChildren();if(!notes.length){const p=document.createElement('p');p.className='muted';p.textContent='No notes yet.';list.append(p);return;}notes.forEach(note=>{const card=document.createElement('article');card.className='note-card';const head=document.createElement('div');head.className='note-card-head';const title=document.createElement('strong');title.textContent=note.title;const del=document.createElement('button');del.type='button';del.className='note-delete';del.textContent='Delete';del.addEventListener('click',()=>{notes=notes.filter(item=>item.id!==note.id);writeJson(STORAGE.notes,notes);render();});head.append(title,del);const time=document.createElement('time');time.dateTime=note.iso||'';time.textContent=note.date||'';const body=document.createElement('p');body.textContent=note.content||'';card.append(head,time,body);list.append(card);});};
  document.getElementById('addNoteBtn')?.addEventListener('click',()=>{const title=document.getElementById('noteTitle')?.value.trim();const content=document.getElementById('noteContent')?.value.trim();if(!title){showToast('Enter a title');document.getElementById('noteTitle')?.focus();return;}const now=new Date();notes.unshift({id:Date.now(),title,content,date:now.toLocaleString('en-GB'),iso:now.toISOString()});notes=notes.slice(0,50);writeJson(STORAGE.notes,notes);const ti=document.getElementById('noteTitle'),tc=document.getElementById('noteContent');if(ti)ti.value='';if(tc)tc.value='';render();showToast('Note saved locally');});render();
}
function initPersistentChecklist(ids,key,fillSelector,percentSelector,resetSelector){
  if(!ids.some(id=>document.getElementById(id))) return;
  const saved=readJson(key,{});ids.forEach(id=>{const input=document.getElementById(id);if(input&&saved[id])input.checked=true;});
  const update=()=>{const state={};let checked=0;ids.forEach(id=>{const input=document.getElementById(id);state[id]=Boolean(input?.checked);if(state[id])checked++;});writeJson(key,state);const percent=Math.round(checked/ids.length*100);const fill=document.querySelector(fillSelector);if(fill)fill.style.width=`${percent}%`;const label=document.querySelector(percentSelector);if(label)label.textContent=`${percent}%`;};
  ids.forEach(id=>document.getElementById(id)?.addEventListener('change',update));document.querySelector(resetSelector)?.addEventListener('click',()=>{ids.forEach(id=>{const input=document.getElementById(id);if(input)input.checked=false;});update();});update();
}



function downloadText(name, text, type='text/plain;charset=utf-8'){try{const blob=new Blob([String(text??'')],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)}catch{}}
function csvCell(value){const text=String(value??'');return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text}
STORAGE.risks='sa_risks_v3'; STORAGE.traceability='sa_traceability_v3'; STORAGE.decisions='sa_decisions_v3';
STORAGE.competency='sa_competency_v2'; STORAGE.security='sa_security_v2'; STORAGE.lastSection='sa_last_section_v3';
STORAGE.bookmarks='sa_bookmarks_v2';

function initRiskMatrix(){
  let risks=readJson(STORAGE.risks,[]);if(!Array.isArray(risks))risks=[];const list=document.getElementById('riskList'); if(!list) return;
  const render=()=>{list.replaceChildren();if(!risks.length){const p=document.createElement('p');p.className='muted';p.textContent='No risks added yet.';list.append(p);return;}risks.sort((a,b)=>b.score-a.score).forEach(risk=>{const row=document.createElement('div');row.className='risk-row';const score=document.createElement('span');score.className=`risk-score risk-score--${risk.score>15?'critical':risk.score>10?'high':risk.score>5?'medium':'low'}`;score.textContent=String(risk.score);const body=document.createElement('div');const title=document.createElement('strong');title.textContent=risk.title;const meta=document.createElement('small');meta.textContent=`P${risk.p} × I${risk.i}`;body.append(title,meta);const del=document.createElement('button');del.type='button';del.className='note-delete';del.textContent='Delete';del.addEventListener('click',()=>{risks=risks.filter(r=>r.id!==risk.id);writeJson(STORAGE.risks,risks);render();});row.append(score,body,del);list.append(row);});};
  document.getElementById('addRiskBtn')?.addEventListener('click',()=>{const title=document.getElementById('riskTitle')?.value.trim();const p=Number(document.getElementById('riskProbability')?.value),i=Number(document.getElementById('riskImpact')?.value);if(!title){showToast('Describe the risk');return;}if(![p,i].every(v=>Number.isInteger(v)&&v>=1&&v<=5)){showToast('Probability and impact must be 1–5');return;}risks.push({id:Date.now(),title,p,i,score:p*i});writeJson(STORAGE.risks,risks);const t=document.getElementById('riskTitle');if(t)t.value='';render();});render();
}
function initTraceabilityTool(){
  let rows=readJson(STORAGE.traceability,[]);if(!Array.isArray(rows))rows=[];const body=document.getElementById('traceTableBody'); if(!body) return;
  const render=()=>{body.replaceChildren();rows.forEach(row=>{const tr=document.createElement('tr');[row.goal,row.requirement,row.acceptance].forEach(value=>{const td=document.createElement('td');td.textContent=value||'';tr.append(td);});const actions=document.createElement('td');const del=document.createElement('button');del.type='button';del.className='table-delete';del.textContent='×';del.setAttribute('aria-label','Delete row');del.addEventListener('click',()=>{rows=rows.filter(r=>r.id!==row.id);writeJson(STORAGE.traceability,rows);render();});actions.append(del);tr.append(actions);body.append(tr);});};
  document.getElementById('addTraceRowBtn')?.addEventListener('click',()=>{const goal=document.getElementById('traceGoal')?.value.trim(),requirement=document.getElementById('traceRequirement')?.value.trim(),acceptance=document.getElementById('traceAcceptance')?.value.trim();if(!requirement){showToast('Enter a requirement');return;}rows.push({id:Date.now(),goal,requirement,acceptance});writeJson(STORAGE.traceability,rows);['traceGoal','traceRequirement','traceAcceptance'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});render();});
  document.getElementById('clearTraceBtn')?.addEventListener('click',()=>{rows=[];writeJson(STORAGE.traceability,rows);render();});
  document.getElementById('exportTraceCsvBtn')?.addEventListener('click',()=>{const csv=['Goal,Requirement,Acceptance/Test',...rows.map(r=>[r.goal,r.requirement,r.acceptance].map(csvCell).join(','))].join('\n');downloadText('traceability-matrix.csv',csv,'text/csv;charset=utf-8');});render();
}
function initDecisionLog(){
  let decisions=readJson(STORAGE.decisions,[]);if(!Array.isArray(decisions))decisions=[];const list=document.getElementById('decisionList'); if(!list) return;
  const render=()=>{list.replaceChildren();if(!decisions.length){const p=document.createElement('p');p.className='muted';p.textContent='No local decisions yet.';list.append(p);return;}decisions.forEach((d,index)=>{const card=document.createElement('article');card.className='decision-entry';const head=document.createElement('div');head.className='decision-entry-head';const title=document.createElement('strong');title.textContent=`ADR-${String(index+1).padStart(3,'0')} · ${d.title}`;const status=document.createElement('span');status.textContent=d.status;head.append(title,status);const context=document.createElement('p');context.textContent=d.context||'No context provided';const consequences=document.createElement('small');consequences.textContent=`Consequences: ${d.consequences||'—'}`;const del=document.createElement('button');del.type='button';del.className='note-delete';del.textContent='Delete';del.addEventListener('click',()=>{decisions=decisions.filter(item=>item.id!==d.id);writeJson(STORAGE.decisions,decisions);render();});card.append(head,context,consequences,del);list.append(card);});};
  document.getElementById('saveDecisionBtn')?.addEventListener('click',()=>{const title=document.getElementById('decisionTitle')?.value.trim();if(!title){showToast('Enter a decision title');return;}decisions.push({id:Date.now(),title,status:document.getElementById('decisionStatus')?.value||'Accepted',context:document.getElementById('decisionContext')?.value.trim()||'',consequences:document.getElementById('decisionConsequences')?.value.trim()||'',date:new Date().toISOString()});writeJson(STORAGE.decisions,decisions);['decisionTitle','decisionContext','decisionConsequences'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});render();showToast('Decision saved locally');});
  document.getElementById('exportDecisionsBtn')?.addEventListener('click',()=>{const md=decisions.map((d,i)=>`# ADR-${String(i+1).padStart(3,'0')}: ${d.title}\n\nStatus: ${d.status}\nDate: ${d.date||''}\n\n## Context\n${d.context||'—'}\n\n## Consequences\n${d.consequences||'—'}\n`).join('\n---\n\n');downloadText('architecture-decisions.md',md,'text/markdown;charset=utf-8');});render();
}



function initCompetency(){
  const ids=['comp1','comp2','comp3','comp4','comp5','comp6','comp7','comp8'].filter(id=>document.getElementById(id));
  if(!ids.length) return;
  const saved=readJson(STORAGE.competency,{}); ids.forEach(id=>{const cb=document.getElementById(id); if(cb&&saved[id]) cb.checked=true;});
  const update=()=>{const checked=ids.filter(id=>document.getElementById(id)?.checked).length; const percent=Math.round(checked/ids.length*100); const fill=document.getElementById('compProgressFill'); if(fill) fill.style.width=`${percent}%`; const label=document.getElementById('compProgressPercent'); if(label) label.textContent=`${percent}%`;};
  ids.forEach(id=>document.getElementById(id)?.addEventListener('change',update));
  document.getElementById('saveCompBtn')?.addEventListener('click',()=>{const state=Object.fromEntries(ids.map(id=>[id,Boolean(document.getElementById(id)?.checked)])); writeJson(STORAGE.competency,state); showToast('Progress saved');});
  document.getElementById('resetCompBtn')?.addEventListener('click',()=>{ids.forEach(id=>{const cb=document.getElementById(id); if(cb) cb.checked=false;}); writeJson(STORAGE.competency,{}); update(); showToast('Progress reset');});
  update();
}

function initGlossaryFilter(){
  const input=document.getElementById('glossarySearch'); const items=[...document.querySelectorAll('#glossary .glossary-grid > div')];
  if(!input||!items.length) return;
  input.addEventListener('input',()=>{const term=input.value.trim().toLowerCase(); items.forEach(item=>item.hidden=Boolean(term&&!item.textContent.toLowerCase().includes(term)));});
}

function initSectionUtilities(){
  setTimeout(()=>{document.getElementById('clearReadingState')?.addEventListener('click',()=>{try{localStorage.removeItem(STORAGE.lastSection)}catch{};const cb=document.getElementById('continueBlock');if(cb)cb.hidden=true;showToast('Progress reset');});},0);
  const continueBlock=document.getElementById('continueBlock');
  const continueLink=document.getElementById('continueLink');
  const continueLabel=document.getElementById('continueLabel');
  const cards=[...document.querySelectorAll('.searchable')].filter(c=>c.id);
  const setContinue=id=>{const card=id?document.getElementById(id):null; if(!card||!continueBlock||!continueLink||!continueLabel) return; continueLink.href=`#${id}`; continueLabel.textContent=card.dataset.title||card.querySelector('h2')?.textContent?.trim()||id; continueBlock.hidden=false;};
  try{const saved=localStorage.getItem(STORAGE.lastSection); if(saved) setContinue(saved);}catch{}
  cards.forEach(card=>{
    const head=card.querySelector('.card-head'); if(!head||head.querySelector('.deep-link-copy')) return;
    const button=document.createElement('button'); button.type='button'; button.className='deep-link-copy'; button.textContent='↗'; button.title='Copy section link'; button.setAttribute('aria-label',`Copy link: ${card.dataset.title||card.id}`);
    button.addEventListener('click', async (e)=>{e.preventDefault(); const url=`${location.origin}${location.pathname}#${card.id}`; try{await navigator.clipboard.writeText(url); showToast('Link copied')}catch{showToast('Could not copy link')}});
    head.append(button);
  });
  if('IntersectionObserver' in window){
    let lastWrite='';
    const observer=new IntersectionObserver(entries=>{const current=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0]; if(!current||current.intersectionRatio<0.28) return; const id=current.target.id; if(!id||id===lastWrite) return; lastWrite=id; try{localStorage.setItem(STORAGE.lastSection,id)}catch{} setContinue(id);},{rootMargin:'-15% 0px -55% 0px',threshold:[0.28,0.5,0.75]});
    cards.forEach(card=>observer.observe(card));
  }
}



async function copyText(text){try{await navigator.clipboard.writeText(String(text??''));return true}catch{return false}}
function initCopyButtons(){
  document.querySelectorAll('[data-copy-target]').forEach(btn=>btn.addEventListener('click',async()=>{const target=document.getElementById(btn.dataset.copyTarget);const text=(target&&'value' in target)?target.value:target?.textContent||'';showToast(await copyText(text)?'Copied':'Could not copy');}));
}

function initApiTester(){
  const btn=document.getElementById('sendApiBtn'); if(!btn) return;
  btn.addEventListener('click',async()=>{
    const method=document.getElementById('apiMethod')?.value||'GET';const url=document.getElementById('apiUrl')?.value?.trim();const out=document.getElementById('apiResponse');const status=document.getElementById('apiStatus');if(!out||!url)return;
    let parsed;try{parsed=new URL(url);}catch{out.textContent='Error: invalid URL';return;}if(!/^https?:$/.test(parsed.protocol)){out.textContent='Error: only http/https URLs are supported';return;}
    out.textContent='Sending request…';if(status)status.textContent='Loading…';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const options={method,signal:controller.signal,headers:{Accept:'application/json,text/plain;q=0.9,*/*;q=0.8'}};
      if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify({title:'Test request from SA Guide',body:'Browser demo',userId:1});}
      const response=await fetch(url,options);clearTimeout(timeout);
      const contentType=response.headers.get('content-type')||'';const raw=await response.text();let body=raw;
      if(contentType.includes('application/json')){try{body=JSON.stringify(JSON.parse(raw),null,2);}catch{}}
      out.textContent=body||'(empty response)';if(status)status.textContent=`${response.status} ${response.statusText||''}`.trim();
    }catch(error){clearTimeout(timeout);const message=error?.name==='AbortError'?'timeout (10s)':(error?.message||'unknown error');out.textContent=`Request failed: ${message}\n\nPossible cause: CORS policy of the target API or no network.`;if(status)status.textContent='Request failed';}
  });
  document.querySelectorAll('[data-api-url]').forEach(b=>b.addEventListener('click',()=>{const input=document.getElementById('apiUrl');if(input)input.value=b.dataset.apiUrl||'';}));
}

const docTemplates={
  srs:'1. Introduction\n1.1 Purpose\n1.2 Scope\n1.3 Definitions\n\n2. Context\n2.1 Users and roles\n2.2 Constraints\n\n3. Functional requirements\nFR-001 ...\n\n4. Non-functional requirements\nNFR-001 ...\n\n5. Integrations and data\n\n6. Acceptance criteria\n\n7. Open questions',
  'user-stories':'As a [role], I want [capability], so that [value].\n\nAcceptance Criteria\nGiven ...\nWhen ...\nThen ...\n\nError scenarios:\n- ...\n\nPriority: Must / Should / Could',
  'api-spec':'openapi: 3.0.3\ninfo:\n  title: Example API\n  version: 1.0.0\npaths:\n  /resource/{id}:\n    get:\n      summary: Get resource\n      parameters:\n        - in: path\n          name: id\n          required: true\n          schema:\n            type: string\n      responses:\n        \'200\':\n          description: Success\n        \'404\':\n          description: Not found',
  'test-cases':'Title: Successful scenario\nPreconditions:\n- ...\n\nSteps:\n1. ...\n2. ...\n\nExpected result:\n- ...\n\nPostconditions:\n- ...'
};
function initDocuments(){
  document.querySelectorAll('[data-doc]').forEach(btn=>btn.addEventListener('click',()=>{const content=docTemplates[btn.dataset.doc]||'';const textarea=document.getElementById('docContent');if(textarea)textarea.value=content;const editor=document.getElementById('docEditor');if(editor)editor.hidden=false;}));
  document.getElementById('downloadDocBtn')?.addEventListener('click',()=>downloadText('sa-template.txt',document.getElementById('docContent')?.value||''));
  document.getElementById('generateDocBtn')?.addEventListener('click',()=>{const type=document.getElementById('docTypeSelect')?.value;const out=document.getElementById('generatedDoc');if(out)out.value=docTemplates[type]||'';});
  document.getElementById('downloadGeneratedDoc')?.addEventListener('click',()=>downloadText('sa-generated-document.txt',document.getElementById('generatedDoc')?.value||''));
}
const messageTemplates={
  clarification:'Hello team,\n\nI need to clarify a few points regarding [task]:\n1. [question]\n2. [question]\n\nThis is needed to finalize [decision / criterion / constraint].\nThank you.',
  meeting:'Hi team, I propose a meeting about [topic].\n\nGoal: [decision to be made].\nInput materials: [link].\nAgenda:\n1. ...\n2. ...\n\nExpected outcome: [decision / list of questions].',
  review:'Hi team, please review [document / diagram / API contract].\n\nPlease check:\n- scenario completeness;\n- errors and constraints;\n- alignment with the current system.\n\nFeedback requested by [date].',
  update:'Status for [task]\n\nDone:\n- ...\n\nIn progress:\n- ...\n\nOpen questions / blockers:\n- ...\n\nNext step:\n- ...'
};
function initMessages(){
  document.querySelectorAll('[data-email]').forEach(btn=>btn.addEventListener('click',()=>{const area=document.getElementById('emailTemplateText');if(area)area.value=messageTemplates[btn.dataset.email]||'';}));
  document.getElementById('copyEmailBtn')?.addEventListener('click',async()=>showToast(await copyText(document.getElementById('emailTemplateText')?.value||'')?'Copied':'Could not copy'));
}



const quizBank = {
  requirements:[
    {q:'Which is a non-functional requirement?',o:['Create an order','API response time','Edit profile'],a:1},
    {q:'What makes a requirement testable?',o:['A long description','Acceptance criteria','A mockup link'],a:1}
  ],
  api:[
    {q:'Which HTTP method is typically used to read a resource?',o:['GET','POST','DELETE'],a:0},
    {q:'Which status code means the resource was not found?',o:['201','404','503'],a:1}
  ],
  db:[
    {q:'What does atomicity of values in a table relate to?',o:['1NF','2NF','3NF'],a:0},
    {q:'Which operator combines rows from multiple tables?',o:['JOIN','ORDER BY','TRUNCATE'],a:0}
  ],
  bpmn:[
    {q:'Which BPMN element is used for branching?',o:['Task','Gateway','Pool'],a:1},
    {q:'What typically separates participant responsibilities?',o:['Lane','Timer','Message'],a:0}
  ],
  security:[
    {q:'What should be defined for authorization?',o:['Only a password','Roles and permissions','Only HTTPS'],a:1},
    {q:'What helps analyze threats?',o:['STRIDE','CRUD','INVEST'],a:0}
  ],
  ddd:[
    {q:'What defines the boundary where a model applies?',o:['Bounded Context','HTTP endpoint','Sprint Goal'],a:0},
    {q:'What is Ubiquitous Language?',o:['A shared domain language','SQL language','UI language'],a:0}
  ]
};

function initQuiz(){
  const area=document.getElementById('testArea'); const select=document.getElementById('testSection'); let questions=[]; let index=0; let answers=[];
  if(!area||!select) return;
  const render=()=>{
    if(!questions.length)return;
    const q=questions[index]; area.replaceChildren();
    const card=document.createElement('div'); card.className='test-card';
    const meta=document.createElement('div'); meta.className='test-meta'; const progress=document.createElement('span'); progress.textContent=`Question ${index+1}/${questions.length}`; const topic=document.createElement('span'); topic.textContent=select?.selectedOptions?.[0]?.textContent||''; meta.append(progress,topic);
    const title=document.createElement('h3'); title.textContent=q.q;
    const options=document.createElement('div'); options.className='test-options';
    q.o.forEach((text,i)=>{const label=document.createElement('label');label.className='checklist-item';const radio=document.createElement('input');radio.type='radio';radio.name='quizOption';radio.value=String(i);radio.checked=answers[index]===i;radio.addEventListener('change',()=>{answers[index]=i;});label.append(radio,document.createTextNode(text));options.append(label);});
    const actions=document.createElement('div');actions.className='button-row';
    const prev=document.createElement('button');prev.type='button';prev.className='btn btn--secondary btn--small';prev.textContent='← Back';prev.disabled=index===0;prev.addEventListener('click',()=>{index--;render();});
    const next=document.createElement('button');next.type='button';next.className='btn btn--primary btn--small';next.textContent=index===questions.length-1?'Finish':'Next →';next.addEventListener('click',()=>{if(index<questions.length-1){index++;render();}else finish();});
    actions.append(prev,next);card.append(meta,title,options,actions);area.append(card);
  };
  const finish=()=>{const correct=questions.reduce((sum,q,i)=>sum+(answers[i]===q.a?1:0),0);const percent=Math.round(correct/questions.length*100);area.replaceChildren();const result=document.createElement('div');result.className='decision-result';const label=document.createElement('span');label.textContent='Result';const score=document.createElement('strong');score.textContent=`${correct}/${questions.length} · ${percent}%`;const text=document.createElement('p');text.textContent=percent>=80?'Good result. You can move to the next topic.':'It may help to review the theory and try again.';const restart=document.createElement('button');restart.type='button';restart.className='btn btn--secondary btn--small';restart.textContent='Try again';restart.addEventListener('click',start);result.append(label,score,text,restart);area.append(result);};
  const start=()=>{questions=[...(quizBank[select.value]||[])];index=0;answers=new Array(questions.length).fill(null);render();};
  document.getElementById('startTestBtn')?.addEventListener('click',start);
}



function initBookmarks(){
  let bookmarks=readJson(STORAGE.bookmarks,[]); if(!Array.isArray(bookmarks)) bookmarks=[];
  const validIds=new Set([...document.querySelectorAll('.searchable')].filter(c=>c.id).map(c=>c.id));
  bookmarks=bookmarks.filter(id=>validIds.has(id));
  const list=document.getElementById('bookmarksList');
  const counter=document.getElementById('bookmarksCounter');
  const titleFor=id=>document.getElementById(id)?.dataset.title||document.getElementById(id)?.querySelector('h2')?.textContent?.trim()||id;
  const render=()=>{
    if(counter) counter.textContent=String(bookmarks.length);
    if(!list) return;
    list.replaceChildren();
    if(!bookmarks.length){const p=document.createElement('p');p.className='muted';p.textContent='No bookmarks yet';list.append(p);} else {
      bookmarks.forEach(id=>{
        const row=document.createElement('div'); row.className='bookmark-row';
        const link=document.createElement('a'); link.href=`#${id}`; link.textContent=titleFor(id);
        const remove=document.createElement('button'); remove.type='button'; remove.className='bookmark-remove'; remove.textContent='×'; remove.setAttribute('aria-label',`Remove bookmark: ${titleFor(id)}`);
        remove.addEventListener('click',()=>toggle(id,false));
        row.append(link,remove); list.append(row);
      });
    }
    document.querySelectorAll('.bookmark-toggle').forEach(btn=>btn.setAttribute('aria-pressed', String(bookmarks.includes(btn.dataset.bookmark))));
  };
  const toggle=(id,announce=true)=>{
    bookmarks=bookmarks.includes(id)?bookmarks.filter(item=>item!==id):[...bookmarks,id];
    writeJson(STORAGE.bookmarks,bookmarks); render();
    if(announce) showToast(bookmarks.includes(id)?'Bookmarked':'Bookmark removed');
  };
  [...document.querySelectorAll('.searchable')].filter(c=>c.id).forEach(card=>{
    const head=card.querySelector('.card-head'); if(!head || head.querySelector('.bookmark-toggle')) return;
    const btn=document.createElement('button'); btn.type='button'; btn.className='bookmark-toggle'; btn.dataset.bookmark=card.id; btn.textContent='◆';
    btn.title='Bookmark topic'; btn.setAttribute('aria-label',`Bookmark: ${card.dataset.title||card.id}`); btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click',(e)=>{e.preventDefault(); toggle(card.id);});
    head.append(btn);
  });
  render();
}



function initActiveNav(){
  if(!('IntersectionObserver' in window)) return;
  const links=[...document.querySelectorAll('#desktopNav a')];
  if(!links.length) return;
  const byId=new Map(links.map(a=>[a.getAttribute('href')?.slice(1), a]));
  const sections=[...document.querySelectorAll('.searchable')].filter(c=>c.id);
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible) return;
    links.forEach(l=>l.classList.remove('is-active'));
    byId.get(visible.target.id)?.classList.add('is-active');
  },{rootMargin:'-20% 0px -65% 0px',threshold:[0,.1,.25]});
  sections.forEach(s=>observer.observe(s));
}



function normalizeIdentifier(value, fallback = 'field') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').replace(/_{2,}/g, '_');
  const safe = normalized || fallback;
  return /^[0-9]/.test(safe) ? `_${safe}` : safe;
}

function initDataModeler() {
  let entities = [];
  const container = document.getElementById('entitiesList');
  const preview = document.getElementById('sqlPreview');
  if (!container || !preview) return;
  const render = () => {
    container.replaceChildren();
    if (!entities.length) {
      const p = document.createElement('p'); p.className='muted'; p.textContent='No entities added yet.'; container.append(p); return;
    }
    entities.forEach((entity,index) => {
      const row = document.createElement('div'); row.className='entity-row';
      const text = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent=entity.name;
      const small = document.createElement('small'); small.textContent=entity.attrs.join(', ');
      text.append(strong,small);
      const actions = document.createElement('div'); actions.className='entity-actions';
      const attr = document.createElement('button'); attr.type='button'; attr.textContent='+'; attr.title='Add attribute';
      attr.addEventListener('click',()=>{
        const value = prompt('Attribute name, e.g. email');
        if (!value) return;
        const safe = normalizeIdentifier(value,'field');
        if (!entity.attrs.includes(safe)) entity.attrs.push(safe);
        render();
      });
      const rename = document.createElement('button'); rename.type='button'; rename.textContent='✎'; rename.title='Rename';
      rename.addEventListener('click',()=>{
        const value = prompt('New entity name', entity.name); if(!value)return; entity.name=normalizeIdentifier(value,'entity'); render();
      });
      const remove = document.createElement('button'); remove.type='button'; remove.textContent='×'; remove.title='Remove';
      remove.addEventListener('click',()=>{entities.splice(index,1);render();});
      actions.append(attr,rename,remove); row.append(text,actions); container.append(row);
    });
  };
  document.getElementById('addEntityBtn')?.addEventListener('click',()=>{
    const value=prompt('Entity name, e.g. users'); if(!value)return;
    const name=normalizeIdentifier(value,'entity');
    if(entities.some(e=>e.name===name)){showToast('Entity already exists');return;}
    entities.push({name,attrs:['id','created_at']});render();
  });
  document.getElementById('clearEntitiesBtn')?.addEventListener('click',()=>{entities=[];render();preview.textContent='-- Add at least one entity';});
  document.getElementById('genSqlBtn')?.addEventListener('click',()=>{
    if(!entities.length){preview.textContent='-- Add at least one entity';return;}
    preview.textContent=entities.map(entity=>`CREATE TABLE ${entity.name} (\n  ${entity.attrs.map((attr,index)=>`${attr} ${index===0 && attr==='id'?'BIGINT PRIMARY KEY':'VARCHAR(255)'}`).join(',\n  ')}\n);`).join('\n\n');
  });
  render();
}

function initTimer() {
  let interval = null;
  let remaining = 0;
  const display = document.getElementById('meetingTimerDisplay');
  if (!display) return;
  const render = () => {
    const min = Math.floor(remaining / 60).toString().padStart(2,'0');
    const sec = (remaining % 60).toString().padStart(2,'0');
    display.textContent = `${min}:${sec}`;
  };
  const stop = (reset = false) => {
    if (interval) clearInterval(interval);
    interval = null;
    if (reset) { remaining = 0; render(); }
  };
  document.querySelectorAll('[data-time]').forEach(btn => btn.addEventListener('click', () => {
    stop(); remaining = Number(btn.dataset.time) || 0; render();
    interval = setInterval(() => {
      remaining = Math.max(0, remaining - 1); render();
      if (remaining <= 0) { stop(); showToast('Timer finished'); }
    }, 1000);
  }));
  document.getElementById('stopMeetingTimer')?.addEventListener('click', () => stop(true));
  render();
}

function exportVisibleMd(){
  const btn=document.getElementById('exportVisibleMdBtn'); if(!btn) return;
  btn.addEventListener('click', async ()=>{
    const sections=[...document.querySelectorAll('.searchable')].filter(s=>!s.hidden);
    if(!sections.length){alert('No visible topics');return}
    const lines=['# SA Guide — export','',`Date: ${new Date().toLocaleString('en-GB')}`,`Topics: ${sections.length}`,''];
    sections.forEach(sec=>{
      const code=sec.querySelector('.section-code')?.textContent.trim();
      const title=sec.querySelector('h2')?.textContent.trim()||sec.dataset.title||sec.id;
      lines.push(`## ${code?code+' — ':''}${title}`,'');
      const intro=[...sec.children].find(el=>el.tagName==='P');
      if(intro){const t=(intro.textContent||'').replace(/\s+/g,' ').trim(); if(t) lines.push(t,'')}
      sec.querySelectorAll('li,a strong').forEach(el=>{const t=(el.textContent||'').replace(/\s+/g,' ').trim(); if(t && t.length<220) lines.push(`- ${t}`)});
      lines.push('');
    });
    const out=lines.join('\n').replace(/\n{3,}/g,'\n\n');
    try{const blob=new Blob([out],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sa-guide-export.md';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)}catch{}
    try{await navigator.clipboard.writeText(out)}catch{}
  });
}

function saBackup(){
  const STORAGE={bookmarks:'sa_bookmarks_v2',notes:'sa_notes_v2',competency:'sa_competency_v2',requirements:'sa_requirements_v2',security:'sa_security_v2',lastSection:'sa_last_section_v3',risks:'sa_risks_v3',traceability:'sa_traceability_v3',decisions:'sa_decisions_v3'};
  const exportBtn=document.getElementById('exportSaDataBtn');
  const importBtn=document.getElementById('importSaDataBtn');
  const clearBtn=document.getElementById('clearSaDataBtn');
  const input=document.getElementById('importSaDataInput');
  if(!exportBtn||!importBtn||!input) return;
  exportBtn.addEventListener('click',()=>{
    const data={schema:'knowerlife-sa-backup',version:1,exportedAt:new Date().toISOString(),storage:{}};
    Object.entries(STORAGE).forEach(([k,key])=>{const v=read(key); if(v) data.storage[key]=v});
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='knowerlife-sa-backup.json'; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  importBtn.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
    const file=input.files&&input.files[0]; if(!file) return;
    try{const text=await file.text(); const data=JSON.parse(text); const storage=(data&&data.storage)||((data&&data.schema)?null:data); if(!storage||typeof storage!=='object') throw 0; Object.entries(storage).forEach(([key,val])=>{if(Object.values(STORAGE).includes(key)) write(key, typeof val==='string'?val:JSON.stringify(val))}); alert('Imported. Reload to apply.'); location.reload()}catch{alert('Invalid backup file')}
    input.value='';
  });
  clearBtn?.addEventListener('click',()=>{
    if(!confirm('Clear local SA data in this browser?')) return;
    Object.values(STORAGE).forEach(k=>{try{localStorage.removeItem(k)}catch{}});
    alert('SA local data cleared.'); location.reload();
  });
}

const _domReady = document.addEventListener;
document.addEventListener('DOMContentLoaded',()=>{try{exportVisibleMd()}catch(e){}try{saBackup()}catch(e){}try{initHttpReference()}catch(e){}try{initConverter()}catch(e){}try{initNotes()}catch(e){}try{initPersistentChecklist(['chStakeholders','chUserStories','chAcceptance','chNonFunctional','chTrace'],STORAGE.requirements,'#reqChecklistProgress','#reqChecklistPercent','#resetReqChecklist')}catch(e){}try{initPersistentChecklist(['sec1','sec2','sec3','sec4','sec5','sec6'],STORAGE.security,'#secChecklistProgress','#secChecklistPercent','#resetSecChecklist')}catch(e){}try{initRiskMatrix()}catch(e){}try{initTraceabilityTool()}catch(e){}try{initDecisionLog()}catch(e){}try{initCompetency()}catch(e){}try{initGlossaryFilter()}catch(e){}try{initSectionUtilities()}catch(e){}try{initApiTester()}catch(e){}try{initDocuments()}catch(e){}try{initMessages()}catch(e){}try{initCopyButtons()}catch(e){}try{initQuiz()}catch(e){}try{initBookmarks()}catch(e){}try{initActiveNav()}catch(e){}try{initDataModeler()}catch(e){}try{initTimer()}catch(e){}});
