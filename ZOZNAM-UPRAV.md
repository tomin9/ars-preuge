# Zoznam úprav

Sem sa zapisuje všetko, čo treba v aplikácii opraviť alebo zjednotiť. Pri každej položke je **čo** nesedí, **kde** to je a **ako** to zjednotiť (podľa `DIZAJN.md`). Hotové veci sa odškrtnú `[x]`.

**Dôležitosť:** 🔴 vidno na prvý pohľad alebo to robí chyby · 🟡 nesúlad, ktorý si všimne pozorný používateľ · ⚪ upratovanie, navonok nevidno.

Súpis vznikol pri podrobnej prehliadke celého kódu (8. 11. 2026). Opravené body sú odškrtnuté s číslom verzie.

---

## A. Dizajn – veľké nezhody

- [ ] 🔴 **A1. Bočný panel má dve podoby.** Kontakt a platba majú novú, peknú podobu (vzor): ikonové tlačidlá ✎ 🗑 × vpravo hore a karty s ikonou a nadpisom (Údaje, Platby, Financovanie). Projekt, grant, podujatie, úloha, rozpočtová položka a prvok programu majú starú podobu: nad obsahom sivý nápis druhu záznamu, textové tlačidlá „Zmazať“ a „Zavrieť“, polia v jednej dlhej mriežke a prepojenia ako sivé oddiely bez kariet.
  *Kde:* `openDrawer`, `dProps`, `dExtra`, `linksHtml` (časť bočného panela v `app/index.html`).
  *Ako:* všetky záznamy podľa kontaktu (DIZAJN 12) – ikonové tlačidlá, polia rozdelené do kariet s ikonou, prepojenia ako karty.
  ✅ *Čiastočne vo verzii 1.68.0: bočný panel úlohy je v novej podobe (karty Termín a zodpovedný, Patrí k, Podúlohy, prepojenia, Komentáre; ikonové tlačidlá; prázdne polia ukáže ceruzka). Ostáva: rozpočtová položka, bod programu, rýchle panely grantu, podujatia a projektu.*

- [ ] 🔴 **A2. Hlavička detailu je na troch stránkach trikrát inak.**
  - *Podujatie* (vzor): obrázok vnútri karty vľavo, stavový štítok a ceruzka vpravo hore.
  - *Grant*: obrázok **nad** kartou cez celú šírku s tlačidlom „Upraviť“ na obrázku, pod ním karta s ďalším tlačidlom „Upraviť“ (slovom), farebným pruhom vľavo, šiestimi údajmi a časovou osou.
  - *Projekt*: žiadna karta – len obrázok, nadpis a tlačidlo „Upraviť“; nemá stav ani súhrn.
  *Ako:* grant a projekt podľa podujatia (DIZAJN 4 – Detail). Údaje grantu (žiadané, schválené, čerpané…) a časová os ostanú, len vnútri karty.
  ✅ *Grant hotový vo verzii 1.70.0 (karta ako pri podujatí, tri dokumenty v karte, ceruzka). Ostáva projekt.*

- [ ] 🔴 **A3. Farby štítkov sú mimo farieb aplikácie a v tmavom režime sa nemenia.** Aplikácia má jednu sadu farieb pre oba režimy (`--accent`, `--good`…), ale štítky, kalendár a grafy používajú ďalších **5 samostatných sád** napísaných priamo v programe: farby stavov (`GRAY`, `BLUE`, `GREEN`…), farby projektov (`COLORS`), farby ikon poskytovateľov (`PICOL`), farby vlastných rolí (`TAGPAL`) a prechody za kartami bez obrázka (`GRADS`). Modrá štítkov `#3B5BD9` ≠ modrá aplikácie `#2F4DB8`, zelená `#2B8A5F` ≠ `#2B7A57`, okrová `#C08A12` ≠ `#A97A0F`, červená `#C2372E` ≠ `#B3261E`.
  *Ako:* jedna sada farieb; štítky brať z pomenovaných farieb s tmavou verziou.

- [ ] 🟡 **A4. Ručne písané farby v štýloch** (nemenia sa v tmavom režime): prekročený pruh rozpočtu `.lbar.over` a stav `.lst` (`#C2372E`, `#C08A12`), kôš v bočnom paneli pri prechode `#E5484D` (ďalšia, tretia červená), počet filtrov `.fcount` biely `#fff`, okraj pri presúvaní záložky `#3B5BD9`.

- [x] 🟡 **A5. Neexistujúca farba `var(--text)`** pri odkazoch v tabuľkách (`.rlink:hover`) – správne `--ink`. ✅ *opravené vo verzii 1.67.0.*

## B. Dizajn – záložky, štítky, tlačidlá

