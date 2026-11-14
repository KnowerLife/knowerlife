const root=document.documentElement;const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
function read(k){try{return localStorage.getItem(k)||''}catch{return''}}function write(k,v){try{localStorage.setItem(k,v)}catch{}}
function theme(){const saved=read('knowerlife-theme');root.dataset.theme=(saved==='light'||saved==='dark')?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const b=$('#themeToggle');const render=()=>{const dark=root.dataset.theme==='dark';b.textContent=dark?'☀':'☾';b.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme')};b.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';write('knowerlife-theme',root.dataset.theme);render()});render()}
function access(){let on=read('knowerlife-accessibility')==='enhanced';const b=$('#accessibilityToggle');const render=()=>{if(on){root.dataset.accessibility='enhanced';root.dataset.fontScale='large'}else{delete root.dataset.accessibility;delete root.dataset.fontScale}b.textContent=on?'A':'A+';b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Use standard accessibility mode':'Enhanced accessibility')};b.addEventListener('click',()=>{on=!on;write('knowerlife-accessibility',on?'enhanced':'standard');render()});render()}
function mobile(){const d=$('#mobileNav'),b=$('#mobileMenuBtn');b.addEventListener('click',()=>{d.showModal();b.setAttribute('aria-expanded','true')});$('[data-close-nav]').addEventListener('click',()=>d.close());d.addEventListener('close',()=>b.setAttribute('aria-expanded','false'));$$('#mobileNav a').forEach(a=>a.addEventListener('click',()=>d.close()))}
function search(){const input=$('#globalSearch'),cards=$$('.searchable'),status=$('#searchStatus'),filters=$$('#categoryFilters [data-category]');let cat='all';const apply=()=>{const q=input.value.trim().toLowerCase();let n=0;cards.forEach(c=>{const okCat=cat==='all'||c.dataset.category===cat;const hay=(c.dataset.title+' '+c.textContent).toLowerCase();const show=okCat&&(!q||hay.includes(q));c.hidden=!show;if(show)n++});status.textContent=`${n} topic${n===1?'':'s'}`;$('#emptyState').hidden=n>0};input.addEventListener('input',apply);filters.forEach(b=>b.addEventListener('click',()=>{cat=b.dataset.category;filters.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));apply()}));document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus()}else if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();input.focus()}});apply()}
function checker(){const input=$('#requirementInput'),out=$('#requirementResult');$('#requirementCheckBtn').addEventListener('click',()=>{const t=input.value.trim();if(!t){out.textContent='Enter a requirement first.';return}let score=100;const issues=[];for(const word of ['fast','easy','user-friendly','convenient','quickly','etc.'])if(t.toLowerCase().includes(word)){score-=12;issues.push(`Ambiguous word: “${word}”`)}if(!/\d/.test(t)){score-=16;issues.push('Add a measurable threshold where applicable.')}if(!/shall|must|should/i.test(t)){score-=12;issues.push('Make the obligation explicit (shall/must).')}if(t.length<25){score-=12;issues.push('Add enough context to make the behavior testable.')}score=Math.max(0,score);out.textContent=`Quality score: ${score}/100. ${issues.length?issues.join(' '):'Clear, measurable and testable wording.'}`})}
function acceptance(){$('#acceptanceBuildBtn').addEventListener('click',()=>{$('#acceptanceOutput').textContent=`Scenario: acceptance criterion\n\nGiven ${$('#givenInput').value||'…'}\nWhen ${$('#whenInput').value||'…'}\nThen ${$('#thenInput').value||'…'}`})}
function sla(){const calc=()=>{const a=Math.min(100,Math.max(0,Number($('#slaAvailability').value))),days=Math.max(1,Number($('#slaDays').value)),sec=days*86400*(1-a/100),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=Math.round(sec%60);$('#slaOutput').textContent=`${a}% over ${days} days allows ${h?h+' h ':''}${m} min ${s} sec of downtime.`};$('#slaCalcBtn').addEventListener('click',calc);calc()}
function pert(){const calc=()=>{const o=Number($('#pertO').value),m=Number($('#pertM').value),p=Number($('#pertP').value);if([o,m,p].some(Number.isNaN)){return}const e=(o+4*m+p)/6,s=(p-o)/6;$('#pertOutput').textContent=`Expected ≈ ${e.toFixed(2)} · σ ≈ ${s.toFixed(2)} · rough 95% range ≈ ${(e-2*s).toFixed(2)}–${(e+2*s).toFixed(2)}`};$('#pertCalcBtn').addEventListener('click',calc);calc()}
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
document.addEventListener('DOMContentLoaded',()=>{try{exportVisibleMd()}catch(e){}try{saBackup()}catch(e){}try{initHttpReference()}catch(e){}try{initConverter()}catch(e){}try{initNotes()}catch(e){}try{initPersistentChecklist(['chStakeholders','chUserStories','chAcceptance','chNonFunctional','chTrace'],STORAGE.requirements,'#reqChecklistProgress','#reqChecklistPercent','#resetReqChecklist')}catch(e){}});
