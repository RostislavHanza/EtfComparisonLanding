# Jemné zmenšení mobilního nadpisu — 12. 10. 2026

## Použitý prompt (výňatky z aktuálního zadání)

> „Mírně zmenši velikost písma druhého řádku ‚Kalkulačka výnosů‘ na mobilních displejích.“
> „Zachovej celý text ‚Kalkulačka výnosů‘ na jednom řádku i na šířce 320 px.“
> „Na desktopu zachovej současnou velikost a rozložení.“
> „Neměň reklamy `/add` ani `/add-simple`."
> „Otestuj mobilní šířky 320, 360, 390 a 393 px.“
> „Jde pouze o jemnou úpravu velikosti mobilního nadpisu. Nic dalšího neměň.“

## Změna a kontrola

Pouze druhý řádek hlavního nadpisu má při šířce do 699 px velikost 0,92 em, tedy o 8 % menší. První řádek, font, kurzíva, barva, zarovnání a desktopové styly zůstaly zachované. Zdroje reklam nebyly změněny.

Browser regresní kontrola ověřuje jeden řádek každé části nadpisu, nezměněnou velikost prvního řádku, poměr velikosti druhého řádku a viditelné odstupy od okrajů. Měření skutečného textu v Chromium:

| Šířka | Druhý řádek | Od levého okraje | Od pravého okraje |
| --- | --- | --- | --- |
| 320 px | 35,328 px | 22 px | 66,19 px |
| 360 px | 39,744 px | 22 px | 77,16 px |
| 390 px | 42,688 px | 22 px | 87,88 px |
| 393 px | 42,688 px | 22 px | 90,88 px |

Všechny čtyři mobilní šířky mají druhý řádek bez zalomení a stránku bez horizontálního přetékání. Screenshot při 320 px byl vizuálně zkontrolován. Na desktopu při 1440 px zůstává font 88 px a stávající rozložení; pravidlo změny je výhradně mobilní.

Prošly `npm run lint`, `npm run typecheck`, `npm run build` (včetně načtení a provedení všech 10 zkompilovaných API endpointů bez TypeScript loaderu) a `tests/browser/mvp.mjs` na lokálním produkčním buildu. Browser suite ověřila také desktop 768/1100/1440 px, formulář, návratové odkazy, uložené úpravy a bezpečné chybové stavy. API v browser testech bylo mockované; žádné skutečné e-maily ani vzdálené databázové zápisy neproběhly. Celá unit suite a nasazené Vercel Preview nebyly v této drobné CSS úloze znovu testovány.
