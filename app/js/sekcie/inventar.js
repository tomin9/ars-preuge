/* ===== Sekcia Inventár – Predaj (od 1.103.0): veci, ktoré sa predávajú a rozdávajú (risografiky, pohľadnice, mapy, tričká…).
   invItems = predmety (druh, cena, vyrobené kusy), invMoves = výdaj (komu, predmet, kusy, suma, platba, odovzdanie).
   Peniaze sa do Financií nezapisujú – súhrn (hotovosť / Darujme.sk) je len tu. V prístupoch je to oblasť „Inventár“ (inc/pristupy.php).
   Technika a požičané veci (prepojené s podujatiami) prídu ako ďalšia záložka.
   Časť programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/sekcie/inventar.js. Nie je to samostatný skript. ===== */
/* ----- Inventár ----- */
const INV_PAID=["hotovost","darujme"];
const invQty=m=>+m.qty||0;
const invItemChip=id=>{const it=get("invItems",id);if(!it)return"";const kinds=[...new Set(S.d.invItems.map(x=>x.kind||""))].sort();
  return`<span class="chip"><i style="background:${COLORS[Math.max(0,kinds.indexOf(it.kind||""))%COLORS.length]}"></i>${esc(it.name||"Bez názvu")}</span>`;};
const invSort=(a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||0)-(a.createdAt||0);   /* najnovšie hore, bez dátumu na konci */
function invMoveLi(m){return`<li data-open="invMoves:${esc(m.id)}"><span class="t">${esc(m.who||"Bez mena")}</span>${chip("ipay",m.pay)}<span class="meta">${fdateS(m.date)||""}</span><span class="num">${invQty(m)} ks</span></li>`;}
function invItemCalc(it){const M=S.d.invMoves.filter(m=>m.itemId===it.id),q=p=>sum(M.filter(m=>p(m.pay)),invQty);
  const sold=q(p=>INV_PAID.includes(p)),free=q(p=>p==="zadarmo"),shop=q(p=>p==="predaj"),out=sum(M,invQty);
  return{M,sold,free,shop,out,left:it.made==null||it.made===""?null:(+it.made||0)-out,earned:sum(M.filter(m=>INV_PAID.includes(m.pay)),m=>m.amount)};}
function invItemExtra(it){const c=invItemCalc(it);
  return`<div class="sec"><div class="facts" style="margin:0"><div><span>Vydané spolu</span><b>${c.out} ks</b></div><div><span>Ostáva</span><b class="${c.left!=null&&c.left<0?"neg":""}">${c.left==null?"—":c.left+" ks"}</b></div><div><span>Zarobené</span><b>${eur(c.earned)}</b></div></div></div>`
    +miniList("Výdaj","invMoves",[...c.M].sort(invSort),invMoveLi,{itemId:it.id});}
