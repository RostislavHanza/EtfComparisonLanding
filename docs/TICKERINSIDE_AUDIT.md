# TickerInside: skutečná kontrola 11. října 2026

Přečteny oficiální API dokumentace, `/api/sections/endpoints/fund.md`, `/api/sections/terms.md`, `/api/sections/cite.md`, `/terms/` a `/legal/`. Požadavky používají User-Agent ClienteloEtfDemo/1.0 s odkazem na repozitář. Výsledky níže pocházejí ze skutečných HTTP 200 JSON odpovědí `/api/v1/fund/{ticker}.json`, nikoli z mocků nebo seed datasetu. Toto je audit získaných informací, nikoli schválení publikace ani naplnění Supabase.

Všech 20 odpovědí obsahuje ticker, název, identifiers.asset_type=etf, identifiers.exchange=NYSE Arca a license=CC BY 4.0. Všech 20 postrádá sledovaný index, dividendovou politiku a popis použitelný jako požadovaná charakteristika. Category/breakdown a yield tato pole nenahrazují. API deklaruje 5 715 dostupných fondů na dokumentační stránce; celý tento počet jsme nezávisle neotestovali, pouze 20 vybraných fondů.

| Ticker | Expense ratio (%) | Zdroj nákladovosti v API | Datum podkladového filing | SHA-256 stažené JSON odpovědi |
| --- | --- | --- | --- | --- |
| SPY | 0.09 | market_data | Neuvedeno | `9ba70f472e93176d17c1123019f2081923778dc7c69840914f0f5e1ed8a0b458` |
| VOO | 0.03 | sec_filing | 2026-04-28 | `a5346f808bddff2c31f9a82a53afd6b3e3e2a56d89dede0acd97c5a12f24ce5b` |
| IVV | 0.03 | sec_filing | 2026-07-27 | `450a832f0ebc4bc0686cfa78946b1ac888ad4e8d204e21cbc6dfe8bd4ec784b7` |
| VTI | 0.03 | sec_filing | 2026-04-28 | `883a00bdeea0d58d435626923085f1a2ca6632f5e909851e6773ad39afd2b6ca` |
| ITOT | 0.03 | sec_filing | 2026-07-27 | `256e6c442515e19bababeaf488cd8e54c833fda1b860b9d37f3cc15e702a0903` |
| SCHB | 0.03 | sec_filing | 2025-12-22 | `78b76174e1b455149b7177328e5480b77c948a79418954a72b7e6a55ac038653` |
| SPYD | 0.07 | sec_filing | 2025-10-24 | `92a469993ec17a5759bfd57466f39308b6ea572aacc036aa350dc4cb9ebaa4ca` |
| VYM | 0.04 | sec_filing | 2026-02-27 | `381cc1bff3fa0a35830c10728b3d2ea6ee692e98e24ec42287689accae0ce351` |
| SCHD | 0.06 | sec_filing | 2025-12-22 | `f224bbf9073ee1ce4a35bba3d0ef60e64e6e97cb2939c119ec57294f44723637` |
| IWM | 0.19 | sec_filing | 2026-07-27 | `74a3dc32800d796e907b60a840447a0f67634122b5cbefb3370258ee46fb503a` |
| IJH | 0.05 | sec_filing | 2026-07-27 | `8ac96b4d556b4ed5f67a0aa5de2df6f68b475df693d955366f431616abff0cd7` |
| IJR | 0.06 | sec_filing | 2026-07-27 | `bfcf186859c0d5f3f9e14261a668d8d96e983a6af2fb6e2d9d8797009671bc23` |
| MDY | 0.23 | market_data | Neuvedeno | `a4d40cbcf6ddb388cde8b924f3e639037c87629e5b7f37c9036548d6ebd42047` |
| DIA | 0.16 | market_data | Neuvedeno | `bc2acea5de65d27d7a06c0bf481081983aeffed1400bb47c8bcecb6f30f53fdb` |
| RSP | 0.2 | sec_filing | 2026-08-27 | `b79d7b8cb3d793b4ddcc4a0c9d8dd2846261b69173898726727f1043acabd7dd` |
| VTV | 0.03 | sec_filing | 2026-04-28 | `150e41d5c9d02aebd6b2e633c11158fa68ba2b28a13a2e1f6ebca3e361d15880` |
| VUG | 0.03 | sec_filing | 2026-04-28 | `686b2585d57cca9b91348dd4cd32bd866e657d267e3578719af4559e83b6a7d1` |
| VT | 0.06 | sec_filing | 2026-02-27 | `c7f19907d4c1d97a6dc7ff9b2f451a0c8b81ba444f1372a439d93296adb3627a` |
| VEA | 0.03 | sec_filing | 2026-04-28 | `9a02c2f32f252f93eccbfb8cb383e521bfec063edb732ad2a6bcd934b549ce86` |
| VWO | 0.06 | sec_filing | 2026-02-27 | `2ac0b307c9421d1c232de308a19edc799070273b68ca695f09ef2b4532108811` |

17 fondů má datovanou nákladovost z SEC filing; SPY, MDY a DIA pouze market_data bez data nákladovosti. SPY zde vrací 0,09 %, zatímco předchozí oficiální SSGA export uváděl gross expense ratio 0,0945 %. Net/gross a zaokrouhlené market_data nesmějí být bez kontroly zaměněny.

Pro aktuální snapshoty je doložené získávání a uchování (nejvýše jednou za nightly build) a komerční použití TickerInside vlastní práce s uvedením zdroje. Licence nepokrývá práva jiných poskytovatelů k holdings nebo cenám. Synchronizace je proto neukládá ani nezobrazuje. Market_data nákladovost se pouze eviduje jako kandidát a neaplikuje automaticky na veřejný katalog. History a flows mají jiné podmínky a nejsou součástí adaptéru.

Žádný z těchto 20 fondů není tímto auditem automaticky schválen pro publikaci. Bez doplnění všech povinných polí a kontroly primárních zdrojů je počet kompletních schválených záznamů z tohoto importu 0. Odpověď VOO je zmenšená na skutečně použité položky v tests/fixtures/tickerinside/voo.json; obsah zůstává skutečný a datovaný, nejde o čerstvá produkční data pro budoucí běhy.

Zdroje: https://tickerinside.com/api/, https://tickerinside.com/api/sections/endpoints/fund.md, https://tickerinside.com/terms/, https://tickerinside.com/legal/, https://tickerinside.com/api/sections/cite.md. Citace konkrétního fondu: https://tickerinside.com/etf/{ticker}/ (ticker malými písmeny). Adaptované údaje označujeme jako převzaté z API a upravené pro zobrazení, s odkazem na licenci https://creativecommons.org/licenses/by/4.0/.
