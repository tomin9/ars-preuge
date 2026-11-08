# Plán: granty

Rozhovor s majiteľom o záložkách grantu (november 2026). Zapisuje sa, čo je **dohodnuté**, čo je **návrh** (čaká na odpoveď) a otvorené otázky. Až po dohode všetkých záložiek sa začne robiť.

## Spoločné: napojenie na Claude (rozhodnuté – variant B)

- Plugin dostane v administrácii WordPressu nastavenie **API kľúč Anthropic** (uložený len na serveri, tím ho nevidí). Kľúč treba vytvoriť na console.anthropic.com; platí sa za použitie.
- WordPress súbor alebo stránku stiahne / prijme, pošle Claude a vráti výsledok aplikácii. **Vždy sa najprv ukáže prehľad na potvrdenie**, až potom sa ukladá.
- Stránky a PDF za prihlásením do grantového systému WordPress sám neotvorí → majiteľ ich stiahne ako PDF a nahrá.

## Záložka Výzva – dohodnuté

- Tlačidlo **„Načítať výzvu“**: odkaz na stránku výzvy alebo nahratie PDF → Claude vytiahne údaje (termíny, sumy, spolufinancovanie, kto môže žiadať, oprávnené výdavky, povinné prílohy…) → prehľad na potvrdenie → uloží sa; PDF sa uloží medzi dokumenty výzvy.
- Otvorené: ktoré údaje sú najdôležitejšie; odkazy na 2–3 skutočné výzvy na vyskúšanie.

## Záložka Žiadosť – dohodnuté

- Majiteľ chce: nahrať PDF z grantového systému (štruktúra je vždy iná), načítať ho a potom do toho dopisovať.
- **„Načítať formulár žiadosti“** (PDF) → Claude vytiahne časti/otázky, pokyny, limity znakov, prípadne už napísaný text → prehľad na potvrdenie; PDF sa uloží medzi dokumenty žiadosti.
- Písanie v rozložení ako **Texty podujatia**: vľavo časti s bodkou stavu, vpravo editor s pokynom z formulára, počítadlo znakov s limitom (červené pri prekročení), Kopírovať; súhrn „hotové X z Y“.
- Nová verzia PDF: zhodné časti si nechajú text, nové pribudnú, zrušené sa len označia (nič sa nezmaže).
- ✅ **Rozpočet zo žiadosti** sa načíta rovno do záložky Rozpočet ako rozpočtové položky (s prehľadom na potvrdenie).
- ✅ **„Navrhnúť text“** pri každej časti – Claude napíše návrh z údajov o projekte, podujatiach a výzve; majiteľ ho upraví.
- ✅ **Komentáre** pri každej časti (bez prideľovania „kto má časť na starosti“).
- ❌ Stiahnutie celej žiadosti ako Word/PDF netreba.
- ❓ Povinné prílohy: majiteľ nevie → zatiaľ ukázať zoznam príloh z výzvy ako nepovinný kontrolný zoznam (s možnosťou priložiť súbor); rozhodne sa, keď ho uvidí.

## Záložka Zmluva – zrušiť (dohodnuté)

- Majiteľ záložku nepotrebuje. Predtým mal pri grante **tri PDF: Žiadosť, Zmluva, Vyúčtovanie** a to mu vyhovovalo.
- Návrh: tri dokumenty ako malé náhľady **priamo v hlavnej karte grantu** (otvoriť / nahrať, ak chýba). Žiadosť sa použije aj v záložke Žiadosť na načítanie formulára. „Postup“ a „Ľudia a kontakty“ zo záložky Zmluva – rozhodnúť, či niekam presunúť alebo zrušiť.

## Záložka Rozpočet – návrh (čaká na odpovede)

Majiteľ potrebuje: **plánovaný rozpočet** (zo žiadosti/zmluvy) → **kategórie** → **položky** s plánovanou sumou → **skutočné výdavky** (platby z denníka priradené k položke). Treba dodržať súčet každej kategórie aj celkovú sumu; snažia sa držať pôvodného plánu.

- Tabuľka po kategóriách: Plán · Zaplatené · Plánované (v denníku bez dátumu) · Zostáva · pruh · stav. Pri položke rozbaliteľný zoznam platieb, priradenie existujúcej / zápis novej platby priamo odtiaľ.
- Varovania: kategória nad plánom = červená; položka nad plánom v rámci kategórie = okrová; celková suma v súčte aj v hlavnej karte. Nezaradené platby osobitne.
- Zaplatené a plánované osobitne (opraví E7).
- Rozdelenie z dotácie / vlastné zdroje pri položke ostáva, súčty osobitne.
- Plán sa naplní zo žiadosti (dohodnuté pri Žiadosti), dá sa upraviť ručne.
- Rozpočet podujatia použije tie isté kategórie a položky grantu.
- Dáta: rozpočtová položka (`budgetLines`) dostane nové pole **kategória** (a poradie); existujúce položky bez kategórie pôjdu do „Bez kategórie“ – nič sa nepremenúva.
- Otázky: limity poskytovateľa (napr. presun medzi kategóriami do X %)? pôvodný aj upravený rozpočet? jedna platba do viacerých položiek? kategórie podľa poskytovateľa, alebo vlastné stále?

## Ďalšie záložky – na prebratie

- Úlohy · Podujatia · hlavná karta grantu.

## Zistené chyby (zapísať aj do ZOZNAM-UPRAV.md)

- Záložka Zmluva: v karte „Ľudia a kontakty“ je obrovská ikona osoby (ikona nemá veľkosť mimo bočného panela).
- „Minuté / čerpané z dotácie“ rátajú aj plánované platby bez dátumu – rozhodnúť, či ukazovať zaplatené a plánované osobitne (ako rozpočet podujatia).
- Platbu možno priradiť len ku grantu v stave „Schválené“ (nie „Zrealizované“) – neskoré faktúry sa nedajú priradiť.
