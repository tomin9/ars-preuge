// node obrazok.js <stránka.html> <výstup.png> <tmavý|svetlý> <kroky…>  – obrázok obrazovky s testovacími údajmi
// kroky: "go:podujatia" (menu), "click:<selektor>", "scroll:<selektor>" (posunúť na prvok), "esc"; VYSKA=1200 = vyššie okno, CELA=1 = celá stránka
const {chromium}=require('playwright');const fs=require('fs');
const [,,file,out,scheme,...steps]=process.argv;const html=fs.readFileSync(file,'utf8');const seed=JSON.parse(fs.readFileSync(__dirname+'/seed.json','utf8'));
function docs(){const o=[];let u=1700000000000;for(const c in seed)for(const i in seed[c])o.push({c,i,u:u++,x:0,d:seed[c][i]});return o;}
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1400,height:+(process.env.VYSKA||860)},colorScheme:scheme==='svetlý'?'light':'dark'});const p=await ctx.newPage();let first=true;
await ctx.route('**/*',async r=>{const u=r.request().url();
 if(u.startsWith('https://t/priestor'))return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
 if(u.includes('/rest/sync')){const d=first?docs():[];first=false;return r.fulfill({json:{now:Date.now(),max:1800000000000,docs:d}});}
 if(u.includes('/rest/doc'))return r.fulfill({json:{u:1800000000000}});if(u.includes('/rest/users'))return r.fulfill({json:u.includes('ids=')?{}:[]});return r.abort();});
await p.goto('https://t/priestor/');await W(800);
for(const s of steps){if(s==='esc'){await p.keyboard.press('Escape');}else if(s.startsWith('go:')){await p.click(`.nav [data-go="${s.slice(3)}"]`);}else if(s.startsWith('click:')){await p.click(s.slice(6));}else if(s.startsWith('scroll:')){await p.$eval(s.slice(7),e=>e.scrollIntoView({block:'start'}));}await W(300);}
await p.screenshot({path:out,fullPage:!!process.env.CELA});await b.close();})();