VIEWS.inventar=()=>{
  const f=S.inf,M=S.d.invMoves,items=[...S.d.invItems].sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  const wait=M.filter(m=>m.handover==="pripravene");
  const tabs=[["vydaj","Výdaj",M.length],["odovzdat","Na odovzdanie",wait.length],["sklad","Sklad",items.length]];
  if(!tabs.some(t=>t[0]===f.tab))f.tab="vydaj";
  const paid=p=>sum(M.filter(m=>m.pay===p),m=>m.amount);
  const head=`<div class="head"><div><h1>Inventár</h1><p class="sub">Predaj a rozdávanie – risografiky, pohľadnice, mapy a ďalšie veci</p></div>
    <div class="row"><button class="btn" data-create="invItems">Nový predmet</button><button class="btn pri" data-create="invMoves"${f.item?` data-defs='${esc(JSON.stringify({itemId:f.item}))}'`:""}>Zapísať výdaj</button></div></div>
  <div class="strip"><div><b>${eur(paid("hotovost")+paid("darujme"))}</b><span>zarobené spolu</span></div><div><b>${eur(paid("hotovost"))}</b><span>v hotovosti</span></div><div><b>${eur(paid("darujme"))}</b><span>cez Darujme.sk</span></div><div><b>${wait.length}</b><span>čaká na odovzdanie</span></div></div>
  <div class="ctbar"><div class="ptabs" role="tablist" style="margin:0">${tabs.map(([k,l,n])=>`<button role="tab" data-itab="${k}" aria-selected="${f.tab===k}">${l}<span>${n||""}</span></button>`).join("")}</div>${f.tab==="sklad"?"":`<div class="ctools"><input type="search" id="if-q" placeholder="Hľadať meno alebo poznámku" value="${esc(f.q||"")}">
    <select id="if-item" aria-label="Predmet"><option value="">Všetky predmety</option>${items.map(it=>`<option value="${esc(it.id)}" ${f.item===it.id?"selected":""}>${esc(it.name||"Bez názvu")}</option>`).join("")}</select>
    <select id="if-pay" aria-label="Platba"><option value="">Všetky platby</option>${OPT.ipay.map(o=>`<option value="${o[0]}" ${f.pay===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></div>`}</div>`;
  if(f.tab==="sklad"){
    const C={};items.forEach(it=>C[it.id]=invItemCalc(it));const n=v=>v?String(v):"";
    return head+`<div class="panel">${items.length?table([
      ["Predmet",it=>`<span class="cut">${esc(it.name||"Bez názvu")}</span>`,"t"],["Druh",it=>esc(it.kind||"")],["Cena za kus",it=>+it.price?eur(it.price):"","num"],["Vyrobené",it=>it.made==null||it.made===""?"":esc(it.made),"num"],
      ["Predané",it=>n(C[it.id].sold),"num"],["Zadarmo",it=>n(C[it.id].free),"num"],["U predajcov",it=>n(C[it.id].shop),"num"],
      ["Ostáva",it=>{const l=C[it.id].left;return l==null?`<span class="meta">—</span>`:`<b class="${l<0?"neg":""}">${l}</b>`;},"num"],["Zarobené",it=>C[it.id].earned?eur(C[it.id].earned):"","num"]
    ],items,it=>"invItems:"+esc(it.id),`<td colspan="4">Spolu</td><td class="num">${sum(items,it=>C[it.id].sold)}</td><td class="num">${sum(items,it=>C[it.id].free)}</td><td class="num">${sum(items,it=>C[it.id].shop)}</td><td></td><td class="num">${eur(sum(items,it=>C[it.id].earned))}</td>`)
      :`<div class="empty">Zatiaľ žiadne predmety. Pridajte prvý tlačidlom „Nový predmet“ – napríklad risografiku alebo pohľadnicu.</div>`}</div>
    <p class="small muted" style="margin:10px 2px 0">„Ostáva“ sa počíta, keď má predmet vyplnené „Vyrobené kusy“. „U predajcov“ sú kusy nechané na predaj (platba „Predáva sa“).</p>`;
  }
  const q=(f.q||"").toLowerCase();
  const list=(f.tab==="odovzdat"?wait:M).filter(m=>(!f.item||m.itemId===f.item)&&(!f.pay||m.pay===f.pay)&&(!q||[m.who,m.note,m.email].join(" ").toLowerCase().includes(q))).sort(invSort);
  return head+`<div class="panel">${list.length?table([
    ["Dátum",m=>`<span class="meta">${fdateS(m.date)}</span>`],["Komu",m=>`<span class="cut">${esc(m.who||"Bez mena")}</span>`,"t"],["Predmet",m=>invItemChip(m.itemId)],["ks",m=>invQty(m)||"","num"],
    ["Suma",m=>+m.amount?eur(m.amount):"","num"],["Platba",m=>chip("ipay",m.pay)],["Odovzdanie",m=>chip("ihand",m.handover)],["Poznámka",m=>`<span class="meta" style="white-space:normal">${esc(m.note||"")}</span>`]
  ],list,m=>"invMoves:"+esc(m.id),`<td colspan="3">Spolu</td><td class="num">${sum(list,invQty)}</td><td class="num">${eur(sum(list.filter(m=>INV_PAID.includes(m.pay)),m=>m.amount))}</td><td colspan="3"></td>`)
    :`<div class="empty">${M.length?(f.tab==="odovzdat"&&!q&&!f.item&&!f.pay?"Všetko je odovzdané.":"V tomto filtri nič nie je."):"Zatiaľ žiadny výdaj. Zapíšte prvý tlačidlom „Zapísať výdaj“."}</div>`}</div>`;
};
