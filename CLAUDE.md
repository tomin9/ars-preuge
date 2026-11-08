# Pravidlá pre prácu v tomto repozitári

## Git: pracuj priamo vo vetve `main`

- Všetky zmeny commituj a pushuj **priamo do vetvy `main`** (východzia vetva tohto repozitára).
- **Nevytváraj** nové vetvy ani pull requesty a nepýtaj sa na ich schválenie.
- Pred pushom si stiahni najnovší stav (`git pull --rebase origin main`), aby nevznikli konflikty.
- Ak push do `main` zlyhá (napr. kvôli ochrane vetvy), zastav sa a vysvetli majiteľovi jednoducho, čo treba urobiť – nevytváraj PR ako náhradné riešenie.

Majiteľ repozitára nie je programátor – výsledky a problémy vysvetľuj po slovensky a bez odborného žargónu.

---

# Čo je táto aplikácia

**Ars Preuge – pracovný priestor** je interná tímová aplikácia občianskeho združenia Ars Preuge (Prievidza). Tím v nej drží na jednom mieste projekty, granty, podujatia, úlohy, peniaze a kontakty. Beží ako **doplnok (plugin) vo WordPresse** na adrese `/priestor/`. Pustí dnu len prihlásených s rolou administrátor, redaktor alebo „Tím Ars Preuge“; všetci, čo sa dostanú dnu, môžu upravovať.

## Z čoho sa skladá (súbory)

| Súbor | Na čo slúži |
|---|---|
| `app/index.html` | Kostra stránky a **sekcie** (Prehľad, Kalendár, Úlohy, Projekty, Granty, Podujatia, Financie, Kontakty, Nastavenia, Zabezpečenie) – ~1 570 riadkov. Na začiatku odkazy na štýly a riadky `//@subor js/…`. |
| `app/js/*.js` | **Spoločný základ programu** – 6 častí v pevnom poradí: `00-nastavenia` (stavy, polia, farby štítkov) · `10-pomocnici` (dátumy, sumy, štítky, bublina, okno s otázkou) · `20-data-a-vypocty` (ukladanie, načítanie, zostatky, čerpanie) · `30-kostra` (navigácia, menu, vykreslenie) · `40-bocny-panel` · `50-prepojenia-a-zoznamy`. **Nie sú to samostatné skripty** – sú to kusy jedného programu; plugin ich vloží do `app/index.html` na miesto riadkov `//@subor js/…` (vnútri spoločného obalu `(function(){ "use strict"; … })()`). Preto do nich nepatrí vlastný obal ani `"use strict"`. |
| `app/css/*.css` | **Vzhľad** – 7 súborov očíslovaných v poradí načítania (**poradie je dôležité**, neskoršie pravidlá prebíjajú skoršie): `00-zaklad` farby a základ · `10-menu-a-stranka` menu, hlavička, tlačidlá, panel · `20-prvky` súhrny, štítky, zoznamy, tabuľky, nástenka · `30-panely-a-okna` bočný panel, výbery, okná · `40-kalendar-a-detaily` kalendár, galéria, hlavné karty, záložky, kontakty, mobil · `50-zabezpecenie` · `60-texty-a-menu` texty podujatia, zbaľovanie menu. Zatiaľ sú rozdelené podľa poradia v pôvodnom súbore, nie podľa účelu. |
| `app/shim.js` | „Most“ medzi aplikáciou a WordPressom: čítanie a ukladanie dát, zoznam používateľov, nahrávanie súborov, sťahovanie (export). Každých 8 sekúnd stiahne zmeny od kolegov. Prepojenie na Google Disk (`mcp`) je vypnuté. |
| `ars-preuge-priestor.php` | Samotný plugin: roly a prístup, adresa `/priestor/`, databáza, nahrané súbory (chránené), náhľady albumov Google Fotiek, import/export dát v administrácii (*Ars Preuge → Import dát*). |
| `index.php`, `app/index.php` | Prázdne zámky (aby sa priečinky nedali prezerať). Nemeniť. |
| `README.md` · `DIZAJN.md` · `ZOZNAM-UPRAV.md` | Popis pre ľudí · jednotný dizajn · súpis toho, čo treba opraviť. |

**Ako sa stránka skladá:** plugin pri otvorení načíta `app/index.html`, na miesto odkazov `<link rel="stylesheet" href="css/…">` vloží obsah štýlov, na miesto riadkov `//@subor js/…` obsah častí programu a **tesne pred prvý `<script>`** vloží nastavenia (`window.ARSP`: adresy, prihlásený používateľ) a `shim.js`. Pri akomkoľvek rozdeľovaní súborov sa toto musí zachovať.

