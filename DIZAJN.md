# Dizajn pracovného priestoru Ars Preuge

Toto je jednotný dizajn aplikácie. Vychádza z toho, čo v aplikácii už je, a z dvoch obrazoviek, ktoré majiteľ označil za najlepšie:

1. **Detail podujatia** (napr. Podujatia / NOX:ART, záložka Texty) – vzor pre **detail záznamu**.
2. **Kontakty s otvoreným bočným panelom** – vzor pre **zoznam** a **bočný panel**.

Keď sa robí nová obrazovka alebo sa upravuje stará, má vyzerať ako tieto dve. Pri každom pravidle je uvedené, ako sa prvok volá v kóde (názov v `zátvorke`), aby sa dal nájsť. Štýly sú v `app/css/` rozdelené podľa kapitol tohto dokumentu (`20-tlacidla.css` = časť 5, `22-zalozky.css` = časť 8 atď.). Čo zatiaľ v aplikácii nesedí, je zapísané v `ZOZNAM-UPRAV.md`.

---

## 0. Zásady (čo robí vzorové obrazovky dobrými)

- **Pokoj.** Veľa voľného miesta, tenké čiary, takmer žiadne tiene. Obsah nie je natlačený v rámikoch.
- **Jedna farba na akciu.** Modrá (`--accent`) znamená „toto je vybrané“ alebo „toto je hlavná akcia“. Nič iné nie je modré.
- **Ikona + nadpis.** Karty v paneli majú malú sivú ikonu a nadpis („Údaje“, „Platby“). Podľa ikony sa dá rýchlo zorientovať.
- **Upravuje sa priamo na mieste.** Polia vyzerajú ako text; rámik sa objaví až pri prechode myšou alebo kliknutí. Nie je tlačidlo „Uložiť“ – ukladá sa samo.
- **Ikonové tlačidlá namiesto slov** tam, kde je význam jasný (ceruzka = upraviť, kôš = zmazať, × = zavrieť, + = pridať).
- **Počty pri záložkách** (Osoby 100, Firmy 78) – človek hneď vidí, koľko čoho je.

## 1. Farby

Aplikácia má **svetlý aj tmavý režim** (podľa nastavenia zariadenia). Každá farba má dve hodnoty, preto sa v kóde **vždy píše pomenovaná farba** (`var(--accent)`), nikdy „holá“ (`#2F4DB8`). Definované sú v `app/css/00-farby.css`.

### Plochy a text

| Názov | Použitie | Svetlý | Tmavý |
|---|---|---|---|
| `--bg` | pozadie stránky a menu | `#F1F2EE` | `#14171D` |
| `--surface` | karty, panely, polia, bočný panel | `#FFFFFF` | `#1C2028` |
| `--surface2` | stĺpce nástenky, pozadie štítkov, prázdny obrázok | `#E8EAE4` | `#272C36` |
| `--surface3` | jemné zvýraznenie pri prechode myšou | `#F6F7F4` | `#191C23` |
| `--ink` | hlavný text | `#1C222C` | `#E5E8EE` |
| `--muted` | popisky, vedľajší text, ikony | `#5B6371` | `#9AA2B1` |
| `--line` | všetky čiary a rámiky | `#D6D9D1` | `#323845` |

### Význam

| Názov | Význam | Svetlý | Tmavý |
|---|---|---|---|
| `--accent` / `--accent-soft` | vybrané, hlavná akcia, odkaz | `#2F4DB8` / `#E3E8F8` | `#8FA5FF` / `#252D4A` |
| `--good` | hotové, potvrdené, príjem | `#2B7A57` | `#5CC28F` |
| `--ochre` | rozpracované, pozor | `#A97A0F` | `#E0B44A` |
| `--bad` / `--bad-soft` | po termíne, chyba, výdavok, mazanie | `#B3261E` / `#F8E4E2` | `#F2867C` / `#3A2224` |

Pravidlá:
- Zelená = v poriadku, okrová = pozor, červená = problém. Tieto tri významy sa nemiešajú s ničím iným.
- Výdavok sa píše červeno so znamienkom **−** („−150,00 €“), príjem zeleno so **+**.
- **Farby štítkov** (stavy, role) sú dnes v osobitnej sade v programe (`OPT`, `GRAY`, `BLUE`…). Cieľ: aj tie brať z pomenovaných farieb, aby sa menili v tmavom režime. Kým sa to neurobí, nové štítky používajú existujúce farby z `OPT`, nevymýšľajú nové.
- Farba projektu (vyberá sa v projekte) sa používa len ako bodka/pruh pri projekte a ako pozadie karty bez obrázka.

