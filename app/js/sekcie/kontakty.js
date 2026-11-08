/* ===== Sekcia Kontakty: Osoby / Firmy / Organizácie / Média, filtre rolí, tabuľka.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/kontakty.js. Nie je to samostatný skript. ===== */
/* ----- Kontakty ----- */
const CTABS=[["osoby","Osoby",c=>c.ctype==="osoba"],["firmy","Firmy",c=>c.ctype==="firma"],["organizacie","Organizácie",c=>c.ctype==="organizacia"],["media","Média",c=>c.ctype==="media"]];
function orgOf(c){const os=orgList(c).map(i=>get("contacts",i)).filter(Boolean);return os.length?os.map(o=>`<button class="btn ghost sm" style="padding:2px 6px" data-peek="contacts:${esc(o.id)}">${cIcon(o)}${esc(o.name)}</button>`).join(" "):esc(c.org||"");}
const isVol=c=>tagList(c).includes(S.cf.tag||"dobrovolnik");
VIEWS.kontakty=()=>{
  const f=S.cf,q=(f.q||"").toLowerCase(),tab=CTABS.find(t=>t[0]===f.tab)||CTABS[0];
  let list=S.d.contacts.filter(tab[2]).filter(c=>(!f.tag||isVol(c))&&(!q||[c.name,c.org,orgOf(c),c.email,c.phone,c.note,c.position].join(" ").toLowerCase().includes(q))&&(tab[0]!=="spoluprace"||(!f.ev&&!f.state)||S.d.partnerships.some(p=>p.contactId===c.id&&(!f.ev||p.eventId===f.ev)&&(!f.state||p.state===f.state)))).sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  S._clist=list;
  const isOrg=["firmy","organizacie","spoluprace"].includes(tab[0]);
  const people=c=>S.d.contacts.filter(x=>orgList(x).includes(c.id)).length;
  const defs=esc(JSON.stringify({osoby:{ctype:"osoba"},firmy:{ctype:"firma"},organizacie:{ctype:"organizacia"},media:{ctype:"media"},dobrovolnici:{ctype:"osoba",role:"dobrovolnik"},spoluprace:{ctype:"organizacia",role:"partner"},vsetci:{}}[tab[0]]));
  const cols=[["Meno",c=>`<span class="cut">${cIcon(c)}${esc(c.name||"Bez mena")}</span>${c.position?`<div class="meta">${esc(c.position)}</div>`:""}`,"t"]];
  cols.push(["E-mail",c=>c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:""],["Telefón",c=>c.phone?`<a href="tel:${esc(String(c.phone).replace(/\s/g,""))}">${esc(c.phone)}</a>`:""]);
  if(isOrg)cols.push(["Ľudia",c=>{const n=people(c);return n?`<span class="meta">${n}</span>`:"";}]);else cols.push(["Organizácia / firma",c=>orgOf(c)]);
  if(tab[0]==="dobrovolnici")cols.push(["Oslovil nás cez",c=>c.source?`<span class="chip"><i style="background:${optC("csrc",c.source)}"></i>${esc(optL("csrc",c.source))}</span>`:""]);
  if(tab[0]==="spoluprace")cols.push(["Spolupráce",c=>S.d.partnerships.filter(p=>p.contactId===c.id&&(!f.ev||p.eventId===f.ev)).map(p=>{const ev=get("events",p.eventId);return ev?`<span class="chip" style="margin:1px 4px 1px 0"><i style="background:${optC("pstav",p.state)}"></i>${esc(ev.name)} · ${esc(optL("pstav",p.state))}</span>`:"";}).join("")]);
  return`<div class="head"><h1>Kontakty</h1><button class="btn pri" data-create="contacts" data-defs='${defs}'>Nový kontakt</button></div>
  <div class="ctbar"><div class="ptabs" role="tablist" style="margin:0">${CTABS.map(([k,l,fn])=>`<button role="tab" data-ctab="${k}" aria-selected="${tab[0]===k}">${l}<span>${S.d.contacts.filter(fn).length||""}</span></button>`).join("")}</div><div class="ctools"><input type="search" id="cf-q" placeholder="Hľadať meno, organizáciu, e-mail" value="${esc(f.q||"")}" style="min-width:260px">
    ${tab[0]==="spoluprace"?`<select id="cf-ev" aria-label="Podujatie"><option value="">Všetky podujatia</option>${S.d.events.filter(ev=>S.d.partnerships.some(p=>p.eventId===ev.id)).map(ev=>`<option value="${esc(ev.id)}" ${f.ev===ev.id?"selected":""}>${esc(ev.name)}</option>`).join("")}</select><select id="cf-state" aria-label="Stav"><option value="">Všetky stavy</option>${OPT.pstav.map(o=>`<option value="${o[0]}" ${f.state===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select>`:""}
    <button class="btn sm" id="cf-copy">Kopírovať e-maily (${list.filter(c=>c.email).length})</button></div></div>
  ${tagVocab(tagTab[tab[0]]).length?`<div class="ctagbar">${tagVocab(tagTab[tab[0]]).map(([k,l,c])=>`<button type="button" class="tg sm" style="--tc:${c}" data-cvol="${k}" aria-pressed="${f.tag===k}" title="Zobraziť len: ${esc(l)}">${esc(l)}</button>`).join("")}</div>`:""}
  <div class="panel">${list.length?table(cols,list,c=>"contacts:"+esc(c.id)):`<div class="empty">${S.d.contacts.length?"V tejto skupine nikto nie je.":"Zatiaľ žiadne kontakty."}</div>`}</div>`;
};

