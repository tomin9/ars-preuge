/* ===== Grant – záložka Rozpočet: kategórie → položky → skutočné platby z denníka.
   Plán celkom aj „z toho dotácia“, zaplatené a plánované osobitne, limit presunu medzi kategóriami, pôvodný rozpočet.
   Číta existujúce rozpočtové položky (budgetLines) a platby (transactions); nové polia (category, origTotal, origFromGrant
   pri položke, shiftPct a origAt pri grante) zapisuje len na pokyn používateľa. Nič nemaže ani nepremenúva.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/grant-rozpocet.js. Nie je to samostatný skript. ===== */
S.gb=S.gb||{open:{},closed:{}};
const gbPaid=x=>x.paid!==false&&!!x.date;             /* zaplatené = má dátum a nie je označené ako nevyplatené */
const gbCat=l=>String((l&&l.category)||"").trim();
function budgetCalc(g){
  const Ln=S.d.lines.filter(l=>l.grantId===g.id).sort((a,b)=>(a.ord??1e9)-(b.ord??1e9)||(a.createdAt||0)-(b.createdAt||0));
  const ids=new Set(Ln.map(l=>l.id));
  const line=l=>{
    const P=S.d.ledger.filter(x=>x.lineId===l.id&&x.type!=="prijem");
    const o={l,P,plan:Math.max(+l.total||0,+l.fromGrant||0),planG:+l.fromGrant||0,orig:l.origTotal!=null?+l.origTotal||0:null,origG:l.origFromGrant!=null?+l.origFromGrant||0:null,paid:0,planned:0,paidG:0,plannedG:0};
    P.forEach(x=>{const a=+x.amount||0,gr=!cofinG(x);if(gbPaid(x)){o.paid+=a;if(gr)o.paidG+=a;}else{o.planned+=a;if(gr)o.plannedG+=a;}});
    o.act=o.paid+o.planned;o.actG=o.paidG+o.plannedG;o.rest=o.plan-o.act;return o;};
  const L=Ln.map(line);
  const order=[];L.forEach(x=>{const c=gbCat(x.l);if(!order.includes(c))order.push(c);});   /* poradie podľa položiek, prázdne nové kategórie na koniec */
  (g.budgetCats||[]).map(x=>String(x).trim()).filter(Boolean).forEach(c=>{if(!order.includes(c))order.push(c);});
  const add=(a,k)=>sum(a,x=>x[k]);
  const cats=order.map(name=>{const I=L.filter(x=>gbCat(x.l)===name);
    const c={name,I,plan:add(I,"plan"),planG:add(I,"planG"),paid:add(I,"paid"),planned:add(I,"planned"),paidG:add(I,"paidG"),plannedG:add(I,"plannedG"),
      orig:I.some(x=>x.orig!=null)?sum(I,x=>x.orig??0):null};c.act=c.paid+c.planned;c.actG=c.paidG+c.plannedG;c.rest=c.plan-c.act;return c;}).filter(c=>c.I.length||c.name);
  const un=S.d.ledger.filter(x=>x.type!=="prijem"&&(x.grantId===g.id||cofinG(x)===g.id)&&!ids.has(x.lineId));
  const T={plan:add(L,"plan"),planG:add(L,"planG"),paid:add(L,"paid"),planned:add(L,"planned"),paidG:add(L,"paidG"),plannedG:add(L,"plannedG"),orig:L.some(x=>x.orig!=null)?sum(L,x=>x.orig??0):null};
  T.unPaid=sum(un.filter(gbPaid),x=>x.amount);T.unPlanned=sum(un.filter(x=>!gbPaid(x)),x=>x.amount);
  T.act=T.paid+T.planned+T.unPaid+T.unPlanned;T.rest=T.plan-T.act;
  const inc=S.d.ledger.filter(x=>x.type==="prijem"&&x.grantId===g.id);
  return{Ln,L,cats,un,T,inc,pct:+g.shiftPct||0};
}
/* stav: v poriadku / nad plánom v rámci povoleného presunu / prekročené */
function gbState(act,plan,pct,isCat){
  if(!plan&&!act)return["","",""];
  if(act<=plan+0.005)return["ok","v poriadku","var(--good)"];
  if(!isCat)return["warn","nad plánom položky","var(--ochre)"];
  if(pct&&act<=plan*(1+pct/100)+0.005)return["warn",`nad plánom, v rámci ${pct} %`,"var(--ochre)"];
  return["bad","prekročené","var(--bad)"];
}
const gbChip=s=>s[1]?`<span class="chip" title="${esc(s[1])}"><i style="background:${s[2]}"></i>${esc(s[1])}</span>`:"";
const gbMoney=(v,dash)=>v||!dash?eur(v):"—";
function grantBudgetTab(g){
  const B=budgetCalc(g),gid=esc(g.id),hasOrig=!!g.origAt,col=(get("projects",g.projectId)||{}).color;
  const def={type:"vydavok",grantId:g.id};if(g.projectId)def.projectId=g.projectId;
  const sub=(v,lbl)=>v?`<div class="meta">${lbl} ${eur(v)}</div>`:"";
  const origCell=(o,cur)=>hasOrig?`<td class="num">${o==null?'<span class="meta">nová</span>':eur(o)}${o!=null&&Math.abs(cur-o)>0.005?`<div class="meta">${cur-o>0?"+":"−"}${eur(Math.abs(cur-o))}</div>`:""}</td>`:"";
  const opts=S.d.ledger.filter(x=>x.type!=="prijem"&&!B.Ln.some(l=>l.id===x.lineId)&&(x.grantId===g.id||cofinG(x)===g.id||(!x.grantId&&!cofinG(x))))
    .sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,300);
  const optHtml=opts.map(x=>`<option value="${esc(x.id)}">${esc(x.desc||"Platba")} · ${x.date?fdateS(x.date):"plánované"} · ${eur(x.amount)}${x.grantId===g.id||cofinG(x)===g.id?"":" · bez grantu"}</option>`).join("");
  const payRows=o=>o.P.sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).map(x=>`<tr class="gbpay" data-open="ledger:${esc(x.id)}"><td class="t"><span class="cut">${esc(x.desc||"Platba")}</span><div class="meta">${x.date?fdateS(x.date):"plánované"}${x.docNo?" · doklad "+esc(x.docNo):""}${cofinG(x)?" · spolufinancovanie":""}${x.paid===false?" · nevyplatené":""}</div></td>${hasOrig?"<td></td>":""}<td></td><td class="num">${gbPaid(x)?eur(x.amount):""}</td><td class="num">${gbPaid(x)?"":eur(x.amount)}</td><td colspan="3"></td></tr>`).join("");
  const lineRow=o=>{const open=!!S.gb.open[o.l.id],st=gbState(o.act,o.plan,B.pct,false),stG=o.planG&&o.actG>o.planG+0.005?["warn","dotácia nad plánom","var(--ochre)"]:null;
    return`<tr class="gbl${open?" open":""}" data-gbline="${esc(o.l.id)}"><td class="t"><div class="gbn"><span class="gbtw">${open?"▾":"▸"}</span><span class="cut">${esc(o.l.name||"Položka")}</span></div><div class="meta gbm">${o.P.length?`${o.P.length} ${o.P.length===1?"platba":o.P.length<5?"platby":"platieb"}`:"bez platieb"}</div></td>
      ${origCell(o.orig,o.plan)}<td class="num">${gbMoney(o.plan,true)}${o.planG&&o.planG<o.plan-0.005?sub(o.planG,"dotácia"):""}</td><td class="num">${gbMoney(o.paid,true)}${o.paid&&o.paidG<o.paid-0.005?sub(o.paidG,"dotácia"):""}</td><td class="num">${gbMoney(o.planned,true)}</td>
      <td class="num ${o.rest<-0.005?"neg":""}">${o.plan?eur(o.rest):"—"}</td><td style="min-width:90px">${o.plan?bar(o.paid,o.plan,col,o.planned):""}</td><td>${gbChip(stG||st)}</td></tr>
      ${open?payRows(o)+`<tr class="gbact"><td colspan="${hasOrig?8:7}"><div class="row" style="gap:8px">${optHtml?`<select class="linksel" data-gbassign="${esc(o.l.id)}" aria-label="Priradiť platbu z denníka"><option value="">Priradiť platbu z denníka…</option>${optHtml}</select>`:""}<button class="btn sm" data-gbnewpay="${esc(o.l.id)}">+ Nová platba</button><button class="btn ghost sm" data-open="lines:${esc(o.l.id)}">Upraviť položku</button></div></td></tr>`:""}`;};
  const catRows=c=>{const st=gbState(c.act,c.plan,B.pct,true),closed=!!S.gb.closed[g.id+"|"+c.name];
    return`<tr class="gbcat"><td class="t"><div class="gbn gbcn"><span class="gbtw" data-gbcatt="${gid}|${esc(c.name)}">${closed?"▸":"▾"}</span><input type="text" class="gbcatname" value="${esc(c.name)}" placeholder="Bez kategórie" data-gbcat="${gid}|${esc(c.name)}" aria-label="Názov kategórie" maxlength="80"></div></td>
      ${hasOrig?`<td class="num">${c.orig==null?"":eur(c.orig)}</td>`:""}<td class="num">${eur(c.plan)}${c.planG&&c.planG<c.plan-0.005?sub(c.planG,"dotácia"):""}</td><td class="num">${gbMoney(c.paid,true)}</td><td class="num">${gbMoney(c.planned,true)}</td>
      <td class="num ${c.rest<-0.005?"neg":""}">${eur(c.rest)}</td><td style="min-width:90px">${c.plan?bar(c.paid,c.plan,col,c.planned):""}</td><td>${gbChip(st)}</td></tr>
      ${closed?"":c.I.map(lineRow).join("")+`<tr class="gbadd"><td colspan="${hasOrig?8:7}"><button class="addrow" data-gbnewline="${gid}|${esc(c.name)}">+ Pridať položku</button></td></tr>`}`;};
  const nBad=B.cats.filter(c=>gbState(c.act,c.plan,B.pct,true)[0]==="bad").length;
  const T=B.T,stT=nBad&&T.act<=T.plan+0.005?["bad",`${nBad} ${nBad===1?"kategória prekročená":nBad<5?"kategórie prekročené":"kategórií prekročených"}`,"var(--bad)"]:gbState(T.act,T.plan,0,true),cofinReq=+g.cofinReq||0,cofinAct=sum(S.d.ledger.filter(x=>x.type!=="prijem"&&cofinG(x)===g.id),x=>x.amount);
  const appr=+g.approved||0,planGsum=sum(B.L,x=>x.planG);
  const head=`<div class="strip"><div><b>${eur0(T.plan)}</b><span>rozpočet spolu${T.plan>planGsum+0.005&&planGsum?` · z toho dotácia ${eur0(planGsum)}`:""}</span></div><div><b>${eur0(T.paid+T.unPaid)}</b><span>zaplatené</span></div><div><b>${eur0(T.planned+T.unPlanned)}</b><span>plánované (ešte nezaplatené)</span></div><div><b class="${T.rest<-0.005?"neg":""}">${eur0(T.rest)}</b><span>zostáva</span></div>${cofinReq||cofinAct?`<div><b class="${cofinReq&&cofinAct<cofinReq-0.005?"warn":""}">${eur0(cofinAct)}${cofinReq?` / ${eur0(cofinReq)}`:""}</b><span>spolufinancovanie</span></div>`:""}</div>`;
  const tools=`<div class="spread" style="margin-bottom:10px"><h2>Rozpočet</h2><div class="row" style="gap:8px"><label class="small muted">Povolený presun medzi kategóriami <input type="number" min="0" max="100" step="1" data-gbpct="${gid}" value="${B.pct||""}" placeholder="0" style="width:64px;padding:4px 8px"> %</label>
    <button class="btn sm" data-gbnewcat="${gid}">+ Kategória</button><button class="btn ghost sm" data-gborig="${gid}" title="Odfotí súčasný plán ako pôvodný rozpočet (zo zmluvy); neskoršie zmeny sa porovnajú s ním">${hasOrig?"Prepísať pôvodný rozpočet":"Uložiť ako pôvodný rozpočet"}</button></div></div>`;
  const warn=[];
  if(appr&&B.L.length&&Math.abs(planGsum-appr)>0.009)warn.push(`Súčet plánu z dotácie (${eur(planGsum)}) nesedí so schválenou sumou (${eur(appr)}).`);
  if(hasOrig)warn.push(`Pôvodný rozpočet uložený ${fdate(iso(new Date(g.origAt)))}.`);
  const unBlock=B.un.length?`<div class="panel" style="margin-top:20px"><div class="spread"><h2>Platby bez položky</h2><span class="meta">${B.un.length} · ${eur(sum(B.un,x=>x.amount))}</span></div>
    <p class="small muted" style="margin:0 0 6px">Tieto výdavky patria ku grantu, ale nie sú priradené k žiadnej položke rozpočtu – započítavajú sa len do súčtu.</p>
    <ul class="items">${B.un.map(x=>`<li data-open="ledger:${esc(x.id)}"><span class="t">${esc(x.desc||"Platba")}</span><span class="meta">${x.date?fdateS(x.date):"plánované"}</span><span class="num neg">−${eur(x.amount)}</span>${B.Ln.length?`<select class="lsel" data-gbput="${esc(x.id)}" aria-label="Priradiť k položke"><option value="">Priradiť k položke…</option>${B.cats.map(c=>`<optgroup label="${esc(c.name||"Bez kategórie")}">${c.I.map(o=>`<option value="${esc(o.l.id)}">${esc(o.l.name||"Položka")}</option>`).join("")}</optgroup>`).join("")}</select>`:""}</li>`).join("")}</ul></div>`:"";
  const incBlock=B.inc.length?`<div class="panel" style="margin-top:20px"><div class="spread"><h2>Príjmy od poskytovateľa</h2><span class="meta">${eur(sum(B.inc,x=>x.amount))}</span></div><ul class="items">${B.inc.map(x=>`<li data-open="ledger:${esc(x.id)}"><span class="t">${esc(x.desc||"Príjem")}</span><span class="meta">${x.date?fdateS(x.date):"plánované"}</span><span class="num pos">+${eur(x.amount)}</span></li>`).join("")}</ul></div>`:"";
  const th=`<thead><tr><th>Kategória / položka</th>${hasOrig?'<th class="num">Pôvodný</th>':""}<th class="num">Plán</th><th class="num">Zaplatené</th><th class="num">Plánované</th><th class="num">Zostáva</th><th></th><th>Stav</th></tr></thead>`;
  const foot=`<tfoot><tr><td>Spolu${T.unPaid+T.unPlanned?` <span class="meta">(vrátane platieb bez položky)</span>`:""}</td>${hasOrig?`<td class="num">${T.orig==null?"":eur(T.orig)}</td>`:""}<td class="num">${eur(T.plan)}</td><td class="num">${eur(T.paid+T.unPaid)}</td><td class="num">${eur(T.planned+T.unPlanned)}</td><td class="num ${T.rest<-0.005?"neg":""}">${eur(T.rest)}</td><td></td><td>${gbChip(stT)}</td></tr></tfoot>`;
  const table=B.cats.length?`<div class="tw"><table class="gbt">${th}<tbody>${B.cats.map(catRows).join("")}</tbody>${foot}</table></div>`
    :`<div class="empty">Rozpočet grantu je prázdny. Pridajte kategóriu (napr. Honoráre, Technické zabezpečenie) a v nej položky podľa žiadosti alebo zmluvy. Ku každej položke potom priradíte platby z denníka.<div style="margin-top:8px"><button class="btn pri" data-gbnewcat="${gid}">+ Kategória</button></div></div>`;
  return head+`<div class="panel">${tools}${table}${warn.length?`<p class="small muted" style="margin:10px 0 0">${warn.map(esc).join(" ")}</p>`:""}</div>${unBlock}${incBlock}`;
}
/* ovládanie */
document.addEventListener("click",async ev=>{const t=ev.target;if(!t.closest)return;let el;
  if((el=t.closest("[data-gbline]"))&&!t.closest("a,select,input,button")){S.gb.open[el.dataset.gbline]=!S.gb.open[el.dataset.gbline];render();return;}
  if((el=t.closest("[data-gbcatt]"))){S.gb.closed[el.dataset.gbcatt]=!S.gb.closed[el.dataset.gbcatt];render();return;}
  if((el=t.closest("[data-gbnewline]"))){const[gid,cat]=split1(el.dataset.gbnewline);const g=get("grants",gid);if(!g)return;
    const n=S.d.lines.filter(l=>l.grantId===gid).length;create("lines",{grantId:gid,category:cat,ord:(n+1)*1000});return;}
  if((el=t.closest("[data-gbnewcat]"))){const g=get("grants",el.dataset.gbnewcat);if(!g)return;const ex=new Set([...(g.budgetCats||[]),...S.d.lines.filter(l=>l.grantId===g.id).map(gbCat)]);
    let nm="Nová kategória",i=2;while(ex.has(nm))nm="Nová kategória "+(i++);
    await upd("grants",g.id,{budgetCats:[...(g.budgetCats||[]),nm]});
    setTimeout(()=>{const inp=[...document.querySelectorAll("[data-gbcat]")].find(x=>x.value===nm);if(inp){inp.focus();inp.select();}},80);return;}
  if((el=t.closest("[data-gbnewpay]"))){const l=get("lines",el.dataset.gbnewpay);if(!l)return;const g=get("grants",l.grantId)||{};
    const d={type:"vydavok",lineId:l.id,grantId:l.grantId};if(g.projectId)d.projectId=g.projectId;create("ledger",d);return;}
  if((el=t.closest("[data-gborig]"))){const g=get("grants",el.dataset.gborig);if(!g)return;const Ln=S.d.lines.filter(l=>l.grantId===g.id);
    if(!Ln.length){toast("Rozpočet je prázdny – nie je čo uložiť.");return;}
    if(!await ask(g.origAt?`Prepísať pôvodný rozpočet súčasným plánom? Doterajší pôvodný rozpočet z ${fdate(iso(new Date(g.origAt)))} sa nahradí.`:"Uložiť súčasný plán ako pôvodný rozpočet (zo zmluvy)? Neskoršie zmeny plánu sa budú porovnávať s ním.",g.origAt?"Prepísať":"Uložiť"))return;
    for(const l of Ln)await upd("lines",l.id,{origTotal:+l.total||0,origFromGrant:+l.fromGrant||0});
    await upd("grants",g.id,{origAt:Date.now()});toast("Pôvodný rozpočet uložený.");return;}
});
const split1=s=>{const i=s.indexOf("|");return[s.slice(0,i),s.slice(i+1)];};
document.addEventListener("change",async ev=>{const t=ev.target;if(!t.closest)return;let el;
  if((el=t.closest("[data-gbpct]"))){const v=el.value===""?null:Math.max(0,Math.min(100,+el.value||0));upd("grants",el.dataset.gbpct,{shiftPct:v});return;}
  if((el=t.closest("[data-gbassign]"))&&el.value){const l=get("lines",el.dataset.gbassign),x=get("ledger",el.value);el.value="";if(!l||!x)return;
    const p={lineId:l.id};if(!x.grantId&&!cofinG(x))p.grantId=l.grantId;const g=get("grants",l.grantId);if(g&&g.projectId&&!x.projectId)p.projectId=g.projectId;
    upd("ledger",x.id,p);toast("Platba priradená k položke.");return;}
  if((el=t.closest("[data-gbput]"))&&el.value){const x=get("ledger",el.dataset.gbput);const lid=el.value;el.value="";if(x)upd("ledger",x.id,{lineId:lid});return;}
  if((el=t.closest("[data-gbcat]"))){const[gid,old]=split1(el.dataset.gbcat);const nv=el.value.trim();const g=get("grants",gid);if(!g||nv===old)return;
    const L=S.d.lines.filter(l=>l.grantId===gid&&gbCat(l)===old);
    if(L.length&&!await ask(`Premenovať kategóriu „${old||"Bez kategórie"}“ na „${nv||"Bez kategórie"}“? Zmení sa pri ${L.length} ${L.length===1?"položke":"položkách"}.`,"Premenovať")){render();return;}
    const bc=(g.budgetCats||[]).map(x=>x===old?nv:x);if(nv&&!bc.includes(nv)&&!old)bc.push(nv);
    const seen=new Set();await upd("grants",gid,{budgetCats:bc.filter(x=>x&&!seen.has(x)&&seen.add(x))});
    for(const l of L)await upd("lines",l.id,{category:nv});return;}
});
