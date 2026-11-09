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
| `app/index.html` | Len **kostra stránky** (~60 riadkov): odkazy na štýly, prázdne miesta pre menu, obsah a bočný panel, a **zoznam riadkov `//@subor js/…`** – ten určuje, z ktorých častí a v akom poradí sa program poskladá. |
| `app/js/*.js` | **Spoločné časti programu:** `00-nastavenia` (stavy, polia, farby štítkov) · `10-pomocnici` (dátumy, sumy, štítky, bublina, okno s otázkou) · `20-data-a-vypocty` (ukladanie, načítanie, zostatky, čerpanie) · `30-kostra` (navigácia, menu, vykreslenie) · `40-bocny-panel` · `50-prepojenia-a-zoznamy` (+ zoznam obrazoviek `VIEWS`) · `60–64` dokumenty, zmluvy, zlúčenie kontaktov, prehliadač dokumentov · `65-ucty-a-kontakty` (prepojenie kontaktu s účtom vo WordPresse podľa e-mailu alebo ručne; „Moje úlohy“ cez kontakt) · `66-pristupy` (prístupy podľa oblastí: skryté menu a tlačidlá, zastavenie zápisu; skutočné obmedzenie robí server – `inc/pristupy.php`) · `70-hladanie` · `71-export` · `90-ovladanie-a-spustenie` (`bindView`, `boot`). |
| `app/js/sekcie/*.js` | **Sekcie:** `prehlad`, `kalendar`, `ulohy`, `projekty`, `granty`, `podujatia` + `podujatie-…` (rozpočet a program, spolupráce, texty, fotky, záložky, poradie platieb), `financie`, `kontakty`, `nastavenia`, `zabezpecenie`. |
| | **Všetky súbory v `app/js/` sú kusy jedného programu, nie samostatné skripty.** Plugin ich vloží do `app/index.html` na miesto riadkov `//@subor …` vnútri spoločného obalu `(function(){ "use strict"; … })()` – preto sa navzájom vidia a do súborov nepatrí vlastný obal ani `"use strict"`. Poradie v zozname v `index.html` je pôvodné poradie programu; nový súbor sa pridá novým riadkom `//@subor` (meno len malé písmená, číslice a pomlčky, nanajvýš jeden podpriečinok). |
| `app/css/*.css` | **Vzhľad**, rozdelený podľa účelu (zodpovedá kapitolám `DIZAJN.md`): `00-farby` · `01-zaklad` (písmo, nadpisy, pomocné triedy) · `10-rozlozenie` (menu, hlavička, horná a dolná lišta) · `20-tlacidla` · `21-karty` · `22-zalozky` · `23-stitky` · `24-formulare` · `25-zoznamy-a-tabulky` · `30-bocny-panel` · `31-okna` · sekcie `40-kalendar`, `41-granty-a-projekty`, `42-podujatia`, `43-kontakty`, `44-financie`, `50-zabezpecenie`. Úpravy pre mobil sú v tom istom súbore ako pravidlo, ktoré upravujú. **Poradie súborov (podľa čísla) a poradie pravidiel v nich je dôležité** – neskoršie pravidlo prebije skoršie; pri presúvaní pravidiel medzi súbormi treba overiť, že sa vzhľad nezmenil. |
| `inc/claude.php` | **Napojenie na Claude** (Anthropic API): kľúč uložený len na serveri (WordPress → Ars Preuge → Napojenie na Claude, len administrátor), volanie `arsp_claude_call()` so štruktúrovanou odpoveďou (JSON schéma), model `claude-opus-5-5`, náhradný model pri odmietnutí (`fallbacks`), zrozumiteľné chyby po slovensky. REST `arsp/v1/ai/vyzva` (odkaz alebo nahraný súbor → navrhnuté údaje výzvy; nič neukladá). Volá sa priamo cez `wp_remote_post` – plugin sa inštaluje bez Composera a musí bežať na PHP 7.4. |
| `inc/pristupy.php` | **Prístupy (fáza 1, plán v `PLAN-PRISTUPY.md`):** skupiny s úrovňami bez/čítať/upravovať pre oblasti (projekty · podujatia · úlohy · granty · financie · kontakty · nastavenia; od 1.98.0 projekty ⇒ aj granty a podujatia, granty ⇒ aj podujatia aspoň na čítanie; staré „dianie“ sa prevzalo do projektov aj podujatí), prideľované používateľom (WordPress → Ars Preuge → Prístupy). Server filtruje `/sync` (zakázané kolekcie neposiela, bez financií ani počiatočné zostatky), kontroluje `/doc` (komentár podľa rodiča), e-maily tímu/nahrávanie/fotky/AI podľa práv. Fáza 2: skupina môže mať rozsah (vybrané projekty/podujatia) – vidí len záznamy rozsahu, z prepojených mimo rozsahu len menovky (id + názov); zmena viditeľnosti cudzou zmenou prepojenia sa prejaví po obnovení stránky. Fáza 3: nahrané súbory (`?arsp_blob=`) a albumy fotiek len k viditeľným záznamom; menovky majú `_stub` a aplikácia ich drží v `S.stub` (len na mená cez `get()`, nie v zoznamoch). Úlohy a Kalendár vidí každý (od 1.97.0): bez práva na oblasť Úlohy dostane len úlohy svojich projektov/podujatí/grantov (podľa práv a rozsahu) a úlohy priradené jemu (jeho účet alebo jeho kontakt) – len na čítanie. Bez skupiny a pre administrátorov = plný prístup ako doteraz. |
| `inc/admin.php` | **Administrácia vo WordPresse:** menu *Ars Preuge* s podstránkami **Prehľad** (počty, odkazy; pre celý tím) · **Nastavenia** · **Prístupy** · **AI** (kľúč ku Claude) · **Záloha** (export JSON, import) – len administrátor; spoločný vzhľad (karty) cez `admin_head` len na stránkach pluginu. |
| `app/shim.js` | „Most“ medzi aplikáciou a WordPressom: čítanie a ukladanie dát, zoznam používateľov, nahrávanie súborov, sťahovanie (export). Každých 8 sekúnd stiahne zmeny od kolegov. Prepojenie na Google Disk (`mcp`) je vypnuté. |
| `ars-preuge-priestor.php` | Samotný plugin: roly a prístup, adresa `/priestor/`, databáza, nahrané súbory (chránené), náhľady albumov Google Fotiek, import/export dát v administrácii (*Ars Preuge → Import dát*). |
| `index.php`, `app/index.php` | Prázdne zámky (aby sa priečinky nedali prezerať). Nemeniť. |
| `README.md` · `DIZAJN.md` · `ZOZNAM-UPRAV.md` | Popis pre ľudí · jednotný dizajn · súpis toho, čo treba opraviť. |
| `nastroje/kontrola-vzhladu/` | Test: aplikácia s testovacími údajmi, 136 obrazoviek, porovnanie vzhľadu každého prvku pred a po úprave (návod v `README.md` tam). Nie je súčasťou pluginu. |

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
9. **Nastavenia** – od 1.94.0 vo WordPresse (*Ars Preuge → Nastavenia*, len administrátor): údaje združenia (len na čítanie), kategórie platieb, typy úloh (počiatočné zostatky sa od 1.94.1 neupravujú – uložené hodnoty ostávajú a počítajú sa); ukladá sa do záznamu `settings/main` (zlúčením, ostatné polia ostanú). V aplikácii na starej adrese ostal len odkaz.

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
- Každá obrazovka je funkcia `VIEWS.<názov>` (napr. `VIEWS.podujatie` v `app/js/sekcie/podujatia.js`), ktorá vráti HTML; `render()` prekreslí stránku, `bindView()` (v `90-ovladanie-a-spustenie.js`) pripojí ovládanie polí na obrazovkách – pri novej sekcii treba doplniť aj tam.
- Zápis: `add`, `upd`, `del`, `saveSettings`. Zmena sa hneď ukáže a uloží na pozadí.
- Staré záznamy sa pri načítaní dopĺňajú/prevádzajú (`norm`, a pri kontaktoch a Zabezpečení automatické opravy po načítaní).
- Texty v aplikácii sú po slovensky; názvy v kóde po slovensky bez diakritiky alebo anglicky.

