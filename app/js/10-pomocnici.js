/* ===== Pomocníci: formát dátumov a súm, štítky (chip), mená a avatary, bublina (toast), potvrdzovacie okno (ask), prevod starých záznamov (norm).
   Časť spoločného programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/10-pomocnici.js. Nie je to samostatný skript. ===== */
/* ================= helpers ================= */
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nf2=new Intl.NumberFormat("sk-SK",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2});
const nf0=new Intl.NumberFormat("sk-SK",{style:"currency",currency:"EUR",maximumFractionDigits:0});
const eur=n=>nf2.format(Number(n)||0), eur0=n=>nf0.format(Number(n)||0);
const pad=n=>String(n).padStart(2,"0");
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>iso(new Date());
const addDays=(s,n)=>{const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return iso(d);};
const fdate=d=>{if(!d)return"";const[y,m,dd]=d.split("-");return`${+dd}. ${+m}. ${y}`;};
const fdateS=d=>{if(!d)return"";const[y,m,dd]=d.split("-");return y===String(new Date().getFullYear())?`${+dd}. ${+m}.`:`${+dd}. ${+m}. ${y}`;};
const daysTo=d=>d?Math.round((new Date(d+"T12:00:00")-new Date(today()+"T12:00:00"))/864e5):null;
const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const get=(e,id)=>id?S.d[e].find(x=>x.id===id):null;
const ttl=(e,r)=>r?(r[ENT[e].title]||"Bez názvu"):"";
const meId=()=>S.me&&S.me.id||null;
const optL=(o,k)=>(OPT[o].find(x=>x[0]===k)||[k,k||""])[1];
const optC=(o,k)=>(OPT[o].find(x=>x[0]===k)||[0,0,GRAY])[2];
const chip=(o,k)=>k?`<span class="chip"><i style="background:${optC(o,k)}"></i>${esc(optL(o,k))}</span>`:"";
const pcolor=id=>(get("projects",id)||{}).color||GRAY;
const pdot=id=>{const p=get("projects",id);return p?`<span class="row" style="gap:6px;flex-wrap:nowrap"><i class="dot" style="background:${esc(p.color||GRAY)}"></i><span class="cut">${esc(p.name||"Bez názvu")}</span></span>`:"";};
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const baseCats=()=>(S.settings.cats&&S.settings.cats.length)?S.settings.cats:DEF_CATS;
const cats=()=>{const a=[...baseCats()];const add=c=>{c=(c||"").trim();if(c&&!a.includes(c))a.push(c);};(S.d.ledger||[]).forEach(x=>add(x.category));(S.d.events||[]).forEach(e=>(e.sections||[]).forEach(add));return a;};
const ttypes=()=>(S.settings.ttypes&&S.settings.ttypes.length)?S.settings.ttypes:DEF_TTYPES;
const isDone=t=>t.status==="hotove";
const pct=(a,b)=>b?Math.round(a/b*100):0;
function rel(ts){if(!ts)return"";const m=Math.round((Date.now()-ts)/6e4);if(m<1)return"práve teraz";if(m<60)return`pred ${m} min`;const h=Math.round(m/60);if(h<24)return`pred ${h} h`;const d=Math.round(h/24);if(d===1)return"včera";if(d<7)return`pred ${d} dňami`;return fdate(iso(new Date(ts)));}
function personName(v){if(!v)return"";if(v[0]==="~")return v.slice(1);const p=S.people[v];if(p&&p.name)return p.name;if(S.me&&v===S.me.id)return S.me.name||"Vy";return"Člen tímu";}
function avatar(v){const p=v&&v[0]!=="~"&&S.people[v];return p&&p.avatarUrl?`<img class="av sm" alt="" src="${esc(p.avatarUrl)}">`:"";}
function who(v){const n=personName(v);return n?`<span class="row" style="gap:5px;flex-wrap:nowrap">${avatar(v)}${esc(n)}</span>`:"";}
function bar(val,max,color,val2){const p=Math.min(pct(val,max),100),p2=val2?Math.min(pct(val+val2,max),100):0;return`<div class="bar">${val2?`<i class="b2" style="width:${p2}%"></i>`:""}<i class="${pct(val,max)>100?"over":""}" style="width:${p}%;${color?`background:${esc(color)}`:""}"></i></div>`;}
function dueHtml(d,done){if(!d)return"";const n=daysTo(d);if(!done&&n<0)return`<span class="late">${fdateS(d)}</span>`;if(!done&&n===0)return`<span class="late">dnes</span>`;if(n===1)return"zajtra";return fdateS(d);}
function toast(msg,ms){document.querySelectorAll(".toast").forEach(t=>t.remove());const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=msg;el.onclick=()=>el.remove();document.body.appendChild(el);setTimeout(()=>el.remove(),ms||3200);}
function ask(msg,okLabel){return new Promise(res=>{const L=$("#layer2");L.innerHTML=`<div class="scrim"><div class="modal" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="0">Zrušiť</button><button class="btn pri" data-a="1">${esc(okLabel||"Potvrdiť")}</button></div></div></div>`;const done=v=>{L.innerHTML="";res(v);};L.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>done(b.dataset.a==="1"));L.querySelector('[data-a="1"]').focus();});}

/* normalize older records (v1 of the app) */
const MAP={pstat:{bezi:"prebieha",ukonceny:"dokoncene",pozastaveny:"pozastavene"},tstat:{todo:"inbox",doing:"rozpracovane",done:"hotove"},prio:{vysoka:"urgentne",bezna:"normalne"}};
function norm(e,o){
  if(e==="projects"){o.status=MAP.pstat[o.status]||o.status||"priprava";if(!o.lead&&o.leadText)o.lead="~"+o.leadText;}
  if(e==="tasks"){o.status=MAP.tstat[o.status]||o.status||"inbox";o.priority=MAP.prio[o.priority]||o.priority;if(!o.assignee&&o.assigneeText)o.assignee="~"+o.assigneeText;}
  if(e==="events"&&o.grantId&&!Array.isArray(o.grantIds)){o.grantIds=[o.grantId];}
  if(e==="ledger"){if(!o.docNo&&o.doc)o.docNo=o.doc;o.type=o.type||"vydavok";o.account=o.account||"banka";}
  return o;
}

