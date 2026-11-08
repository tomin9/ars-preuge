/* ===== Zoznamy a nastavenia: farby štítkov, stavy (OPT), údaje združenia (ORG), druhy záznamov a ich polia (ENT), stav aplikácie (S).
   Časť spoločného programu – plugin ju vloží do app/index.html na miesto riadku //@subor js/00-nastavenia.js. Nie je to samostatný skript. ===== */
/* ================= constants ================= */
const GRAY="#8A8F98",BLUE="#3B5BD9",GREEN="#2B8A5F",OCHRE="#C08A12",RED="#C2372E",PURPLE="#8A3B9E",ORANGE="#D2691E",TEAL="#0F8A80",PINK="#C2457A";
const OPT={
  pstat:[["napad","Nápad",GRAY],["priprava","V príprave",OCHRE],["prebieha","Prebieha",BLUE],["dokoncene","Dokončené",GREEN],["pozastavene","Pozastavené",RED]],
  gstat:[["napad","Nápad",GRAY],["priprava","Píšeme žiadosť",OCHRE],["podane","Podané",ORANGE],["schvalene","Schválené",BLUE],["zrealizovane","Zrealizované",TEAL],["vyuctovane","Vyúčtované",GREEN],["nepodporene","Nepodporené",RED],["pozastavene","Pozastavené",PURPLE]],
  estat:[["napad","Nápad",GRAY],["priprava","V príprave",OCHRE],["prebieha","Prebieha",BLUE],["zrealizovane","Zrealizované",GREEN],["zrusene","Zrušené",RED]],
  tstat:[["inbox","Inbox",GRAY],["tyzden","Tento týždeň",BLUE],["rozpracovane","Rozpracované",ORANGE],["hotove","Hotové",GREEN]],
  prio:[["urgentne","Urgentné",RED],["normalne","Normálne",OCHRE],["nizka","Nízka",GREEN]],
  org:[["ars","Ars Preuge",PURPLE],["kass","KaSS",BLUE]],
  ltype:[["vydavok","Výdavok",RED],["prijem","Príjem",GREEN]],
  acct:[["banka","Banka",BLUE],["hotovost","Hotovosť",PINK]],
  lstate:[["kryte","Kryté",GREEN],["nevybavene","Nevybavené",RED],["barter","Barter",ORANGE]],
  crole:[["tim","Člen tímu",BLUE],["umelec","Umelec",PINK],["partner","Partner",GREEN],["dodavatel","Dodávateľ",ORANGE],["medium","Médium",OCHRE],["institucia","Inštitúcia",GRAY],["firma","Firma",PURPLE],["externy","Externý",TEAL],["dobrovolnik","Dobrovoľník",GREEN],["sponzor","Sponzor",PURPLE],["mediapartner","Mediálny partner",OCHRE]],
  csrc:[["email","E-mail",BLUE],["osobne","Osobne",GREEN],["telefon","Telefonicky",OCHRE],["facebook","Facebook",BLUE],["instagram","Instagram",PINK],["ine","Iné",GRAY]],
  pstav:[["oslovit","Osloviť",GRAY],["osloveny","Oslovení",OCHRE],["potvrdeny","Potvrdení",GREEN],["odmietnuty","Odmietnutí",RED]],
  ctype:[["osoba","Osoba",BLUE],["firma","Firma",PURPLE],["organizacia","Organizácia",RED],["media","Média",ORANGE]],
  pkind:[["dielo","Umelecké dielo",BLUE],["sprievodny","Sprievodný program",PURPLE]],
  psec:[["Objekty a svetelné inštalácie","Objekty a svetelné inštalácie",BLUE],["Nové sgrafitá","Nové sgrafitá",GREEN],["Galéria ulice","Galéria ulice",OCHRE],["Živé sgrafitá","Živé sgrafitá",RED],["Sprievodný program","Sprievodný program",PURPLE]],
  pday:[["oba","Piatok aj sobota",GRAY],["piatok","Piatok",BLUE],["sobota","Sobota",PURPLE]],
  pst:[["nevybavene","Nevybavené",GRAY],["riesi","V riešení",OCHRE],["pripravene","Pripravené",GREEN]]
};
const DEF_TTYPES=["Plagát","Podklady","Grafika","Web/Social","Fotenie","Tlač","Produkcia","Administratíva","Iné"];
const DEF_CATS=["Honoráre","Materiál","Služby","Technika","Propagácia","Tlač","Cestovné","Prenájom","Ubytovanie","Občerstvenie","Bankové poplatky","Dotácia","Dar / sponzoring","Vstupné","Členské","Iné"];
const GRANT_CL=["Žiadosť podaná","Rozhodnutie o pridelení","Zmluva podpísaná","Dotácia prijatá na účet","Publicita – logo poskytovateľa na výstupoch","Realizácia ukončená","Vyúčtovanie odoslané","Záverečná správa odoslaná"];
const COLORS=["#2F4DB8","#A97A0F","#2B7A57","#8A3B9E","#C2410C","#0F766E","#6B7280","#B4235B"];
const ORG={name:"Ars Preuge, o. z.",ico:"42147018",dic:"2023110408",seat:"Veľkolehotská cesta 2994/6, 971 01 Prievidza",form:"Združenie (zväz, spolok)",since:"25. 11. 2009"};