- [ ] 🟡 **B1. Záložky mimo dvoch schválených druhov** (DIZAJN 8):
  - detail projektu má tabletky namiesto čiary (ako podujatie a grant),
  - Financie (aj Financie v projekte) majú **roky** ako tabletky a **pohľady** (Denník / Projekty / Kategórie) ako prepínač – pohľady sú vlastne záložky,
  - rozpočet podujatia má tretí druh záložiek (`evbtabs`, menšie, modré pozadie),
  - Zabezpečenie má dva prepínače pod sebou, druhý (Všetky / Neriešené / …) je v skutočnosti filter.

- [ ] 🟡 **B2. Päť druhov štítkov.** Okrem `chip` (stav) a `tg` (rola) sú ešte: `zb-stav` (stav diela v Zabezpečení ako farebný rozbaľovací štítok), `zb-rest` (zostatok dodávky), `zb-tag` (druh napájania) a `lst` (farebný text „v poriadku / prekročené“ v rozpočte). → zjednotiť na `chip` / `tg`.

- [ ] 🟡 **B3. `zb-tag` je v štýloch dvakrát** s rôznym vzhľadom; prelínajú sa, takže výsledok (modrý, s veľkými písmenami) nie je ani jeden zamýšľaný. Duplicitne sú aj `zb-chip`, `zb-list` a `.side .who`.

- [ ] 🟡 **B4. Tlačidlo „Upraviť“ je raz ceruzka, raz slovo.** Podujatie: ikonové tlačidlo s ceruzkou. Grant a projekt: tlačidlo so slovom „Upraviť“ (grant dokonca dvakrát). Kontakt v paneli: ceruzka bez rámika.

- [ ] 🟡 **B5. Pridávanie má asi desať podôb:** „+ Nový“ (tiché), „+ Pridať“ (tiché), „+ Úloha“ / „+ Položka“ / „+ Platba“ / „+ Podujatie“ (s rámikom), malé „+“ v nadpise tabuľky (`addic`), prerušované „+ Pridať položku“ (`zb-add`), „+ Nový partner“, pole „+ Nová časť“, „+ Pridať sekciu“, riadok „Pridať text“, karta „+ Nový …“. → podľa DIZAJN 5: „+ Pridať …“ v zozname, + v nadpise karty, karta „+ Nový …“ v galérii.

- [ ] 🟡 **B6. Prepojenie s existujúcim záznamom má rôzne texty:** „Prepojiť existujúce…“, „↗ Prepojiť existujúce…“, „↗ Pridať existujúci kontakt…“, „↗ Osloviť pre podujatie…“, „↗ Priradiť existujúcu platbu z denníka…“. → jeden text a vzhľad.

- [ ] 🟡 **B7. Dokumenty sa ukazujú tromi spôsobmi:** grant – zoznam názvov v paneloch („Výzva“, „Zmluva“…); platba – náhľady súborov s ikonou; podujatie (záložka Dokumenty) – ďalší vlastný zoznam s formulárom na odkaz. → jeden spôsob (najlepšie náhľady ako pri platbe).

- [ ] ⚪ **B8. Emoji namiesto ikon** na kartách úloh (☑ podúlohy, 💬 komentáre); inde šípky a znaky (↗, ▸, ⠿). → čiarové ikony.

- [ ] ⚪ **B9. Mazanie komentára** je textové tlačidlo „Zmazať“, inde sa z riadkov maže ×.

## C. Dizajn – písmo, rozostupy, drobnosti

