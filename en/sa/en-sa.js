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
document.addEventListener('DOMContentLoaded',()=>{try{exportVisibleMd()}catch(e){}try{saBackup()}catch(e){}});
