/* ===== Ukladanie údajov (add, upd, del, saveSettings), načítanie (boot) a výpočty: zostatky, čerpanie grantov a projektov, termíny (agenda).
   Časť spoločného programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/20-data-a-vypocty.js. Nie je to samostatný skript. ===== */
/* ================= data layer ================= */
async function write(fn){
  if(S.readOnly){toast("Máte len prístup na čítanie.");return false;}
  try{await fn();return true;}
  catch(e){
    if(e&&e.code==="invalid_argument"){toast("Zmena sa neuložila – nemáte právo upravovať, alebo je záznam príliš veľký.");}
    else if(e&&e.code==="quota_exceeded")toast("Databáza je plná. Zmažte staré záznamy.");
    else if(e&&e.code==="resource_exhausted")toast("Príliš veľa zmien naraz. Skúste to o chvíľu.");
    else toast("Zmenu sa nepodarilo uložiť. Skúste to znova.");
    return false;
  }
}
async function add(e,data){
  if(!accEdit(e)){accDeny();return null;}
  const t=Date.now(),doc=Object.assign({createdAt:t,updatedAt:t},meId()?{createdBy:meId(),updatedBy:meId()}:{},data);
  let id=null;
  const ok=await write(async()=>{
    if(db){const ref=db.collection(ENT[e].col).doc();id=ref.id;await ref.set(doc);}
    else{id=rid();S.d[e].push(Object.assign({id},doc));render();}
  });
  return ok?id:null;
}
function upd(e,id,patch){
  if(!accEdit(e))return Promise.resolve(accDeny());
  patch=Object.assign({},patch,{updatedAt:Date.now()},meId()?{updatedBy:meId()}:{});
  return write(async()=>{
    if(db)await db.doc(ENT[e].col+"/"+id).update(patch);
    else{Object.assign(get(e,id),patch);render();}
  });
}
function del(e,id){
  if(!accEdit(e))return Promise.resolve(accDeny());
  return write(async()=>{
    if(db)await db.doc(ENT[e].col+"/"+id).delete();
    else{S.d[e]=S.d[e].filter(x=>x.id!==id);render();}
  });
}
function saveSettings(patch){
  if(ACC&&!accEditA("nastavenia"))return Promise.resolve(accDeny());
  const next=Object.assign({},S.settings,patch);
  return write(async()=>{if(db)await db.doc("settings/main").set(next);else{S.settings=next;render();}});
}

let peopleT=null;
function refreshPeople(){
  if(!user)return;clearTimeout(peopleT);
  peopleT=setTimeout(async()=>{
    const ids=new Set();
    const addv=v=>{if(v&&v[0]!=="~")ids.add(v);};
    S.d.tasks.forEach(t=>addv(t.assignee));["projects","grants","events"].forEach(e=>S.d[e].forEach(x=>addv(x.lead)));
    KEYS.forEach(e=>S.d[e].forEach(x=>{addv(x.updatedBy);addv(x.createdBy);}));
    if(!ids.size)return;
    const ps=await user.profiles([...ids]);let ch=false;
    for(const id in ps){const o=S.people[id];if(!o||o.name!==ps[id].name||o.avatarUrl!==ps[id].avatarUrl)ch=true;}
    S.people=Object.assign({},S.people,ps);if(ch)render();
  },150);
}

