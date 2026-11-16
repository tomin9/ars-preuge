/* ===== Podujatie – záložka Marketing: Plán (oblasti vľavo, položky vpravo) a Harmonogram (všetko podľa dátumu).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-marketing.js. Nie je to samostatný skript.
   Uložené v podujatí v poli mktPlan = {areas:[{id,title}],items:[{id,a,t,d,date,who,note,url,body,txid,docs}]} (body = krátky text výstupu, txid = prepojený dlhý text zo záložky Texty, docs = podklady ako pri dokumentoch). Staré pole mkt (odškrtávací zoznam) ostáva – kým sa plán prvý raz neuloží, skladá sa z neho. ===== */
const MKA_DEF=[["pr","PR a médiá"],["soc","Sociálne siete"],["out","Reklama vonku"],["news","Newsletter"],["video","Video a reels"],["camp","Kampane"]];
const MKA_RX=[["soc",/facebook|instagram|stories|tiktok|sociáln/i],["news",/newsletter/i],["video",/video|reel|foto/i],["out",/výlep|plagát|billboard|citylight|vizuál/i],["pr",/tlačov|rádi|médi|článok|web|kalendár/i]];
function evPlan(e){
  if(e.mktPlan&&Array.isArray(e.mktPlan.items))return{areas:Array.isArray(e.mktPlan.areas)?e.mktPlan.areas:[],items:e.mktPlan.items};
  const areas=MKA_DEF.map(([id,title])=>({id,title}));let other=false;
  const items=evMkt(e).map((x,i)=>{const m=MKA_RX.find(r=>r[1].test(x.t||""));if(!m)other=true;return{id:"m"+i,a:m?m[0]:"ost",t:x.t||"",d:!!x.d,date:"",who:"",note:"",url:""};});
  if(other)areas.push({id:"ost",title:"Ostatné"});
  return{areas,items};
}
const mkEd=e=>!!e&&accEditRec("events",e)&&!S.readOnly;
const mkCol=(P,aid)=>{const i=P.areas.findIndex(a=>a.id===aid);return i<0?GRAY:TAGPAL[i%TAGPAL.length];};
const mkSt=eid=>{S._mk=S._mk||{};return S._mk[eid]=S._mk[eid]||{tab:"plan",sel:""};};
const mkId=()=>"k"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
/* zmena plánu: fn dostane kópiu {areas,items} a upraví ju */
function mkSet(eid,fn){const e0=get("events",eid);if(!e0||!mkEd(e0))return Promise.resolve();const P=evPlan(e0),N={areas:P.areas.map(a=>({...a})),items:P.items.map(i=>({...i}))};fn(N);return upd("events",eid,{mktPlan:N});}
const mkSort=(a,b)=>(a.date||"9999").localeCompare(b.date||"9999");
function mkRow(e,P,it,harm){
  const k=`${esc(e.id)}|${esc(it.id)}`,ed=mkEd(e),a=P.areas.find(x=>x.id===it.a);
  return`<li class="${it.d?"on":""}">${harm?`<span class="dt">${it.date?dueHtml(it.date,it.d):""}</span>`:""}<button class="check ${it.d?"on":""}" data-mkdone="${k}" aria-label="Hotové"></button><button type="button" class="t" data-mkopen="${k}">${esc(it.t||"Bez názvu")}</button>${String(it.body||"").trim()||it.txid?`<span class="meta mki" title="Má text"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${TXI.ic[0]}</svg></span>`:""}${clip(it)}${harm&&a?`<span class="tg sm" style="--tc:${mkCol(P,it.a)}">${esc(a.title)}</span>`:""}${it.who?`<span class="meta who">${who(it.who)}</span>`:""}${harm?"":`<input type="date" value="${esc(it.date||"")}" data-mkdate="${k}" aria-label="Dátum"${ed?"":" disabled"}>`}</li>`;
}
function marketingTab(e){
  const P=evPlan(e),id=esc(e.id),st=mkSt(e.id),ed=mkEd(e);
  const sub=`<div class="ptabs evbtabs" role="tablist" style="margin-bottom:14px">${[["plan","Plán"],["harm","Harmonogram"]].map(([k,l])=>`<button role="tab" data-mktab="${id}|${k}" aria-selected="${st.tab===k}">${l}</button>`).join("")}<span class="meta" style="margin-left:auto">${P.items.filter(x=>x.d).length} / ${P.items.length} hotových</span></div>`;
  if(st.tab==="harm"){
    const D=P.items.filter(x=>x.date).sort(mkSort),N=P.items.filter(x=>!x.date),G=[];
    D.forEach(it=>{const m=it.date.slice(0,7);if(!G.length||G[G.length-1][0]!==m)G.push([m,[]]);G[G.length-1][1].push(it);});
    const mon=m=>{const[y,mm]=m.split("-");const s=new Date(+y,+mm-1,1).toLocaleDateString("sk-SK",{month:"long",year:"numeric"});return s.charAt(0).toUpperCase()+s.slice(1);};
    const body=!P.items.length?`<div class="empty">Plán je zatiaľ prázdny. Položky pridáte v záložke Plán.</div>`
      :G.map(([m,L])=>`<h3 class="mkmon">${esc(mon(m))}</h3><ul class="mkl harm">${L.map(it=>mkRow(e,P,it,true)).join("")}</ul>`).join("")
       +(N.length?`<h3 class="mkmon">Bez termínu</h3><ul class="mkl harm">${N.map(it=>mkRow(e,P,it,true)).join("")}</ul>`:"");
    return sub+`<div class="panel mkharm">${body}</div>`;
  }
  const sel=P.areas.find(a=>a.id===st.sel)||P.areas[0];
  const list=P.areas.map(a=>{const L=P.items.filter(x=>x.a===a.id),on=sel&&a.id===sel.id;
    return`<button type="button" class="txi${on?" on":""}" data-mksel="${id}|${esc(a.id)}"><i class="txdot" style="background:${mkCol(P,a.id)};width:10px;height:10px"></i><span class="txt"><b>${esc(a.title)}</b><small>${L.length?`${L.filter(x=>x.d).length} z ${L.length} hotových`:"zatiaľ nič"}</small></span></button>`;}).join("");
  let main=`<div class="panel txmain" style="display:flex;align-items:center;justify-content:center;color:var(--muted);min-height:200px">Zatiaľ žiadne oblasti.</div>`;
  if(sel){const L=P.items.filter(x=>x.a===sel.id),k=`${id}|${esc(sel.id)}`;
    main=`<div class="panel txmain"><div class="txhead"><div style="min-width:0;flex:1"><div class="kick">Marketing / ${esc(e.name||"Podujatie")}</div><input type="text" class="txtitle" value="${esc(sel.title)}" data-mkarea="${k}" aria-label="Názov oblasti" maxlength="60"${ed?"":" readonly"}></div>
      ${ed?`<div class="row" style="flex:none;gap:8px"><button type="button" class="tplus tdel" data-mkadel="${k}" title="Odstrániť oblasť" aria-label="Odstrániť oblasť">${TI.del}</button></div>`:""}</div>
      ${L.length?`<ul class="mkl">${L.map(it=>mkRow(e,P,it,false)).join("")}</ul>`:`<div class="empty" style="padding:26px">V tejto oblasti zatiaľ nič nie je.</div>`}
      ${ed?`<div class="mkadd"><input type="text" id="mk-add" data-mkadd="${k}" placeholder="+ Pridať položku a Enter" maxlength="120"></div>`:""}</div>`;}
  return sub+`<div class="txm"><div class="txlist">${list}${ed?`<button type="button" class="txi txadd" data-mkaadd="${id}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg><span class="txt"><b>Pridať oblasť</b></span></button>`:""}</div>${main}</div>
    <div class="panel" style="margin-top:18px"><h2>Poznámky</h2><textarea id="ev-mkt" placeholder="Hashtagy, kontakty na médiá, nápady…" style="width:100%;min-height:110px;margin-top:8px">${esc(e.marketing||"")}</textarea></div>`;
}
/* bočný panel položky */
function mkOpen(eid,iid){const e0=get("events",eid);if(!e0||!evPlan(e0).items.some(x=>x.id===iid))return;closeDrawer();S.mkD={eid,iid};mkDrawer(true);}
function mkDrawer(force){
  const host=$("#drawer"),D=S.mkD;if(!D)return;const e0=get("events",D.eid),P=e0&&evPlan(e0),it=P&&P.items.find(x=>x.id===D.iid);
  if(!it){closeDrawer();return;}
  const ae=document.activeElement;if(!force&&ae&&host.contains(ae)&&ae.matches("input,select,textarea"))return;
  const ed=mkEd(e0),ro=ed?"":" disabled",fld=(l,inp)=>`<label>${l}</label><div class="pv">${inp}</div>`;
  const X='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const T=evTexts(e0),tx=T.find(t=>t.id===it.txid),docs=Array.isArray(it.docs)?it.docs:[];
  const url=String(it.url||"").trim(),href=/^https?:\/\//i.test(url)?url:(url?"https://"+url:"");
  const body=`<div id="dw-head"><input class="ttl" data-mkf="t" value="${esc(it.t||"")}" placeholder="Názov" aria-label="Názov"${ed?"":" readonly"}></div>
    <section class="dcard"><h3>${DI.list}Údaje</h3><div class="props cprops" style="margin:0">
      ${fld("Hotové",`<button class="check ${it.d?"on":""}" data-mkdone="${esc(D.eid)}|${esc(it.id)}" aria-label="Hotové"></button>`)}
      ${fld("Oblasť",`<select data-mkf="a"${ro}>${P.areas.map(a=>`<option value="${esc(a.id)}" ${a.id===it.a?"selected":""}>${esc(a.title)}</option>`).join("")}</select>`)}
      ${fld("Dátum",`<input type="date" data-mkf="date" value="${esc(it.date||"")}"${ro}>`)}
      ${fld("Kto",ed?`<div data-mkwho></div>`:(it.who?who(it.who):"—"))}
      ${fld("Odkaz",`<input type="url" data-mkf="url" value="${esc(url)}" placeholder="https://…"${ed?"":" readonly"}>${href?`<a class="meta" href="${esc(href)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px">Otvoriť odkaz ↗</a>`:""}`)}
    </div></section>
    <section class="dcard"><h3 style="justify-content:space-between"><span class="lkh">${DI.note}Text</span><button type="button" class="tplus" data-mkcopy title="Kopírovať text" aria-label="Kopírovať text">${TXI.copy}</button></h3>
      <textarea data-mkf="body" placeholder="Krátky text výstupu – príspevok, text na plagát, popis k videu…" style="display:block;width:100%;box-sizing:border-box;min-height:150px"${ed?"":" readonly"}>${esc(it.body||"")}</textarea>
      <div class="meta" id="mk-cnt" style="margin-top:6px">${String(it.body||"").length} znakov</div>
      <div class="props cprops" style="margin:10px 0 0">${fld("Dlhý text",`<select data-mkf="txid"${ro}><option value="">— žiadny —</option>${T.map(t=>`<option value="${esc(t.id)}" ${t.id===it.txid?"selected":""}>${esc(t.title)}</option>`).join("")}</select>${tx?`<button type="button" class="meta" data-mktx="${esc(D.eid)}|${esc(tx.id)}" style="all:unset;cursor:pointer;display:block;margin-top:4px;font-size:13px;color:var(--muted);text-decoration:underline">Otvoriť „${esc(tx.title)}“ v Textoch →</button>`:""}`)}</div></section>
    <section class="dcard lkc docslot"><h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="lkh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/></svg>Podklady</span>${ed?`<span class="row" style="gap:6px"><label class="btn sm" style="cursor:pointer">Nahrať súbor<input type="file" multiple data-mkfile hidden></label><button type="button" class="btn sm ghost" data-mklink>+ Odkaz</button></span>`:""}</h3>
      ${docs.length?`<div class="dr2-t">${docs.map((d,i)=>docThumb("events",e0,d,i,true).replace(/<\/div>$/,ed?`<button type="button" class="x" data-mkdocrm="${i}" aria-label="Odstrániť" title="Odstrániť">×</button></div>`:"</div>")).join("")}</div>`:`<div class="meta" style="margin-top:4px;white-space:normal">Grafika, fotka, video… Veľké videá vložte radšej odkazom (napr. z Disku).</div>`}</section>
    <section class="dcard note"><textarea data-mkf="note" placeholder="Poznámka…" style="min-height:70px"${ed?"":" readonly"}>${esc(it.note||"")}</textarea></section>`;
  const box=host.querySelector("aside[data-mkbox] .dbody");
  host.hidden=false;
  if(box)box.innerHTML=body;
  else host.innerHTML=`<div class="dscrim" data-dclose></div><aside class="drawer dw-narrow" data-mkbox role="dialog" aria-modal="true" aria-label="Položka marketingu">
    <div class="dtop dtop-ic">${ed?`<button class="icb danger" data-mkidel title="Zmazať" aria-label="Zmazať">${TI.del}</button>`:""}<button class="icb" data-dclose title="Zavrieť" aria-label="Zavrieť">${X}</button></div><div class="dbody">${body}</div></aside>`;
  host.querySelectorAll("[data-dclose]").forEach(b=>b.onclick=closeDrawer);
  const dl=host.querySelector("[data-mkidel]");if(dl)dl.onclick=async()=>{if(!await ask(`Zmazať položku „${it.t||"Bez názvu"}“?`,"Zmazať"))return;const d=S.mkD;closeDrawer();if(d)mkSet(d.eid,N=>{N.items=N.items.filter(x=>x.id!==d.iid);});};
  host.querySelectorAll("[data-mkf]").forEach(inp=>{const f=inp.dataset.mkf;
    inp.onchange=()=>{let v=String(inp.value).trim();if(f==="t"&&!v){inp.value=it.t||"";return;}
      mkSet(D.eid,N=>{const x=N.items.find(y=>y.id===D.iid);if(x)x[f]=v;}).then(()=>mkDrawer(true));};
    if(inp.tagName==="INPUT")inp.onkeydown=ev=>{if(ev.key==="Enter")inp.blur();};});
  const item=N=>N.items.find(y=>y.id===D.iid);
  const bd=host.querySelector('[data-mkf="body"]'),cn=host.querySelector("#mk-cnt");if(bd&&cn)bd.oninput=()=>{cn.textContent=bd.value.length+" znakov";};
  const cp=host.querySelector("[data-mkcopy]");if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(bd.value);toast("Text skopírovaný.");}catch(_){toast("Kopírovanie sa nepodarilo.");}};
  const tb=host.querySelector("[data-mktx]");if(tb)tb.onclick=()=>{const[eid,tid]=tb.dataset.mktx.split("|");closeDrawer();S._txsel=S._txsel||{};S._txsel[eid]=tid;S.evtab="texty";if(S.view==="podujatie"&&S.id===eid)render();else go("podujatie",eid);};
  const fi=host.querySelector("[data-mkfile]");if(fi)fi.onchange=async()=>{const fs=[...(fi.files||[])],out=[];for(const f of fs){const d=await uploadDoc(f,{en:"events",id:D.eid,kind:""});if(d)out.push(Object.assign(d,{at:Date.now()}));}fi.value="";
    if(out.length){await mkSet(D.eid,N=>{const x=item(N);if(x)x.docs=[...(Array.isArray(x.docs)?x.docs:[]),...out];});mkDrawer(true);}};
  const lk=host.querySelector("[data-mklink]");if(lk)lk.onclick=()=>{const box=lk.closest(".docslot");if(box.querySelector(".dform"))return;
    const f=document.createElement("div");f.className="dform";f.style.marginTop="8px";f.innerHTML=`<input type="text" placeholder="Názov" style="width:100%;margin-bottom:6px"><div class="row" style="gap:6px"><input type="url" placeholder="https://…" style="flex:1"><button type="button" class="btn sm pri">Uložiť</button></div>`;box.appendChild(f);
    const[n,u]=f.querySelectorAll("input");n.focus();f.querySelector("button").onclick=async()=>{const v=u.value.trim();if(!v){toast("Vložte odkaz.");return;}await mkSet(D.eid,N=>{const x=item(N);if(x)x.docs=[...(Array.isArray(x.docs)?x.docs:[]),{name:n.value.trim()||v,url:v,at:Date.now()}];});mkDrawer(true);};};
  host.querySelectorAll("[data-mkdocrm]").forEach(b=>b.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(!await ask("Odstrániť podklad?","Odstrániť"))return;await mkSet(D.eid,N=>{const x=item(N);if(x)x.docs=(x.docs||[]).filter((_,j)=>j!==+b.dataset.mkdocrm);});mkDrawer(true);});
  renderPdfThumbs(host);
  const wb=host.querySelector("[data-mkwho]");if(wb)picker(wb,it.who||"",v=>mkSet(D.eid,N=>{const x=N.items.find(y=>y.id===D.iid);if(x)x.who=v||"";}));
}
document.addEventListener("change",ev=>{const t=ev.target;if(!t||!t.dataset)return;
  if(t.dataset.mkdate){const[eid,iid]=t.dataset.mkdate.split("|");mkSet(eid,N=>{const x=N.items.find(y=>y.id===iid);if(x)x.date=t.value;});return;}
  if(t.dataset.mkarea){const[eid,aid]=t.dataset.mkarea.split("|"),v=t.value.trim();if(!v){render();return;}mkSet(eid,N=>{const a=N.areas.find(y=>y.id===aid);if(a)a.title=v;});}});
document.addEventListener("keydown",ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.mkadd||ev.key!=="Enter")return;const v=t.value.trim();if(!v)return;
  const[eid,aid]=t.dataset.mkadd.split("|");t.value="";mkSet(eid,N=>{N.items.push({id:mkId(),a:aid,t:v,d:false,date:"",who:"",note:"",url:""});});});
document.addEventListener("click",async ev=>{const q=s=>ev.target.closest&&ev.target.closest(s);let x;
  if((x=q("[data-mktab]"))){const[eid,k]=x.dataset.mktab.split("|");mkSt(eid).tab=k;render();return;}
  if((x=q("[data-mksel]"))){const[eid,aid]=x.dataset.mksel.split("|");mkSt(eid).sel=aid;render();return;}
  if((x=q("[data-mkdone]"))){ev.stopPropagation();const[eid,iid]=x.dataset.mkdone.split("|");await mkSet(eid,N=>{const i=N.items.find(y=>y.id===iid);if(i)i.d=!i.d;});if(S.mkD)mkDrawer(true);return;}
  if((x=q("[data-mkopen]"))){const[eid,iid]=x.dataset.mkopen.split("|");mkOpen(eid,iid);return;}
  if((x=q("[data-mkaadd]"))){const eid=x.dataset.mkaadd,nid=mkId();mkSt(eid).sel=nid;await mkSet(eid,N=>{N.areas.push({id:nid,title:"Nová oblasť"});});setTimeout(()=>{const i=document.querySelector(`[data-mkarea$="|${nid}"]`);if(i){i.focus();i.select();}},60);return;}
  if((x=q("[data-mkadel]"))){const[eid,aid]=x.dataset.mkadel.split("|"),e0=get("events",eid);if(!e0)return;const P=evPlan(e0),a=P.areas.find(y=>y.id===aid),n=P.items.filter(y=>y.a===aid).length;if(!a)return;
    if(n&&!await ask(`Odstrániť oblasť „${a.title}“ aj s ${n} ${n===1?"položkou":"položkami"}?`,"Odstrániť"))return;
    mkSt(eid).sel="";mkSet(eid,N=>{N.areas=N.areas.filter(y=>y.id!==aid);N.items=N.items.filter(y=>y.a!==aid);});return;}
});
