/* ===== Podujatie – rozpočet (graf, časti programu, granty a ich položky) a dramaturgia (umelecké diela, sprievodný program).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/podujatie-rozpocet-a-program.js. Nie je to samostatný skript. ===== */
function grantLinesPanel(g,lines,rows){
  if(!g)return"";const exp=rows.filter(x=>x.type!=="prijem");
  const isPaid=x=>x.paid!==false&&!!x.date;
  const calc=L=>({paid:sum(L.filter(isPaid),x=>x.amount),plan:sum(L.filter(x=>!isPaid(x)),x=>x.amount)});
  const allG=S.d.ledger.filter(x=>x.grantId===g.id&&x.type!=="prijem");
  const R=lines.map(l=>{const L=allG.filter(x=>x.lineId===l.id);const c=calc(L);const fg=+l.fromGrant||0,tot=Math.max(+l.total||0,fg);const cf=tot-fg;const bud=tot||fg;return{l,fg,cf,bud,...c,rest:bud-c.paid-c.plan,n:L.length};});
  const un=allG.filter(x=>!x.lineId||!lines.some(l=>l.id===x.lineId));const cu=calc(un);
  const tb=sum(R,r=>r.bud),tfg=sum(R,r=>r.fg),tcf=sum(R,r=>r.cf),cfReq=+g.cofinReq||0,tp=sum(R,r=>r.paid)+cu.paid,tl=sum(R,r=>r.plan)+cu.plan;const appr=+g.approved||0;
  const st=r=>!r.bud?`<span class="meta">bez rozpočtu</span>`:r.paid>r.bud+0.005?`<span class="lst bad">prekročené</span>`:r.paid+r.plan>r.bud+0.005?`<span class="lst warn">s plánom prekročí</span>`:`<span class="lst ok">v poriadku</span>`;
  const barH=r=>{if(!r.bud)return"";const pp=Math.min(100,r.paid/r.bud*100),pl=Math.max(0,Math.min(100-pp,r.plan/r.bud*100));const over=r.paid+r.plan>r.bud+0.005;
    return`<div class="lbar${over?" over":""}"><i style="width:${pp}%"></i><i class="pl" style="left:${pp}%;width:${pl}%"></i></div>`;};
  return`<div class="glines">
  ${R.length||un.length?`<div class="tw"><table class="lt"><thead><tr><th>Rozpočtová položka <button class="addic" data-create="lines" data-defs='${esc(JSON.stringify({grantId:g.id}))}' title="Pridať rozpočtovú položku" aria-label="Pridať rozpočtovú položku">+</button></th><th class="num">Rozpočet</th><th class="num">Spolufin.</th><th class="num">Plánované</th><th class="num">Zaplatené</th><th class="num">Zostáva</th><th style="width:22%"></th><th></th></tr></thead><tbody>
    ${R.map(r=>`<tr data-open="lines:${esc(r.l.id)}"><td class="t"><span class="cut">${esc(r.l.name||"Položka")}</span><span class="meta">${r.n?r.n+" plat.":""}</span></td><td class="num">${r.fg?eur(r.fg):"—"}</td><td class="num">${r.cf?eur(r.cf):"—"}</td><td class="num">${r.paid+r.plan?eur(r.paid+r.plan):"—"}</td><td class="num neg">${eur(r.paid)}</td><td class="num ${r.rest<0?"neg":""}">${r.bud?eur(r.rest):"—"}</td><td>${barH(r)}</td><td>${st(r)}</td></tr>`).join("")}
    ${un.length?`<tr class="unl" data-unl style="cursor:pointer" title="Zobraziť nezaradené platby"><td class="t"><span class="cut">${S.evb&&S.evb.unl?"▾":"▸"} Nezaradené k položke</span><span class="meta">${un.length} plat.</span></td><td class="num">—</td><td class="num">—</td><td class="num">${cu.paid+cu.plan?eur(cu.paid+cu.plan):"—"}</td><td class="num neg">${eur(cu.paid)}</td><td></td><td></td><td></td></tr>${S.evb&&S.evb.unl?un.map(x=>`<tr class="unl sub" data-open="ledger:${esc(x.id)}"><td class="t" style="padding-left:28px"><span class="cut">${esc(x.desc||"—")}</span><span class="meta">${x.date?fdateS(x.date):"plánované"}${x.eventId?"":" · bez podujatia"}</span></td><td></td><td></td><td class="num">${eur(x.amount)}</td><td></td><td></td><td colspan="2"></td></tr>`).join(""):""}`:""}
    </tbody><tfoot><tr><td>Spolu</td><td class="num">${eur(tfg)}</td><td class="num ${cfReq&&tcf<cfReq-0.005?"warn":""}" title="${cfReq?"Povinné spolufinancovanie "+eur(cfReq):""}">${eur(tcf)}</td><td class="num">${eur(tp+tl)}</td><td class="num neg">${eur(tp)}</td><td class="num ${tb-tp-tl<0?"neg":""}">${eur(tb-tp-tl)}</td><td></td><td></td></tr></tfoot></table></div>`
  :`<div class="empty" style="padding:4px 0">Grant zatiaľ nemá rozpočtové položky. <button class="addic" data-create="lines" data-defs='${esc(JSON.stringify({grantId:g.id}))}' title="Pridať rozpočtovú položku" aria-label="Pridať rozpočtovú položku">+</button></div>`}</div>`;
}
function evSections(e,rows){if(!e)return[];const a=[...(e.sections||[])];const cnt={};(rows||[]).forEach(x=>{if(x.category)cnt[x.category]=(cnt[x.category]||0)+1;});
  Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]||x.localeCompare(y,"sk")).forEach(c=>{if(!a.includes(c))a.push(c);});return a;}

