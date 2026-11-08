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
const gaKey=(gid,sid)=>`grants:${gid}~${sid}`;
function grantAppTab(g){
  const T=gaList(g),gid=esc(g.id);S._gasel=S._gasel||{};
  const sel=T.find(t=>t.id===S._gasel[g.id])||null;            /* nič nevybraté = Prehľad žiadosti (ako Údaje o výzve) */
  const done=T.filter(t=>gaSt(t)==="hotove").length,over=T.filter(t=>+t.limit&&gaLen(t.body)>+t.limit).length;
  const sum=T.length?`Hotové ${done} z ${T.length} ${T.length===1?"časti":"častí"}`:"zatiaľ bez častí";
  const pv=`<button type="button" class="txi${sel?"":" on"}" data-gasel="${gid}|"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${GV_IC}</svg><span class="txt"><b>Prehľad žiadosti</b><small class="${over?"neg":""}">${sum}${over?` · ${over} nad limitom`:""}</small></span><i class="txdot" style="background:${T.length&&done===T.length?GREEN:T.length?ORANGE:GRAY}"></i></button>`;
  const list=T.map((t,i)=>{const st=TXST.find(x=>x[0]===gaSt(t))||TXST[0],on=sel&&t.id===sel.id,lim=+t.limit||0,n=gaLen(t.body);
    return`<button type="button" class="txi${on?" on":""}" data-gasel="${gid}|${esc(t.id)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TXI.ic[t.legacy?0:2]}</svg><span class="txt"><b>${esc(t.title||"Bez názvu")}</b><small class="${lim&&n>lim?"neg":""}">${lim?`${n.toLocaleString("sk-SK")} / ${lim.toLocaleString("sk-SK")} znakov`:n?`${n.toLocaleString("sk-SK")} znakov`:"zatiaľ prázdne"}</small></span><i class="txdot" style="background:${st[2]}" title="${st[1]}"></i></button>`;}).join("");
  const fu=g.formUrl?(/^https?:/.test(g.formUrl)?g.formUrl:"https://"+g.formUrl):"";
  let main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Žiadosť / ${esc(g.name||"Grant")}</div><div class="txtitle" style="font-size:28px;font-weight:600">Prehľad žiadosti</div></div>
      ${fu?`<div class="row" style="flex:none;gap:8px"><a class="btn" href="${esc(fu)}" target="_blank" rel="noopener">Žiadosť v grantovom systéme ↗</a></div>`:""}</div>
      <div class="txbar"><span class="meta">${sum}${over?` · <span class="neg">${over} nad limitom znakov</span>`:""}</span></div>
      ${T.length?`<div class="gvgrid">${T.map(t=>{const st=TXST.find(x=>x[0]===gaSt(t))||TXST[0],lim=+t.limit||0,n=gaLen(t.body);
        return`<div class="gvi"><span>${esc(t.title||"Bez názvu")}</span><b><i class="txdot" style="background:${st[2]};display:inline-block;margin-right:8px;vertical-align:middle"></i>${st[1]} <span class="meta${lim&&n>lim?" neg":""}" style="font-weight:400">· ${n.toLocaleString("sk-SK")}${lim?` / ${lim.toLocaleString("sk-SK")}`:""} znakov</span></b></div>`;}).join("")}</div>`
      :`<div class="empty" style="padding:22px 26px;text-align:left">Sem si rozpíšete žiadosť po častiach tak, ako ich má formulár grantového systému (napr. Popis projektu, Ciele, Cieľové skupiny, Harmonogram). Pri každej časti môžete zadať limit znakov a pokyn z formulára; počítadlo ukáže, koľko ešte môžete napísať. Časť pridáte vľavo.</div>`}</div>`;
  if(sel){const t=sel,st=gaSt(t),sc=(TXST.find(x=>x[0]===st)||TXST[0])[2],k=`${gid}|${esc(t.id)}`,lim=+t.limit||0;
    const C=S.d.comments.filter(c=>c.parent===gaKey(g.id,t.id)).sort((a,b)=>(a.at||0)-(b.at||0));
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Žiadosť / ${esc(g.name||"Grant")}</div>${t.legacy?`<div class="txtitle" style="font-size:28px;font-weight:600">${esc(t.title)}</div>`:`<input type="text" class="txtitle" value="${esc(t.title||"")}" data-ga="${k}|title" aria-label="Názov časti" maxlength="120" placeholder="Názov časti">`}</div>
      <div class="row" style="flex:none;gap:8px"><button type="button" class="btn" data-gacopy="${k}">${TXI.copy} Kopírovať</button>${t.legacy?"":`<button type="button" class="tplus tdel" data-gadel="${k}" title="Odstrániť časť" aria-label="Odstrániť časť">${TI.del}</button>`}</div></div>
      <div class="txbar">${t.legacy?`<span class="meta">${esc(t.hint)}</span>`:`<label class="txst"><i class="txdot" style="background:${sc}"></i><select data-ga="${k}|st" aria-label="Stav časti">${TXST.map(([v,l])=>`<option value="${v}"${v===st?" selected":""}>${l}</option>`).join("")}</select></label>
        <label class="small muted" style="display:flex;align-items:center;gap:6px">Limit znakov <input type="number" min="0" step="1" data-ga="${k}|limit" value="${lim||""}" placeholder="—" style="width:92px;padding:3px 8px"></label>`}</div>
      ${t.legacy?"":`<input type="text" class="gahint" data-ga="${k}|hint" value="${esc(t.hint||"")}" placeholder="Pokyn z formulára – čo má táto časť obsahovať…" aria-label="Pokyn z formulára">`}
      <textarea class="txbody" id="ga-body" data-ga="${k}|body" placeholder="Napíšte text tejto časti…">${esc(t.body||"")}</textarea>
      <div class="txfoot" id="gastat">${gaCount(t)}</div></div>
      <div class="panel" style="margin-top:14px"><h3 style="margin-bottom:6px">Komentáre <span class="meta">${C.length||""}</span></h3>
      ${C.map(c=>`<div class="cmt"><div class="h">${avatar(c.by)}<b>${esc(personName(c.by)||"Niekto")}</b><span>${rel(c.at)}</span>${c.by&&c.by===meId()?`<button class="x" style="margin-left:auto" data-gacdel="${esc(c.id)}" title="Zmazať komentár" aria-label="Zmazať komentár">×</button>`:""}</div><p>${esc(c.text)}</p></div>`).join("")}
      <textarea id="ga-cmt" placeholder="Napíšte komentár k tejto časti…" style="margin-top:8px;min-height:60px;width:100%"></textarea>
      <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm pri" data-gacsend="${k}">Pridať komentár</button></div></div>`;}
  return`<div class="txm"><div class="txlist">${pv}${list}<button type="button" class="txi txadd" data-gaadd="${gid}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať časť</b></span></button></div><div>${main}</div></div>`;
}
/* zápis jednej časti: doterajší text ide do g.text, ostatné do appSections (mení sa len daná časť) */
function gaSave(gid,sid,patch){const g=get("grants",gid);if(!g)return;
  if(sid===GA_LEG){if("body"in patch)return upd("grants",gid,{text:patch.body});return;}
  const a=(Array.isArray(g.appSections)?g.appSections:[]).map(x=>x.id===sid?Object.assign({},x,patch):x);return upd("grants",gid,{appSections:a});}
document.addEventListener("input",ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.ga)return;const[gid,sid,f]=t.dataset.ga.split("|");if(f!=="body")return;
  const st=document.getElementById("gastat");const g=get("grants",gid);const x=g&&gaList(g).find(y=>y.id===sid);if(st&&x)st.innerHTML=gaCount(Object.assign({},x,{body:t.value}));});
document.addEventListener("change",ev=>{const x=ev.target.closest&&ev.target.closest("[data-ga]");if(!x)return;const[gid,sid,f]=x.dataset.ga.split("|");
  let v=x.value;if(f==="limit")v=v===""?null:Math.max(0,Math.round(+v||0));if(f==="title")v=v.trim()||"Bez názvu";gaSave(gid,sid,{[f]:v});});
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