**Dáta nie sú v repozitári** (`data/` a `*.zip` sú vylúčené). Žijú v databáze WordPressu (tabuľka `wp_arsp_docs`, každý záznam = kolekcia + id + JSON), nahrané súbory v `wp-content/uploads/arsp/`. Kolekcie: `projects`, `grants`, `events`, `tasks`, `transactions` (platby), `budgetLines` (rozpočtové položky grantov), `contacts`, `partnerships` (spolupráce kontakt–podujatie), `programItems` (program podujatia), `zabezpecenie` (diela NOX:art), `zabdodavky` (dodávky techniky), `comments` a `settings/main` (spoločné nastavenia).

## Sekcie aplikácie

Ľavé menu (na mobile dolná lišta Prehľad · Úlohy · Kalendár · Financie + Menu):

1. **Prehľad** – „Ahoj, …“, súhrn (banka, pokladňa, moje úlohy, úlohy po termíne, granty v procese), moje úlohy, granty v realizácii s čerpaním, nevyplatené platby, termíny na mesiac, posledné zmeny v tíme.
2. **Kalendár** – mesiac; zbiera dátumy podujatí, termíny úloh, uzávierky / koniec realizácie / vyúčtovanie grantov a konce projektov.
3. **Úlohy** – nástenka Inbox → Tento týždeň → Rozpracované → Hotové (ťahaním sa mení stav) alebo zoznam; filtre projekt, človek, typ, organizácia (Ars Preuge / KaSS). Úloha má podúlohy a komentáre.
4. **Projekty** – galéria/tabuľka. Detail projektu: záložky Podujatia · Úlohy · Granty · Financie (roky, denník, kategórie, podľa partnerov) · Ľudia. Projekt má farbu a titulný obrázok.
5. **Granty** – skupiny Plánované · Prebieha · Zrealizované · Nepodporené, galéria/tabuľka. Detail: karta so sumami (žiadané, schválené, čerpané, spolufinancovanie) a časovou osou termínov; záložky **Výzva** (dokumenty, údaje o výzve, „Doplniť údaje“ vložením textu) · **Žiadosť** · **Zmluva** (dokumenty, postup krokov, kontakty) · **Rozpočet** (rozpočtové položky a čerpanie) · **Úlohy** · **Podujatia**; export podkladu k vyúčtovaniu (CSV).
6. **Podujatia** – skupiny Plánované · Prebieha · Zrealizované · Zrušené, galéria/tabuľka. **Detail podujatia je vzor dizajnu.** Záložky:
   - **Texty** – anotácia, texty na siete, tlačová správa… (zoznam vľavo, editor vpravo, stav textu, kopírovanie),
   - **Rozpočet** – graf príjmov a výdavkov, platby podujatia rozdelené podľa častí programu alebo podľa grantov (s rozpočtovými položkami grantu),
   - **Úlohy**, **Granty**,
   - **Dramaturgia** – koncept, umelecké diela (kto pripravuje, kto stráži) a sprievodný program,
   - **Marketing** – kontrolný zoznam propagácie a poznámky,
   - **Spolupráce** – tím (s úlohami ľudí), partneri a sponzori (stav oslovenia), dobrovoľníci; sekcie sa dajú pridávať a presúvať,
   - **Dokumenty**, **Fotky** (zdieľaný album Google Fotiek),
   - **Zabezpečenie** – len pri podujatí s „nox“ v názve (NOX:art): technický plán po dielach – napájanie, technika a káble, ľudia s dňom a časom, otvorené úlohy, dodávky (kto čo požičal/daroval), súhrn a pohľad „podľa ľudí“.
7. **Financie** – peňažný denník (banka a pokladňa, priebežné zostatky, poradové čísla), roky + „Plánované“, pohľady Denník · Projekty · Kategórie, filtre, export CSV. Platba v bočnom paneli má doklady (zmluva, faktúra, výpis) a **generátor zmluvy o dielo / autorskej zmluvy** (Word alebo tlač).
8. **Kontakty** – Osoby · Firmy · Organizácie · Média, filtre podľa rolí, kopírovanie e-mailov. Kontakt v bočnom paneli: fotka/ikona, údaje, organizácie s funkciou, platby, spolupráce, logo, zlúčenie duplicít.
9. **Nastavenia** – údaje združenia (len na čítanie), počiatočné zostatky, kategórie platieb, typy úloh.

Všade: **hľadanie** (lupa alebo Ctrl+K), **+ Nové** (úloha, podujatie, platba, grant, projekt, kontakt), **bočný panel** na rýchlu úpravu (malé záznamy sa otvárajú len v ňom; projekt, grant a podujatie majú vlastnú stránku), komentáre, adresa v prehliadači sa mení so sekciou (funguje Späť).

## Ako spolu súvisia

