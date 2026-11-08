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
function progPanel(e){
  const P=S.d.prog.filter(x=>x.eventId===e.id).sort((a,b)=>(+a.ord||0)-(+b.ord||0)||(a.createdAt||0)-(b.createdAt||0));
  const W=P.filter(x=>x.kind!=="sprievodny"),SP=P.filter(x=>x.kind==="sprievodny");
  const who=id=>{const c=id&&get("contacts",id);return c?`<span class="cut">${esc(c.name||"")}</span>`:'<span class="miss">—</span>';};
  const st=x=>`<span class="chip"><i style="background:${optC("pst",x.status||"nevybavene")}"></i>${esc(optL("pst",x.status||"nevybavene"))}</span>`;
  const needs=x=>{const a=[x.needOrg&&"org.",x.needMat&&"mat."].filter(Boolean);return a.length?`<span class="meta" title="${esc([x.needOrg,x.needMat].filter(Boolean).join("\n"))}">${a.join(" · ")}</span>`:'<span class="miss">—</span>';};
  const head=`<thead><tr><th>Dielo</th><th>Miesto</th><th>Potreby</th><th>Pripravuje</th><th>Stráži pi</th><th>Stráži so</th><th>Stav</th></tr></thead>`;
  const row=x=>`<tr data-open="prog:${esc(x.id)}"><td class="t"><b class="cut">${esc(x.title||"Bez názvu")}</b><div class="meta cut">${esc(x.author||"")}</div></td><td><span class="meta cut">${esc(x.place||"")}</span></td><td>${needs(x)}</td><td>${who(x.prepId)}</td>${x.noGuard?`<td colspan="2"><span class="meta">netreba strážiť</span></td>`:`<td>${who(x.guardFri)}</td><td>${who(x.guardSat)}</td>`}<td>${st(x)}</td></tr>`;
  const secs=OPT.psec.map(o=>o[0]).filter(k=>k!=="Sprievodný program");
  const groups=[...secs,...new Set(W.map(x=>x.section||"").filter(k=>!secs.includes(k)))].map(k=>[k,W.filter(x=>(x.section||"")===k)]).filter(([k,L])=>L.length||secs.includes(k));
  const miss=W.filter(x=>!x.prepId||(!x.noGuard&&(!x.guardFri||!x.guardSat))).length;
  const add=(defs,l)=>`<button class="addic" data-create="prog" data-defs='${esc(JSON.stringify(Object.assign({eventId:e.id},defs)))}' title="${l}" aria-label="${l}">+</button>`;
  const dayL={piatok:"Piatok",sobota:"Sobota",oba:"Piatok aj sobota"};
  const spDays=["piatok","sobota","oba"].map(d=>[d,SP.filter(x=>(x.day||"oba")===d)]).filter(([d,L])=>L.length);
  const spRow=x=>`<tr data-open="prog:${esc(x.id)}"><td><span class="meta" style="white-space:nowrap">${esc(x.time||"")}</span></td><td class="t"><b class="cut">${esc(x.title||"Bez názvu")}</b>${x.author?`<div class="meta cut">${esc(x.author)}</div>`:""}</td><td><span class="meta cut">${esc(x.place||"")}</span></td><td>${needs(x)}</td><td>${who(x.prepId)}</td><td>${st(x)}</td></tr>`;
  return`<div class="panel" style="margin-top:20px"><div class="spread"><h2>Umelecké diela <span class="meta">${W.length}</span></h2>${miss?`<span class="meta">${miss} bez pripravujúceho alebo strážcu</span>`:""}</div>
  ${groups.map(([k,L])=>`<h3 class="pgh">${esc(k||"Bez kategórie")} <span class="meta">${L.length||""}</span> ${add({kind:"dielo",section:k},"Pridať dielo")}</h3>${L.length?`<div class="tw"><table class="pgt">${head}<tbody>${L.map(row).join("")}</tbody></table></div>`:""}`).join("")}</div>
  <div class="panel" style="margin-top:20px"><div class="spread"><h2>Sprievodný program <span class="meta">${SP.length}</span></h2>${add({kind:"sprievodny",section:"Sprievodný program",day:"piatok"},"Pridať bod programu")}</div>
  ${spDays.length?spDays.map(([d,L])=>`<h3 class="pgh">${dayL[d]}</h3><div class="tw"><table class="pgt"><thead><tr><th style="width:110px">Čas</th><th>Program</th><th>Miesto</th><th>Potreby</th><th>Pripravuje</th><th>Stav</th></tr></thead><tbody>${L.sort((a,b)=>(a.time||"").localeCompare(b.time||"")).map(spRow).join("")}</tbody></table></div>`).join(""):`<div class="empty">Zatiaľ bez sprievodného programu.</div>`}</div>`;
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
  <div class="panel"><div class="spread" style="margin-bottom:10px"><div class="tabs"><button data-evbmode="sekcie" aria-pressed="${B.mode==="sekcie"}">Časti programu</button><button data-evbmode="granty" aria-pressed="${B.mode==="granty"}">Granty</button></div><button class="btn sm" data-create="ledger" data-defs='${esc(JSON.stringify(defs))}'>+ Položka</button></div>
  ${T.length?sub:""}${gPanel}
  ${rows.length?table([["",x=>`<span class="rh" data-rowdrag="${esc(x.id)}" title="Potiahnutím presuniete riadok" aria-label="Presunúť riadok">⠿</span>`,"rhc"],["Dátum",x=>x.date?`<span class="meta">${fdateS(x.date)||"plánované"}</span>`:'<span class="meta">plánované</span>'],["Popis",x=>`<span class="drow"><span class="cut">${esc(x.desc||"—")}</span>${clip(x)}</span>`,"t"],["Suma",x=>`<span class="${isInc(x)?"pos":"neg"}">${eur(x.amount||0)}</span>`,"num"],["Meno",x=>ctLink(x.contactId)],...(B.mode==="sekcie"?[other]:[grCol,other])],rows,x=>"ledger:"+esc(x.id),
    "")
   :`<div class="empty">${all.length?"V tejto časti nie sú žiadne položky.":"Zatiaľ žiadne položky z finančného denníka. Platbe vo finančnom denníku nastavte podujatie, kategóriu (časť programu) a grant – tu sa zobrazí automaticky."}</div>`}
  ${avail.length?`<select class="linksel" data-linkadd="events:${esc(e.id)}|ledger" style="margin-top:10px"><option value="">↗ Priradiť existujúcu platbu z denníka…</option>${avail.map(x=>`<option value="${esc(x.id)}">${esc(x.desc||"Platba")} · ${fdateS(x.date)||"plánované"} · ${eur(x.amount)}</option>`).join("")}</select>`:""}</div>`;
}