const ENT={
  projects:{col:"projects",one:"Projekt",many:"Projekty",title:"name",fields:[
    {k:"place",l:"Miesto",t:"text"},{k:"cover",l:"Titulný obrázok",t:"image"},{k:"color",l:"Farba",t:"color"},{k:"desc",l:"Popis",t:"long"}]},
  grants:{col:"grants",one:"Grant",many:"Granty",title:"name",fields:[
    {k:"cover",l:"Obrázok",t:"image"},{k:"status",l:"Stav",t:"sel",o:"gstat"},{k:"providerId",l:"Poskytovateľ",t:"rel",e:"contacts"},{k:"program",l:"Program / výzva",t:"text"},{k:"callNo",l:"Číslo výzvy",t:"text",ph:"napr. Výzva č. 1/2027"},{k:"callOpen",l:"Podávanie žiadostí od",t:"date"},{k:"callMin",l:"Minimálna dotácia",t:"money"},{k:"callMax",l:"Maximálna dotácia",t:"money"},{k:"cofinPct",l:"Spolufinancovanie žiadateľa",t:"text",ph:"napr. 10 % z rozpočtu projektu"},{k:"spendFrom",l:"Čerpanie od",t:"date"},
    {k:"projectId",l:"Projekt",t:"rel",e:"projects"},{k:"lead",l:"Zodpovedný",t:"person"},
    {k:"submitTo",l:"Uzávierka žiadosti",t:"date"},{k:"realFrom",l:"Realizácia od",t:"date"},{k:"realTo",l:"Realizácia do",t:"date"},{k:"settleDue",l:"Termín vyúčtovania",t:"date"},
    {k:"requested",l:"Žiadaná suma",t:"money"},{k:"approved",l:"Schválená suma",t:"money"},{k:"totalBudget",l:"Celkový rozpočet",t:"money"},{k:"cofinReq",l:"Povinné spolufinancovanie",t:"money"},{k:"shiftPct",l:"Povolený presun medzi kategóriami (%)",t:"num"},
    {k:"contractNo",l:"Číslo zmluvy",t:"text"},{k:"callUrl",l:"Výzva",t:"url"},{k:"formUrl",l:"Žiadosť / systém",t:"url"},{k:"driveFolder",l:"Priečinok na Disku",t:"url"},{k:"note",l:"Poznámka",t:"long"}]},
  events:{col:"events",one:"Podujatie",many:"Podujatia",title:"name",fields:[
    {k:"cover",l:"Plagát / obrázok",t:"image"},{k:"status",l:"Stav",t:"sel",o:"estat"},{k:"date",l:"Dátum",t:"date"},{k:"dateTo",l:"Do (viacdňové)",t:"date"},{k:"time",l:"Čas",t:"text",ph:"napr. 17.00 – 23.00"},
    {k:"place",l:"Miesto",t:"text"},{k:"projectId",l:"Projekt",t:"rel",e:"projects"},{k:"grantIds",l:"Granty",t:"mrel",e:"grants"},
    {k:"lead",l:"Zodpovedný",t:"person"},{k:"visitors",l:"Návštevnosť",t:"num"},{k:"url",l:"Odkaz",t:"url"},{k:"driveFolder",l:"Priečinok na Disku",t:"url"},{k:"note",l:"Poznámky",t:"long"}]},
  tasks:{col:"tasks",one:"Úloha",many:"Úlohy",title:"title",fields:[
    {k:"status",l:"Stav",t:"sel",o:"tstat"},{k:"assignee",l:"Zodpovedný",t:"person"},{k:"due",l:"Termín",t:"date"},
    {k:"priority",l:"Priorita",t:"sel",o:"prio"},{k:"projectId",l:"Projekt",t:"rel",e:"projects"},{k:"grantId",l:"Grant",t:"rel",e:"grants"},
    {k:"eventId",l:"Podujatie",t:"rel",e:"events"},{k:"contactIds",l:"Ľudia",t:"mrel",e:"contacts"},{k:"types",l:"Typ",t:"multi",src:"ttypes"},{k:"org",l:"Organizácia",t:"sel",o:"org"},
    {k:"from",l:"Od koho",t:"text"},{k:"note",l:"Poznámka",t:"long"}]},
  ledger:{col:"transactions",one:"Platba",many:"Peňažný denník",title:"desc",fields:[
    {k:"type",l:"Typ",t:"sel",o:"ltype",req:1},{k:"amount",l:"Suma",t:"money"},{k:"date",l:"Dátum",t:"date"},
    {k:"account",l:"Účet",t:"sel",o:"acct",req:1},{k:"docNo",l:"Doklad č.",t:"text"},{k:"contactId",l:"Komu / od koho",t:"rel",e:"contacts"},
    {k:"projectId",l:"Projekt",t:"rel",e:"projects"},{k:"grantId",l:"Grant",t:"rel",e:"grants"},{k:"cofinGrantId",l:"Spolufinancovanie",t:"rel",e:"grants"},{k:"lineId",l:"Rozpočtová položka",t:"rel",e:"lines"},
    {k:"eventId",l:"Podujatie",t:"rel",e:"events"},{k:"taskId",l:"Úloha",t:"rel",e:"tasks"},{k:"category",l:"Kategória",t:"sel",src:"cats"},{k:"state",l:"Stav",t:"sel",o:"lstate"},
    {k:"note",l:"Poznámka",t:"long"}]},
  lines:{col:"budgetLines",one:"Rozpočtová položka",many:"Rozpočtové položky",title:"name",fields:[
    {k:"grantId",l:"Grant",t:"rel",e:"grants"},{k:"category",l:"Kategória",t:"text",ph:"napr. Honoráre"},{k:"total",l:"Celkové náklady",t:"money"},{k:"fromGrant",l:"Z dotácie",t:"money"},{k:"note",l:"Poznámka",t:"long"}]},
  contacts:{col:"contacts",one:"Kontakt",many:"Kontakty",title:"name",fields:[
    {k:"ctype",l:"Typ",t:"sel",o:"ctype"},{k:"tags",l:"Rola",t:"tags"},{k:"source",l:"Oslovil nás cez",t:"sel",o:"csrc"},{k:"orgIds",l:"Organizácie",t:"orgs",only:"osoba"},{k:"position",l:"Funkcia",t:"text"},
    {k:"email",l:"E-mail",t:"email"},{k:"phone",l:"Telefón",t:"tel"},{k:"legalName",l:"Názov",t:"text",only:"!osoba"},{k:"titleBefore",l:"Titul pred",t:"text",ph:"napr. Mgr. art.",only:"osoba"},{k:"titleAfter",l:"Titul za",t:"text",ph:"napr. PhD.",only:"osoba"},{k:"address",l:"Sídlo",t:"text"},{k:"birthDate",l:"Narodený",t:"date",only:"osoba"},{k:"idNo",l:"Číslo OP",t:"text",only:"osoba"},{k:"birthNo",l:"Rodné číslo",t:"text",ph:"napr. 925808/8367",only:"osoba"},{k:"iban",l:"IBAN",t:"text",ph:"SK00 0000 0000 0000 0000 0000"},{k:"ico",l:"IČO",t:"text"},{k:"dic",l:"DIČ",t:"text"},{k:"icdph",l:"IČ DPH",t:"text"},
    {k:"projectIds",l:"Projekty",t:"mrel",e:"projects"},{k:"grantIds",l:"Granty",t:"mrel",e:"grants"},{k:"eventIds",l:"Podujatia",t:"mrel",e:"events"},{k:"note",l:"Poznámka",t:"long"}]},
  partnerships:{col:"partnerships",one:"Spolupráca",many:"Spolupráce",title:"state",fields:[]},
  prog:{col:"programItems",one:"Prvok programu",many:"Program",title:"title",fields:[
    {k:"status",l:"Stav",t:"sel",o:"pst"},{k:"kind",l:"Druh",t:"sel",o:"pkind"},{k:"section",l:"Kategória",t:"sel",o:"psec"},{k:"author",l:"Autor / účinkujúci",t:"text"},{k:"contactId",l:"Autor – kontakt",t:"rel",e:"contacts"},
    {k:"day",l:"Deň",t:"sel",o:"pday"},{k:"time",l:"Čas",t:"text",ph:"napr. 17.00 – 22.00"},{k:"place",l:"Miesto",t:"text"},
    {k:"prepId",l:"Pripravuje",t:"rel",e:"contacts"},{k:"noGuard",l:"Netreba strážiť",t:"check"},{k:"guardFri",l:"Stráži – piatok",t:"rel",e:"contacts"},{k:"guardSat",l:"Stráži – sobota",t:"rel",e:"contacts"},
    {k:"needOrg",l:"Organizačne treba",t:"long"},{k:"needMat",l:"Materiál a technika",t:"long"},{k:"eventId",l:"Podujatie",t:"rel",e:"events"},{k:"note",l:"Poznámka",t:"long"}]},
  zab:{col:"zabezpecenie",one:"Dielo",many:"Zabezpečenie",title:"title",fields:[]},
  zabd:{col:"zabdodavky",one:"Dodávka",many:"Dodávky",title:"nazov",fields:[]},
  comments:{col:"comments"}
};
const KEYS=Object.keys(ENT);

/* ================= state ================= */
const S={d:{},settings:{},people:{},me:null,view:"prehlad",id:null,live:false,loading:true,readOnly:false,
  tf:{project:"",who:"",org:"",type:"",q:"",mode:"board",allDone:false},
  gf:{mode:"board"}, ef:{past:false}, ff:{tab:"dennik",year:String(new Date().getFullYear()),acct:"",type:"",project:"",grant:"",q:""},
  cf:{q:"",role:""}, pf:"aktivne", cal:null};
KEYS.forEach(k=>S.d[k]=[]);
let db=null,user=null,dl=null,assets=null,mcp=null;

