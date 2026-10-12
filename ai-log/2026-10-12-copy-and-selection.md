# Požadované texty, FAQ a flexibilní výběr ETF

Výchozí commit: `063399d021f71208aca129bbe8d0926512e6e36c`, pouze větev `design-exploration`. Úplný skutečně dostupný prompt je v [prompts/2026-10-12-copy-and-selection.txt](prompts/2026-10-12-copy-and-selection.txt), převzatý z uživatelova přiloženého souboru; normalizováno pouze ukončení řádků. Žádné prompty nebyly domýšleny.

## Provedené změny

- Požadované texty potvrzení, FAQ, souhrnu, nadpisu uloženého přehledu a stručné informace o správci. Z výběru odstraněno jen zobrazení data; datum zůstává v DTO, tabulce a zdrojích. Návratový mechanismus z předchozí migrace 008 se nemění.
- `Zpráva byla odeslána` je podmíněna explicitním API status=sent. Server ho vydá až po await SMTP acceptance a zápisu stavu; ne po vložení do DB/fronty. Při chybě, pending nebo jiné neúplné odpovědi UI úspěch neukáže. Doručení do inboxu se tím neprokazuje.
- Odstraněny minimum dva a maximum pět v aktivním React srovnávači a sdíleném serverovém validátoru. Žádné nové pevné maximum. Nadále se odmítá prázdný/duplicitní výběr a fond mimo publikovaný čerstvý katalog; zůstává 8KiB HTTP limit a původní rate limiting.
- Připravena migrace 009 měnící pouze constraint a stávající create/update RPC. Původní migrace nebyly upraveny. Zachovány snapshoty, ochrana session, oprávnění, consent records a analytické triggery. Trigger 008 nadále nastavuje expiraci; 009 sama nemění return token RPC ani datum stávajících tokenů.
- Mobilní katalog má dva fondy na řádek; první šestice, další po šesti. Hledání běží přes celý dostupný katalog; při novém hledání zobrazí nejprve šest výsledků. Výběr se nemění a zůstává označený/dostupný přes štítky i mimo aktuální výsledky. Na desktopu má rozsáhlejší detailní tabulka vlastní horizontální posun přístupný klávesnicí. Kalkulační výpočty ani design kalkulačky se neměnily.
- Zkrácený požadovaný text uvádí ETFMaster a mailto kontakt. Přehled poskytovatelů a odvolání starších marketingových souhlasů zůstává v samostatném oznámení. Nový formulář nadále nesbírá marketing. Právní úplnost nelze potvrdit bez skutečné identifikace správce, smluv a regionů; potřebné kontroly případných přenosů mimo EHP jsou uvedeny v README/SETUP. Žádné neověřené smluvní záruky nebo právní schválení nejsou tvrzeny.

## Kontroly a opravy

- Lint, typecheck, 62 unit/backend/SQL testů a produkční build prošly. Nový PGlite test provádí skutečné SQL lokálně: vytvoření s jedním fondem, uložení/restaurace dvaceti, návrat zpět na jeden, neplatná session, prázdný výběr, duplicity, nepublikované/zastaralé fondy a anon oprávnění. Potvrzena 90denní expirace po kombinaci 008+009 a opakované použití tokenu. App testy používají izolovaný SMTP transport, žádné skutečné zprávy.
- Browser test zpočátku porovnával innerText FAQ eyebrow, který CSS převádí na velká písmena. Opraven test na textContent; zachována původní typografie. Odstraněn také ponechaný závěrečný dovětek návratové FAQ, aby odpověď přesně odpovídala zadání.
- Celá browser sada Chromium proti lokálnímu produkčnímu buildu prošla: přesné texty a FAQ, datum pouze v detailu, dva fondy na řádek, 6/12/18/20 položek, hledání dvacáté položky a štítky, jeden i sedm fondů v e-mailovém formuláři, prázdný výběr, úspěch/chyba/pending, automatický opakovaný odkaz a obnovení výběru/částky, privacy a odvolání, Preview admin a atribuce. Kalkulačka/graf/detail: jeden, pět a šest fondů na 320/390/1440 px. Šestý je výslovná izolovaná testovací metadata fixture bez historie; žádná historická hodnota nebo křivka pro něj nebyla vymyšlena.
- Oficiální Vercel Node.js 24 builder: všech deset API artifacts prošlo, včetně regresní detekce neexistujícího TS importu. Lokální check:server rovněž prošel. To není potvrzení nasazeného runtime nebo živého Supabase/SMTP.
- README, PLAN, SETUP a AGENTS odpovídají novému neprázdnému výběru bez maxima; historická AI evidence a archivní návrhy nebyly přepsány.

## Ruční kroky a omezení

Novou 009 správce aplikuje jednou samostatně podle SETUP část 13; předchozí 008 musí být již aplikovaná pro opakované návratové odkazy. S pěti aktuálně publikovanými fondy je absence Zobrazit další správná; dvacet synchronizačních kandidátů se automaticky nepublikuje. Historický datový zdroj zůstává ověřený pro současnou publikovanou pětici, širší výběr nezakládá chybějící historii. Nedostupné podklady nezpůsobí falešná procenta.

Neproběhly vzdálené zápisy nebo migrace, změny environment variables, skutečné e-maily ani ruční deployment. Provozovatel musí porovnat zveřejněný kontakt s OPERATOR_NAME/OPERATOR_CONTACT, ověřit úplnou identitu správce a skutečné případné přenosy a záruky. Tento záznam nepředstírá právní schválení.
