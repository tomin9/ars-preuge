/* ===== Grant – záložka Žiadosť: editor po častiach formulára (ako Texty podujatia).
   Časti sú v poli grantu appSections [{id,title,hint,limit,body,st}]; komentáre v kolekcii comments s parent „grants:<id>~<časť>“.
   Doterajšie pole „Text žiadosti“ (g.text) sa ukazuje ako prvá časť a upravuje priamo g.text – nič sa neprevádza ani nemaže.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/grant-ziadost.js. Nie je to samostatný skript. ===== */
S._gasel=S._gasel||{};
const GA_LEG="__text";                                   /* časť z doterajšieho poľa „Text žiadosti“ */
const gaList=g=>{const a=Array.isArray(g.appSections)?g.appSections:[];
  return(String(g.text||"").trim()?[{id:GA_LEG,title:"Text žiadosti",hint:"Doterajší text žiadosti (pôvodné pole).",body:g.text,legacy:true}]:[]).concat(a);};
const gaSt=t=>t.st||(String(t.body||"").trim()?"rozpracovane":"nezacate");
const gaLen=b=>String(b||"").length;
const gaWords=b=>String(b||"").trim().split(/\s+/).filter(Boolean).length;
const gaCount=(t)=>{const n=gaLen(t.body),lim=+t.limit||0;return`<span class="${lim&&n>lim?"neg":""}">${n.toLocaleString("sk-SK")}${lim?` / ${lim.toLocaleString("sk-SK")}`:""} znakov</span>&nbsp;&nbsp;·&nbsp;&nbsp;${gaWords(t.body)} slov`;};
const GA_DL='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
const gaKey=(gid,sid)=>`grants:${gid}~${sid}`;
function grantAppTab(g){
  const T=gaList(g),gid=esc(g.id);S._gasel=S._gasel||{};
  const sel=T.find(t=>t.id===S._gasel[g.id])||T[0]||null;
  const list=T.map((t,i)=>{const st=TXST.find(x=>x[0]===gaSt(t))||TXST[0],on=sel&&t.id===sel.id,lim=+t.limit||0,n=gaLen(t.body);
    return`<button type="button" class="txi${on?" on":""}" data-gasel="${gid}|${esc(t.id)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TXI.ic[t.legacy?0:2]}</svg><span class="txt"><b>${esc(t.title||"Bez názvu")}</b></span><i class="txdot" style="background:${st[2]}" title="${st[1]}"></i></button>`;}).join("");
  const fu=g.formUrl?(/^https?:/.test(g.formUrl)?g.formUrl:"https://"+g.formUrl):"";
  let main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Žiadosť / ${esc(g.name||"Grant")}</div><div class="txtitle" style="font-size:28px;font-weight:600">Žiadosť</div></div></div>
      <div class="empty" style="padding:22px 26px;text-align:left">Sem si rozpíšete žiadosť po častiach tak, ako ich má formulár grantového systému (napr. Popis projektu, Ciele, Cieľové skupiny, Harmonogram). Časti načítate z formulára žiadosti (PDF alebo odkaz) tlačidlom „Načítať žiadosť“ vľavo, alebo ich pridáte ručne.</div></div>`;
  if(sel){const t=sel,st=gaSt(t),sc=(TXST.find(x=>x[0]===st)||TXST[0])[2],k=`${gid}|${esc(t.id)}`,lim=+t.limit||0;
    const C=S.d.comments.filter(c=>c.parent===gaKey(g.id,t.id)).sort((a,b)=>(a.at||0)-(b.at||0));
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick" style="display:flex;align-items:center;gap:8px">${t.legacy?"":`<label class="gastdot" title="Stav: ${esc((TXST.find(x=>x[0]===st)||TXST[0])[1])} – kliknutím zmeníte"><i class="txdot" style="background:${sc}"></i><select data-ga="${k}|st" aria-label="Stav časti">${TXST.map(([v,l])=>`<option value="${v}"${v===st?" selected":""}>${l}</option>`).join("")}</select></label>`}<span>Žiadosť / ${esc(g.name||"Grant")}</span></div>${t.legacy?`<div class="txtitle" style="font-size:28px;font-weight:600">${esc(t.title)}</div>`:`<textarea class="txtitle gattl" rows="1" data-ga="${k}|title" aria-label="Názov časti" maxlength="200" placeholder="Názov časti">${esc(t.title||"")}</textarea>`}</div>
      <div class="row" style="flex:none;gap:8px">${t.legacy?"":`<button type="button" class="tplus tdel" data-gadel="${k}" title="Odstrániť časť" aria-label="Odstrániť časť">${TI.del}</button>`}</div></div>
      ${t.legacy?`<div class="txbar"><span class="meta">${esc(t.hint)}</span></div>`:""}
      ${t.legacy?"":`<input type="text" class="gahint" data-ga="${k}|hint" value="${esc(t.hint||"")}" placeholder="Pokyn z formulára – čo má táto časť obsahovať…" aria-label="Pokyn z formulára">`}
      <div class="txw"><textarea class="txbody" id="ga-body" data-ga="${k}|body" placeholder="Napíšte text tejto časti…">${esc(t.body||"")}</textarea><button type="button" class="tplus txcp" data-gacopy="${k}" title="Kopírovať text" aria-label="Kopírovať text">${TXI.copy}</button></div>
      <div class="txfoot" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><span id="gastat">${gaCount(t)}</span>${t.legacy?"":`<label style="display:flex;align-items:center;gap:6px">Limit znakov <input type="number" min="0" step="1" data-ga="${k}|limit" value="${lim||""}" placeholder="—" style="width:92px;padding:3px 8px"></label>`}</div></div>
      <div class="panel" style="margin-top:14px"><h3 style="margin-bottom:6px">Komentáre <span class="meta">${C.length||""}</span></h3>
      ${C.map(c=>`<div class="cmt"><div class="h">${avatar(c.by)}<b>${esc(personName(c.by)||"Niekto")}</b><span>${rel(c.at)}</span>${c.by&&c.by===meId()?`<button class="x" style="margin-left:auto" data-gacdel="${esc(c.id)}" title="Zmazať komentár" aria-label="Zmazať komentár">×</button>`:""}</div><p>${esc(c.text)}</p></div>`).join("")}
      <textarea id="ga-cmt" placeholder="Napíšte komentár k tejto časti…" style="margin-top:8px;min-height:60px;width:100%"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm pri" data-gacsend="${k}">Pridať komentár</button></div></div>`;}
  return`<div class="txm"><div class="txlist galist">${list}<div class="gdsep"></div><button type="button" class="txi txadd" data-aiziadost="${gid}" title="Claude prečíta formulár žiadosti (PDF alebo odkaz) a pripraví jeho časti">${GA_DL}<span class="txt"><b>Načítať žiadosť</b></span></button><button type="button" class="txi txadd" style="margin-top:0" data-gaadd="${gid}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať časť</b></span></button>${fu?`<a class="txi txadd" style="margin-top:0" href="${esc(fu)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg><span class="txt"><b>Žiadosť v grantovom systéme</b></span></a>`:""}</div><div>${main}</div></div>`;
}
/* zápis jednej časti: doterajší text ide do g.text, ostatné do appSections (mení sa len daná časť) */
function gaSave(gid,sid,patch){const g=get("grants",gid);if(!g)return;
  if(sid===GA_LEG){if("body"in patch)return upd("grants",gid,{text:patch.body});return;}
  const a=(Array.isArray(g.appSections)?g.appSections:[]).map(x=>x.id===sid?Object.assign({},x,patch):x);return upd("grants",gid,{appSections:a});}