## 2. Písmo

Systémové písmo zariadenia (na Macu San Francisco, na Windows Segoe UI). Nesťahuje sa žiadne. Základ je **15 px**, riadkovanie 1,5.

**Stupnica – používať len tieto veľkosti:**

| Veľkosť | Na čo | Hrúbka |
|---|---|---|
| **38 px** (mobil 31) | nadpis stránky (`h1`): „Kontakty“, „NOX:ART“ | 700 |
| **28 px** | nadpis v bočnom paneli a v editore textu („Alexandra Mutala“, „Anotácia“) | 700 |
| **24 px** | veľké čísla v pruhu súhrnov (`strip`) | 700 |
| **18 px** | nadpis panelu (`h2`) | 700 |
| **16 px** | záložky s čiarou, položky zoznamu vľavo (Texty) | 400 / 600 |
| **15 px** | bežný text, nadpis karty v paneli (`h3`) | 400 / 700 |
| **14 px** | tlačidlá, polia, tabuľky, cesta hore | 400 / 600 |
| **13 px** | popisky polí, vedľajšie údaje (`meta`), malé tlačidlá | 400 |
| **12 px** | štítky, hlavičky tabuliek, malý nadpis veľkými písmenami | 500 / 600 |

**Malý nadpis veľkými písmenami** (`kick`, napr. „TEXTY / NOX:ART“): 12 px, veľké písmená, rozostup písmen 0,14 em, farba `--muted`. Používa sa nad veľkým nadpisom, aby bolo jasné, kde človek je.

Čísla a sumy: rovnako široké číslice, v tabuľkách zarovnané doprava. Formát po slovensky – **sumy** `1 234,50 €` (v súhrnoch bez centov `1 235 €`), **dátumy** `30. 10. 2026`, v rámci aktuálneho roka skrátene `30. 10.`, rozsah `30. 10. 2026 → 31. 10. 2026`.

## 3. Rozostupy, rohy, tiene

- **Rozostupy:** 4 · 8 · 12 · 16 · 20 · 24 px. Medzi veľkými blokmi (karty, panely) **20 px**; vnútri karty 12–16 px; medzi prvkami v riadku 8 px.
- **Okraje stránky:** hore 28 px, po stranách 72 px (mobil 14 px), obsah najviac 1 320 px široký.
- **Rohy:** **12 px** veľké karty, panely, bočné karty, vybraná položka · **8 px** tlačidlá, polia, ikonové tlačidlá · **4 px** malé prvky · **okrúhle** štítky.
- **Čiary:** 1 px `--line`. Vybraná záložka má 3 px modrú čiaru.
- **Tiene:** žiadne na kartách. Výrazný tieň (`--pop`) len pre to, čo „pláva“ nad stránkou: bočný panel, menu, okno s otázkou.

## 4. Rozloženie stránky

### Kostra
- **Ľavé menu** (200 px, dá sa zbaliť na 64 px): logo, tlačidlo **+ Nové** (modré) a lupa, potom sekcie s ikonou. Vybraná sekcia = „vybraná položka“ (pozri 7). Dole „Zbaliť menu“ a meno prihláseného.
- **Mobil** (do 760 px): dolná lišta so 4 sekciami + Menu; ľavé menu sa vysúva.
- **Horná lišta** (`navbar`): šípka späť, cesta „Podujatia / NOX:ART“ (posledná časť tučne). Ostáva prilepená hore, pod ňou tenká čiara.

### Zoznam (vzor: Kontakty)
1. Nadpis `h1`, vpravo hore jedno modré tlačidlo („Nový kontakt“).
2. Záložky-tabletky s počtom (pozri 8b); vpravo v rovnakom riadku hľadanie a doplnkové tlačidlá.
3. Pod tým riadok filtrov z farebných štítkov (pozri 9b) – ak sekcia nejaké má.
4. Obsah: tabuľka v paneli, alebo galéria kariet (prepínač Galéria / Tabuľka, pozri 8c).
5. Kliknutie na riadok otvorí bočný panel (malé záznamy) alebo stránku (projekt, grant, podujatie).

