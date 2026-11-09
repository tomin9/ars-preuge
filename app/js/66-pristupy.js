/* ===== Prístupy (fáza 1): podľa oblastí – čo prihlásený vidí a čo smie meniť.
   ARSP.access je null (plný prístup) alebo mapa oblasť → 0 bez / 1 čítať / 2 upravovať; nastavuje administrátor
   vo WordPresse (Ars Preuge → Prístupy). Skutočné obmedzenie robí server (/sync nepošle, /doc odmietne) – tu sa
   len skrýva menu a tlačidlá a zápis sa zastaví so zrozumiteľnou správou skôr, než by ho odmietol server.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/66-pristupy.js. Nie je to samostatný skript. ===== */
const ACC=(window.ARSP&&ARSP.access)||null;
const ACC_AREA={projects:"projekty",events:"podujatia",partnerships:"podujatia",programItems:"podujatia",zabezpecenie:"podujatia",zabdodavky:"podujatia",tasks:"ulohy",grants:"granty",budgetLines:"granty",transactions:"financie",contacts:"kontakty"};
const ACC_VIEW={projekty:"projekty",projekt:"projekty",granty:"granty",grant:"granty",podujatia:"podujatia",podujatie:"podujatia",financie:"financie",kontakty:"kontakty",nastavenia:"nastavenia"};
const accAreaOf=e=>ACC_AREA[(ENT[e]&&ENT[e].col)||e]||"";          /* oblasť druhu záznamu; komentáre stráži server podľa rodiča */
const accReadA=a=>!ACC||!a||(ACC[a]||0)>=1;
const accEditA=a=>!ACC||!a||(ACC[a]||0)>=2;
const accRead=e=>accAreaOf(e)==="ulohy"||accReadA(accAreaOf(e));   /* úlohy vidí každý (server pošle len tie z jeho oblastí a rozsahu, a jeho vlastné) */
const accEdit=e=>accEditA(accAreaOf(e));
const accView=v=>accReadA(ACC_VIEW[v]||"");
const accDeny=()=>{toast("Na túto úpravu nemáte právo. Požiadajte správcu o rozšírenie prístupu.",5000);return false;};
if(ACC&&!Object.values(ACC).some(l=>l>=2))S.readOnly=true;          /* nikde právo upravovať → celá aplikácia len na čítanie */
/* po každom prekreslení sa skryjú tlačidlá na vytváranie v oblastiach bez práva upravovať */
function accSweep(){if(!ACC)return;
  if(!["tasks","events","ledger","grants","projects","contacts"].some(accEdit))document.querySelectorAll("[data-new]").forEach(b=>b.style.display="none");
  if(!accEdit("tasks"))document.querySelectorAll("#qa").forEach(b=>b.style.display="none");   /* rýchle pridanie úlohy */
  document.querySelectorAll("[data-create]").forEach(b=>{if(!accEdit(b.dataset.create))b.style.display="none";});
  document.querySelectorAll(".gnew").forEach(b=>{if(b.dataset.create&&!accEdit(b.dataset.create))b.style.display="none";});}
/* „len čítať“: polia, ktoré zapisujú (majú data-… alebo id editora), sa zamknú – bez prístupu by ich zápis aj tak odmietol server */
function accLock(root){if(!root)return;
  root.querySelectorAll("input,textarea,select").forEach(el=>{
    const w=Object.keys(el.dataset).length||(el.id&&/^(f-|dw-|ga-|ph-|gbn-|g-|st-|ev-|cmt|tx)/.test(el.id));if(!w||el.type==="search")return;
    if(el.tagName==="SELECT"||["checkbox","radio","file","date","color"].includes(el.type))el.disabled=true;else el.readOnly=true;
    el.classList.add("acc-ro");});}
function accLockView(){if(!ACC)return;const a=ACC_VIEW[S.view]||"";if(a&&!accEditA(a))accLock(document.getElementById("view"));}
function accLockDrawer(){if(!ACC||!DW)return;if(!accEdit(DW.e))accLock(document.getElementById("drawer"));}
