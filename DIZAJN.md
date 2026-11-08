# Dizajn pracovného priestoru Ars Preuge

> **Dva vzory (potvrdené majiteľom, tmavý režim):**
> 1. **Detail záznamu = stránka podujatia** – cesta hore („Podujatia / NOX:ART“), veľká karta s obrázkom vľavo, záložky s čiarou. Záložka Texty ukazuje aj vzor „zoznam vľavo + editor vpravo“: vľavo položky (ikona, názov, podtitul, bodka stavu), vpravo karta s malým nadpisom veľkými písmenami („TEXTY / NOX:ART“), veľkým názvom, stavovým riadkom a veľkým poľom na text; dole počet slov.
> 2. **Zoznam = stránka Kontakty** – veľký nadpis, záložky-tabletky s počtom, obrysové filtre, čistá tabuľka bez zbytočných čiar a **bočný panel** zprava: fotka/ikona, meno, kontakty s malou šípkou „otvoriť“, pod tým karty s ikonou a nadpisom (Údaje, Platby). Výdavky sa píšu červeno so znamienkom mínus.

Toto je jednotný dizajn aplikácie. Vychádza z toho, čo už v aplikácii je, a za vzor berie **stránku podujatia** (detail podujatia: veľká karta hore, pod ňou záložky). Keď sa vytvára alebo upravuje akákoľvek obrazovka, má vyzerať ako táto.

Hodnoty nižšie sú aktuálne hodnoty z kódu (`app/index.html`, začiatok súboru). Ak sa niečo v dizajne zmení, zmení sa najprv tu a potom na jednom mieste v kóde – nie na desiatich miestach.

---

## 1. Farby

Aplikácia má **svetlý aj tmavý režim** (prepína sa podľa nastavenia zariadenia). Každá farba má preto dve hodnoty. V kóde sa nikdy nepíše „holá“ farba (napr. `#2F4DB8`), vždy len pomenovaná (`var(--accent)`), aby fungovali oba režimy.

| Názov | Použitie | Svetlý | Tmavý |
|---|---|---|---|
| `--bg` | pozadie celej stránky | `#F1F2EE` | `#14171D` |
| `--surface` | karty, panely, polia | `#FFFFFF` | `#1C2028` |
| `--surface2` | zvýraznené pozadie (stĺpce, štítky, hover) | `#E8EAE4` | `#272C36` |
| `--surface3` | jemné pozadie (hlavičky tabuliek, hover riadkov) | `#F6F7F4` | `#191C23` |
| `--ink` | hlavný text | `#1C222C` | `#E5E8EE` |
| `--muted` | vedľajší text, popisky | `#5B6371` | `#9AA2B1` |
| `--line` | všetky čiary a rámiky | `#D6D9D1` | `#323845` |
| `--accent` | hlavná modrá (tlačidlá, odkazy, vybraná záložka) | `#2F4DB8` | `#8FA5FF` |
| `--accent-soft` | svetlomodré pozadie (vybrané, upozornenie) | `#E3E8F8` | `#252D4A` |
| `--good` | úspech, hotové, príjem | `#2B7A57` | `#5CC28F` |
| `--ochre` | pozor, rozpracované | `#A97A0F` | `#E0B44A` |
| `--bad` / `--bad-soft` | chyba, po termíne, výdavok | `#B3261E` / `#F8E4E2` | `#F2867C` / `#3A2224` |

**Pravidlá**
- Modrá (`--accent`) je jediná „značková“ farba. Používa sa na hlavné tlačidlo, odkazy a vybranú záložku. Inde sa nepoužíva ako dekorácia.
- Zelená = v poriadku / hotové, okrová = pozor / rozpracované, červená = problém / po termíne. Tieto tri významy sa nemenia.
- Farba projektu (`color` v projekte) sa používa len ako pruh/bodka pri projekte a jeho podujatiach.
- Farby štítkov (stavy, role…) sú definované v jednom zozname `OPT` v kóde – pozri časť 6.

## 2. Písmo

- Písmo: systémové (`-apple-system`, `Segoe UI`, `Roboto`…). **Žiadne stiahnuté písmo.**
- Základná veľkosť textu: **15 px**, riadkovanie 1,5.

