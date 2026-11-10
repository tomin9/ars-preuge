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
/* ----- prepojenie predaja s platbou vo Financiách: výdaj má txId; v platbe je karta so zoznamom priradených predajov ----- */
const invTxOf=m=>m.txId?get("ledger",m.txId):null;
function invTxCard(r){
  if(!accReadA("inventar"))return"";
  const L=S.d.invMoves.filter(m=>m.txId===r.id).sort(invSort);
  if(!L.length&&r.type!=="prijem")return"";
  const tot=sum(L,m=>m.amount),free=S.d.invMoves.filter(m=>!m.txId&&INV_PAID.includes(m.pay)&&+m.amount).sort(invSort),ed=accEditA("inventar")&&!S.readOnly;
  const it=m=>{const x=get("invItems",m.itemId);return x?x.name||"":"";};
  return`<section class="dcard lkc"><h3 style="margin-bottom:6px"><span class="lkh">${DI.tag}Predaj z inventára</span>${L.length?`<span class="meta">${eur(tot)}${+r.amount&&Math.abs(tot-(+r.amount||0))>0.004?` z ${eur(r.amount)}`:""}</span>`:""}</h3>
    ${L.length?`<ul class="items lk">${L.map(m=>`<li data-open="invMoves:${esc(m.id)}"><span class="t">${esc(m.who||"Bez mena")}<span class="meta" style="margin-left:6px">${esc(it(m))}</span></span><span class="num">${eur(m.amount)}</span>${ed?`<button type="button" class="icb" data-invuntx="${esc(m.id)}" title="Zrušiť priradenie" aria-label="Zrušiť priradenie">×</button>`:""}</li>`).join("")}</ul>`:`<p class="meta" style="margin:0 0 6px;white-space:normal">K tejto platbe zatiaľ nie je priradený žiadny predaj z Inventára.</p>`}
    ${ed&&free.length?`<select data-invtx="1" aria-label="Priradiť predaj" style="margin-top:6px;width:100%"><option value="">+ priradiť predaj…</option>${free.map(m=>`<option value="${esc(m.id)}">${esc([fdateS(m.date),m.who||"Bez mena",it(m),eur(m.amount),optL("ipay",m.pay)].filter(Boolean).join(" · "))}</option>`).join("")}</select>`:""}</section>`;}
function invMoveLi(m){return`<li data-open="invMoves:${esc(m.id)}"><span class="t">${esc(m.who||"Bez mena")}</span>${chip("ipay",m.pay)}<span class="meta">${fdateS(m.date)||""}</span><span class="num">${invQty(m)} ks</span></li>`;}
function invItemCalc(it){const M=S.d.invMoves.filter(m=>m.itemId===it.id),q=p=>sum(M.filter(m=>p(m.pay)),invQty);
  const sold=q(p=>INV_PAID.includes(p)),free=q(p=>p==="zadarmo"),shop=q(p=>p==="predaj"),out=sum(M,invQty);
  return{M,sold,free,shop,out,left:it.made==null||it.made===""?null:(+it.made||0)-out,earned:sum(M.filter(m=>INV_PAID.includes(m.pay)),m=>m.amount)};}
function invItemExtra(it){const c=invItemCalc(it);
  return`<div class="sec"><div class="facts" style="margin:0"><div><span>Vydané spolu</span><b>${c.out} ks</b></div><div><span>Ostáva</span><b class="${c.left!=null&&c.left<0?"neg":""}">${c.left==null?"—":c.left+" ks"}</b></div><div><span>Zarobené</span><b>${eur(c.earned)}</b></div></div></div>`
    +miniList("Výdaj","invMoves",[...c.M].sort(invSort),invMoveLi,{itemId:it.id});}
