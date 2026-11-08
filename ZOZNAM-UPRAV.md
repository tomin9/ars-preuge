# Zoznam úprav

Sem sa zapisuje všetko, čo treba v aplikácii opraviť alebo zjednotiť. Pri každej položke je, **kde** to je, **čo** je nesprávne a **ako** to zjednotiť (podľa `DIZAJN.md`). Hotové veci sa odškrtnú `[x]`.

Dôležitosť: 🔴 vidno na prvý pohľad / robí chyby · 🟡 nesúlad, ktorý si všimne pozorný používateľ · ⚪ čistenie kódu, navonok nevidno.

Stav k 8. 11. 2026 – zatiaľ **nič z toho nie je opravené**, toto je len súpis nájdený pri prehliadke kódu.

---

## A. Nekonzistencie v dizajne

### Záložky

- [ ] 🔴 **Štyri rôzne druhy záložiek.** Detail podujatia a detail grantu majú záložky s modrou čiarou pod vybranou (vzor). Detail projektu, zoznamy (Podujatia, Granty, Kontakty, Financie) majú záložky ako sivé „tabletky“. Rozpočet podujatia má ďalší menší druh. Prepínač Galéria/Tabuľka je štvrtý. → Všetky záložky v detailoch aj zoznamoch podľa vzoru podujatia; prepínač pohľadu ostane osobitný.
  *Kde:* `.ptabs`, `.ptabs.ntabs`, `.ptabs.evbtabs`, `.tabs`; použitie napr. `VIEWS.projekt`, `VIEWS.podujatia`, `VIEWS.kontakty`.

### Farby

- [ ] 🔴 **Dve „modré“, dve „zelené“, dve „okrové“ a dve „červené“.** Stavové štítky a kalendár používajú pevné farby (modrá `#3B5BD9`, zelená `#2B8A5F`, okrová `#C08A12`, červená `#C2372E`), no tlačidlá, odkazy a ostatné texty používajú iné odtiene (`#2F4DB8`, `#2B7A57`, `#A97A0F`, `#B3261E`). Pevné farby sa v tmavom režime **nemenia**, takže štítky tam môžu vyzerať inak ako zvyšok. → Jedna sada farieb pre oba režimy; štítky brať z pomenovaných farieb.
  *Kde:* začiatok skriptu (`BLUE`, `GREEN`, `OCHRE`, `RED`…, zoznam `OPT`) vs. `:root` v štýloch.
- [ ] 🟡 **Ručne písané farby v štýloch** (nie sú pomenované, v tmavom režime sa nezmenia): `.lst.warn` (`#C08A12`), `.lst.bad` (`#C2372E`), červené mazanie pri prechode myšou v záložkách rozpočtu (`#C2372E`), modrý okraj pri presúvaní záložky (`#3B5BD9`), biele pozadie ikôn (`#fff`).
- [ ] 🟡 **Farba `var(--text)` neexistuje** (pri odkazoch v riadkoch tabuľky `.rlink`). Má byť `--ink`. Odkaz preto pri prechode myšou nedostane správnu farbu.
- [ ] 🟡 **Niektoré farby stavov sa opakujú** pre rôzny význam: v rolách kontaktov je „Partner“ aj „Dobrovoľník“ zelený, „Firma“ aj „Sponzor“ fialový, „Médium“ aj „Mediálny partner“ okrový; v grantoch je „Podané“ oranžové a „Rozpracované“ úlohy tiež oranžové. Pri čítaní zoznamu sa ťažko rozlišujú.

### Stavové štítky

- [ ] 🟡 **Okrem štítka `chip` sa stav píše ešte inak:** Zabezpečenie má vlastné štítky (`zb-stav`, `zb-rest`, `zb-tag`), rozpočet grantu má farebný text „ok/pozor/zle“ (`lst`). Všetko majú vyzerať ako `chip`.
- [ ] 🟡 **`zb-tag` je v štýloch nadefinovaný dvakrát** – dva rôzne vzhľady jedného prvku (sivý štítok s veľkými písmenami vs. malý modrý štítok). Prelínajú sa, takže výsledok (modrý, ale s veľkými písmenami a rozostupmi) nie je ani jeden z nich.

### Tlačidlá

- [ ] 🟡 **Viac druhov „pridať“:** `.addrow` (sivý text), `.addic` (malé „+“), `.zb-add` (prerušovaný rámik, modrý), `button.lnk` (modrý text), `.gnew` (prerušovaná karta), `+ Pridať…` v textovom poli. → Dve verzie: v zozname slabý text „+ Pridať…“, v galérii prerušovaná karta.
- [ ] 🟡 **Ikonové tlačidlá majú tri vzhľady:** `evedit` (rámik), `icb` (tmavé priesvitné na obrázku), `nb-back`/`zb-x`/`zb-h` (bez rámika). Plus „Upraviť“ je v projekte slovom, v podujatí ceruzkou.
- [ ] 🟡 **Poradie tried `btn pri sm` / `btn sm pri`** je v kóde miešané (zbytočná nejednotnosť, vzhľad rovnaký).
- [ ] ⚪ **Hlavné (modré) tlačidlo** je v zoznamoch vpravo hore, v detaile projektu však vpravo v riadku záložiek a mení sa podľa záložky. Pravidlo má byť jedno a na rovnakom mieste.

### Karty a panely

