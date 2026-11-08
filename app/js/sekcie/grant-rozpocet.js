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
    o.act=o.paid+o.planned;o.actG=o.paidG+o.plannedG;o.rest=Math.round((o.plan-o.act)*100)/100;return o;};
  const L=Ln.map(line);
  const order=[];L.forEach(x=>{const c=gbCat(x.l);if(!order.includes(c))order.push(c);});   /* poradie podľa položiek, prázdne nové kategórie na koniec */
  (g.budgetCats||[]).map(x=>String(x).trim()).filter(Boolean).forEach(c=>{if(!order.includes(c))order.push(c);});
  const add=(a,k)=>sum(a,x=>x[k]);
  const cats=order.map(name=>{const I=L.filter(x=>gbCat(x.l)===name);
    const c={name,I,plan:add(I,"plan"),planG:add(I,"planG"),paid:add(I,"paid"),planned:add(I,"planned"),paidG:add(I,"paidG"),plannedG:add(I,"plannedG"),
      orig:I.some(x=>x.orig!=null)?sum(I,x=>x.orig??0):null};c.act=c.paid+c.planned;c.actG=c.paidG+c.plannedG;c.rest=Math.round((c.plan-c.act)*100)/100;return c;}).filter(c=>c.I.length||c.name);
  const un=S.d.ledger.filter(x=>x.type!=="prijem"&&(x.grantId===g.id||cofinG(x)===g.id)&&!ids.has(x.lineId));
  const T={plan:add(L,"plan"),planG:add(L,"planG"),paid:add(L,"paid"),planned:add(L,"planned"),paidG:add(L,"paidG"),plannedG:add(L,"plannedG"),orig:L.some(x=>x.orig!=null)?sum(L,x=>x.orig??0):null};
  T.unPaid=sum(un.filter(gbPaid),x=>x.amount);T.unPlanned=sum(un.filter(x=>!gbPaid(x)),x=>x.amount);
  T.act=T.paid+T.planned+T.unPaid+T.unPlanned;T.rest=Math.round((T.plan-T.act)*100)/100;
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
function grantBudgetTab(g){  /* vzhľad ako Rozpočet podujatia → Granty: tabuľka položiek (v kategóriách) a pod ňou všetky platby grantu */
  const B=budgetCalc(g),gid=esc(g.id),hasOrig=!!g.origAt,cats=B.cats.some(c=>c.name);
  const lbar=(paid,act,plan)=>{if(!plan)return"";const pp=Math.min(100,paid/plan*100),pl=Math.max(0,Math.min(100-pp,(act-paid)/plan*100));return`<div class="lbar${act>plan+0.005?" over":""}"><i style="width:${pp}%"></i><i class="pl" style="left:${pp}%;width:${pl}%"></i></div>`;};
  const lst=s=>s[1]?`<span class="lst ${s[0]}">${esc(s[1])}</span>`:"";
  const cf=o=>Math.max(0,o.plan-o.planG);
  const origTd=(o,cur)=>hasOrig?`<td class="num">${o==null?'<span class="meta">nová</span>':eur(o)}${o!=null&&Math.abs(cur-o)>0.005?`<div class="meta">${cur-o>0?"+":"−"}${eur(Math.abs(cur-o))}</div>`:""}</td>`:"";
  const nc=hasOrig?9:8;
  const lineRow=o=>{const st=o.planG&&o.actG>o.planG+0.005&&o.act<=o.plan+0.005?["warn","dotácia nad plánom"]:gbState(o.act,o.plan,B.pct,false);
    return`<tr data-open="lines:${esc(o.l.id)}"${cats?' class="gbi"':""}><td class="t"><span class="cut">${esc(o.l.name||"Položka")}</span><span class="meta">${o.P.length?o.P.length+" plat.":""}</span></td>${origTd(o.orig,o.plan)}
      <td class="num">${o.planG?eur(o.planG):"—"}</td><td class="num">${cf(o)?eur(cf(o)):"—"}</td><td class="num">${o.act?eur(o.act):"—"}</td><td class="num neg">${eur(o.paid)}</td><td class="num ${o.rest<-0.005?"neg":""}">${o.plan?eur(o.rest):"—"}</td><td>${lbar(o.paid,o.act,o.plan)}</td><td>${o.plan?lst(st):'<span class="meta">bez rozpočtu</span>'}</td></tr>`;};
  const catRows=c=>{const st=gbState(c.act,c.plan,B.pct,true),closed=!!S.gb.closed[g.id+"|"+c.name];
    return`<tr class="gbcat"><td class="t"><div class="gbn gbcn"><span class="gbtw" data-gbcatt="${gid}|${esc(c.name)}">${closed?"▸":"▾"}</span><input type="text" class="gbcatname" value="${esc(c.name)}" placeholder="Bez kategórie" data-gbcat="${gid}|${esc(c.name)}" aria-label="Názov kategórie" maxlength="80"></div></td>${hasOrig?`<td class="num">${c.orig==null?"":eur(c.orig)}</td>`:""}
      <td class="num">${eur(c.planG)}</td><td class="num">${cf(c)?eur(cf(c)):"—"}</td><td class="num">${c.act?eur(c.act):"—"}</td><td class="num neg">${eur(c.paid)}</td><td class="num ${c.rest<-0.005?"neg":""}">${eur(c.rest)}</td><td>${lbar(c.paid,c.act,c.plan)}</td><td>${lst(st)}</td></tr>
      ${closed?"":c.I.map(lineRow).join("")+`<tr class="gbadd"><td colspan="${nc}"><button class="addrow" data-gbnewline="${gid}|${esc(c.name)}">+ Pridať položku</button></td></tr>`}`;};
  const nBad=B.cats.filter(c=>c.name&&gbState(c.act,c.plan,B.pct,true)[0]==="bad").length;
  const T=B.T,stT=nBad&&T.act<=T.plan+0.005?["bad",`${nBad} ${nBad===1?"kategória prekročená":nBad<5?"kategórie prekročené":"kategórií prekročených"}`]:gbState(T.act,T.plan,0,true);
  const cofinReq=+g.cofinReq||0,cofinAct=sum(S.d.ledger.filter(x=>x.type!=="prijem"&&cofinG(x)===g.id),x=>x.amount);
  const appr=+g.approved||0,planGsum=sum(B.L,x=>x.planG),cfSum=sum(B.L,cf);
  const tools=`<div class="spread gbtools"><label class="small muted">Povolený presun medzi kategóriami <input type="number" min="0" max="100" step="1" data-gbpct="${gid}" value="${B.pct||""}" placeholder="0" style="width:64px;padding:4px 8px"> %</label>
    <div class="row" style="gap:8px"><button class="btn sm" data-gbnewcat="${gid}">+ Kategória</button><button class="btn ghost sm" data-gborig="${gid}" title="Odfotí súčasný plán ako pôvodný rozpočet (zo zmluvy); neskoršie zmeny sa porovnajú s ním">${hasOrig?"Prepísať pôvodný rozpočet":"Uložiť ako pôvodný rozpočet"}</button></div></div>`;
  const warn=[];
  if(appr&&B.L.length&&Math.abs(planGsum-appr)>0.009)warn.push(`Súčet rozpočtu z dotácie (${eur(planGsum)}) nesedí so schválenou sumou (${eur(appr)}).`);
  if(hasOrig)warn.push(`Pôvodný rozpočet uložený ${fdate(iso(new Date(g.origAt)))}.`);
  const addL=cats?"":`<button class="addic" data-gbnewline="${gid}|" title="Pridať rozpočtovú položku" aria-label="Pridať rozpočtovú položku">+</button>`;
  const th=`<thead><tr><th>Rozpočtová položka ${addL}</th>${hasOrig?'<th class="num">Pôvodný</th>':""}<th class="num">Rozpočet</th><th class="num">Spolufin.</th><th class="num">Plánované</th><th class="num">Zaplatené</th><th class="num">Zostáva</th><th style="width:20%"></th><th></th></tr></thead>`;
  const unAct=T.unPaid+T.unPlanned;
  const foot=`<tfoot><tr><td>Spolu${unAct?` <span class="meta">(aj ${eur(unAct)} bez položky)</span>`:""}</td>${hasOrig?`<td class="num">${T.orig==null?"":eur(T.orig)}</td>`:""}<td class="num">${eur(planGsum)}</td><td class="num ${cofinReq&&cfSum<cofinReq-0.005?"warn":""}" title="${cofinReq?"Povinné spolufinancovanie "+eur(cofinReq):""}">${eur(cfSum)}</td><td class="num">${eur(T.act)}</td><td class="num neg">${eur(T.paid+T.unPaid)}</td><td class="num ${T.rest<-0.005?"neg":""}">${eur(T.rest)}</td><td></td><td>${lst(stT)}</td></tr></tfoot>`;
  const body=cats?B.cats.map(catRows).join(""):B.L.map(lineRow).join("");
  const tbl=B.L.length||cats?`<div class="tw"><table class="lt gbt">${th}<tbody>${body}</tbody>${foot}</table></div>`
    :`<div class="empty">Rozpočet grantu je prázdny. Pridajte položky podľa žiadosti alebo zmluvy (<button class="addic" data-gbnewline="${gid}|" title="Pridať rozpočtovú položku" aria-label="Pridať rozpočtovú položku">+</button>), prípadne ich zoskupte do kategórií (+ Kategória). Platby potom priradíte k položkám v zozname nižšie.</div>`;
  /* všetky platby grantu: dátum, popis, suma, meno, rozpočtová položka, časť programu */
  const lids=new Set(B.Ln.map(l=>l.id)),isInc=x=>x.type==="prijem";
  const rows=S.d.ledger.filter(x=>x.grantId===g.id||cofinG(x)===g.id||lids.has(x.lineId))
    .sort((a,b)=>{if(!!a.date!==!!b.date)return a.date?-1:1;if(a.date&&b.date&&a.date!==b.date)return a.date.localeCompare(b.date);const oa=typeof a.ord==="number"?a.ord:Infinity,ob=typeof b.ord==="number"?b.ord:Infinity;if(oa!==ob)return oa-ob;return isInc(b)-isInc(a);});
  const lopt=x=>`<option value="">—</option>${cats?B.cats.map(c=>`<optgroup label="${esc(c.name||"Bez kategórie")}">${c.I.map(o=>`<option value="${esc(o.l.id)}" ${x.lineId===o.l.id?"selected":""}>${esc(o.l.name||"Položka")}</option>`).join("")}</optgroup>`).join(""):B.Ln.map(l=>`<option value="${esc(l.id)}" ${x.lineId===l.id?"selected":""}>${esc(l.name||"Položka")}</option>`).join("")}`;
  const def={type:"vydavok",grantId:g.id};if(g.projectId)def.projectId=g.projectId;
  const ids=new Set(rows.map(x=>x.id));
  const avail=S.d.ledger.filter(x=>!ids.has(x.id)&&!x.grantId&&!cofinG(x)).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,300);
  const pays=`<div class="gbpays"><div class="spread" style="margin-bottom:6px"><h2>Platby</h2><button class="btn sm" data-create="ledger" data-defs='${esc(JSON.stringify(def))}'>+ Platba</button></div>
    ${rows.length?table([["Dátum",x=>`<span class="meta">${x.date?fdateS(x.date):"plánované"}</span>`],["Popis",x=>`<span class="drow"><span class="cut">${esc(x.desc||"—")}</span>${clip(x)}</span>${cofinG(x)===g.id?'<span class="meta"> · spolufin.</span>':""}`,"t"],["Suma",x=>`<span class="${isInc(x)?"pos":"neg"}">${eur(x.amount||0)}</span>`,"num"],["Meno",x=>ctLink(x.contactId)],
      ["Rozp. položka",x=>isInc(x)||!B.Ln.length?"":`<select class="lsel" data-lline="${esc(x.id)}" aria-label="Rozpočtová položka">${lopt(x)}</select>`],["Kategória",x=>x.category?`<span class="meta">${esc(x.category)}</span>`:""]],rows,x=>"ledger:"+esc(x.id))
    :`<div class="empty">Ku grantu zatiaľ nie sú platby. Pridajte novú alebo priraďte existujúcu z denníka.</div>`}
    ${avail.length?`<select class="linksel" data-gbaddpay="${gid}" style="margin-top:10px"><option value="">↗ Priradiť existujúcu platbu z denníka…</option>${avail.map(x=>`<option value="${esc(x.id)}">${esc(x.desc||"Platba")} · ${x.date?fdateS(x.date):"plánované"} · ${eur(x.amount)}</option>`).join("")}</select>`:""}</div>`;
  return`<div class="glines gbbox">${tools}${tbl}${warn.length?`<p class="small muted" style="margin:6px 0 2px">${warn.map(esc).join(" ")}</p>`:""}</div>${pays}`;
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
  if((el=t.closest("[data-gbaddpay]"))&&el.value){const g=get("grants",el.dataset.gbaddpay),x=get("ledger",el.value);el.value="";if(!g||!x)return;
    const p={grantId:g.id};if(g.projectId&&!x.projectId)p.projectId=g.projectId;upd("ledger",x.id,p);toast("Platba priradená ku grantu.");return;}
  if((el=t.closest("[data-gbput]"))&&el.value){const x=get("ledger",el.dataset.gbput);const lid=el.value;el.value="";if(x)upd("ledger",x.id,{lineId:lid});return;}
  if((el=t.closest("[data-gbcat]"))){const[gid,old]=split1(el.dataset.gbcat);const nv=el.value.trim();const g=get("grants",gid);if(!g||nv===old)return;
    const L=S.d.lines.filter(l=>l.grantId===gid&&gbCat(l)===old);
    if(L.length&&!await ask(`Premenovať kategóriu „${old||"Bez kategórie"}“ na „${nv||"Bez kategórie"}“? Zmení sa pri ${L.length} ${L.length===1?"položke":"položkách"}.`,"Premenovať")){render();return;}
    const bc=(g.budgetCats||[]).map(x=>x===old?nv:x);if(nv&&!bc.includes(nv)&&!old)bc.push(nv);
    const seen=new Set();await upd("grants",gid,{budgetCats:bc.filter(x=>x&&!seen.has(x)&&seen.add(x))});
    for(const l of L)await upd("lines",l.id,{category:nv});return;}
});