### Detail (vzor: podujatie)
1. **Hlavná karta** (`hero evc`): vľavo obrázok (**štvrtina šírky**, pomer obrázok : text = 1 : 3; bez obrázka farebný prechod), vpravo – všetko **na výšku, jedno pod druhým**:
   - veľký názov `h1`, pod ním „projekt **Nové sídlisko**“ (odkaz),
   - vpravo hore **stavový štítok** a **ikonové tlačidlo ceruzka** (upraviť),
   - „fakty“: malý sivý popis nad tučnou hodnotou (Dátum, Miesto),
   - riadok malých tlačidiel s odkazmi („Priečinok na Disku“),
   - prípadne popis.
2. **Záložky s čiarou** (pozri 8a).
3. Obsah záložky.

### Zoznam + editor (vzor: Texty podujatia)
Vľavo (⅓) zoznam položiek: ikona, názov 16 px, pod ním sivý podtitul, vpravo bodka stavu; vybraná položka = „vybraná položka“. Posledný riadok „+ Pridať …“ bez rámika. Vpravo (⅔) karta: malý nadpis veľkými písmenami, veľký názov, vpravo hore tlačidlo s ikonou a textom („Kopírovať“) a ikonové tlačidlo kôš; pod tým stavový riadok (bodka + stav, vpravo popis); potom veľké pole na písanie; dole sivá päta (počet slov).

## 5. Tlačidlá

| Druh | Vzhľad | Kedy | V kóde |
|---|---|---|---|
| **Hlavné** | modré, tučný text | jedna hlavná akcia na obrazovke („Nový kontakt“, „+ Nové“) | `btn pri` |
| **Bežné** | plocha `--surface`, rámik | druhotná akcia, odkaz von („Priečinok na Disku“, „Kopírovať“) | `btn` |
| **Tiché** | bez rámika, sivé pozadie pri prechode | doplnková akcia, odkaz v texte | `btn ghost` |
| **Malé** | o stupeň menšie | akcie vnútri kariet a tabuliek | `btn sm` |
| **Ikonové s rámikom** | štvorec 34 px, rámik, sivá ikona | upraviť na hlavnej karte | `evedit` |
| **Ikonové bez rámika** | štvorec 34 px (v karte 28 px), sivá ikona, pri prechode jemné pozadie | ceruzka / kôš / × v bočnom paneli a v kartách | `dtop-ic .icb`, `tplus` |
| **Nebezpečné** | ikona/text pri prechode červený | zmazať | `danger`, `tdel` |

Pravidlá:
- Na obrazovke je **najviac jedno modré tlačidlo**.
- Text tlačidla je sloveso alebo „Nový / Nová …“: „Nová úloha“, „Zapísať platbu“, „Kopírovať“.
- **Pridanie do zoznamu** vnútri karty = tichý riadok „**+ Pridať …**“ na konci zoznamu (ako „+ Pridať text“), alebo ikonové tlačidlo **+** v nadpise karty. V galérii = prerušovaná karta „+ Nový …“ (`gnew`).
- **Prepojenie s existujúcim záznamom** = rozbaľovací výber „Prepojiť existujúce…“ pod zoznamom.
- Mazanie vždy cez potvrdzovacie okno.

## 6. Karty a plochy

- **Panel** (`panel`): `--surface`, rámik, rohy 12 px, vnútri 16 × 20 px. Nadpis `h2`, vpravo v riadku počet alebo malé tlačidlo.
- **Hlavná karta** (`hero`): pozri časť 4 – Detail.
- **Karta v bočnom paneli** (`dcard`): rámik, rohy 12 px, vnútri 14 × 16 px, medzi kartami 14 px. Nadpis: **sivá ikona 18 px + tučný text 15 px** („Údaje“, „Platby“). Obsah je buď **zoznam popis – hodnota** (popis vľavo sivý, hodnota vpravo), alebo zoznam riadkov.
- **Karta v galérii** (`gcard`): obrázok 16 : 9 (bez obrázka farebný prechod), pod ním názov a 1–2 riadky sivých údajov. Pri prechode tmavší rámik.
- **Karta na nástenke** (`card`): menšia, v sivom stĺpci; tučný názov, pod ním sivé údaje.
- **Pruh súhrnov** (`strip`): vedľa seba veľké čísla a pod nimi malý sivý popis.
- **Oznámenie** (`notice`): svetlomodrý pás s jednou vetou.