function evbEdit(btn,ev,key){
  const inp=document.createElement("input");inp.type="text";inp.value=btn.textContent.trim();inp.className="evb-ren";inp.style.width=Math.max(90,btn.offsetWidth+10)+"px";
  const wrap=document.createElement("span");wrap.className="evb-renw";wrap.appendChild(inp);
  if(S.evb.mode==="sekcie"){const x=document.createElement("button");x.type="button";x.className="evb-del";x.title="Odstrániť záložku";x.setAttribute("aria-label","Odstrániť záložku");x.textContent="×";
    x.addEventListener("mousedown",e=>{e.preventDefault();done=true;evbDelete(ev,key);});wrap.appendChild(x);}
  btn.replaceWith(wrap);inp.focus();inp.select();let done=false;
  const finish=async save=>{if(done)return;done=true;const nv=inp.value.trim();if(!save||!nv||nv===(S.evb.mode==="sekcie"?key:btn.textContent.trim())){render();return;}await evbRename(ev,key,nv);};
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();finish(true);}else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();finish(false);}});
  inp.addEventListener("blur",()=>finish(true));
}
async function evbDelete(ev,key){
  const R=related("events",ev,"ledger").filter(x=>x.category===key);
  if(R.length&&!(await ask(`Záložka „${key}“ má ${R.length} ${R.length===1?"položku":R.length<5?"položky":"položiek"}. Odstrániť ju? Položky zostanú v denníku, len bez kategórie (Nezaradené).`,"Odstrániť")))return render();
  await upd("events",ev.id,{sections:(ev.sections||[]).filter(x=>x!==key)});
  for(const x of R)await upd("ledger",x.id,{category:""});
  if(!S.d.ledger.some(x=>x.category===key)&&!S.d.events.some(e=>(e.sections||[]).includes(key))&&baseCats().includes(key))await saveSettings({cats:baseCats().filter(x=>x!==key)});
  S.evb.sec="";toast("Záložka odstránená.");render();
}
async function evbRename(ev,key,nv){
  const rows=related("events",ev,"ledger");
  if(S.evb.mode==="sekcie"){
    const R=rows.filter(x=>x.category===key);toast(R.length?`Premenúvam ${R.length} položiek…`:"Premenúvam…");
    const cur=evSections(ev,rows);const secs=cur.map(x=>x===key?nv:x).filter((x,i,a)=>a.indexOf(x)===i);
    await upd("events",ev.id,{sections:secs});
    for(const x of R)await upd("ledger",x.id,{category:nv});
    const stillOld=S.d.ledger.some(x=>x.category===key);let c=[...baseCats()];
    if(!c.includes(nv)){const i=c.indexOf(key);if(i>=0&&!stillOld)c[i]=nv;else c.push(nv);await saveSettings({cats:c});}
    else if(!stillOld&&c.includes(key))await saveSettings({cats:c.filter(x=>x!==key)});
    S.evb.sec=nv;toast("Premenované.");
  }else{
    await upd("events",ev.id,{tabLabels:Object.assign({},ev.tabLabels||{},{[key]:nv})});
    S.evb.gr=key;toast("Premenované.");
  }
  render();
}
function eventBudget(e){
  S.evb=S.evb||{mode:"sekcie",sec:"",gr:""};const B=S.evb;
  const all=related("events",e,"ledger");const isInc=x=>x.type==="prijem";
  const tExp=sum(all.filter(x=>!isInc(x)),x=>x.amount),tInc=sum(all.filter(isInc),x=>x.amount),unpaid=sum(all.filter(x=>!isInc(x)&&!(x.paid!==false&&!!x.date)),x=>x.amount),tPaid=tExp-unpaid,incPlan=sum(all.filter(x=>isInc(x)&&!(x.paid!==false&&!!x.date)),x=>x.amount),incGot=tInc-incPlan;
  const secs=evSections(e,all.filter(x=>!isInc(x)));
  const evG=[...new Set([...(e.grantIds||[]),...all.map(x=>x.grantId)].filter(Boolean))].map(id=>get("grants",id)).filter(Boolean);
  const lbl=g=>{const t=(e.tabLabels||{})[g.id];if(t)return t;const pn=provName(g);if(!pn)return g.name||"Grant";return evG.filter(h=>provName(h)===pn).length>1?pn+" · "+(g.name||"Grant"):pn;};
  const po=e.provOrder||[];const pi=g=>{let i=po.indexOf(g.id);if(i<0)i=po.indexOf(lbl(g));return i<0?1e9:i;};
  const gTabs=evG.sort((a,b)=>pi(a)-pi(b)||lbl(a).localeCompare(lbl(b),"sk")).map(g=>[g.id,lbl(g)]);
  if(gTabs.length&&all.some(x=>!x.grantId))gTabs.push(["__none","Bez grantu"]);
  const T=B.mode==="sekcie"?secs.map(x=>[x,x]).concat(secs.length&&all.some(x=>!x.category&&!isInc(x))?[["__none","Nezaradené"]]:[]):gTabs;
  let cur=B.mode==="sekcie"?B.sec:B.gr;if(!T.some(t=>t[0]===cur))cur=T.length?T[0][0]:"";
  const rows=all.filter(x=>B.mode!=="sekcie"||!isInc(x)).filter(x=>!cur||(B.mode==="sekcie"?(cur==="__none"?!x.category:x.category===cur):(cur==="__none"?!x.grantId:x.grantId===cur)))
    .sort((a,b)=>{if(!!a.date!==!!b.date)return a.date?-1:1;if(a.date&&b.date&&a.date!==b.date)return a.date.localeCompare(b.date);const oa=typeof a.ord==="number"?a.ord:Infinity,ob=typeof b.ord==="number"?b.ord:Infinity;if(oa!==ob)return oa-ob;return isInc(b)-isInc(a)||(a.createdAt||0)-(b.createdAt||0);});
  const exp=sum(rows.filter(x=>!isInc(x)),x=>x.amount),inc=sum(rows.filter(isInc),x=>x.amount);
  const defs={eventId:e.id,type:"vydavok"};const pid=e.projectId;if(pid)defs.projectId=pid;
  if(cur&&cur!=="__none"){if(B.mode==="sekcie")defs.category=cur;else defs.grantId=cur;}
  const sub=`<div class="ptabs evbtabs" role="tablist" style="margin-bottom:10px">${T.map(([k,l])=>`<button role="tab" data-evb="${esc(k)}" aria-selected="${cur===k}"${k!=="__none"?` data-evbdrag="${esc(k)}" title="Kliknutím otvoríte, potiahnutím presuniete, dvojklikom premenujete"`:""}>${esc(l)}</button>`).join("")}${B.mode==="sekcie"?`<input type="text" id="evb-newsec" placeholder="+ Nová časť" style="width:130px;margin-left:6px;padding:5px 8px;font-size:13px">`:""}</div>`;
  const other=B.mode==="sekcie"?["Grant",x=>{const g=get("grants",x.grantId);return g?`<span class="rlink" data-open="grants:${esc(g.id)}">${gName(g)}</span>`:"";}]:["Kategória",x=>x.category?`<span class="meta">${esc(x.category)}</span>`:""];
  const gLines=B.mode==="granty"&&cur&&cur!=="__none"?S.d.lines.filter(l=>l.grantId===cur).sort((a,b)=>(a.ord??1e9)-(b.ord??1e9)||(a.name||"").localeCompare(b.name||"","sk")):[];
  const grCol=["Rozp. položka",x=>x.type==="prijem"?"":`<select class="lsel" data-lline="${esc(x.id)}" aria-label="Rozpočtová položka"><option value="">—</option>${gLines.map(l=>`<option value="${esc(l.id)}" ${x.lineId===l.id?"selected":""}>${esc(l.name||"Položka")}</option>`).join("")}${x.lineId&&!gLines.some(l=>l.id===x.lineId)?`<option value="${esc(x.lineId)}" selected>${esc(ttl("lines",get("lines",x.lineId)))}</option>`:""}</select>`];
  const gPanel=B.mode==="granty"&&cur&&cur!=="__none"?grantLinesPanel(get("grants",cur),gLines,rows):"";
  const ids=new Set(all.map(x=>x.id));
  const avail=S.d.ledger.filter(x=>!ids.has(x.id)).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,300);
  const incRows=all.filter(isInc),gIds=[...new Set([...(e.grantIds||[]),...all.map(x=>x.grantId)].filter(Boolean))];
  const gTot=sum(gIds,id=>{const g=get("grants",id);const a=g&&+g.approved;return a||sum(incRows.filter(x=>x.grantId===id),x=>x.amount);});
  const TI=gTot+sum(incRows.filter(x=>!x.grantId||!gIds.includes(x.grantId)),x=>x.amount),IG=sum(incRows.filter(x=>x.paid!==false&&!!x.date),x=>x.amount),IP=Math.max(0,TI-IG);
  const bmax=Math.max(TI,tExp,1);const free=Math.max(0,TI-tExp);
  const seg=(v,cls,t)=>v>0?`<i class="${cls}" style="width:${v/bmax*100}%" data-tip="${t}: ${eur(v)}" tabindex="0"></i>`:"";
  const bRow=(lbl,tot,cls,segs,tt)=>`<div class="bgr"><div class="bgl"><b>${lbl}</b><span class="${cls}" title="${tt}">${eur0(tot)}</span></div><div class="bgt">${segs}</div></div>`;
  return`<div class="bgraph">${bRow("Príjmy",TI,"pos",seg(IG,"pos","Prijaté")+seg(IP,"pos pl","Ešte majú poslať"),"Súčet grantov pod podujatím"+(TI-gTot>0.005?" + ďalšie príjmy":""))}${bRow("Výdavky",tExp,"neg",seg(tPaid,"neg","Zaplatené")+seg(unpaid,"neg pl","Plánované")+seg(free,"fr","Ešte nepridelené"),tExp>TI?"Výdavky prevyšujú príjmy o "+eur(tExp-TI):"Nepridelené: "+eur(free))}</div>
  <div class="panel"><div class="spread" style="margin-bottom:10px"><div class="tabs"><button data-evbmode="sekcie" aria-pressed="${B.mode==="sekcie"}">Časti programu</button><button data-evbmode="granty" aria-pressed="${B.mode==="granty"}">Granty</button></div><div class="row" style="flex:none;gap:8px">${!HIDE_AMT&&(all.length||gIds.length)?`<button class="btn sm" data-evbpdf="${esc(e.id)}" title="Rozpočet s položkami podľa grantov a podľa kategórií – v okne tlače zvoľte Uložiť ako PDF">PDF rozpočtu</button>`:""}<button class="btn sm" data-create="ledger" data-defs='${esc(JSON.stringify(defs))}'>+ Položka</button></div></div>
  ${T.length?sub:""}${gPanel}
  ${rows.length?table([["",x=>`<span class="rh" data-rowdrag="${esc(x.id)}" title="Potiahnutím presuniete riadok" aria-label="Presunúť riadok">⠿</span>`,"rhc"],["Dátum",x=>x.date?`<span class="meta">${fdateS(x.date)||"plánované"}</span>`:'<span class="meta">plánované</span>'],["Popis",x=>`<span class="drow"><span class="cut">${esc(x.desc||"—")}</span>${clip(x)}</span>`,"t"],["Suma",x=>`<span class="${isInc(x)?"pos":"neg"}">${eur(x.amount||0)}</span>`,"num"],["Meno",x=>ctLink(x.contactId)],...(B.mode==="sekcie"?[other]:[grCol,other])],rows,x=>"ledger:"+esc(x.id),
    "")
   :`<div class="empty">${all.length?"V tejto časti nie sú žiadne položky.":"Zatiaľ žiadne položky z finančného denníka. Platbe vo finančnom denníku nastavte podujatie, kategóriu (časť programu) a grant – tu sa zobrazí automaticky."}</div>`}
  ${avail.length?`<select class="linksel" data-linkadd="events:${esc(e.id)}|ledger" style="margin-top:10px"><option value="">↗ Priradiť existujúcu platbu z denníka…</option>${avail.map(x=>`<option value="${esc(x.id)}">${esc(x.desc||"Platba")} · ${fdateS(x.date)||"plánované"} · ${eur(x.amount)}</option>`).join("")}</select>`:""}</div>`;
}
/* ===== PDF rozpočtu podujatia (od 2.1.5): tlačidlo „PDF rozpočtu“ v záložke Rozpočet otvorí dokument na tlač (ako zmluva o dielo) – v okne tlače
   sa zvolí „Uložiť ako PDF“. Obsah: súhrn, príjmy (granty a ostatné), výdavky podľa grantov (po rozpočtových položkách) a podľa kategórií
   (časti programu), pri každej skupine medzisúčet. Počíta sa rovnako ako graf v záložke. Nič sa neukladá. ===== */
