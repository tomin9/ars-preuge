/* ===== Sekcia Úlohy: nástenka a zoznam úloh, filtre, karta úlohy.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/ulohy.js. Nie je to samostatný skript. ===== */
VIEWS.ulohy=()=>{
  const f=S.tf,me=meId();
  let list=S.d.tasks.filter(t=>(!f.project||t.projectId===f.project)&&(!f.org||t.org===f.org)&&(!f.type||(t.types||[]).includes(f.type))
    &&(!f.who||(f.who==="__me"?t.assignee===me:f.who==="__none"?!t.assignee:t.assignee===f.who))&&(!f.q||(t.title||"").toLowerCase().includes(f.q.toLowerCase())));
  const people=[...new Set(S.d.tasks.map(t=>t.assignee).filter(Boolean))];
  const tools=`<div class="tools">
    <input type="search" id="tf-q" placeholder="Hľadať v úlohách" value="${esc(f.q)}" aria-label="Hľadať">
    <select id="tf-project" aria-label="Projekt"><option value="">Všetky projekty</option>${S.d.projects.map(p=>`<option value="${esc(p.id)}" ${f.project===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select>
    <select id="tf-who" aria-label="Zodpovedný"><option value="">Všetci</option>${me?`<option value="__me" ${f.who==="__me"?"selected":""}>Moje</option>`:""}<option value="__none" ${f.who==="__none"?"selected":""}>Nepriradené</option>${people.filter(p=>p!==me).map(p=>`<option value="${esc(p)}" ${f.who===p?"selected":""}>${esc(personName(p))}</option>`).join("")}</select>
    <select id="tf-type" aria-label="Typ"><option value="">Všetky typy</option>${ttypes().map(x=>`<option ${f.type===x?"selected":""}>${esc(x)}</option>`).join("")}</select>
    <select id="tf-org" aria-label="Organizácia"><option value="">Ars Preuge aj KaSS</option>${OPT.org.map(o=>`<option value="${o[0]}" ${f.org===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>
    <div class="tabs"><button data-tmode="board" aria-pressed="${f.mode==="board"}">Tabuľa</button><button data-tmode="list" aria-pressed="${f.mode==="list"}">Zoznam</button></div></div>`;
  const defs={};if(f.project)defs.projectId=f.project;if(f.who==="__me"&&me)defs.assignee=me;
  let body;
  if(!S.d.tasks.length)body=`<div class="panel">${emptyBox("Zatiaľ žiadne úlohy. Zapíšte prvú – do Inboxu môžete hádzať všetko, čo treba neskôr roztriediť.","tasks","Nová úloha")}</div>`;
  else if(f.mode==="list"){
    body=`<div class="panel">${list.length?table([
      ["",t=>`<button class="check ${isDone(t)?"on":""}" data-done="${esc(t.id)}" aria-label="Hotové"></button>`],
      ["Úloha",t=>`<span class="cut">${esc(t.title||"Bez názvu")}</span>`,"t"],["Stav",t=>chip("tstat",t.status)],["Zodpovedný",t=>who(t.assignee)],
      ["Termín",t=>dueHtml(t.due,isDone(t))],["Priorita",t=>chip("prio",t.priority)],["Projekt",t=>pdot(t.projectId)],["Typ",t=>esc((t.types||[]).join(", "))]
    ],list.sort((a,b)=>(isDone(a)-isDone(b))||byDue(a,b)),t=>"tasks:"+esc(t.id)):`<div class="empty">Žiadne úlohy v tomto filtri.</div>`}</div>`;
  }else{
    body=`<div class="board">${OPT.tstat.map(([st,label,c])=>{
      let col=list.filter(t=>(t.status||"inbox")===st);
      if(st==="hotove")col.sort((a,b)=>(b.doneAt||b.updatedAt||0)-(a.doneAt||a.updatedAt||0));
      else col.sort((a,b)=>(a.priority==="urgentne"?0:1)-(b.priority==="urgentne"?0:1)||byDue(a,b));
      const total=col.length;if(st==="hotove"&&!f.allDone)col=col.slice(0,12);
      return`<div class="col" data-drop="tasks:status:${st}"><h3><span class="row" style="gap:7px;color:var(--ink);font-weight:700"><i class="dot" style="background:${c}"></i>${label}</span><span>${total}</span></h3>
        ${st==="inbox"?`<input type="text" class="qa" id="qa" placeholder="+ Rýchlo pridať a Enter" aria-label="Rýchlo pridať úlohu">`:""}
        ${col.map(taskCard).join("")}
        ${st==="hotove"&&total>12?`<button class="btn ghost sm" id="tf-alldone" style="width:100%;justify-content:center">${f.allDone?"Zobraziť menej":`Zobraziť všetkých ${total}`}</button>`:""}</div>`;
    }).join("")}</div>`;
  }
  return`<div class="head"><div><h1>Úlohy</h1><p class="sub">${S.d.tasks.filter(t=>!isDone(t)).length} otvorených · ťahaním kariet meníte stav</p></div><button class="btn pri" data-create="tasks" data-defs='${esc(JSON.stringify(defs))}'>Nová úloha</button></div>${tools}${body}`;
};
function taskCard(t){
  const p=get("projects",t.projectId),ev=get("events",t.eventId);const cl=t.checklist||[];
  return`<div class="card" draggable="true" data-drag="tasks:${esc(t.id)}" data-open="tasks:${esc(t.id)}">
    <div class="ct">${esc(t.title||"Bez názvu")}</div>
    <div class="cm">${p?`<span class="row" style="gap:5px"><i class="dot" style="background:${esc(p.color||GRAY)}"></i>${esc(p.name)}</span>`:""}
      ${ev?`<span>${esc(ev.name)}</span>`:""}${t.priority==="urgentne"&&!isDone(t)?chip("prio","urgentne"):""}
      ${(t.types||[]).map(x=>`<span class="chip out">${esc(x)}</span>`).join("")}
      ${t.assignee?who(t.assignee):""}${t.due?`<span>${dueHtml(t.due,isDone(t))}</span>`:""}
      ${cl.length?`<span>☑ ${cl.filter(x=>x.d).length}/${cl.length}</span>`:""}
      ${S.d.comments.some(c=>c.parent==="tasks:"+t.id)?`<span>💬 ${S.d.comments.filter(c=>c.parent==="tasks:"+t.id).length}</span>`:""}</div></div>`;
}