| Čo | Veľkosť | Hrúbka |
|---|---|---|
| Hlavný nadpis stránky `h1` | 38 px (mobil 31 px) | 700 |
| Nadpis sekcie `h2` | 18 px | 700 |
| Podnadpis `h3` | 15 px | 700 |
| Bežný text, polia, tlačidlá | 14–15 px | 400 / 600 |
| Vedľajší popis (`.sub`, `.meta`, `.small`) | 13–14 px, farba `--muted` | 400 |
| Malé štítky a hlavičky tabuliek | 12–12,5 px | 600 |
| Veľké čísla v prehľade | 27 px | 750 |

Čísla a sumy majú vždy rovnako široké číslice (`tabular-nums`) a sumy sú zarovnané doprava. Sumy sa píšu v eurách po slovensky (`1 234,50 €`), dátumy ako `5. 3. 2026`.

## 3. Rozostupy a tvary

- **Rozostupy:** 4 · 6 · 8 · 10 · 14 · 18–20 px. Medzi veľkými blokmi (karty, panely) je **20 px**, medzi prvkami v riadku **10 px**.
- **Okraje stránky:** 28 px hore, 72 px po stranách na počítači, 14 px na mobile. Obsah je najviac 1 320 px široký.
- **Zaoblenie rohov:** veľké karty a panely **12 px**, tlačidlá a polia **8 px**, malé prvky **4–6 px**, štítky (chip) **plne okrúhle**.
- **Čiary:** 1 px, farba `--line`. Tiene sa takmer nepoužívajú; len vyskakovacie okná (menu, modál, bočný panel) majú výraznejší tieň.
- **Rozloženie:** počítač = ľavé menu (200 px, dá sa zbaliť na 64 px) + obsah. Mobil (do 760 px) = dolná lišta so 4 hlavnými sekciami + výsuvné menu.

## 4. Tlačidlá

| Druh | Vzhľad | Kedy |
|---|---|---|
| `btn pri` | modré, biely text | **Jedna hlavná akcia na obrazovke** (Nové podujatie, Uložiť) |
| `btn` | biele s rámikom | druhotná akcia (Zapísať platbu, Odkaz na podujatie) |
| `btn ghost` | bez rámika, pri prechode myšou sivé | doplnková akcia, odkaz v texte (napr. názov projektu) |
| `btn sm` | menšie (4 × 9 px) | akcie vnútri kariet a tabuliek |
| `btn danger` | červený text | mazanie, odobratie |
| ikonové tlačidlo (`evedit`, `icb`) | štvorec 34 × 34 px, rámik, ikona | upraviť (ceruzka), zavrieť, zmeniť obrázok |

Pravidlá: na obrazovke je **najviac jedno** modré tlačidlo. Text tlačidla je sloveso („Nová úloha“, „Pridať dielo“). Pridávanie do zoznamu v karte je len slabý text „+ Pridať …“.

## 5. Karty a panely

- **Panel** (`.panel`) – biela plocha s 1 px rámikom, rohy 12 px, vnútri 16 × 20 px. Základný stavebný blok všetkých stránok. Nadpis panelu je `h2`, vpravo v rovnakom riadku môže byť počet alebo tlačidlo.
- **Hlavná karta stránky** (`.hero`, vzor: podujatie) – veľká karta hore. Vľavo obrázok (alebo farebný prechod, ak obrázok nie je), vpravo názov (`h1`), pod ním „projekt …“, vpravo hore stavový štítok a ceruzka na úpravu. Pod tým „fakty“ (Dátum, Miesto), tlačidlá s odkazmi a popis. Ak nie je obrázok, namiesto neho je na ľavom okraji 8 px pruh farby projektu.
- **Karta v galérii** (`.gcard`) – obrázok 16:9, pod ním názov a malé údaje; po prejdení myšou tmavší rámik. Posledná v mriežke je prerušovaná karta „+ Nové …“.
- **Karta na nástenke** (`.card`, úlohy) – menšia, v sivom stĺpci; názov tučne, pod ním malé údaje.
- **Pás čísel** (`.strip`) – riadok veľkých čísel s malým popisom pod nimi (Prehľad).
- **Bočný panel** (`.drawer`) – výsuvný zprava (560 px), slúži na rýchle úpravy záznamu. Skladá sa z kariet `.dcard` s ikonou a nadpisom.

## 6. Stavové štítky

Jediný vzor je **chip** (`.chip`): malý okrúhly štítok, vľavo farebná bodka, vedľa text. Farba bodky sa berie zo zoznamu `OPT` – tam je pre každý stav jedna farba:

