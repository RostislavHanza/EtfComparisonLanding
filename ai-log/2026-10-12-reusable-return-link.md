# Opakovaně použitelný e-mailový návratový odkaz

Navazuje na commit `12bc5e3192c29f456ade49962ab887f0d051ab26`, větev `design-exploration`. Tento záznam nemění předchozí historické prompty ani výsledky.

## Skutečný dostupný prompt

> Upřesnění k e-mailovému odkazu:
>
> Odkaz zaslaný uživateli nesmí být omezený na jednu session ani jednorázové otevření.
>
> Jde o návratový odkaz k jeho uloženému interaktivnímu srovnání ETF.
>
> Po prvním otevření automaticky ověř e-mail a zpřístupni srovnávač. Při dalších návštěvách stejného odkazu musí být srovnání znovu dostupné, i po zavření prohlížeče nebo skončení session.
>
> Nevyžaduj nové potvrzení e-mailu, další tlačítko ani opětovné zadání adresy.
>
> Zachovej bezpečný neuhodnutelný token a ochranu proti úniku. Odkaz může mít rozumně definovanou dobu platnosti nebo možnost zneplatnění z bezpečnostních důvodů, ale nesmí se spotřebovat prvním otevřením.
>
> Nevytvářej nový přístupový mechanismus, pokud lze bezpečně využít stávající řešení.
>
> Ostatní požadavky z předchozího promptu zůstávají beze změny.

## Změna

- Stávající 256bitový token, jeho hash a `redeem_comparison` zůstávají. Nová migrace 008 mění RPC tak, že token nepotřebuje předchozí cookie a každé platné otevření vytvoří novou 30denní session. Řádkový zámek chrání první potvrzení; `confirmed_at` a souhlasem podmíněný `email_confirmed` se neopakují.
- INSERT trigger nastavuje novým odkazům pevnou maximální platnost 90 dní. Žádný existující odkaz se neprodlužuje ani neobnovuje. Nepoužité žádosti stále podléhají 30denní retenci. Otevření tokenu ani session tyto lhůty neposouvá.
- Odebrána session-dependent fallback větev do `reopen_comparison`. Historická migrace 007 se nemění; její RPC už aplikace nevolá. Administrátorské jednorázové přihlášení se nemění.
- E-mail, FAQ, potvrzení o předání zprávy a uložený přehled vysvětlují skutečný návrat a ochranu přístupového odkazu. Aktualizovány README, SETUP, PLAN, PERFORMANCE a AGENTS, aby další vývoj neobnovil staré jednorázové chování.
- Fragment se odstraňuje z adresního řádku; token se neloguje ani neukládá do localStorage. ID bez serverové cookie nic neodemkne. Zachována kontrola Origin/JSON, HTTPS cookie a rate limit. Držitel e-mailového odkazu má přístup: odkaz se nesmí sdílet.
- GET/HEAD a neaktivní stránky neověřují. Plně aktivní browser skener může být považován za uživatele; automatické potvrzení nemůže garantovat jeho odlišení. Nově tím alespoň nezneplatní odkaz pro skutečného uživatele.

## Ověření a opravy

- První běh přidaného SQL testu selhal kvůli testovací hodnotě `z` místo hexadecimálního hashe. Opraven pouze testovací hash; databázová validace nebyla oslabena. Numerický výstup PostgreSQL je v testu převeden explicitně na číslo.
- `npm test`: 60/60 prošlo. PGlite provádí skutečné SQL migrace v izolovaném PostgreSQL enginu: první potvrzení, opakování, souběžné návraty, nová session po expiraci staré, zachování uložené částky, jediné potvrzení, neznámý token, expirace, neobnovení starých expirovaných odkazů a zákaz anon RPC. Původní databázové testy ponechávají historické chování základních migrací; nové testy ověřují výsledné chování po 008.
- `npm run lint`, `npm run typecheck`, `npm run build`: prošly. Build kontroluje všech deset emitovaných Node.js endpointů bez TypeScript loaderu.
- `npm run check:vercel`: všech deset oficiálních Node.js 24 function artifacts prošlo, včetně regresní kontroly chybného `.ts` runtime importu. Jde o lokální build oficiálním builderem, nikoli ověření nasazeného endpointu.
- Celá browser sada Chromium proti lokálnímu produkčnímu buildu prošla: veřejný vstup 320–1440 px, automatické otevření, opakovaný návrat po smazání cookie, návrat v úplně novém browser contextu, obnovení uložených úprav, odmítnutí zneplatněného odkazu a přímého ID bez cookie. Prošly také privacy/odvolání, Preview admin, atribuce SPY/VTI a kalkulačka včetně null/outage. Browser API jsou izolované fixtures; nejsou vydávány za test živých služeb.

## Ruční krok a omezení

Správce musí jednou aplikovat novou migraci `202610120008_reusable_comparison_links.sql` podle `docs/SETUP.md`, část 12. Bez této DB změny staré RPC stále odmítne již potvrzený token. Původní migrace neopakovat. Nebyly provedeny vzdálené zápisy, změny environment variables, skutečné e-maily ani ruční deployment. Stav Vercel Preview ani skutečné doručení tímto lokálním ověřením nejsou potvrzené.