/* dlhý názov časti sa zalomí do viacerých riadkov – výška podľa textu, Enter uloží */
const gaFit=el=>{el.style.height="auto";el.style.height=el.scrollHeight+"px";};
new MutationObserver(()=>document.querySelectorAll("textarea.gattl").forEach(el=>{if(!el._fit){el._fit=1;gaFit(el);el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();el.blur();}});}})).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("resize",()=>document.querySelectorAll("textarea.gattl").forEach(gaFit));
document.addEventListener("input",ev=>{const t=ev.target;if(t&&t.classList&&t.classList.contains("gattl"))gaFit(t);});
document.addEventListener("input",ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.ga)return;const[gid,sid,f]=t.dataset.ga.split("|");if(f!=="body")return;
  const st=document.getElementById("gastat");const g=get("grants",gid);const x=g&&gaList(g).find(y=>y.id===sid);if(st&&x)st.innerHTML=gaCount(Object.assign({},x,{body:t.value}));});
document.addEventListener("change",ev=>{const x=ev.target.closest&&ev.target.closest("[data-ga]");if(!x)return;const[gid,sid,f]=x.dataset.ga.split("|");
  let v=x.value;if(f==="limit")v=v===""?null:Math.max(0,Math.round(+v||0));if(f==="title")v=v.replace(/\s*\n\s*/g," ").trim()||"Bez názvu";gaSave(gid,sid,{[f]:v});});