| Skupina | Stavy a farby |
|---|---|
| Podujatie | Nápad (sivá) · V príprave (okrová) · Prebieha (modrá) · Zrealizované (zelená) · Zrušené (červená) |
| Grant | Nápad · Píšeme žiadosť (okrová) · Podané (oranžová) · Schválené (modrá) · Zrealizované (tyrkysová) · Vyúčtované (zelená) · Nepodporené (červená) · Pozastavené (fialová) |
| Projekt | Nápad · V príprave · Prebieha · Dokončené · Pozastavené |
| Úloha | Inbox (sivá) · Tento týždeň (modrá) · Rozpracované (oranžová) · Hotové (zelená) |
| Priorita | Urgentné (červená) · Normálne (okrová) · Nízka (zelená) |

Pravidlo: **stav = vždy chip**. Prázdny chip s rámikom (`chip out`) je pre neutrálne označenia. Termín po lehote sa píše červeno (`late`), „dnes“ tiež.

## 7. Záložky

Sú **dva schválené druhy**, každý na iné miesto:

**a) Záložky s čiarou – v detaile záznamu** (vzor: podujatie, grant). Riadok pod hlavnou kartou, text 16 px, neaktívna sivá, vybraná tmavá a tučná s **3 px modrou čiarou pod ňou**; celý riadok má dole 1 px čiaru.

**b) Záložky „tabletky“ s počtom – v zoznamoch** (vzor: Kontakty – Osoby 100 · Firmy 78 · Organizácie 28 · Média 3). Vybraná tabletka má jemné pozadie, počet je malý a sivý za názvom. Pod nimi môže byť riadok filtrov z obrysových štítkov (Dobrovoľník, Partner…).

Detail projektu má dnes tabletky – podľa tohto pravidla má mať čiaru (pozri `ZOZNAM-UPRAV.md`). Prepínač pohľadu **Galéria / Tabuľka** je osobitný prvok (dva-tri spojené gombíky) a s tabletkami sa nemieša.

## 8. Formuláre

- Polia (`input`, `select`, `textarea`): biele, rámik 1 px `--line`, rohy 8 px, vnútri 7 × 10 px, text 14 px.
- Popisok je **nad poľom** alebo **vľavo** v mriežke „vlastností“ (150 px), farba `--muted`, 13 px.
- V bočnom paneli a v kartách sa polia „vlastností“ tvária ako text – rámik sa ukáže až pri prechode myšou alebo kliknutí (úprava priamo na mieste, bez tlačidla Uložiť).
- Výber záznamu (projekt, kontakt…) je pole s našepkávaním (`combo`).
- Výber viacerých možností sú malé okrúhle gombíky (`mchips`).
- Zaškrtnutie úlohy je štvorček 17 px, po zaškrtnutí zelený s fajkou.
- Mazanie a nezvratné kroky vždy cez potvrdzovacie okno (`ask`).

## 9. Prázdne stavy

- Text v `.empty`: sivý, 14 px, jednou vetou po slovensky, povie **čo tu bude** a **ako to pridať** („Zmluvy, technický rider, scenár… Nahrajte PDF alebo vložte odkaz.“).
- Ak sa dá položka rovno vytvoriť, pod textom je modré tlačidlo (`emptyBox`).
- V galérii je prázdne miesto nahradené prerušovanou kartou „+ Nové …“.
- Ak záznam neexistuje: „Podujatie sa nenašlo.“ a tlačidlo „Späť na podujatia“.
- Počas načítania: „Načítavam dáta tímu…“.

## 10. Ostatné prvky

- **Horná lišta** (`navbar`): šípka späť, cesta (Podujatia › NOX:art). Zostáva prilepená hore pri posúvaní.
- **Oznámenie** (`.notice`): svetlomodrý pás s vetou na vrchu stránky.
- **Toast**: tmavá bublina dole uprostred na 3 sekundy („Uložené“).
- **Tabuľka**: hlavička sivá 12,5 px, riadky oddelené čiarou, kliknutie na riadok otvorí záznam, súčty v pätičke tučne.
- **Pruhy postupu** (`.bar`): 8 px vysoké, modré, pri prekročení rozpočtu červené.
- **Ikony**: jednoduché čiarové, hrúbka 1,8 px, 18 px; farba podľa textu.

---

## Čo sa nesmie

1. Nepísať farby ručne (`#C2372E`) – používať pomenované.
2. Nevymýšľať nový druh tlačidla, záložky ani karty – použiť existujúci.
3. Nedávať na jednu obrazovku viac ako jedno modré tlačidlo.
4. Nepísať vzhľad priamo do prvku (`style="…"`) tam, kde existuje pomenovaný štýl.