## 7. Vybraná položka

Jeden vzhľad pre všetko, čo je „práve otvorené“: položka v ľavom menu, vybraný text v zozname textov, (cieľovo aj vybraná položka v iných zoznamoch).
- pozadie: modrá premiešaná na 12 % s plochou,
- rámik: modrá na 35 %,
- text a ikona modré, rohy 12 px.

## 8. Záložky

**a) Záložky s čiarou – v detaile záznamu** (`ptabs ntabs`). Riadok pod hlavnou kartou, text 16 px, neaktívne sivé, vybraná tmavá a tučná s **3 px modrou čiarou** pod ňou, pod celým riadkom 1 px čiara.

**b) Záložky-tabletky s počtom – v zoznamoch** (`ptabs`). Text 15–16 px, za názvom malý sivý počet. Vybraná má jemné pozadie (`--surface2`). Slúžia na rozdelenie zoznamu na skupiny (Osoby / Firmy…, Plánované / Prebieha…).

**c) Prepínač pohľadu** (`tabs`): 2–3 spojené gombíky v rámiku, vybraný svetlomodrý. Len na prepnutie **spôsobu zobrazenia** (Galéria / Tabuľka, Tabuľa / Zoznam, Po dielach / Podľa ľudí). Nie na skupiny.

Iné druhy záložiek sa nepoužívajú.

## 9. Štítky

**a) Stav = `chip`.** Malý okrúhly štítok so sivým pozadím, vľavo farebná bodka, vedľa text. Farba bodky je zo zoznamu `OPT`:

| Čoho | Stavy (farba bodky) |
|---|---|
| Podujatie | Nápad (sivá) · V príprave (okrová) · Prebieha (modrá) · Zrealizované (zelená) · Zrušené (červená) |
| Grant | Nápad · Píšeme žiadosť (okrová) · Podané (oranžová) · Schválené (modrá) · Zrealizované (tyrkysová) · Vyúčtované (zelená) · Nepodporené (červená) · Pozastavené (fialová) |
| Úloha | Inbox (sivá) · Tento týždeň (modrá) · Rozpracované (oranžová) · Hotové (zelená) |
| Priorita | Urgentné (červená) · Normálne (okrová) · Nízka (zelená) |
| Spolupráca | Osloviť (sivá) · Oslovení (okrová) · Potvrdení (zelená) · Odmietnutí (červená) |

V tesných zoznamoch stačí samotná **bodka stavu** (ako pri textoch podujatia), s popisom pri prechode myšou.

**b) Rola / označenie / filter = `tg`.** Okrúhly štítok s farebným rámikom a jemne zafarbeným pozadím („Dobrovoľník“, „Partner“). Vypnutý filter je prerušovaný a sivý. Používa sa na roly kontaktov, filtre nad zoznamom a úlohy ľudí na podujatí.

**c) Termín:** po termíne a „dnes“ červeno tučne (`late`).

Iné druhy štítkov sa nepoužívajú.

## 10. Zoznamy a tabuľky

- **Tabuľka** (`table`): hlavička 12–13 px sivá, riadky oddelené tenkou čiarou, žiadne zvislé čiary. Kliknutie na riadok otvorí záznam. Súčty v pätičke tučne.
- Prvý stĺpec = názov s ikonou typu (osoba, firma…), tučne.
- E-mail a telefón sú odkazy (dajú sa rovno otvoriť).
- **Riadkový zoznam** (`items`): riadky s tenkou čiarou medzi nimi; vľavo názov, vpravo sivé údaje a suma. Pri prechode sa názov zafarbí modro.
- Odstránenie z prepojeného zoznamu = × vpravo, ktoré sa ukáže pri prechode myšou.

## 11. Formuláre