async function boot(){
  const now=new Date();S.cal={y:now.getFullYear(),m:now.getMonth()};
  {let hv=hashView()||"prehlad";if(!accView(hv))hv="prehlad";S.view=hv;try{history.replaceState(history.state,"",urlFor(hv));}catch(_){}}
  render();
  const C=window.claude;const use=n=>(C&&typeof C.use==="function")?C.use(n):Promise.resolve(null);
  [db,user,dl,assets,mcp]=await Promise.all([use("db"),use("user"),use("downloads"),use("assets"),use("mcp")]);
  if(user){S.me=await user.me();const can=await user.can("data.write");if(can===false)S.readOnly=true;}
  if(db){
    S.live=true;let pending=KEYS.length+1;
    const done=()=>{if(pending>0&&--pending===0)S.loading=false;};
    KEYS.forEach(e=>db.collection(ENT[e].col).onSnapshot(snap=>{
      const all=snap.docs.map(d=>norm(e,Object.assign({id:d.id},d.data())));
      S.d[e]=all.filter(x=>!x._stub);S.stub=S.stub||{};S.stub[e]=all.filter(x=>x._stub);   /* menovky záznamov mimo rozsahu – nie v zoznamoch */
      done();refreshPeople();loadTeam();render();
    },err=>{done();if(err&&err.code!=="revoked")toast("Spojenie s databázou sa prerušilo. Obnovte stránku.");render();}));
    db.doc("settings/main").onSnapshot(s=>{S.settings=s.exists?Object.assign({},s.data()):{};done();render();},()=>{done();});
  }else S.loading=false;
  render();
}
/* ================= computations ================= */
function ledgerCalc(){
  const list=[...S.d.ledger].sort((a,b)=>(a.date||"").localeCompare(b.date||"")||(a.createdAt||0)-(b.createdAt||0));
  let bank=+S.settings.openBank||0,cash=+S.settings.openCash||0;const seq={},map={};
  list.forEach(x=>{
    const y=(x.date||"").slice(0,4)||"—";seq[y]=(seq[y]||0)+1;
    const moves=x.state!=="barter"&&x.paid!==false;const s=(x.type==="prijem"?1:-1)*(+x.amount||0);
    if(moves){if(x.account==="hotovost")cash+=s;else bank+=s;}
    map[x.id]={seq:seq[y],bank,cash};
  });
  return{map,bank,cash,list};
}
/* grant, ktorý položku financuje ako spolufinancovanie (staré záznamy: začiarknuté „cofin“ = spolufinancovanie vlastného grantu) */
const cofinG=x=>x.cofinGrantId||(x.cofin?x.grantId||"":"");
function grantCalc(g){
  const L=S.d.ledger.filter(x=>x.grantId===g.id||(x.type!=="prijem"&&cofinG(x)===g.id));let sg=0,sc=0,rec=0;
  let paidG=0,planG=0;
  L.forEach(x=>{const a=+x.amount||0;if(x.type==="prijem"){if(x.grantId===g.id)rec+=a;}else if(cofinG(x)){if(cofinG(x)===g.id)sc+=a;}else{sg+=a;if(x.paid!==false&&x.date)paidG+=a;else planG+=a;}});
  const appr=+g.approved||0;return{L,sg,sc,rec,appr,rest:appr-sg,cofinReq:+g.cofinReq||0,paidG,planG};  /* sg = všetko (aj plánované); paidG = zaplatené, planG = plánované */
}
function lineCalc(l){
  const L=S.d.ledger.filter(x=>x.lineId===l.id&&x.type!=="prijem");let sg=0,sc=0;
  L.forEach(x=>{if(cofinG(x))sc+=+x.amount||0;else sg+=+x.amount||0;});return{L,sg,sc,spent:sg+sc};
}
function projCalc(p){
  const L=S.d.ledger.filter(x=>x.projectId===p.id);
  const inc=sum(L.filter(x=>x.type==="prijem"),x=>x.amount),exp=sum(L.filter(x=>x.type!=="prijem"),x=>x.amount);
  const T=S.d.tasks.filter(t=>t.projectId===p.id);
  return{L,inc,exp,T,open:T.filter(t=>!isDone(t)).length,done:T.filter(isDone).length};
}
const ACTIVE_G=["priprava","podane","schvalene","zrealizovane"];
/* all dated things → for dashboard & calendar */
function agenda(){
  const out=[];
  S.d.tasks.forEach(t=>{if(t.due)out.push({d:t.due,kind:"task",c:"var(--accent)",txt:t.title||"Úloha",open:"tasks:"+t.id,done:isDone(t),pid:t.projectId,mine:t.assignee&&t.assignee===meId()});});
  S.d.events.forEach(e=>{if(e.date){const end=e.dateTo&&e.dateTo>e.date?e.dateTo:e.date;let d=e.date,i=0;while(d<=end&&i<40){out.push({d,kind:"event",c:PINK,txt:(e.name||"Podujatie")+(e.time&&d===e.date?" · "+e.time:""),open:"events:"+e.id,done:e.status==="zrealizovane",pid:e.projectId});d=addDays(d,1);i++;}}});
  S.d.grants.forEach(g=>{
    const closed=["vyuctovane","nepodporene"].includes(g.status);
    if(g.submitTo)out.push({d:g.submitTo,kind:"grant",c:OCHRE,txt:"Uzávierka: "+(g.name||"grant"),open:"grants:"+g.id,done:closed||g.status!=="napad"&&g.status!=="priprava",pid:g.projectId});
    if(g.realTo)out.push({d:g.realTo,kind:"grant",c:OCHRE,txt:"Koniec realizácie: "+(g.name||"grant"),open:"grants:"+g.id,done:closed,pid:g.projectId});
    if(g.settleDue)out.push({d:g.settleDue,kind:"grant",c:RED,txt:"Vyúčtovanie: "+(g.name||"grant"),open:"grants:"+g.id,done:g.status==="vyuctovane"||g.status==="nepodporene",pid:g.projectId});
  });
  S.d.projects.forEach(p=>{if(p.end&&p.status!=="dokoncene")out.push({d:p.end,kind:"project",c:GREEN,txt:"Koniec projektu: "+(p.name||""),open:"projects:"+p.id,done:false,pid:p.id});});
  return out.sort((a,b)=>a.d.localeCompare(b.d));
}

