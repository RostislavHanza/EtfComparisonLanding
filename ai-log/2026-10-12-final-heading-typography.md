# Dvouřádkový nadpis a sjednocení úvodního oddělovače

## Skutečné zadání (doslovné výňatky)

> Z hlavní stránky úplně odstraň text: „Americký trh. ETF NYSE.“

> Americká ETF
> Kalkulačka výnosů

> Na mobilu jsou přesně dva řádky nadpisu bez dalšího zalamování.

> První oddělovací čára má stejnou tloušťku jako ostatní hlavní oddělovače.

> Uprav tak, aby slovo „výnosů“ nebylo kurzívou.

> Neměň jednoduchou reklamu /add-simple.

> Commitni a pushni pouze na design-exploration. main neměň.

## Změny

Zkontrolována čistá větev a aktuální styly/testy. Hero eyebrow včetně tečky odstraněn z JSX, není nahrazován prázdným blokem. H1 text bez koncových teček, br zachovává požadované dvě části; pouze mobil pod 700 px má přizpůsobenou font-size a nowrap na jednotlivých částech. Desktopový font/barvy a kurzíva hlavního hero zůstávají. Úvodní border nad kroky má 3 místo 4 px; stejný accent jako existující 3px border výběru, žádné jiné čáry se nemění. V ads/style.css přidáno pouze font-style:normal na h1 em; zelená a mobilní display/centrování zachovány.

Browser MVP test rozšířen o 360 a 393 px, přesné texty, chybějící eyebrow, jeden vizuální řádek každé části a porovnání tloušťky existujících oddělovačů. Reklamní browser kontrola ověřuje také nekurzivní řez. README upraven. Nezměněny /add-simple, ikony, kampaně, souhlasy, finance, ETF metadata nebo serverový kód.

## Ověření

Prošly lint, typecheck, všech 78 unit/backend testů, produkční build hlavního webu i obou reklam a NodeNext kontrola všech 10 API endpointů. Celá browser sada prošla včetně soukromí, adminu, kampaní, uložených srovnání, historie a obou reklam. Po vizuální kontrole byl mobilní hero font upřesněn na min(12vw,46.4px), aby se původní velikost zmenšovala jen při potřebné šířce; opakovaný build a celý MVP browser test s touto finální velikostí prošly. Přesné dva řádky a žádný overflow ověřeny na 320/360/390/393 px, také desktop 1440 px a mezilehlé breakpointy. Screenshot 320 px prohlédnut. /add normal font-style se zelenou a kompaktní výškou ověřen, /add-simple má nezměněné zdrojové soubory i assety. Autor a noreply, diff a přítomnost secrets ověřeny před commitem. Nasazený Preview zatím netestován. Backend browser fixtures a unit testy neodesílají skutečné zprávy ani neprovádějí zápisy do vzdálené DB.
