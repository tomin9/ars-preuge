# Plán: granty

Rozhovor s majiteľom o záložkách grantu (november 2026). Zapisuje sa, čo je **dohodnuté**, čo je **návrh** (čaká na odpoveď) a otvorené otázky. Až po dohode všetkých záložiek sa začne robiť.

## ⚠ Bezpečnosť existujúcich grantov (pevné pravidlo)

Majiteľ už má granty v aplikácii zadané a fungujú – **nič sa nesmie zmazať ani zmeniť**.

1. Nič sa nemaže ani nepremenúva; nové veci sú **nové polia vedľa existujúcich** (sumy, položky, platby a ich prepojenia ostávajú).
2. Žiadne automatické prepisovanie ani hromadné úpravy záznamov pri načítaní. Položky bez kategórie sa ukážu v skupine „Bez kategórie“; kategóriu priradí majiteľ.
3. Pôvodný rozpočet sa vytvorí len tlačidlom „Uložiť ako pôvodný rozpočet“ (odfotí aktuálny stav); dovtedy jeden rozpočet ako dnes.
4. Pred každým nasadením zmeny grantov **upozorniť majiteľa na zálohu**: WordPress → Ars Preuge → Import dát → „Stiahnuť zálohu dát (JSON)“ (bez nahraných súborov – tie sa nemenia).
5. Každú zmenu vyskúšať na testovacích údajoch napodobňujúcich granty (položky, platby, podujatia) a overiť, že sumy pred a po sedia; obrázky na schválenie.
6. Pri probléme vrátiť predchádzajúcu verziu aplikácie – dáta sa neprepisujú, takže ostanú ako predtým.

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

## Záložka Rozpočet – ✅ hotové vo verzii 1.69.0

Majiteľ potrebuje: **plánovaný rozpočet** (zo žiadosti/zmluvy) → **kategórie** → **položky** s plánovanou sumou → **skutočné výdavky** (platby z denníka priradené k položke). Treba dodržať súčet každej kategórie aj celkovú sumu; snažia sa držať pôvodného plánu.

- Tabuľka po kategóriách: Plán · Zaplatené · Plánované (v denníku bez dátumu) · Zostáva · pruh · stav. Pri položke rozbaliteľný zoznam platieb, priradenie existujúcej / zápis novej platby priamo odtiaľ.
- Varovania: kategória nad plánom = červená; položka nad plánom v rámci kategórie = okrová; celková suma v súčte aj v hlavnej karte. Nezaradené platby osobitne.
- Zaplatené a plánované osobitne (opraví E7).
- Rozdelenie z dotácie / vlastné zdroje pri položke ostáva, súčty osobitne.
- Plán sa naplní zo žiadosti (dohodnuté pri Žiadosti), dá sa upraviť ručne.
- Rozpočet podujatia použije tie isté kategórie a položky grantu.
- Dáta: rozpočtová položka (`budgetLines`) dostane nové pole **kategória** (a poradie); existujúce položky bez kategórie pôjdu do „Bez kategórie“ – nič sa nepremenúva.
- ✅ **Limit presunu:** pri grante nové pole „Povolený presun medzi kategóriami (%)“; upozornenie pri priblížení a prekročení.
- ✅ **Pôvodný a aktuálny rozpočet:** tlačidlo „Uložiť ako pôvodný rozpočet“ (odfotí aktuálny stav do nových polí); tabuľka ukáže pôvodný plán, aktuálny plán a rozdiel.
- ✅ **Jedna platba = jedna položka** (ostáva ako dnes).
- ✅ **Kategórie sú pri každom grante vlastné** (zo žiadosti alebo ručne), žiadny stály zoznam.

## Záložka Úlohy – dohodnuté

- Zoznam úloh grantu ostáva. Pribudne **„Navrhnúť úlohy z dokumentov“**: Claude prečíta zmluvu (prípadne výzvu či iný dokument grantu) a navrhne úlohy s termínmi (napr. vyúčtovanie, záverečná správa, publicita/logo, oznámenie zmien) → prehľad na potvrdenie, jednotlivé sa dajú odškrtnúť → vytvoria sa ako bežné úlohy priradené ku grantu (kalendár, Prehľad).

## Záložka Podujatia – dohodnuté

- Stačí zobraziť priradené podujatia (ako dnes). Bez ďalších výpočtov.

## Hlavná karta grantu – návrh

- Podoba ako karta podujatia (obrázok vľavo, názov, štítok stavu, ceruzka), tri dokumenty Žiadosť · Zmluva · Vyúčtovanie ako náhľady.
- Otvorené: ktoré sumy na prvý pohľad (ostatné do Rozpočtu); či ostáva export „Podklad k vyúčtovaniu (CSV)“.

## Navrhované poradie prác

1. **Bez Claude (dá sa hneď):** ✅ Rozpočet s kategóriami (1.69.0; limit presunu = % z plánu kategórie, porovnáva sa s celkovými nákladmi – majiteľ ešte potvrdí, či to tak ráta poskytovateľ) (zaplatené/plánované, limit presunu, pôvodný rozpočet) + opravy E7–E9 · zrušenie záložky Zmluva a tri dokumenty v hlavnej karte · hlavná karta v podobe podujatia · Žiadosť ako editor častí (s limitmi znakov a komentármi – časti sa dajú zapísať aj ručne).
2. **S Claude (po získaní API kľúča):** nastavenie kľúča v plugine · Načítať výzvu · Načítať formulár žiadosti (+ rozpočet do Rozpočtu) · Navrhnúť text · Navrhnúť úlohy z dokumentov.

## Zistené chyby (zapísať aj do ZOZNAM-UPRAV.md)

- Záložka Zmluva: v karte „Ľudia a kontakty“ je obrovská ikona osoby (ikona nemá veľkosť mimo bočného panela).
- „Minuté / čerpané z dotácie“ rátajú aj plánované platby bez dátumu – rozhodnúť, či ukazovať zaplatené a plánované osobitne (ako rozpočet podujatia).
- Platbu možno priradiť len ku grantu v stave „Schválené“ (nie „Zrealizované“) – neskoré faktúry sa nedajú priradiť.
