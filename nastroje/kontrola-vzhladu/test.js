// node test.js <stránka.html> <výstup.json> [páry.json]
const {chromium}=require('playwright');const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');const seed=JSON.parse(fs.readFileSync(__dirname+'/seed.json','utf8'));
const pairs=process.argv[4]?JSON.parse(fs.readFileSync(process.argv[4],'utf8')):[];
function docs(){const o=[];let u=1700000000000;for(const c in seed)for(const i in seed[c])o.push({c,i,u:u++,x:0,d:seed[c][i]});return o;}
const FIXED=Date.parse('2026-11-08T10:00:00');
async function setup(b,opts){const ctx=await b.newContext(opts);const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(`{const F=${FIXED};const D=Date;class X extends D{constructor(...a){a.length?super(...a):super(F)}static now(){return F}};window.Date=X;}`);
  let first=true;
  await ctx.route('**/*',async r=>{const u=r.request().url();
    if(u.startsWith('https://t/priestor'))return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
    if(u.includes('/rest/sync')){const d=first?docs():[];first=false;return r.fulfill({json:{now:FIXED,max:1800000000000,docs:d}});}
    if(u.includes('/rest/doc'))return r.fulfill({json:{u:1800000000000+Math.floor(Math.random()*1e6)}});
    if(u.includes('/rest/users'))return r.fulfill({json:u.includes('ids=')?{}:[]});
    if(u.includes('/rest/photos'))return r.fulfill({json:{title:'Album',photos:[]}});
    return r.abort();});
  await p.goto('https://t/priestor/');await p.waitForTimeout(700);return {ctx,p,errs};}
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function go(p,v){await p.evaluate(()=>{const s=document.querySelector('#side');s&&s.classList.remove('open');});await p.click(`.nav [data-go="${v}"]`,{timeout:1500}).catch(async()=>{await p.evaluate(v=>{const b=document.querySelector(`[data-go="${v}"]`);b&&b.click();},v);});await W(150);}
async function cl(p,s){const el=await p.$(s);if(!el)throw new Error('nenájdené: '+s);await el.click();await W(180);}
async function esc(p){await p.keyboard.press('Escape');await W(120);}
const DESK=[
 ['prehlad',p=>go(p,'prehlad')],['kalendar',p=>go(p,'kalendar')],
 ['ulohy-tabula',p=>go(p,'ulohy')],['ulohy-zoznam',async p=>{await go(p,'ulohy');await cl(p,'[data-tmode="list"]');}],
 ['projekty',async p=>{await go(p,'projekty');}],
 ...['podujatia','ulohy','granty','financie','ludia'].map(t=>['projekt-'+t,async p=>{await go(p,'projekty');await cl(p,'.gcard[data-open="projects:p1"]');await cl(p,`[data-ptab="${t}"]`);}]),
 ['projekt-financie-kat',async p=>{await cl(p,'[data-ptab="financie"]');await cl(p,'[data-pftab="kategorie"]');}],['projekt-financie-partneri',async p=>{await cl(p,'[data-pftab="partneri"]');}],
 ['granty',async p=>{await go(p,'granty');await cl(p,'[data-gtab="schvalene"]');}],
 ...['vyzva','ziadost','rozpocet','ulohy','podujatia','dokumenty'].map(t=>['grant-'+t,async p=>{await go(p,'granty');await cl(p,'[data-gtab="schvalene"]');await cl(p,'.gcard[data-open="grants:g1"]');await cl(p,`[data-grtab="${t}"]`);}]),
 ['podujatia',async p=>{await go(p,'podujatia');await cl(p,'[data-etab="planovane"]');}],
 ...['texty','rozpocet','ulohy','granty','dramaturgia','marketing','spoluprace','dokumenty','zabezpecenie'].map(t=>['podujatie-'+t,async p=>{await go(p,'podujatia');await cl(p,'[data-etab="planovane"]');await cl(p,'.gcard[data-open="events:e1"]');await cl(p,`[data-evtab="${t}"]`);}]),
 ['podujatie-rozpocet-granty',async p=>{await cl(p,'[data-evtab="rozpocet"]');await cl(p,'[data-evbmode="granty"]');}],
 ['podujatie-spoluprace-uprava',async p=>{await cl(p,'[data-evtab="spoluprace"]');await cl(p,'[data-secedit]');}],
 ['zabezpecenie-ludia',async p=>{await cl(p,'[data-evtab="zabezpecenie"]');await cl(p,'[data-zbmode="ludia"]');}],
 ['financie',async p=>{await go(p,'financie');await cl(p,'[data-ftab="dennik"]');}],['financie-filter',async p=>{await cl(p,'[data-fftoggle]');}],
 ['financie-projekty',async p=>{await cl(p,'[data-ftab="projekty"]');}],['financie-kategorie',async p=>{await cl(p,'[data-ftab="kategorie"]');}],
 ...['osoby','firmy','organizacie','media'].map(t=>['kontakty-'+t,async p=>{await go(p,'kontakty');await cl(p,`[data-ctab="${t}"]`);}]),
 ['kontakty-filter',async p=>{await go(p,'kontakty');await cl(p,'[data-ctab="osoby"]');await cl(p,'[data-cvol]');}],
 ['nastavenia',p=>go(p,'nastavenia')],
 ['panel-kontakt',async p=>{await go(p,'kontakty');await cl(p,'[data-ctab="osoby"]');await cl(p,'tr[data-open="contacts:c1"]');}],
 ['panel-kontakt-uprava',async p=>{await cl(p,'[data-dedit]');}],
 ['panel-organizacia',async p=>{await esc(p);await cl(p,'[data-ctab="organizacie"]');await cl(p,'tr[data-open="contacts:c3"]');}],
 ['panel-uloha',async p=>{await esc(p);await go(p,'ulohy');await cl(p,'[data-tmode="list"]');await cl(p,'tr[data-open="tasks:t1"]');}],
 ['panel-platba',async p=>{await esc(p);await go(p,'financie');await cl(p,'[data-ftab="dennik"]');await cl(p,'tr[data-open="ledger:x3"]');}],
 ['panel-grant',async p=>{await esc(p);await go(p,'granty');await cl(p,'[data-gtab="schvalene"]');await cl(p,'.gcard[data-open="grants:g1"]');await cl(p,'[data-peek="grants:g1"]');}],
 ['panel-polozka',async p=>{await esc(p);await cl(p,'[data-grtab="rozpocet"]');if(await p.$('tr[data-open="lines:l1"]'))await cl(p,'tr[data-open="lines:l1"]');else{await cl(p,'[data-gbline="l1"]');await cl(p,'button[data-open="lines:l1"]');}}],
 ['panel-podujatie',async p=>{await esc(p);await go(p,'podujatia');await cl(p,'.gcard[data-open="events:e1"]');await cl(p,'[data-peek="events:e1"]');}],
 ['panel-program',async p=>{await esc(p);await cl(p,'[data-evtab="dramaturgia"]');await cl(p,'tr[data-open="prog:pr1"]');}],
 ['panel-projekt',async p=>{await esc(p);await go(p,'projekty');await cl(p,'.gcard[data-open="projects:p1"]');await cl(p,'[data-peek="projects:p1"]');}],
 ['hladanie',async p=>{await esc(p);await p.keyboard.press('Control+k');await W(100);await p.keyboard.type('a');await W(150);}],
 ['nove-menu',async p=>{await esc(p);await cl(p,'[data-new]');}],
 ['zbalene-menu',async p=>{await esc(p);await cl(p,'[data-sidecol]');await go(p,'prehlad');}],
];
const MOB=[
 ['m-prehlad',p=>go(p,'prehlad')],['m-kalendar',async p=>{await cl(p,'.bottom [data-go="kalendar"]');}],
 ['m-menu',async p=>{await cl(p,'[data-menu]');}],
 ['m-podujatie',async p=>{await esc(p);await go(p,'podujatia');await cl(p,'[data-etab="planovane"]');await cl(p,'.gcard[data-open="events:e1"]');await cl(p,'[data-evtab="texty"]');}],
 ['m-zabezpecenie',async p=>{await cl(p,'[data-evtab="zabezpecenie"]');}],
 ['m-spoluprace',async p=>{await cl(p,'[data-evtab="spoluprace"]');}],
 ['m-grant',async p=>{await go(p,'granty');await cl(p,'[data-gtab="schvalene"]');await cl(p,'.gcard[data-open="grants:g1"]');}],
 ['m-kontakt',async p=>{await go(p,'kontakty');await cl(p,'[data-ctab="osoby"]');await cl(p,'tr[data-open="contacts:c1"]');}],
 ['m-financie',async p=>{await esc(p);await go(p,'financie');}],
];
const SNAP=`(()=>{const out=[];const all=[...document.querySelectorAll('body *')];
  const path=e=>{const a=[];while(e&&e!==document.body){let i=0,s=e;while((s=s.previousElementSibling))i++;a.unshift(e.tagName+i);e=e.parentElement;}return a.join('/');};
  for(const e of all){for(const ps of [null,'::before','::after']){const cs=getComputedStyle(e,ps);if(ps&&cs.content==='none')continue;let s='';for(let i=0;i<cs.length;i++){const k=cs[i];s+=k+':'+cs.getPropertyValue(k)+';';}out.push([path(e)+(ps||''),s]);}}
  return out;})()`;
