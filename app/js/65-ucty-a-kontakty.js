/* ===== Prepojenie kontaktov s účtami vo WordPresse („kto je kto“).
   Kontakt (osoba) a prihlásený používateľ sú ten istý človek, ak majú rovnaký e-mail, alebo ak je to v kontakte nastavené ručne
   (pole wpUser: "wp_<id>" = prepojený, "-" = neprepájať, prázdne = podľa e-mailu). Nič sa automaticky nezapisuje – prepojenie sa počíta.
   Zodpovedný v úlohe môže byť: "wp_<id>" (člen tímu), "c:<id>" (kontakt) alebo "~Meno" (napísané ručne).
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/65-ucty-a-kontakty.js. Nie je to samostatný skript. ===== */
S.team=S.team||[];
const pnorm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
let teamLoaded=false;
async function loadTeam(){if(teamLoaded||!user||!user.team)return;teamLoaded=true;
  const L=await user.team();if(!Array.isArray(L)||!L.length)return;S.team=L;
  const add={};L.forEach(u=>{add[u.id]={id:u.id,name:u.name,firstName:u.firstName,avatarUrl:u.avatarUrl};});S.people=Object.assign({},S.people,add);render();}
/* účet, ku ktorému kontakt patrí ("" = žiadny) */
function ctUserId(c){if(!c||(c.ctype&&c.ctype!=="osoba"))return"";const w=String(c.wpUser||"");if(w==="-")return"";if(w)return w;
  const em=String(c.email||"").trim().toLowerCase();if(!em)return"";const u=S.team.find(x=>x.email&&x.email===em);return u?u.id:"";}
const ctLinkedByEmail=c=>!c.wpUser&&!!ctUserId(c);
/* kontakt človeka, ktorý sa prihlasuje ako uid */
function contactOfUser(uid){if(!uid)return null;return S.d.contacts.find(c=>ctUserId(c)===uid)||null;}
/* kontakt, ktorý zodpovedá hodnote „Zodpovedný“ */
function assigneeContact(v){if(!v)return null;
  if(v.startsWith("c:"))return get("contacts",v.slice(2))||null;
  if(v[0]==="~"){const n=pnorm(v.slice(1));return n?S.d.contacts.find(c=>(c.ctype||"osoba")==="osoba"&&pnorm(c.name)===n)||null:null;}
  return contactOfUser(v);}
/* jeden kľúč za človeka (na filtre): účet, ak ho má, inak kontakt, inak napísané meno */
function personKey(v){if(!v)return"";if(v.startsWith("c:")||v[0]==="~"){const c=assigneeContact(v);if(c){const u=ctUserId(c);return u||"c:"+c.id;}}return v;}
const isMine=v=>!!v&&!!meId()&&personKey(v)===meId();
/* úlohy, ktoré má kontakt na starosti */
function tasksOfContact(c){const u=ctUserId(c);return S.d.tasks.filter(t=>{const v=t.assignee;if(!v)return false;if(u&&personKey(v)===u)return true;const x=assigneeContact(v);return!!x&&x.id===c.id;});}
/* karta v bočnom paneli kontaktu: účet vo WordPresse + úlohy */
function accountCard(c,ed){if(c.ctype&&c.ctype!=="osoba")return"";
  const uid=ctUserId(c),u=uid&&S.people[uid],w=String(c.wpUser||"");
  const T=tasksOfContact(c).filter(t=>!isDone(t)).sort(byDue);
  let h="";
  if(ed&&S.team.length){h+=`<section class="dcard"><h3>${LKI.contacts||""}Prihlasuje sa ako</h3><select data-ctwp="${esc(c.id)}" aria-label="Účet vo WordPresse" style="width:100%">
      <option value=""${!w?" selected":""}>Podľa e-mailu${!w&&uid?` – ${esc((u&&u.name)||uid)}`:" (nenašiel sa)"}</option>
      ${S.team.map(x=>`<option value="${esc(x.id)}"${w===x.id?" selected":""}>${esc(x.name)}</option>`).join("")}
      <option value="-"${w==="-"?" selected":""}>Neprepájať</option></select></section>`;}
  else if(uid&&u)h+=`<section class="dcard"><p class="meta" style="margin:0;white-space:normal;display:flex;gap:8px;align-items:center">${avatar(uid)}Prihlasuje sa ako <b style="color:var(--ink)">${esc(u.name)}</b>${ctLinkedByEmail(c)?" (podľa e-mailu)":""}</p></section>`;
  if(T.length)h+=`<section class="dcard lkc"><h3 style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="lkh">${LKI.tasks||""}Úlohy</span><span class="meta">${T.length}</span></h3><ul class="items">${T.map(taskLi).join("")}</ul></section>`;
  return h;}
document.addEventListener("change",ev=>{const s=ev.target.closest&&ev.target.closest("[data-ctwp]");if(!s)return;const c=get("contacts",s.dataset.ctwp);if(!c)return;
  const v=s.value;if(v&&v!=="-"){const o=S.d.contacts.find(x=>x.id!==c.id&&x.wpUser===v);if(o)toast(`Pozor: k tomuto účtu je prepojený aj kontakt „${o.name||"Bez mena"}“.`,6000);}
  upd("contacts",c.id,{wpUser:v});});