function evbPdf(e){
  const all=related("events",e,"ledger"),isInc=x=>x.type==="prijem",paid=x=>x.paid!==false&&!!x.date;
  const ord=(a,b)=>(!!a.date!==!!b.date?(a.date?-1:1):String(a.date||"").localeCompare(String(b.date||"")))||(a.createdAt||0)-(b.createdAt||0);
  const EX=all.filter(x=>!isInc(x)).sort(ord),IN=all.filter(isInc).sort(ord),amt=L=>sum(L,x=>x.amount);
  const gIds=[...new Set([...(e.grantIds||[]),...all.map(x=>x.grantId)].filter(Boolean))],po=e.provOrder||[];
  const G=gIds.map(id=>get("grants",id)).filter(Boolean).sort((a,b)=>{const i=g=>{const k=po.indexOf(g.id);return k<0?1e9:k;};return i(a)-i(b)||String(a.name||"").localeCompare(String(b.name||""),"sk");});
  const gExp=g=>+g.approved||amt(IN.filter(x=>x.grantId===g.id));
  const TI=sum(G,gExp)+amt(IN.filter(x=>!x.grantId||!gIds.includes(x.grantId))),IG=amt(IN.filter(paid)),tExp=amt(EX),tPaid=amt(EX.filter(paid));
  const cn=x=>{const c=x.contactId&&get("contacts",x.contactId);return c?c.name||"":"";},gl=g=>[g.name||"Grant",provName(g)].filter(Boolean).join(" – ");
  const st=x=>paid(x)?"zaplatené":"plánované",dt=x=>x.date?fdate(x.date):"—";
  const tbl=(L,xh,xv)=>`<table class="it it6"><thead><tr><th class="d">Dátum</th><th>Popis</th><th class="c">Komu / od koho</th><th class="x">${xh}</th><th class="n">Suma</th><th class="s">Stav</th></tr></thead><tbody>${L.map(x=>`<tr><td class="d">${dt(x)}</td><td>${esc(x.desc||"—")}</td><td>${esc(cn(x))}</td><td class="m">${esc(xv(x))}</td><td class="n">${eur(x.amount)}</td><td class="s${paid(x)?"":" pl"}">${st(x)}</td></tr>`).join("")}</tbody></table>`;
  const grp=(t,L,note,body)=>`<div class="grp"><h3><span>${esc(t)}${note?` <small>${esc(note)}</small>`:""}</span><span class="n">${eur(amt(L))}</span></h3>${body}</div>`;
  /* výdavky podľa grantov: v rámci grantu po rozpočtových položkách (poradie ako v grante), potom bez položky; nakoniec výdavky bez grantu */
  const byG=G.map(g=>{const L=EX.filter(x=>x.grantId===g.id);if(!L.length)return"";
    const lines=S.d.lines.filter(l=>l.grantId===g.id).sort((a,b)=>(a.ord??1e9)-(b.ord??1e9)||String(a.name||"").localeCompare(String(b.name||""),"sk"));
    const parts=lines.map(l=>{const M=L.filter(x=>x.lineId===l.id),bud=+l.fromGrant||+l.total||0;return M.length?grp(l.name||"Položka",M,bud?"rozpočet položky "+eur(bud):"",tbl(M,"Kategória",x=>x.category||"")):"";}).join("");
    const rest=L.filter(x=>!x.lineId||!lines.some(l=>l.id===x.lineId));
    return`<section class="gr"><h2><span>${esc(gl(g))}${+g.approved?` <small>schválené ${eur(+g.approved)}</small>`:""}</span><span class="n">${eur(amt(L))}</span></h2>${parts}${rest.length?(lines.length?grp("Bez rozpočtovej položky",rest,"",tbl(rest,"Kategória",x=>x.category||"")):tbl(rest,"Kategória",x=>x.category||"")):""}</section>`;}).join("");
  const noG=EX.filter(x=>!x.grantId||!gIds.includes(x.grantId));
  const gName0=x=>{const g=x.grantId&&get("grants",x.grantId);return g?g.name||"Grant":"";};
  const secs=evSections(e,EX),byC=[...secs.map(c=>[c,EX.filter(x=>x.category===c)]),["Nezaradené",EX.filter(x=>!x.category||!secs.includes(x.category))]].filter(([,L])=>L.length)
    .map(([c,L])=>grp(c,L,"",tbl(L,"Grant",gName0))).join("");
  const r=(l,v,cls)=>`<tr class="${cls||""}"><td>${l}</td><td class="n">${eur(v)}</td></tr>`;
  const sumT=`<table class="sum">${r("Príjmy spolu",TI,"b")}${r("z toho prijaté",IG,"sub")}${r("ešte majú prísť",Math.max(0,TI-IG),"sub")}${r("Výdavky spolu",tExp,"b")}${r("z toho zaplatené",tPaid,"sub")}${r("plánované",tExp-tPaid,"sub")}${r(TI-tExp<0?"Chýba (výdavky prevyšujú príjmy)":"Zostáva (príjmy − výdavky)",TI-tExp,"tot")}</table>`;
  const inR=[...G.map(g=>({t:"Grant: "+gl(g),e:gExp(g),got:amt(IN.filter(x=>x.grantId===g.id&&paid(x)))})),...IN.filter(x=>!x.grantId||!gIds.includes(x.grantId)).map(x=>({t:(x.desc||"Príjem")+(cn(x)?" – "+cn(x):""),e:+x.amount||0,got:paid(x)?+x.amount||0:0}))];
  const inT=inR.length?`<table class="it it3"><thead><tr><th>Zdroj</th><th class="n">Schválené / očakávané</th><th class="n">Prijaté</th></tr></thead><tbody>${inR.map(x=>`<tr><td>${esc(x.t)}</td><td class="n">${eur(x.e)}</td><td class="n">${eur(x.got)}</td></tr>`).join("")}</tbody><tfoot><tr><td>Spolu</td><td class="n">${eur(TI)}</td><td class="n">${eur(IG)}</td></tr></tfoot></table>`:`<p class="empty">Podujatie zatiaľ nemá príjmy ani granty.</p>`;
  const p=get("projects",e.projectId),when=e.date?fdate(e.date)+(e.dateTo&&e.dateTo!==e.date?" – "+fdate(e.dateTo):""):"";
  const meta=[when,e.place,p&&p.name?"projekt "+p.name:""].filter(Boolean).map(esc).join(" · ");
  const css=`@page{size:A4;margin:1.6cm 1.5cm}body{font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;color:#111;margin:0}.org{font-size:8.5pt;color:#666;margin-bottom:4pt}h1{font-size:18pt;margin:0 0 3pt}.meta{color:#444;margin:0 0 2pt}.gen{color:#888;font-size:8pt;margin:0 0 14pt}
    h2{font-size:12.5pt;margin:18pt 0 6pt;padding-bottom:3pt;border-bottom:1.2pt solid #111;display:flex;justify-content:space-between;gap:12pt}h2.part{border-bottom-width:2pt;margin-top:22pt}
    h3{font-size:10.5pt;margin:10pt 0 3pt;display:flex;justify-content:space-between;gap:12pt}small{font-weight:normal;color:#666;font-size:8.5pt}
    table{width:100%;border-collapse:collapse}th{text-align:left;font-weight:600;color:#555;font-size:8.5pt;border-bottom:.8pt solid #999;padding:3pt 4pt}td{padding:3pt 4pt;border-bottom:.4pt solid #ddd;vertical-align:top}
    .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.d{white-space:nowrap;width:62pt}.s{white-space:nowrap;width:52pt}.pl{color:#8a6d00}.m{color:#555}tfoot td{font-weight:700;border-top:.8pt solid #999;border-bottom:0}
    .sum{width:60%;margin-bottom:4pt}.sum td{border-bottom:.4pt solid #e3e3e3}.sum .b td{font-weight:700}.sum .sub td:first-child{padding-left:16pt;color:#555}.sum .tot td{font-weight:700;border-top:1.2pt solid #111;border-bottom:0;font-size:10.5pt}
    .it6{table-layout:fixed}.it6 th.d{width:62pt}.it6 th.c{width:19%}.it6 th.x{width:15%}.it6 th.n{width:70pt}.it6 th.s{width:54pt}.it6 td{overflow-wrap:anywhere}   /* rovnaké stĺpce vo všetkých tabuľkách položiek */
    .it3 th.n{width:110pt}thead{display:table-header-group}tr,h3{page-break-inside:avoid;break-inside:avoid}h2,h3{break-after:avoid}.empty{color:#666}`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Rozpočet – ${esc(e.name||"Podujatie")}</title><style>${css}</style></head><body>
    <div class="org">${esc(ORG.name)}</div><h1>Rozpočet podujatia ${esc(e.name||"")}</h1>${meta?`<p class="meta">${meta}</p>`:""}<p class="gen">Stav k ${esc(fdate(today()))}</p>
    <h2>Súhrn</h2>${sumT}<h2>Príjmy</h2>${inT}
    <h2 class="part"><span>Výdavky podľa grantov</span><span class="n">${eur(tExp)}</span></h2>${byG}${noG.length?`<section class="gr"><h2><span>Bez grantu</span><span class="n">${eur(amt(noG))}</span></h2>${tbl(noG,"Kategória",x=>x.category||"")}</section>`:""}${EX.length?"":`<p class="empty">Zatiaľ žiadne výdavky.</p>`}
    <h2 class="part"><span>Výdavky podľa kategórií</span><span class="n">${eur(tExp)}</span></h2>${byC||`<p class="empty">Zatiaľ žiadne výdavky.</p>`}
  </body></html>`;
  const w=window.open("","_blank");if(!w){toast("Prehliadač zablokoval nové okno. Povoľte okná pre túto stránku a skúste znova.",6000);return;}
  w.document.write(html);w.document.close();setTimeout(()=>{try{w.focus();w.print();}catch(_){}},400);
}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-evbpdf]");if(!b)return;const e0=get("events",b.dataset.evbpdf);if(e0)evbPdf(e0);});