- [ ] 🟡 **C1. 24 rôznych veľkostí písma** (8,5 až 54 px; napr. 12 · 12,5 · 13 · 13,5 · 14 · 14,5). → stupnica DIZAJN 2. Konkrétne: meno v bočnom paneli kontaktu 24 px vs. nadpis textu 28 px; veľké čísla 27 px (stupnica 24).
- [ ] 🟡 **C2. Deväť rôznych zaoblení** (2, 4, 6, 7, 8, 9, 10, 12, 14 px, plus `99px` aj `999px` pre okrúhle). → 4 / 8 / 12 / okrúhle.
- [x] 🟡 **C3. Zoznam textov podujatia začína 70 px nižšie** ako editor vedľa (`.txlist` má pevné odsadenie zhora). Na obrazovke je nad prvou položkou prázdne miesto. → zarovnať s nadpisom editora inak (alebo bez odsadenia). ✅ *opravené vo verzii 1.67.0.*
- [ ] 🟡 **C4. Sumy v súhrnoch nejednotne:** Prehľad ukazuje zostatky bez centov, Financie s centami; výdavky sú v súhrne Financií čierne, v súhrne projektu červené. → súhrny bez centov, výdavky vždy červené.
- [ ] 🟡 **C5. Podnadpis pod hlavným nadpisom raz je, raz nie je.** Majú ho Prehľad, Kalendár, Úlohy, Projekty, Financie, Nastavenia („Peňažný denník Ars Preuge“, „12 projektov združenia“…); nemajú ho Granty, Podujatia a Kontakty. → rozhodnúť jedno (vzorové Kontakty sú bez neho).
- [ ] 🟡 **C6. Projekt – záložka Ľudia** ukazuje ľudí ako kartičky v galérii bez obrázka; inde (Kontakty, bočný panel) sú ľudia v tabuľke/zozname s ikonou. → zoznam ako v Kontaktoch.
- [ ] ⚪ **C7. Asi 160 miest so vzhľadom zapísaným priamo v prvku** (`style="…"`), napr. rovnaký nadpis karty `display:flex;justify-content:space-between…` je skopírovaný 6×, odstupy nadpisov panelov 6 / 8 / 10 / 12 px. → nahradiť pomenovanými štýlmi.
- [ ] ⚪ **C8. Zbytočné nastavenia písma:** šírka písma (`wdth`) pri nadpisoch a číslach sa hneď ruší pravidlom `body * {…normal!important}`; v hlavičke je príprava na Google Fonts, ktoré sa nesťahujú. → odstrániť.
- [x] 🟡 **C10. Ikonové tlačidlá v bočnom paneli (✎ 🗑 ×) majú pri ovládaní klávesnicou bielu obrysovú čiaru** – na svetlom pozadí ju nevidno, takže človek s klávesnicou nevie, kde je. Pravidlo pre tlačidlá na obrázku (`.icb:focus-visible`, biely obrys) sa uplatní aj na tieto. → v paneli modrý obrys ako všade inde. ✅ *opravené vo verzii 1.67.0.*
- [ ] ⚪ **C11. Obmedzenie šírky stĺpca Popis v denníku Financií sa neuplatní** (`td.ldsc{max-width:200px}` prebije všeobecné `td.t{max-width:340px}`). Rozhodnúť, ktorá šírka je správna, a jedno pravidlo zmazať.
- [ ] ⚪ **C9. Nepoužívané štýly** (nikde v programe sa nepoužívajú): `addln`, `addrow`, `bgbal`, `bgm`, `crumb`, `cthead`, `dutyin`, `kbd`, `orgchips`, `pd`, `pdc`, `plist`, `provlist`, `txcols`, `txlh`, `zb-bad`, `zb-sgrid`; tiež `.brand b` a `.brand span` (prebíjajú ich iné pravidlá). → zmazať.

## D. Texty v aplikácii

- [x] 🔴 **D1. Zastarané texty o claude.ai** (aplikácia bola pôvodne pre claude.ai, teraz beží vo WordPresse):
  - oznámenie „Táto verzia neukladá dáta… otvorte publikovanú aplikáciu prihlásený do claude.ai“,
  - „Máte prístup len na čítanie… požiadajte správcu o úroveň Prispievateľ“,
  - Nastavenia → Prístup tímu: „zdieľate cez tlačidlo zdieľania… Prispievateľ / Divák… v claude.ai“,
  - chyby pri Google Disku: „nie je pripojený v claude.ai (Nastavenia → Konektory)“ (dnes sa neukážu, pozri E1).
  *Správne:* prístup sa riadi vo WordPresse (rola „Tím Ars Preuge“, administrátor, redaktor). ✅ *opravené vo verzii 1.67.0 – texty hovoria o WordPresse, v Nastaveniach je návod a odkaz na používateľov.*
- [x] 🟡 **D2. Chybný text pri výbere viacerých záznamov:** keď nie je z čoho vyberať, vždy sa napíše „Zatiaľ žiadne projekty“ – aj keď sa vyberajú granty alebo podujatia. ✅ *opravené vo verzii 1.67.0.*
- [ ] 🟡 **D3. Prázdne stavy bez návodu:** „Zatiaľ nič.“, „Žiadne úlohy.“, „Žiadne podujatia.“, „Zatiaľ nikto.“, „Žiadne platby.“ → veta „čo tu bude a ako to pridať“ (DIZAJN 13). Dobré príklady už sú (Úlohy, Dokumenty, rozpočet podujatia).
- [ ] 🟡 **D4. Údaje združenia a meno štatutára sú napísané priamo v programe** (`ORG`, `CT_REP` = „Tomáš Pekár“ pre zmluvy). V Nastaveniach sa dajú len prečítať. → upravovateľné v Nastaveniach.
- [ ] 🟡 **D6. Zlá gramatika v otázke pred zmazaním:** „Zmazať úloha „…“?“, „Zmazať platba…“ – druh záznamu je v 1. páde namiesto 4. (úlohu, platbu, rozpočtovú položku…). → doplniť do `ENT` tvar v 4. páde.
- [ ] ⚪ **D5. Filter úloh „Ars Preuge aj KaSS“** a organizácie Ars / KaSS sú pevne v programe – ak pribudne ďalšia organizácia, treba zásah do kódu.

