/* ===== Sekcia Prehľad: súhrn, moje úlohy, granty v realizácii, nevyplatené platby, termíny, posledné zmeny.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/prehlad.js. Nie je to samostatný skript. ===== */
VIEWS.prehlad=()=>{
  const me=meId(),td=today();
  const open=S.d.tasks.filter(t=>!isDone(t));
  const mine=open.filter(t=>isMine(t.assignee)).sort((a,b)=>(a.status==="tyzden"?0:1)-(b.status==="tyzden"?0:1)||byDue(a,b));
  const late=open.filter(t=>t.due&&t.due<td);
  const lc=ledgerCalc();
  const ag=agenda().filter(a=>!a.done&&a.d>=addDays(td,-30)&&a.d<=addDays(td,30)&&(a.kind!=="task"||a.d<=addDays(td,14)));
  const activeG=S.d.grants.filter(g=>["schvalene","zrealizovane"].includes(g.status));
  const unpaid=S.d.ledger.filter(x=>x.paid===false||x.state==="nevybavene");
  const feed=[];KEYS.filter(k=>k!=="comments"&&k!=="partnerships"&&k!=="zab"&&k!=="zabd"&&k!=="invItems"&&k!=="invMoves"&&k!=="invTech").forEach(k=>S.d[k].forEach(r=>feed.push({k,r,t:r.updatedAt||r.createdAt||0})));
  S.d.comments.forEach(c=>{const[k,id]=(c.parent||"").split(":");const r=get(k,id);if(r)feed.push({k,r,t:c.at,c});});
  feed.sort((a,b)=>b.t-a.t);
  const first=S.me?(S.me.firstName||(S.me.name||"").split(" ")[0]):"";
  const dstr=new Date().toLocaleDateString("sk-SK",{weekday:"long",day:"numeric",month:"long"});
  return`<div class="head"><div><h1>${first?`Ahoj, ${esc(first)}`:"Prehľad"}</h1><p class="sub">${esc(dstr)}</p></div>
    <div class="row"><button class="btn" data-create="ledger">Zapísať platbu</button><button class="btn pri" data-create="tasks">Nová úloha</button></div></div>
  <div class="strip">
    ${accView("financie")?`<div><b class="${lc.bank<0?"neg":""}">${eur0(lc.bank)}</b><span>na bankovom účte</span></div>
    <div><b class="${lc.cash<0?"neg":""}">${eur0(lc.cash)}</b><span>v pokladni</span></div>`:""}
    <div><b>${me?mine.length:open.length}</b><span>${me?"mojich otvorených úloh":"otvorených úloh"}</span></div>
    <div><b class="${late.length?"neg":""}">${late.length}</b><span>úloh po termíne</span></div>
    <div><b>${S.d.grants.filter(g=>ACTIVE_G.includes(g.status)).length}</b><span>grantov v procese</span></div>
  </div>
  <div class="grid3">
    <div class="stack">
      <div class="panel"><div class="spread"><h2>${me?"Moje úlohy":"Otvorené úlohy"}</h2><button class="btn ghost sm" data-go="ulohy">Všetky úlohy</button></div>
        ${(me?mine:open.sort(byDue)).length?`<ul class="items">${(me?mine:open).slice(0,12).map(taskLi).join("")}</ul>`:`<div class="empty">${me?"Nemáte priradené žiadne otvorené úlohy.":"Žiadne otvorené úlohy."}</div>`}</div>
      <div class="panel"><div class="spread"><h2>Granty v realizácii</h2><button class="btn ghost sm" data-go="granty">Všetky granty</button></div>
        ${activeG.length?activeG.map(g=>{const c=grantCalc(g);const n=daysTo(g.settleDue);return`<div data-open="grants:${esc(g.id)}" style="cursor:pointer;padding:9px 0;border-top:1px solid var(--line)">
          <div class="spread"><b>${esc(g.name||"Grant")}</b><span class="meta">${g.settleDue?`vyúčtovanie ${n<0?`<span class="late">${fdateS(g.settleDue)}</span>`:fdateS(g.settleDue)}`:""}</span></div>
          <div class="barline" style="margin-top:6px">${bar(c.paidG,c.appr,pcolor(g.projectId),c.planG)}<span class="meta">${eur0(c.paidG)} z ${eur0(c.appr)}${c.planG?` · plánované ${eur0(c.planG)}`:""}</span></div></div>`;}).join(""):`<div class="empty">Žiadny schválený grant v realizácii.</div>`}</div>
      ${unpaid.length&&accView("financie")?`<div class="panel"><div class="spread"><h2>Nevyplatené a nevybavené</h2><span class="meta">${eur(sum(unpaid,x=>x.amount))}</span></div><ul class="items">${unpaid.slice(0,8).map(ledgerLi).join("")}</ul></div>`:""}
    </div>
    <div class="stack">
      <div class="panel"><div class="spread"><h2>Termíny</h2><button class="btn ghost sm" data-go="kalendar">Kalendár</button></div>
        ${ag.length?`<ul class="items">${ag.slice(0,14).map(a=>`<li data-open="${a.open}"><i class="dot" style="background:${a.c}"></i><span class="t">${esc(a.txt)}</span><span class="meta">${a.d<td?`<span class="late">${fdateS(a.d)}</span>`:a.d===td?'<span class="late">dnes</span>':fdateS(a.d)}</span></li>`).join("")}</ul>`:`<div class="empty">Najbližší mesiac bez termínov.</div>`}</div>
      <div class="panel"><h2 style="margin-bottom:6px">Posledné zmeny v tíme</h2>
        ${feed.length?`<ul class="items feed">${feed.slice(0,10).map(f=>`<li data-open="${f.k}:${esc(f.r.id)}"><span class="t"><span class="muted small">${esc(ENT[f.k].one)}${f.c?" · komentár":""}</span> ${esc(ttl(f.k,f.r))}</span><span class="meta">${esc(personName(f.c?f.c.by:(f.r.updatedBy||f.r.createdBy))||"")} ${rel(f.t)}</span></li>`).join("")}</ul>`:`<div class="empty">Zatiaľ žiadna aktivita.</div>`}</div>
    </div>
  </div>`;
};