- Polia: plocha `--surface`, rámik 1 px, rohy 8 px, vnútri 7 × 10 px, text 14 px.
- **Úprava na mieste** (bočný panel, karty): pole bez rámika a pozadia, pri prechode jemné pozadie, po kliknutí rámik. Bez tlačidla Uložiť.
- Popis poľa: v karte vľavo sivý v mriežke „popis – hodnota“, inde nad poľom (13 px, sivý).
- Výber záznamu (projekt, kontakt…): pole s našepkávaním (`combo`), v ktorom sa dá aj vytvoriť nový kontakt.
- Výber z 2–4 možností: prepínač (`seg`), napr. Výdavok / Príjem.
- Viac možností naraz: štítky `tg` alebo `mchips`.
- Zaškrtnutie: štvorček 17 px, zaškrtnutý zelený s fajkou.
- Krátke pole „+ Pridať …“ s Enterom na rýchle pridanie (úloha, krok).

## 12. Bočný panel (vzor: kontakt)

- Vysúva sa sprava, šírka 500–560 px, zvyšok stránky stmavne.
- **Vpravo hore ikonové tlačidlá bez rámika:** ceruzka (upraviť / zobraziť všetky polia), kôš (zmazať), × (zavrieť).
- **Hlavička:** vľavo fotka / ikona / obrázok (rohy 12 px), vpravo veľký názov (28 px), pod ním organizácia, štítky a riadky kontaktov s ikonou a malou šípkou ↗ „otvoriť“.
- **Telo:** karty `dcard` s ikonou a nadpisom (Údaje, Platby, Projekty…). Prázdne polia sa v režime čítania nezobrazujú; ceruzka ich ukáže.
- Pre záznamy so stránkou (projekt, grant, podujatie) je v paneli tlačidlo „Otvoriť stránku“.

## 13. Prázdne stavy, načítanie, správy

- **Prázdny stav** (`empty`): sivý text 14 px, jedna-dve vety: **čo tu bude** a **ako to pridať**. Kde sa dá rovno pridať, je pod textom tlačidlo. Nepoužívať holé „Zatiaľ nič.“
  - Príklad: „Zmluvy, technický rider, scenár, plagát… Nahrajte PDF alebo obrázok, alebo vložte odkaz na Google Disk.“
- **V galérii** je prázdne miesto vždy prerušovaná karta „+ Nový …“.
- **Filter bez výsledku:** „V tomto filtri nie sú žiadne … “ (+ tlačidlo „Zrušiť filter“, ak sa dá).
- **Záznam neexistuje:** „Podujatie sa nenašlo.“ + tlačidlo „Späť na podujatia“.
- **Načítanie:** „Načítavam …“ sivým textom.
- **Potvrdenie akcie:** krátka tmavá bublina dole (`toast`): „Uložené.“, „Text skopírovaný.“
- **Otázka pred zmazaním:** okno s vetou („Zmazať kontakt „…“? Toto sa nedá vrátiť.“) a tlačidlami Zrušiť / Zmazať.

## 14. Ikony

Jednoduché čiarové ikony (hrúbka čiary 1,8), veľkosť 18 px (v nadpise karty), 17–18 px v ikonových tlačidlách, 22 px v zozname textov. Farba podľa textu (väčšinou `--muted`). **Nepoužívať emoji** (☑, 💬) – namiesto nich ikonu.

## 15. Texty v aplikácii

- Po slovensky, vykať („Napíšte text…“, „Vyberte…“).
- Tlačidlá: sloveso alebo „Nový / Nová / Nové …“ podľa rodu („Nová úloha“, „Nové podujatie“, „Nový kontakt“).
- Pridávanie: vždy „+ Pridať …“ (nie „+ Nový“, „+ Úloha“, „+ Položka“).
- Placeholder v poli končí tromi bodkami („Hľadať meno, organizáciu, e-mail“ bez bodiek je výnimka pre hľadanie).
- Žiadne zmienky o claude.ai – aplikácia beží vo WordPresse.

---

## Kontrolný zoznam pred odovzdaním zmeny

1. Sú všetky farby pomenované (`var(--…)`)? Funguje to v tmavom aj svetlom režime?
2. Je na obrazovke najviac jedno modré tlačidlo?
3. Použil som existujúci druh tlačidla, karty, záložky, štítka – žiadny nový?
4. Sú veľkosti písma zo stupnice (časť 2) a rohy 4 / 8 / 12 / okrúhle?
5. Má každý prázdny zoznam vetu „čo tu bude a ako to pridať“?
6. Vyzerá to dobre na mobile (do 760 px)?
7. Nie sú vzhľadové nastavenia napísané priamo v prvku (`style="…"`), keď existuje pomenovaný štýl?