## E. Fungovanie (nie dizajn) – treba overiť a rozhodnúť

- [ ] 🟡 **E1. Google Disk je vypnutý.** Program vie ukladať dokumenty rovno do priečinkov na Google Disku (zmluvy, faktúry, výpisy), ale potrebuje na to prepojenie cez claude.ai, ktoré vo WordPresse nie je (`app/shim.js` ho nastavuje na „žiadne“). Súbory sa preto ticho ukladajú do WordPressu (to funguje) a tlačidlo „presunúť na Disk“ sa neukáže. Kus programu pre Disk (a čísla priečinkov) tak zbytočne leží v kóde. → rozhodnúť: ostať pri WordPresse a časť pre Disk odstrániť, alebo Disk prepojiť inak.
- [ ] 🟡 **E2. Diela NOX:art sú evidované dvakrát.** V záložke **Dramaturgia** je zoznam „Umelecké diela“ (kto pripravuje, kto stráži, potreby) a v záložke **Zabezpečenie** je druhý, samostatný zoznam diel (napájanie, technika, ľudia, úlohy). Nie sú prepojené – názov diela treba písať dvakrát. Podobne ľudia v Zabezpečení sú voľný text, nie Kontakty, a „Otvorené úlohy“ diela nie sú v sekcii Úlohy. → rozhodnúť, či ich prepojiť.
- [ ] 🟡 **E3. Zabezpečenie sa hľadá podľa názvu.** Záložka sa zobrazí len pri podujatí, ktoré má v názve „nox“; pri premenovaní zmizne. Počet pri záložke je počet všetkých diel, nie diel daného podujatia.
- [x] 🔴 **E7. Čerpanie grantu ráta aj plánované platby** (bez dátumu) ako minuté – v hlavnej karte grantu („Čerpané z dotácie“, „Zostáva vyčerpať“) aj v rozpočte grantu („Minuté z dotácie“). → ukazovať zaplatené a plánované osobitne (ako rozpočet podujatia). Pozri `PLAN-GRANTY.md`. ✅ *Opravené vo verzii 1.69.0 (hlavná karta grantu a rozpočet ukazujú zaplatené a plánované osobitne). Vo verzii 1.72.0 dokončené aj na Prehľade, v zozname grantov a v paneli rozpočtovej položky.*
- [ ] 🟡 **E8. Platbu možno priradiť len ku grantu v stave „Schválené“** – po prepnutí na „Zrealizované“ sa neskorá faktúra už nedá priradiť (to isté pri priraďovaní grantov k podujatiu).
- [x] 🟡 **E9. Obrovská ikona osoby** v karte „Ľudia a kontakty“ v záložke Zmluva grantu (ikona prepojení má veľkosť len v bočnom paneli). ✅ *Opravené vo verzii 1.70.0 – ikony prepojení majú všade 18 px (rovnaká chyba bola aj v Úlohách podujatia a v paneli projektu a podujatia).*
- [ ] ⚪ **E4. Projekty nemajú stav, koniec ani rozpočet,** hoci s nimi program počíta: kalendár ukazuje „Koniec projektu“ a Financie „zostáva z rozpočtu“, ale tieto údaje sa v projekte nedajú vyplniť (zostali po staršej verzii). → buď pridať polia, alebo odstrániť.
- [ ] ⚪ **E5. Mŕtve časti programu:** záložka „Obsah“ v projekte, záložky „Spolupráce“, „Dobrovoľníci“, „Všetci“ v Kontaktoch a „Nevyplatené“ vo Financiách – kód existuje, ale nedá sa na ne kliknúť. Text „V tomto filtri nie sú žiadne projekty“ v Projektoch, kde žiadny filter nie je. → zmazať.
- [ ] ⚪ **E6. Režim „len na čítanie“ sa nikdy nezapne** – vo WordPresse má každý, kto sa dostane dnu, právo upravovať. Text a správanie pre čítanie sú zbytočné, alebo treba doplniť rolu len na čítanie.

---

## Odporúčané poradie

1. **D1** texty o claude.ai, **D2**, **A5**, **C3** – drobné, rýchle, hneď viditeľné.
2. **Rozdelenie `app/index.html`** (krok 2 a ďalšie) – aby sa ďalšie úpravy robili na jednom mieste.
3. **A3 + A4** farby – jedna sada pre oba režimy.
4. **A1** bočný panel podľa kontaktu.
5. **A2** hlavičky grantu a projektu podľa podujatia, **B4**.
6. **B1** záložky, **B2/B3** štítky, **B5/B6** pridávanie a prepájanie, **B7** dokumenty.
7. **C1–C7** stupnica písma, rohy, odstupy, štýly v prvkoch; **D3** prázdne stavy.
8. **E1–E2** – po rozhodnutí majiteľa.
9. Upratovanie **B8, B9, C8, C9, E4–E6**.
