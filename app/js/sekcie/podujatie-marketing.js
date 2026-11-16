/* ===== Podujatie – záložka Marketing: oblasti vľavo; stredný panel vybranej oblasti má dve časti – zoznam položiek a vedľa neho vybranú položku
   (od 2.0.65 bez vysúvacieho bočného panela; do 2.0.63 bola záložka rozdelená na Plán a Harmonogram).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-marketing.js. Nie je to samostatný skript.
   Uložené v podujatí v poli mktPlan = {areas:[{id,title}],items:[{id,a,t,st,d,date,who,note,url,body,txid,docs}]} (st = stav: pripravit / vpriprave / pripravene / publikovane; d = staré „hotové“, drží sa v zhode s Publikované) (body = krátky text výstupu, txid = starý odkaz na dlhý text (od 2.0.54 sa nepoužíva – stal sa prepojením podkladu), docs = vlastné súbory a odkazy; zadania zo záložky Podklady sa pripájajú z ich strany – pole mk v zadaní). Staré pole mkt (odškrtávací zoznam) ostáva – kým sa plán prvý raz neuloží, skladá sa z neho. ===== */
const MKA_DEF=[["pr","PR a médiá"],["soc","Sociálne siete"],["out","Reklama vonku"],["news","Newsletter"],["video","Video a reels"],["camp","Kampane"]];
const MKA_RX=[["soc",/facebook|instagram|stories|tiktok|sociáln/i],["news",/newsletter/i],["video",/video|reel|foto/i],["out",/výlep|plagát|billboard|citylight|vizuál/i],["pr",/tlačov|rádi|médi|článok|web|kalendár/i]];
/* stav položky (pole st): Pripraviť · V príprave · Pripravené · Publikované. Staré d = hotové sa číta ako Publikované a drží sa s ním v zhode (počíta s ním Kalendár). */
const MK_ST=[["pripravit","Pripraviť",GRAY],["vpriprave","V príprave",ORANGE],["pripravene","Pripravené",BLUE],["publikovane","Publikované",GREEN]];
const mkStat=it=>MK_ST.some(x=>x[0]===it.st)?it.st:(it.d?"publikovane":"pripravit");
const mkStDef=it=>MK_ST.find(x=>x[0]===mkStat(it));
const mkPub=it=>mkStat(it)==="publikovane";
const mkDM=d=>{const p=String(d||"").split("-");return p.length===3?`${+p[2]}. ${+p[1]}.`:"";};   /* dátum len ako deň a mesiac */
const mkDue=it=>it.date?(!mkPub(it)&&daysTo(it.date)<0?`<span class="late">${mkDM(it.date)}</span>`:mkDM(it.date)):"";
function evPlan(e){
  if(e.mktPlan&&Array.isArray(e.mktPlan.items))return{areas:Array.isArray(e.mktPlan.areas)?e.mktPlan.areas:[],items:e.mktPlan.items};
  const areas=MKA_DEF.map(([id,title])=>({id,title}));let other=false;
  const items=evMkt(e).map((x,i)=>{const m=MKA_RX.find(r=>r[1].test(x.t||""));if(!m)other=true;return{id:"m"+i,a:m?m[0]:"ost",t:x.t||"",d:!!x.d,date:"",who:"",note:"",url:""};});
  if(other)areas.push({id:"ost",title:"Ostatné"});
  return{areas,items};
}
const mkEd=e=>!!e&&accEditRec("events",e)&&!S.readOnly;
const mkCol=(P,aid)=>{const i=P.areas.findIndex(a=>a.id===aid);return i<0?GRAY:TAGPAL[i%TAGPAL.length];};
const mkSt=eid=>{S._mk=S._mk||{};const u=S._mk[eid]=S._mk[eid]||{sel:"",item:{}};u.item=u.item||{};return u;};   /* vybraná oblasť a vybraná položka v každej oblasti */
const mkId=()=>"k"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
/* zmena plánu: fn dostane kópiu {areas,items} a upraví ju */
function mkSet(eid,fn){const e0=get("events",eid);if(!e0||!mkEd(e0))return Promise.resolve();const P=evPlan(e0),N={areas:P.areas.map(a=>({...a})),items:P.items.map(i=>({...i}))};fn(N);return upd("events",eid,{mktPlan:N});}
const mkOne=(eid,iid,fn)=>mkSet(eid,N=>{const x=N.items.find(y=>y.id===iid);if(x)fn(x);});
/* riadok zoznamu: dátum (len deň a mesiac, bez dátumu ikona kalendára) · bodka stavu (klik ho zmení) · názov (klik položku vyberie) */
function mkRow(e,it,on){
  const k=`${esc(e.id)}|${esc(it.id)}`,ed=mkEd(e),sd=mkStDef(it);
  const dot=`<label class="gastdot" title="Stav: ${sd[1]}${ed?" – kliknutím zmeníte":""}"><i class="txdot" style="background:${sd[2]}"></i>${ed?`<select data-mkst="${k}" aria-label="Stav">${MK_ST.map(([v,l])=>`<option value="${v}"${v===sd[0]?" selected":""}>${l}</option>`).join("")}</select>`:""}</label>`;
  const date=ed?`<span class="gbndate"><button type="button" class="tplus pkv" data-gbndate title="${it.date?"Dátum: "+esc(fdateS(it.date))+" – kliknutím zmeníte":"Vybrať dátum"}" aria-label="Dátum">${it.date?`<span>${mkDue(it)}</span>`:PK_CAL}</button><input type="date" value="${esc(it.date||"")}" data-mkdate="${k}" tabindex="-1" aria-hidden="true"></span>`:`<span class="dt">${mkDue(it)}</span>`;
  return`<li class="${mkPub(it)?"on":""}${on?" sel":""}">${date}${dot}<button type="button" class="t" data-mkopen="${k}">${esc(it.t||"Bez názvu")}</button>${String(it.body||"").trim()||pkOfMk(e,it.id).some(pkHasText)?`<span class="meta mki" title="Má text"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${TXI.ic[0]}</svg></span>`:""}${clip({docs:mkAllDocs(e,it)})}</li>`;
}
function marketingTab(e){
  const P=evPlan(e),id=esc(e.id),st=mkSt(e.id),ed=mkEd(e);
  const sel=P.areas.find(a=>a.id===st.sel)||P.areas[0];
  const list=P.areas.map(a=>{const L=P.items.filter(x=>x.a===a.id),on=sel&&a.id===sel.id;
    return`<button type="button" class="txi${on?" on":""}" data-mksel="${id}|${esc(a.id)}"><i class="txdot" style="background:${mkCol(P,a.id)};width:10px;height:10px"></i><span class="txt"><b>${esc(a.title)}</b><small>${L.length?`${L.filter(mkPub).length} z ${L.length} publikovaných`:"zatiaľ nič"}</small></span></button>`;}).join("");
  let main=`<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ žiadne oblasti.</div>`;
  if(sel){const L=P.items.filter(x=>x.a===sel.id),k=`${id}|${esc(sel.id)}`,it=L.find(x=>x.id===st.item[sel.id])||L[0];
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Marketing / ${esc(e.name||"Podujatie")}</div><input type="text" class="txtitle" value="${esc(sel.title)}" data-mkarea="${k}" aria-label="Názov oblasti" maxlength="60"${ed?"":" readonly"}></div>
      ${ed?`<div class="row" style="flex:none;gap:8px"><button type="button" class="tplus tdel" data-mkadel="${k}" title="Odstrániť oblasť" aria-label="Odstrániť oblasť">${TI.del}</button></div>`:""}</div>
      <div class="mksplit"><div class="mkleft">${L.length?`<ul class="mkl">${L.map(x=>mkRow(e,x,it&&x.id===it.id)).join("")}</ul>`:`<div class="empty" style="padding:26px">V tejto oblasti zatiaľ nič nie je.</div>`}
        ${ed?`<div class="mkadd"><input type="text" id="mk-add" data-mkadd="${k}" placeholder="+ Pridať položku a Enter" maxlength="120"></div>`:""}</div>
        ${it?mkDetail(e,P,it,ed):`<div class="mkd mkd0">${ed?"Pridajte prvú položku vľavo.":""}</div>`}</div></div>`;}
  return`<div class="txm"><div class="txlist">${list}${ed?`${P.areas.length?`<div class="gdsep"></div>`:""}<button type="button" class="txi txadd" data-mkaadd="${id}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať oblasť</b></span></button>`:""}</div>${main}</div>
    ${String(e.marketing||"").trim()?`<div class="panel" style="margin-top:18px"><h2>Poznámky</h2><p class="meta" style="margin:2px 0 0;white-space:normal">Staršie poznámky. Keď ich vymažete, toto pole zmizne.</p><textarea id="ev-mkt" placeholder="Hashtagy, kontakty na médiá, nápady…" style="width:100%;min-height:110px;margin-top:8px">${esc(e.marketing||"")}</textarea></div>`:""}`;
}
/* vybraná položka – pravá časť stredného panela: hlavička (bodka stavu, názov, termín, človek, kôš), Text, Podklady, Odkaz a oblasť, Poznámka */
function mkDetail(e,P,it,ed){
  const k=`${esc(e.id)}|${esc(it.id)}`,f=n=>`data-mkf="${k}|${n}"`,ro=ed?"":" readonly",dis=ed?"":" disabled",sd=mkStDef(it),due=mkDue(it),wn=it.who?personName(it.who):"";
  const url=String(it.url||"").trim(),href=/^https?:\/\//i.test(url)?url:(url?"https://"+url:"");
  const PK=evPk(e),LK=pkOfMk(e,it.id),docs=Array.isArray(it.docs)?it.docs:[],avail=PK.items.filter(x=>!(x.mk||[]).includes(it.id));
  const dBtn=ed?`<span class="gbndate"><button type="button" class="${due?"pkchip":"tplus"}" data-gbndate title="Dátum${it.date?": "+esc(fdateS(it.date)):""} – kliknutím ${it.date?"zmeníte":"vyberiete"}" aria-label="Dátum">${PK_CAL}${due?`<span>${due}</span>`:""}</button><input type="date" value="${esc(it.date||"")}" data-mkdate="${k}" tabindex="-1" aria-hidden="true"></span>`:(due?`<span class="pkchip ro">${PK_CAL}<span>${due}</span></span>`:"");
  const wBtn=ed?`<button type="button" class="${wn?"pkchip":"tplus"}" data-mkwhobtn="${k}" title="${wn?"Robí: "+esc(wn)+" – kliknutím zmeníte":"Prideliť človeka"}" aria-label="Prideliť človeka">${avatar(it.who||"")||PK_USER}${wn?`<span>${esc(wn)}</span>`:""}</button>
      <div class="pkpop" id="mk-whopop" hidden><div data-mkwho></div>${it.who?`<button type="button" class="btn sm ghost" data-mkwhoclr="${k}">Zrušiť pridelenie</button>`:""}</div>`:(wn?`<span class="pkchip ro">${avatar(it.who)||PK_USER}<span>${esc(wn)}</span></span>`:"");
  const chips=LK.map(x=>{const xs=pkStDef(x),sc=PK.secs.find(y=>y.id===x.s);return`<span class="tg sm" title="${sc?esc(sc.title)+" – ":""}${xs[1]}"><span data-open="pk:${esc(e.id)}~${esc(x.id)}"><i class="txdot" style="background:${xs[2]}"></i>${esc(x.t||"Bez názvu")}</span>${pkHasText(x)?`<button type="button" class="dutyx" data-mkpkcopy="${esc(x.id)}" aria-label="Kopírovať text podkladu" title="Kopírovať text podkladu">${TXI.copy}</button>`:""}${ed?`<button type="button" class="dutyx" data-mkpkrm="${esc(x.id)}" aria-label="Odpojiť" title="Odpojiť">×</button>`:""}</span>`;}).join("");
  const thumbs=LK.flatMap(x=>(x.docs||[]).map((d,i)=>docThumb("events",e,d,i,true))).join("")+sdThumbs(e,docs,ed);
  return`<div class="mkd" id="mk-main" data-mkmain="${k}">
    <div class="mkdh"><div class="pkt"><label class="gastdot" title="Stav: ${sd[1]}${ed?" – kliknutím zmeníte":""}"><i class="txdot" style="background:${sd[2]}"></i>${ed?`<select data-mkst="${k}" aria-label="Stav">${MK_ST.map(([v,l])=>`<option value="${v}"${v===sd[0]?" selected":""}>${l}</option>`).join("")}</select>`:""}</label><input type="text" class="mkdt" id="mk-t" data-keep ${f("t")} value="${esc(it.t||"")}" aria-label="Názov položky" maxlength="120"${ro}></div>
      <div class="row pkact">${dBtn}${wBtn}${ed?`<button type="button" class="tplus tdel" data-mkidel="${k}" title="Odstrániť položku" aria-label="Odstrániť položku">${TI.del}</button>`:""}</div></div>
    <div class="pkb pkout"><div class="pkh">Text<span class="row" style="gap:2px"><button type="button" class="tplus" data-mkcopy title="Kopírovať text" aria-label="Kopírovať text">${TXI.copy}</button></span></div>
      <textarea class="pkta" id="mk-body" rows="3" data-keep ${f("body")} placeholder="Text príspevku alebo výstupu…"${ro}>${esc(it.body||"")}</textarea><div class="txfoot" id="mk-cnt">${txStat(it.body)}</div></div>
    <div class="pkb pkout docslot" id="mk-out"><div class="pkh">Podklady${ed?`<span class="row" style="gap:2px;flex-wrap:nowrap"><label class="tplus" title="Nahrať súbor" aria-label="Nahrať súbor">${GD_I.up}<input type="file" multiple data-sdfile hidden></label><button type="button" class="tplus" data-sdlink title="Pridať odkaz" aria-label="Pridať odkaz">${GD_I.link}</button><label class="tplus pkv" title="Pripojiť podklad zo záložky Podklady alebo zadať nový">+ Pripojiť<select data-mkpkadd aria-label="Pripojiť podklad"><option value="">Pripojiť…</option>${PK.secs.map(a=>{const L=avail.filter(x=>x.s===a.id);return L.length?`<optgroup label="${esc(a.title)}">${L.map(x=>`<option value="${esc(x.id)}">${esc(x.t||"Bez názvu")}</option>`).join("")}</optgroup>`:"";}).join("")}<optgroup label="Zadať nový">${PK.secs.map(a=>`<option value="new:${esc(a.id)}">${esc((PK_ADD[a.id]||PK_ADD._)[1])}</option>`).join("")}</optgroup></select></label></span>`:""}</div>
      ${chips||thumbs?`<div class="mkpk">${chips?`<div class="pkchips">${chips}</div>`:""}${thumbs?`<div class="dr2-t">${thumbs}</div>`:""}</div>`:`<div class="mkpk meta" style="white-space:normal">${ed?"Pripojte podklad (text, grafika, video, dokument) alebo priložte súbor či odkaz.":"Zatiaľ nič."}</div>`}</div>
    <div class="pkb mkprops"><label>Odkaz<span class="row" style="gap:6px;flex:1;flex-wrap:nowrap"><input type="url" id="mk-url" data-keep ${f("url")} value="${esc(url)}" placeholder="https://… (kde to vyšlo)"${ro}>${href?`<a class="tplus" href="${esc(href)}" target="_blank" rel="noopener" title="Otvoriť odkaz" aria-label="Otvoriť odkaz">↗</a>`:""}</span></label>
      <label>Oblasť<select ${f("a")}${dis}>${P.areas.map(a=>`<option value="${esc(a.id)}" ${a.id===it.a?"selected":""}>${esc(a.title)}</option>`).join("")}</select></label></div>
    <div class="pkb pkout"><div class="pkh">Poznámka</div><textarea class="pkta" id="mk-note" rows="2" data-keep ${f("note")} placeholder="Poznámka…"${ro}>${esc(it.note||"")}</textarea></div>
  </div>`;
}
/* ovládanie, ktoré sa pripája po každom vykreslení stránky (volá bindView): výška polí, súbory a pripojené podklady */
function mkBind(v){
  const m=v.querySelector("#mk-main");if(!m)return;const[eid,iid]=m.dataset.mkmain.split("|");
  m.querySelectorAll("textarea.pkta").forEach(t=>pkGrow(t,true));
  const out=m.querySelector("#mk-out");if(out)mkPkBind(out,{eid,iid});
}
/* otvorenie položky odinakiaľ (Kalendár, prepojenie v podklade): prejde na záložku Marketing a vyberie ju */
function mkOpen(eid,iid){const e0=get("events",eid),it=e0&&evPlan(e0).items.find(x=>x.id===iid);if(!it)return;closeDrawer();const st=mkSt(eid);st.sel=it.a;st.item[it.a]=iid;S.evtab="marketing";
  if(S.view==="podujatie"&&S.id===eid)render();else go("podujatie",eid);
  setTimeout(()=>{const m=document.getElementById("mk-main");if(m&&m.scrollIntoView)m.scrollIntoView({block:"nearest"});},60);}
document.addEventListener("change",ev=>{const t=ev.target;if(!t||!t.dataset)return;
  if(t.dataset.mkst){const[eid,iid]=t.dataset.mkst.split("|"),v=t.value;mkOne(eid,iid,x=>{x.st=v;x.d=v==="publikovane";});return;}
  if(t.dataset.mkdate){const[eid,iid]=t.dataset.mkdate.split("|");mkOne(eid,iid,x=>{x.date=t.value;});return;}
  if(t.dataset.mkf){const[eid,iid,f]=t.dataset.mkf.split("|"),v=String(t.value).trim();if(f==="t"&&!v){render();return;}
    if(f==="a"){const st=mkSt(eid);st.sel=v;st.item[v]=iid;}   /* položka presunutá do inej oblasti ostane vybraná */
    mkOne(eid,iid,x=>{x[f]=v;});return;}
  if(t.dataset.mkarea){const[eid,aid]=t.dataset.mkarea.split("|"),v=t.value.trim();if(!v){render();return;}mkSet(eid,N=>{const a=N.areas.find(y=>y.id===aid);if(a)a.title=v;});}});
document.addEventListener("keydown",ev=>{const t=ev.target;if(!t||ev.key!=="Enter")return;
  if(t.id==="mk-t"||t.id==="mk-url"){t.blur();return;}
  if(!t.dataset||!t.dataset.mkadd)return;const v=t.value.trim();if(!v)return;
  const[eid,aid]=t.dataset.mkadd.split("|"),nid=mkId();t.value="";mkSt(eid).item[aid]=nid;mkSet(eid,N=>{N.items.push({id:nid,a:aid,t:v,d:false,date:"",who:"",note:"",url:""});});});
document.addEventListener("input",ev=>{const t=ev.target;if(t&&t.id==="mk-body"){const c=document.getElementById("mk-cnt");if(c)c.innerHTML=txStat(t.value);}});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  {const pop=document.getElementById("mk-whopop");if(pop&&!pop.hidden&&!q("#mk-whopop")&&!q("[data-mkwhobtn]"))pop.hidden=true;}   /* klik mimo zavrie výber človeka */
  if((x=q("[data-mkwhobtn]"))){const pop=document.getElementById("mk-whopop");if(!pop)return;if(!pop.hidden){pop.hidden=true;return;}
    const[eid,iid]=x.dataset.mkwhobtn.split("|"),box=pop.querySelector("[data-mkwho]");pop.hidden=false;picker(box,"",val=>{if(val)mkOne(eid,iid,y=>{y.who=val;});});const i=box.querySelector("input");if(i)i.focus();return;}
  if((x=q("[data-mkwhoclr]"))){const[eid,iid]=x.dataset.mkwhoclr.split("|");mkOne(eid,iid,y=>{y.who="";});return;}
  if((x=q("[data-mkcopy]"))){const b=document.getElementById("mk-body");if(b)pkCopy(b.value);return;}
  if((x=q("[data-mkidel]"))){const[eid,iid]=x.dataset.mkidel.split("|"),e0=get("events",eid),it=e0&&evPlan(e0).items.find(y=>y.id===iid);if(!it)return;
    if(!await ask(`Odstrániť položku „${it.t||"Bez názvu"}“?`,"Odstrániť"))return;mkSet(eid,N=>{N.items=N.items.filter(y=>y.id!==iid);});return;}
  if((x=q("[data-mksel]"))){const[eid,aid]=x.dataset.mksel.split("|");mkSt(eid).sel=aid;render();return;}
  if((x=q("[data-mkopen]"))){const[eid,iid]=x.dataset.mkopen.split("|");mkOpen(eid,iid);return;}
  if((x=q("[data-mkaadd]"))){const eid=x.dataset.mkaadd,nid=mkId();mkSt(eid).sel=nid;await mkSet(eid,N=>{N.areas.push({id:nid,title:"Nová oblasť"});});setTimeout(()=>{const i=document.querySelector(`[data-mkarea$="|${nid}"]`);if(i){i.focus();i.select();}},60);return;}
  if((x=q("[data-mkadel]"))){const[eid,aid]=x.dataset.mkadel.split("|"),e0=get("events",eid);if(!e0)return;const P=evPlan(e0),a=P.areas.find(y=>y.id===aid),n=P.items.filter(y=>y.a===aid).length;if(!a)return;
    if(n&&!await ask(`Odstrániť oblasť „${a.title}“ aj s ${n} ${n===1?"položkou":"položkami"}?`,"Odstrániť"))return;
    mkSt(eid).sel="";mkSet(eid,N=>{N.areas=N.areas.filter(y=>y.id!==aid);N.items=N.items.filter(y=>y.a!==aid);});return;}
});