/* ----- Technika: naše veci + čo treba zohnať a čo je požičané (z riadkov techniky pri dielach v Zabezpečení) ----- */
const invTechByName=n=>{const k=zbKey(n);return k?S.d.invTech.find(t=>zbKey(t.name)===k)||null:null;};
const invTechRows=()=>zbList().flatMap(x=>(x.technika||[]).map((r,i)=>({x,r,i})).filter(a=>a.r.nazov));   /* všetky riadky techniky pri dielach */
/* každý kus je samostatný záznam; rovnaký názov = jedna vec s viacerými kusmi */
const invPieces=t=>{const k=zbKey(t&&t.name);return k?S.d.invTech.filter(x=>zbKey(x.name)===k).sort((a,b)=>(a.code||"").localeCompare(b.code||"","sk",{numeric:true})||(a.createdAt||0)-(b.createdAt||0)):[t];};
function invTechCalc(t){const k=zbKey(t.name),P=invPieces(t),A=invTechRows().filter(a=>zbTyp(a.r)==="nase"&&zbKey(a.r.nazov)===k),used=sum(A,a=>zbNum(a.r.ks||1));return{P,A,used,have:P.length,free:P.length-used,fix:P.filter(x=>x.state==="oprava").length};}
function invTechWarn(name){const t=invTechByName(name);if(!t)return;const c=invTechCalc(t);if(c.free<0)toast(`„${t.name}“: pri dielach je pridelených o ${-c.free} ks viac, než máme v inventári (${c.have} ks).`,6000);}
/* do 1.104: jeden záznam s počtom kusov (qty) → rozdeliť na samostatné kusy; id kusov sú odvodené, takže dvaja naraz zapíšu to isté */
function invTechSplit(){
  if(S.readOnly||S.loading||!db||S.invSplit||!accEditA("inventar"))return;
  const L=S.d.invTech.filter(t=>t.qty!=null&&t.qty!=="");if(!L.length)return;S.invSplit=true;
  (async()=>{for(const t of L){const n=Math.max(1,Math.round(+t.qty||1));
    for(let i=2;i<=n;i++)await write(async()=>{const now=Date.now();const d={name:t.name||"",kind:t.kind||"",place:t.place||"",state:t.state||"ok",note:t.note||"",createdAt:(t.createdAt||now)+i,updatedAt:now};if(meId())Object.assign(d,{createdBy:meId(),updatedBy:meId()});await db.collection(ENT.invTech.col).doc(t.id+"_k"+i).set(d);});
    await upd("invTech",t.id,{qty:null});}})();
}
const invWork=a=>`<button type="button" class="btn ghost sm" style="padding:2px 6px" data-open="zab:${esc(a.x.id)}" title="Otvoriť Zabezpečenie">č. ${esc(a.x.ord||"")} ${esc(a.x.title||"")}</button>`;
function invTechExtra(t){const c=invTechCalc(t);
  const pc=`<div class="sec"><h3>Kusy tejto veci<span class="row" style="gap:6px"><span class="meta">${c.have}</span><button class="btn ghost sm" data-create="invTech" data-defs='${esc(JSON.stringify({name:t.name||"",kind:t.kind||"",place:t.place||""}))}'>+ Pridať kus</button></span></h3>
    <ul class="items">${c.P.map((x,n)=>`<li data-open="invTech:${esc(x.id)}"${x.id===t.id?' aria-current="true" style="background:var(--surface3)"':""}><span class="t">${esc(x.code||("Kus "+(n+1)))}</span>${x.place?`<span class="meta">${esc(x.place)}</span>`:""}${chip("istate",x.state||"ok")}</li>`).join("")}</ul>
    <p class="meta" style="margin:6px 0 0;white-space:normal">Kusy s rovnakým názvom patria k jednej veci. Keď kusu zmeníte názov, stane sa z neho samostatná vec.</p></div>`;
  return pc+`<div class="sec"><div class="facts" style="margin:0"><div><span>Máme</span><b>${c.have} ks</b></div><div><span>Pridelené</span><b>${c.used} ks</b></div><div><span>Voľné</span><b class="${c.free<0?"neg":""}">${c.free} ks</b></div></div></div>
  <div class="sec"><h3>Kde je pridelené<span class="meta">${c.A.length||""}</span></h3>${c.A.length?`<ul class="items">${c.A.map(a=>`<li data-open="zab:${esc(a.x.id)}"><span class="t">č. ${esc(a.x.ord||"")} ${esc(a.x.title||"")}</span><span class="num">${zbNum(a.r.ks||1)} ks</span></li>`).join("")}</ul>`:`<div class="empty">Zatiaľ nikde. Pridelíte pri diele v Zabezpečení – do poľa „Položka“ napíšte názov tejto veci.</div>`}</div>`;}