## Rozdelenie `app/index.html` (hotové)

1. ✅ Štýly → `app/css/` (hotové, vzhľad overene rovnaký).
2. ✅ Spoločný základ programu → `app/js/` (hotové, poskladaná stránka overene znak po znaku rovnaká; vo WordPresse overené majiteľom).
3. ✅ Sekcie → `app/js/sekcie/` a zvyšné spoločné kúsky → `app/js/` (hotové naraz, v pôvodnom poradí, poskladaná stránka znak po znaku rovnaká; preklikané všetky sekcie, detaily a záložky vo svetlom aj tmavom režime).
4. ✅ Štýly preskupené podľa účelu (17 súborov podľa `DIZAJN.md`). Overené porovnaním vzhľadu každého prvku na 136 obrazovkách a stavoch (svetlý/tmavý režim, počítač/mobil) – 0 rozdielov. Pravidlá, ktoré by sa po presune pobili, ostali spolu v pôvodnom poradí.

Rozdelenie je hotové. Pravidlo do budúcna: plugin skladá súbory do jednej stránky v pevnom poradí; pri väčších presunoch sa poskladaná stránka porovná s pôvodnou a preklikajú sa sekcie v prehliadači (svetlý aj tmavý režim, počítač aj mobil).

# Pravidlá pri úpravách

1. **Dizajn:** všetko nové podľa `DIZAJN.md` (vzory: detail podujatia, Kontakty s bočným panelom). Nevymýšľať nové druhy tlačidiel, záložiek, kariet ani štítkov; farby len pomenované (`var(--…)`).
2. **Zoznam úprav:** nájdené nedostatky sa zapisujú do `ZOZNAM-UPRAV.md`, opravené sa tam odškrtnú.
3. **Dáta:** nemeniť názvy polí, kolekcií ani kľúče stavov v `OPT`, kým sa nerieši prevod existujúcich záznamov – inak sa v živých dátach tímu „stratia“.
4. **Jedna vec naraz:** pri väčších zmenách najprv navrhnúť, počkať na súhlas majiteľa, až potom robiť.
5. **Overenie:** po zmene overiť, že sa aplikácia otvorí bez chýb a sekcia funguje – svetlý aj tmavý režim, počítač aj mobil. Na to slúži `nastroje/kontrola-vzhladu/` (pri úpravách, ktoré nemajú meniť vzhľad, musí ukázať 0 rozdielov).
6. **Verzia:** pri každej zmene, ktorá ide do WordPressu, zvýšiť číslo verzie v `ars-preuge-priestor.php` (`Version` a `ARSP_VER`).
