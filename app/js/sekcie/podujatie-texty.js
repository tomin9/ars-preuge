/* ===== Podujatie – záložka Texty (zoznam vľavo, editor vpravo).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-texty.js. Nie je to samostatný skript. ===== */
const TXT_DEF=[["Anotácia","Krátke predstavenie podujatia"],["Sociálne siete","Texty na zdieľanie"],["Tlačová správa","Podklady pre médiá"]];
const evTexts=e=>Array.isArray(e.texts)?e.texts:TXT_DEF.map(([t,d],i)=>({id:"t"+i,title:t,desc:d,body:""}));
const TXI={copy:'<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
 ic:['<path d="M4 7h16M4 12h10M4 17h16"/>','<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>','<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>']};
const TXST=[["nezacate","Nezačaté",GRAY],["rozpracovane","Rozpracované",ORANGE],["hotove","Hotové",GREEN]];
const txSt=t=>t.st||(String(t.body||"").trim()?"rozpracovane":"nezacate");
const txStat=b=>{const w=String(b||"").trim().split(/\s+/).filter(Boolean).length;return`${w} slov&nbsp;&nbsp;&nbsp;&nbsp;${String(b||"").length} znakov`;};
function textyTab(e){
  const T=evTexts(e),id=esc(e.id);S._txsel=S._txsel||{};
  let sel=T.find(t=>t.id===S._txsel[e.id])||T[0];
  const list=T.map((t,i)=>{const st=TXST.find(x=>x[0]===txSt(t))||TXST[0],on=sel&&t.id===sel.id;
    return`<button type="button" class="txi${on?" on":""}" data-txsel="${id}|${esc(t.id)}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TXI.ic[i%3]}</svg><span class="txt"><b>${esc(t.title)}</b><small>${esc(t.desc||"")}</small></span><i class="txdot" style="background:${st[2]}" title="${st[1]}"></i></button>`;}).join("");
  let main='<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ žiadne texty.</div>';
  if(sel){const t=sel,st=txSt(t),sc=(TXST.find(x=>x[0]===st)||TXST[0])[2],k=`${id}|${esc(t.id)}`;
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Texty / ${esc(e.name||"Podujatie")}</div><input type="text" class="txtitle" value="${esc(t.title)}" data-txt="${k}|title" aria-label="Názov textu" maxlength="60"></div>
      <div class="row" style="flex:none;gap:8px"><button type="button" class="btn" data-txcopy="${k}">${TXI.copy} Kopírovať</button><button type="button" class="tplus tdel" data-txdel="${k}" title="Odstrániť text" aria-label="Odstrániť text">${TI.del}</button></div></div>
      <div class="txbar"><label class="txst"><i class="txdot" style="background:${sc}"></i><select data-txt="${k}|st" aria-label="Stav textu">${TXST.map(([v,l])=>`<option value="${v}"${v===st?" selected":""}>${l}</option>`).join("")}</select></label><input type="text" class="txdesc" value="${esc(t.desc||"")}" data-txt="${k}|desc" placeholder="Krátky popis…" maxlength="80" aria-label="Popis textu"></div>
      <textarea class="txbody" data-txt="${k}|body" placeholder="Napíšte text…">${esc(t.body||"")}</textarea>
      <div class="txfoot" id="txstat">${txStat(t.body)}</div></div>`;}
  return`<div class="txm"><div class="txlist">${list}<button type="button" class="txi txadd" data-txadd="${id}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať text</b></span></button></div>${main}</div>`;
}
document.addEventListener("input",ev=>{const t=ev.target;if(t&&t.classList&&t.classList.contains("txbody")){const st=document.getElementById("txstat");if(st)st.innerHTML=txStat(t.value);}});
document.addEventListener("change",ev=>{const x=ev.target.closest&&ev.target.closest("[data-txt]");if(!x)return;const[eid,tid,f]=x.dataset.txt.split("|"),e0=get("events",eid);if(!e0)return;const v=x.value;
  upd("events",eid,{texts:evTexts(e0).map(t=>t.id===tid?Object.assign({},t,{[f]:f==="title"?(v.trim()||t.title):v}):t)});});
document.addEventListener("click",async ev=>{
  const sl=ev.target.closest&&ev.target.closest("[data-txsel]");if(sl){const[eid,tid]=sl.dataset.txsel.split("|");S._txsel=S._txsel||{};S._txsel[eid]=tid;render();return;}
  const ad=ev.target.closest&&ev.target.closest("[data-txadd]");if(ad){const e0=get("events",ad.dataset.txadd);if(!e0)return;const nid="t"+Date.now().toString(36);S._txsel=S._txsel||{};S._txsel[e0.id]=nid;await upd("events",e0.id,{texts:[...evTexts(e0),{id:nid,title:"Nový text",desc:"",body:""}]});setTimeout(()=>{const i=document.querySelector(`[data-txt$="|${nid}|title"]`);if(i){i.focus();i.select();}},60);return;}
  const dl=ev.target.closest&&ev.target.closest("[data-txdel]");if(dl){const[eid,tid]=dl.dataset.txdel.split("|"),e0=get("events",eid);if(!e0)return;const t=evTexts(e0).find(x=>x.id===tid);if(!t)return;if(t.body.trim()&&!await ask(`Odstrániť text „${t.title}“?`,"Odstrániť"))return;await upd("events",eid,{texts:evTexts(e0).filter(x=>x.id!==tid)});return;}
  const cp=ev.target.closest&&ev.target.closest("[data-txcopy]");if(cp){const[eid,tid]=cp.dataset.txcopy.split("|"),e0=get("events",eid),t=e0&&evTexts(e0).find(x=>x.id===tid);if(!t)return;try{await navigator.clipboard.writeText(t.body);toast("Text skopírovaný.");}catch(_){toast("Kopírovanie sa nepodarilo.");}return;}
});
/* ===== Fotky: album zo Google Fotiek ===== */