```
PROJEKT ──┬── GRANT ──────── rozpočtové položky ◄── PLATBA
          │     │  └─ poskytovateľ = KONTAKT          │  └─ komu / od koho = KONTAKT
          │     └── financuje ──► PODUJATIE ◄─────────┘
          │                         ├─ spolupráce = KONTAKT + stav + rola
          │                         ├─ program, texty, dokumenty, fotky
          │                         └─ [NOX:art] zabezpečenie + dodávky
          ├── ÚLOHA  (môže patriť aj ku grantu a podujatiu)
          └── KONTAKT (ľudia projektu)
```

- **Projekt** zastrešuje podujatia, granty, úlohy, platby a ľudí.
- **Grant** má poskytovateľa (kontakt), rozpočtové položky a termíny; jeden grant môže financovať viac podujatí a podujatie môže mať viac grantov.
- **Platba** sa viaže na grant a jeho rozpočtovú položku (z toho sa počíta čerpanie a spolufinancovanie), na podujatie a jeho časť programu (kategória) a na kontakt.
- **Úloha** môže patriť k projektu, grantu aj podujatiu; jej termín ide do kalendára a prehľadu.
- Väzby sa ukazujú **z oboch strán** (podujatie vidí svoje granty, grant svoje podujatia) – v kóde to robí `related()`, prepájanie `link()`.

## Ako je napísaný kód (pre úpravy)

- Žiadne knižnice ani build – čistý JavaScript; po úprave stačí obnoviť stránku. Mimo WordPressu (otvorenie `app/index.html` priamo) program nefunguje – časti z `app/js/` skladá až plugin. (Len na náhľady PDF sa pri potrebe stiahne pdf.js.)
- `ENT` – druhy záznamov a ich polia (podľa nich sa sám skladá bočný panel). `OPT` – zoznamy stavov s farbami. `S` – stav aplikácie (`S.d.<druh>` = dáta).
- Každá obrazovka je funkcia `VIEWS.<názov>` (napr. `VIEWS.podujatie`), ktorá vráti HTML; `render()` prekreslí stránku, `bindView()` pripojí ovládanie.
- Zápis: `add`, `upd`, `del`, `saveSettings`. Zmena sa hneď ukáže a uloží na pozadí.
- Staré záznamy sa pri načítaní dopĺňajú/prevádzajú (`norm`, a pri kontaktoch a Zabezpečení automatické opravy po načítaní).
- Texty v aplikácii sú po slovensky; názvy v kóde po slovensky bez diakritiky alebo anglicky.

## Plán rozdelenia `app/index.html` (schválený postup, po krokoch)

1. ✅ Štýly → `app/css/` (hotové, vzhľad overene rovnaký).
2. ✅ Spoločný základ programu → `app/js/` (hotové, poskladaná stránka overene znak po znaku rovnaká). Spoločné kúsky, ktoré v pôvodnom súbore ležia medzi sekciami (dokumenty a nahrávanie, zmluvy, zlúčenie kontaktov, hľadanie, export, `bindView`), sa presunú v kroku 3 – presun mimo pôvodného poradia treba overiť zvlášť.
3. Sekcie po jednej → `app/js/sekcie/` (od najmenšej – Nastavenia – po najväčšiu – Podujatia; podujatie sa rozdelí na viac súborov: texty, rozpočet, spolupráce, fotky, zabezpečenie).
4. Štýly preskupiť podľa účelu (farby, tlačidlá, karty, záložky, štítky, formuláre, sekcie) – podľa `DIZAJN.md`.

Pravidlá rozdeľovania: plugin skladá súbory do jednej stránky, poradie je pevné. Po každom kroku sa poskladaná stránka porovná s pôvodnou (ideálne znak po znaku) a preklikajú sa sekcie v prehliadači.

# Pravidlá pri úpravách

1. **Dizajn:** všetko nové podľa `DIZAJN.md` (vzory: detail podujatia, Kontakty s bočným panelom). Nevymýšľať nové druhy tlačidiel, záložiek, kariet ani štítkov; farby len pomenované (`var(--…)`).
2. **Zoznam úprav:** nájdené nedostatky sa zapisujú do `ZOZNAM-UPRAV.md`, opravené sa tam odškrtnú.
3. **Dáta:** nemeniť názvy polí, kolekcií ani kľúče stavov v `OPT`, kým sa nerieši prevod existujúcich záznamov – inak sa v živých dátach tímu „stratia“.
4. **Jedna vec naraz:** pri väčších zmenách najprv navrhnúť, počkať na súhlas majiteľa, až potom robiť.
5. **Overenie:** po zmene overiť, že sa aplikácia otvorí bez chýb a sekcia funguje – svetlý aj tmavý režim, počítač aj mobil.