document.addEventListener("click",async ev=>{const t=ev.target;if(!t.closest)return;let el;
  if((el=t.closest("[data-gasel]"))){const[gid,sid]=el.dataset.gasel.split("|");S._gasel[gid]=sid;render();return;}
  if((el=t.closest("[data-gaadd]"))){const g=get("grants",el.dataset.gaadd);if(!g)return;const nid="s"+Date.now().toString(36);S._gasel[g.id]=nid;
    await upd("grants",g.id,{appSections:[...(Array.isArray(g.appSections)?g.appSections:[]),{id:nid,title:"Nová časť",hint:"",limit:null,body:""}]});
    setTimeout(()=>{const i=document.querySelector(`[data-ga$="|${nid}|title"]`);if(i){i.focus();i.select();}},60);return;}
  if((el=t.closest("[data-gadel]"))){const[gid,sid]=el.dataset.gadel.split("|"),g=get("grants",gid);if(!g)return;const x=(g.appSections||[]).find(y=>y.id===sid);if(!x)return;
    if(!await ask(`Odstrániť časť „${x.title||"Bez názvu"}“${String(x.body||"").trim()?" aj s jej textom":""}? Toto sa nedá vrátiť.`,"Odstrániť"))return;
    await upd("grants",gid,{appSections:(g.appSections||[]).filter(y=>y.id!==sid)});return;}
  if((el=t.closest("[data-gacopy]"))){const[gid,sid]=el.dataset.gacopy.split("|"),g=get("grants",gid),x=g&&gaList(g).find(y=>y.id===sid);if(!x)return;
    const ta=document.getElementById("ga-body");const txt=ta?ta.value:x.body||"";try{await navigator.clipboard.writeText(txt);toast("Text skopírovaný.");}catch(_){toast("Kopírovanie sa nepodarilo.");}return;}
  if((el=t.closest("[data-gacsend]"))){const[gid,sid]=el.dataset.gacsend.split("|");const ta=document.getElementById("ga-cmt");const txt=ta&&ta.value.trim();if(!txt)return;
    if(await add("comments",{parent:gaKey(gid,sid),text:txt,by:meId()||"",at:Date.now()}))ta.value="";return;}
  if((el=t.closest("[data-gacdel]"))){if(await ask("Zmazať komentár?","Zmazať"))del("comments",el.dataset.gacdel);return;}
});
/* ===== „Načítať žiadosť“ cez Claude: formulár (PDF / odkaz) → navrhnuté časti → pridajú sa len vybrané nové časti.
   Existujúce časti sa nikdy nemenia ani nemažú; časť s rovnakým názvom sa nepridá druhýkrát. ===== */
function gaiOpen(gid){const g=get("grants",gid);if(!g)return;
  aiSource(gid,{title:"Načítať žiadosť",intro:"Claude prečíta formulár žiadosti (vzor z grantového systému alebo vyplnenú žiadosť) a pripraví jeho časti s pokynmi a limitmi znakov; ak je žiadosť vyplnená, prevezme aj text.",
    urlLabel:"Odkaz na formulár žiadosti (PDF alebo stránka)",url:"",kind:"ziadost",endpoint:"ai/ziadost",wait:"Claude číta formulár žiadosti",ok:j=>Array.isArray(j.sections),done:(j,src,url,box,close)=>gaiReview(gid,j,src,box,close)});}
function gaiReview(gid,j,src,box,close){
  const nt=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
  const g=get("grants",gid)||{},have=new Set(gaList(g).map(t=>nt(t.title)));
  const rows=(j.sections||[]).filter(x=>x&&String(x.title||"").trim()).map(x=>({title:String(x.title).trim().slice(0,120),hint:String(x.hint||"").trim(),limit:Number.isFinite(+x.limit)&&+x.limit>0?Math.round(+x.limit):null,body:String(x.body||""),dup:have.has(nt(x.title))}));
  const fin=h=>{box.innerHTML=`<h2 style="margin:0 0 10px">Načítať žiadosť</h2><p style="white-space:normal">${h}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="x">Zavrieť</button></div>`;box.querySelector('[data-a="x"]').onclick=close;};
  if(!rows.length)return fin("Claude vo formulári nenašiel žiadne časti, do ktorých sa píše text.");
  box.innerHTML=`<h2 style="margin:0 0 4px">Skontrolujte časti žiadosti</h2><p class="small muted" style="margin:0 0 10px">Zdroj: ${esc(src)}. Zaškrtnuté časti sa pridajú na koniec žiadosti. Časti, ktoré už máte, sa nezmenia.</p>
    <div class="aivlist">${rows.map((x,i)=>`<label class="aivrow${x.dup?" same":""}"><input type="checkbox" data-i="${i}" ${x.dup?"disabled":"checked"}><span class="aivl">${esc(x.title)}</span><span class="aivv">${x.hint?`<span class="aivtx">${esc(x.hint)}</span>`:'<span class="muted">bez pokynu</span>'}<small>${x.dup?"takú časť už máte – nezmení sa":[x.limit?`limit ${x.limit.toLocaleString("sk-SK")} znakov`:"bez limitu",x.body.trim()?`s textom (${x.body.length.toLocaleString("sk-SK")} znakov)`:""].filter(Boolean).join(" · ")}</small></span></label>`).join("")}</div>
    <p class="small muted" style="margin:10px 0 0">${aiCost(j.usage)}</p>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="x">Zrušiť</button><button class="btn pri" data-a="save">Pridať vybrané</button></div>`;
  box.querySelector('[data-a="x"]').onclick=close;
  box.querySelector('[data-a="save"]').onclick=async()=>{
    const pick=[...box.querySelectorAll("input[data-i]:checked")].map(c=>rows[+c.dataset.i]);
    if(!pick.length){toast("Nič nie je vybrané.");return;}
    const g1=get("grants",gid);if(!g1){close();return;}const t0=Date.now().toString(36);
    const add=pick.map((x,i)=>({id:"s"+t0+i,title:x.title,hint:x.hint,limit:x.limit,body:x.body}));
    close();await upd("grants",gid,{appSections:[...(Array.isArray(g1.appSections)?g1.appSections:[]),...add]});toast("Pridané časti: "+add.length+".");};
}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-aiziadost]");if(b){ev.preventDefault();gaiOpen(b.dataset.aiziadost);}});