- [ ] 🟡 **Hlavička detailu nie je jednotná.** Podujatie má veľkú kartu (`hero`) s obrázkom vľavo a ceruzkou; projekt má obrázok nad nadpisom a tlačidlo „Upraviť“ slovom; grant má ešte inú hlavičku s osou termínov; kontakt, úloha a platba sa otvárajú len v bočnom paneli. → Všetky detaily podľa podujatia.
- [ ] 🟡 **Zabezpečenie používa vlastnú kartu** (`zb-card`, `zb-sum`) a polia so sivým pozadím (`--surface3`) namiesto bieleho, na rozdiel od zvyšku aplikácie.
- [ ] 🟡 **Pole „Upraviť priamo na mieste“ vyzerá rôzne:** v bočnom paneli bez rámika (rámik sa objaví pri prechode), v Zabezpečení stále s rámikom a sivým pozadím, v tabuľke programu bez rámika. → Jeden vzhľad polí.

### Písmo a rozostupy

- [ ] 🟡 **Príliš veľa veľkostí písma:** 8,5 · 9 · 11 · 11,5 · 12 · 12,5 · 13 · 13,5 · 14 · 14,5 · 15 · 16 · 17 · 18 · 20 · 22 · 23 · 24 · 27 · 28 · 31 · 34 · 38 · 54 px. Rozdiely typu 13 vs. 13,5 vs. 14 sa nedajú rozlíšiť. → Stupnica v `DIZAJN.md` (12 · 13 · 14 · 15 · 18 · 24 · 38).
- [ ] 🟡 **Rôzne zaoblenie rohov:** 2, 4, 6, 7, 8, 9, 10, 12, 14 px a okrúhle (`99px` aj `999px`). → 4 · 8 · 12 · okrúhle.
- [ ] 🟡 **Nadpisy panelov majú rôzny spodný odstup** (6, 8, 10, 12 px a „0“) písaný priamo v prvku. → jedno pravidlo.
- [ ] ⚪ **Veľa štýlov priamo v prvkoch:** v kóde je ~160 miest typu `style="…"` (odstupy, šírky, farby). Sťažujú zjednotenie – najprv ich treba nahradiť pomenovanými štýlmi.
- [ ] ⚪ **Nadpis `h2` a čísla majú nastavenú „šírku písma“** (`wdth`), ale tá sa pravidlom `body * {font-variation-settings: normal !important}` ruší, a Google Fonts sa vôbec nesťahujú (je tam len `preconnect`). Nastavenie je zbytočné, treba ho odstrániť (prípadne dať aj písmo, ak sa chce).

### Prázdne stavy a texty

- [ ] 🟡 **Prázdne stavy majú rôznu podobu:** niekde veta + modré tlačidlo (`emptyBox`), niekde len sivá veta, niekde „bez dátumu“ v tabuľke, niekde nič. → Pravidlá v časti 9 `DIZAJN.md`.
- [ ] 🔴 **Zastaralé texty o claude.ai.** Aplikácia bola pôvodne pre claude.ai a texty to prezrádzajú:
  - oznámenie na vrchu „Táto verzia neukladá dáta… otvorte publikovanú aplikáciu prihlásený do claude.ai“,
  - Nastavenia → „Prístup tímu“: „zdieľate cez tlačidlo zdieľania… úroveň Prispievateľ / Divák“,
  - chyby pri Google Disku: „nie je pripojený v claude.ai (Nastavenia → Konektory)“.
  Správne má byť: prístup sa riadi vo WordPresse (rola „Tím Ars Preuge“).
- [ ] 🟡 **Údaje združenia (IČO, DIČ, sídlo…) sú napísané priamo v kóde** (`ORG`) a v Nastaveniach sa len zobrazujú; nedajú sa zmeniť bez zásahu do kódu. Rovnako meno zástupcu v zmluve (`CT_REP`).

## B. Veci mimo dizajnu, všimnuté pri prehliadke (treba overiť)

- [ ] 🔴 **Nahrávanie na Google Disk pravdepodobne nefunguje.** Kód počíta s prepojením na Google Drive cez claude.ai (`mcp`), no most pre WordPress (`app/shim.js`) ho nastavuje na „žiadne“. Tlačidlá na Disk tak zrejme vždy skončia chybou. Treba overiť a rozhodnúť, či sa nahrávanie rieši cez WordPress (priečinok `uploads/arsp`), alebo sa Disk zruší.
- [ ] 🟡 **Zabezpečenie sa hľadá podľa názvu.** Ľavé menu nemá položku Zabezpečenie; v kóde existuje samostatné zobrazenie, ktoré len presmeruje na záložku v podujatí NOX:art. Je to zámerné (podujatie NOX sa pozná podľa slova „nox“ v názve), len treba mať na pamäti, že pri premenovaní podujatia záložka zmizne.
- [ ] ⚪ **Vyhľadávanie, export a pomocné funkcie sú rozhádzané** medzi sekciami (pozri návrh rozdelenia).
- [ ] ⚪ **Počet pri záložke Zabezpečenie** je počet všetkých diel (`S.d.zab.length`), nie diel konkrétneho podujatia – bude zavádzať, ak pribudne druhé podujatie so zabezpečením.
- [ ] ⚪ **README spomína verziu aj dáta, ale nie `DIZAJN.md` ani tento zoznam** – po dokončení Fázy 1 doplniť odkazy.

## C. Odporúčané poradie opráv

1. Texty o claude.ai (A, „Prázdne stavy a texty“) – rýchle a vidno ich hneď.
2. Farby: jedna sada pre oba režimy + oprava `--text`.
3. Záložky podľa vzoru podujatia.
4. Stavové štítky v Zabezpečení a rozpočte grantu → `chip`.
5. Hlavičky detailov (projekt, grant) podľa podujatia.
6. Stupnica písma, rohov a odstupov; odstránenie `style="…"` z prvkov.
7. Overiť nahrávanie na Disk (B) a rozhodnúť.

Väčšinu bodov 2–6 je rozumné robiť **až po rozdelení `app/index.html`**, aby sa dizajn upravoval na jednom mieste (pozri návrh rozdelenia).