const strip=s=>s.replace(/:(hover|focus|focus-visible|focus-within|active)\b/g,'').replace(/::?(before|after|placeholder|-webkit-details-marker|marker)\b/g,'')||'*';
(async()=>{const b=await chromium.launch();const res={states:{},errs:[],overlap:{}};
 for(const [name,opts,steps] of [['desk-light',{viewport:{width:1400,height:900},colorScheme:'light'},DESK],['desk-dark',{viewport:{width:1400,height:900},colorScheme:'dark'},DESK],['mob-light',{viewport:{width:390,height:844},colorScheme:'light',isMobile:true,hasTouch:true},MOB],['mob-dark',{viewport:{width:390,height:844},colorScheme:'dark',isMobile:true,hasTouch:true},MOB]]){
  const {ctx,p,errs}=await setup(b,opts);
  for(const [st,fn] of steps){try{await fn(p);}catch(e){res.errs.push(name+' '+st+': '+e.message.split('\n')[0]);}
    await W(150);res.states[name+'|'+st]=await p.evaluate(SNAP);
    if(pairs.length){const hit=await p.evaluate(([pairs,code])=>{const strip=eval(code);const o=[];pairs.forEach((q,i)=>{try{const A=new Set(document.querySelectorAll(strip(q[0])));if(!A.size)return;for(const e of document.querySelectorAll(strip(q[1])))if(A.has(e)){o.push(i);return;}}catch(_){}});return o;},[pairs,strip.toString()]);hit.forEach(i=>{res.overlap[i]=(res.overlap[i]||[]).concat(name+'|'+st);});}
  }
  res.errs.push(...errs.map(e=>name+' chyba stránky: '+e));await ctx.close();}
 fs.writeFileSync(process.argv[3],JSON.stringify(res));console.log('stavov',Object.keys(res.states).length,'prvkov spolu',Object.values(res.states).reduce((a,x)=>a+x.length,0));console.log('problémy:',JSON.stringify(res.errs,null,1));await b.close();})();