function invTechView(head){
  invTechSplit();
  const f=S.inf,R=invTechRows(),items=[...new Map(S.d.invTech.map(t=>[zbKey(t.name)||t.id,t])).values()].sort((a,b)=>(a.kind||"").localeCompare(b.kind||"","sk")||(a.name||"").localeCompare(b.name||"","sk"));
  const need=R.filter(a=>!a.r.ok&&((zbTyp(a.r)===""&&!zbKey(a.r.zdroj))||zbTyp(a.r)==="objednane"));
  /* požičané / darované: dodávky (zabd) + riadky, ktoré ešte dodávkou nie sú */
  const G={},grp=n=>{const k=zbKey(n);return G[k]||(G[k]={k,name:String(n||"").trim().replace(/\s+/g," "),L:[]});};
  const alloc={};R.forEach(a=>{if(a.r.supplyId)(alloc[a.r.supplyId]=alloc[a.r.supplyId]||[]).push(a);});
  S.d.zabd.forEach(d=>grp(d.kto).L.push({n:d.nazov,ks:zbNum(d.ks),typ:d.typ,ok:!!d.ok,A:alloc[d.id]||[]}));
  R.forEach(a=>{const t=zbTyp(a.r);if(a.r.supplyId||!(zbLent(a.r)||(t===""&&zbKey(a.r.zdroj))))return;grp(a.r.zdroj).L.push({n:a.r.nazov,ks:zbNum(a.r.ks||1),typ:t,ok:!!a.r.ok,A:[a]});});
  const lent=Object.values(G).sort((a,b)=>!a.k-!b.k||a.name.localeCompare(b.name,"sk"));
  const tabs=[["nase","Naše",items.length],["zohnat","Zohnať",need.length],["pozicane","Požičané",lent.length]];
  if(!tabs.some(t=>t[0]===f.ttab))f.ttab="nase";
  const bar=`<div class="ctbar"><div class="ptabs" role="tablist" style="margin:0">${tabs.map(([k,l,n])=>`<button role="tab" data-ittab="${k}" aria-selected="${f.ttab===k}">${l}<span>${n||""}</span></button>`).join("")}</div></div>`;
  if(f.ttab==="zohnat")return head+bar+`<div class="panel">${need.length?table([
      ["Položka",a=>`<span class="cut">${esc(a.r.nazov)}</span>`,"t"],["ks",a=>zbNum(a.r.ks||1),"num"],
      ["Stav",a=>zbTyp(a.r)==="objednane"?`<span class="chip"><i style="background:${BLUE}"></i>Objednané</span>`:`<span class="chip"><i style="background:${RED}"></i>Treba zohnať</span>`],
      ["Kam",a=>`<span class="meta">č. ${esc(a.x.ord||"")} ${esc(a.x.title||"")}</span>`],["Od koho / kde",a=>esc(a.r.zdroj||"")]
    ],need,a=>"zab:"+esc(a.x.id),`<td>Spolu</td><td class="num">${sum(need,a=>zbNum(a.r.ks||1))}</td><td colspan="3"></td>`)
    :`<div class="empty">Nič netreba zháňať – všetky položky pri dielach majú zdroj alebo sú zabezpečené.</div>`}</div>
    <p class="small muted" style="margin:10px 2px 0">Sú tu položky pri dielach v Zabezpečení, ktoré nie sú z nášho inventára a nemajú vyplnené „od koho“, a položky s druhom „objednané“. Keď pri položke doplníte, od koho je, presunie sa do Požičané; keď ju odškrtnete ako zabezpečenú, zo zoznamu zmizne.</p>`;
  if(f.ttab==="pozicane")return head+bar+`<div class="panel">${lent.length?`<div class="tw"><table><thead><tr><th class="t">Od koho</th><th>Čo a kam to ide</th><th class="num">ks</th></tr></thead><tbody>${lent.map(g=>{const c=g.k?S.d.contacts.find(x=>zbKey(x.name)===g.k):null;
      return`<tr${c?` data-open="contacts:${esc(c.id)}"`:""}><td class="t">${g.k?(c?`<span class="cut">${cIcon(c)}${esc(c.name)}</span>`:`<span class="cut">${esc(g.name)}</span><div class="meta">nie je v kontaktoch</div>`):`<span class="meta">nezadané, od koho</span>`}</td>
      <td style="white-space:normal">${g.L.map(l=>`<div style="margin:3px 0"><b>${esc(l.n||"")}</b> · ${l.ks} ks${l.typ==="darovane"?` <span class="chip"><i style="background:${GREEN}"></i>darované</span>`:""}${l.ok?` <span class="chip"><i style="background:${GREEN}"></i>máme</span>`:` <span class="chip"><i style="background:${OCHRE}"></i>čaká</span>`} ${l.A.map(invWork).join(" ")}</div>`).join("")}</td>
      <td class="num">${sum(g.L,l=>l.ks)}</td></tr>`;}).join("")}</tbody></table></div>`
    :`<div class="empty">Zatiaľ nič požičané. Pri diele v Zabezpečení vyplňte pri položke „od koho“ a objaví sa tu.</div>`}</div>`;
  const C={};items.forEach(t=>C[t.id]=invTechCalc(t));
  return head+bar+`<div class="panel">${items.length?table([
      ["Vec",t=>`<span class="cut">${esc(t.name||"Bez názvu")}</span>`,"t"],["Druh",t=>esc(t.kind||"")],["Máme",t=>C[t.id].have,"num"],["Pridelené",t=>C[t.id].used||"","num"],
      ["Voľné",t=>`<b class="${C[t.id].free<0?"neg":""}">${C[t.id].free}</b>`,"num"],["Kde je uložené",t=>esc([...new Set(C[t.id].P.map(x=>x.place).filter(Boolean))].join(", "))],
      ["Stav",t=>C[t.id].fix?`<span class="chip"><i style="background:${optC("istate","oprava")}"></i>${C[t.id].fix===C[t.id].have?"Treba opraviť":C[t.id].fix+" ks treba opraviť"}</span>`:""]
    ],items,t=>"invTech:"+esc(C[t.id].P[0].id))
    :`<div class="empty">Zatiaľ žiadne veci. Pridajte prvú tlačidlom „Nová vec“ – napríklad LED panel alebo kábel 30 m. Ďalšie kusy pridáte v jej paneli („+ Pridať kus“).</div>`}</div>
    <p class="small muted" style="margin:10px 2px 0">Vec pridelíte pri diele v Zabezpečení: do poľa „Položka“ začnite písať jej názov a vyberte ju z ponuky – riadok dostane druh „naše“ a kusy sa tu odpočítajú z voľných.</p>`;
}
VIEWS.inventar=()=>{
  const f=S.inf,M=S.d.invMoves,items=[...S.d.invItems].sort((a,b)=>(a.name||"").localeCompare(b.name||"","sk"));
  const wait=M.filter(m=>m.handover==="pripravene");
  const tabs=[["vydaj","Výdaj",M.length],["odovzdat","Na odovzdanie",wait.length],["sklad","Sklad",items.length]];
  if(!tabs.some(t=>t[0]===f.tab))f.tab="vydaj";
  const paid=p=>sum(M.filter(m=>m.pay===p),m=>m.amount);
  const sec=`<div class="tabs" style="margin-bottom:18px">${[["predaj","Predaj"],["technika","Technika"]].map(([k,l])=>`<button data-isec="${k}" aria-pressed="${(f.sec==="technika"?"technika":"predaj")===k}">${l}</button>`).join("")}</div>`;
  if(f.sec==="technika")return invTechView(`<div class="head"><div><h1>Inventár</h1><p class="sub">Technika – čo máme, čo treba zohnať a čo máme požičané</p></div>
    <div class="row"><button class="btn pri" data-create="invTech">Nová vec</button></div></div>${sec}`);
  const head=`<div class="head"><div><h1>Inventár</h1><p class="sub">Predaj a rozdávanie – risografiky, pohľadnice, mapy a ďalšie veci</p></div>
    <div class="row"><button class="btn" data-create="invItems">Nový predmet</button><button class="btn pri" data-create="invMoves"${f.item?` data-defs='${esc(JSON.stringify({itemId:f.item}))}'`:""}>Zapísať výdaj</button></div></div>${sec}
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
    ["Suma",m=>+m.amount?eur(m.amount):"","num"],["Platba",m=>chip("ipay",m.pay)+(invTxOf(m)?` <span class="meta" title="Priradené k platbe vo Financiách">✓ vo Financiách</span>`:"")],["Odovzdanie",m=>chip("ihand",m.handover)],["Poznámka",m=>`<span class="meta" style="white-space:normal">${esc(m.note||"")}</span>`]
  ],list,m=>"invMoves:"+esc(m.id),`<td colspan="3">Spolu</td><td class="num">${sum(list,invQty)}</td><td class="num">${eur(sum(list.filter(m=>INV_PAID.includes(m.pay)),m=>m.amount))}</td><td colspan="3"></td>`)
    :`<div class="empty">${M.length?(f.tab==="odovzdat"&&!q&&!f.item&&!f.pay?"Všetko je odovzdané.":"V tomto filtri nič nie je."):"Zatiaľ žiadny výdaj. Zapíšte prvý tlačidlom „Zapísať výdaj“."}</div>`}</div>`;
};
