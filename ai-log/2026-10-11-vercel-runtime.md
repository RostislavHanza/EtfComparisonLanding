# Oprava ESM importů Vercel Functions

## Skutečný prompt a diagnostický podklad

Uživatel poskytl runtime chybu z nasazeného Preview:

> Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/http.ts' imported from /var/task/api/preview-admin.js

Požadoval prozkoumat Vercel konfiguraci/package/tsconfig/importy, opravit příčinu pro všechny API endpointy oficiálním runtime řešením, zachovat API a bezpečnost, přidat kontrolu před nasazením, spustit lint/typecheck/testy/build a pokud možno skutečný Vercel build/runtime. Výslovně autorizoval commit a push pouze do `design-exploration`, zakázal změny migrací/environment variables a ruční deployment. Závěr má vysvětlit příčinu, opravu a ověření nového Preview; samotné lokální testy nepotvrzují nápravu nasazeného endpointu.

## Zjištěná příčina

Všech devět endpointů a jejich serverové závislosti importovalo relativní `.ts` soubory. Root konfigurace byla frontendová (`moduleResolution=bundler`, `noEmit`, `allowImportingTsExtensions`) a Vite build nesestavoval backend. Testy používaly tsx, který zdrojové importy umí načíst. Oficiální builder `@vercel/node` kompiluje a balí TS závislosti pod názvy `.js`; původní import by tedy v ESM artefaktu ukazoval na neexistující soubor. Prostudován i nainstalovaný builder (23.0.1): výběr nejbližšího tsconfig, TypeScript kompilace, NFT trasování závislostí a přejmenování TS souborů v balíčku.

## Oprava

- Relativní importy v `api/`, `server/` a závislosti `shared/validation.ts` používají runtime `.js` přípony. TypeScript je rozpoznává jako odpovídající `.ts` zdroje; tsx vývoj i frontend zůstávají kompatibilní.
- Přidán `tsconfig.server.json` s NodeNext a skutečným emitováním; `api/tsconfig.json` zajistí jeho použití i oficiálním Vercel builderem. Frontendová konfigurace zůstala zachována.
- `check:server` načítá/vykonává všech devět emitovaných handlerů bez TS loaderu, s bezpečnými metodami a navíc ověřuje nepřihlášený GET Preview administrace. Tato kontrola je nyní součást buildCommand přes `npm run build`.
- `check:vercel` použije skutečný lokální oficiální builder, materializuje jeho výstup do izolovaných adresářů a spustí emitované ESM soubory Node.js 24. Nejde o kopírování zdrojů do produkce; jsou to pouze testovací artefakty builderu. Regresní zkouška ověří, že opětovný neexistující `.ts` import způsobí detekovanou chybu.
- Žádné změny migrací, SMTP/Supabase logiky, prostředí, přihlašování nebo publikování ETF. Generované soubory pouze v ignorovaném `.cache/`; ESLint tento výstup vynechává.

## Průběžné kontroly a opravy

První serverový typecheck odhalil i zbývající `.ts` import v `shared/validation.ts`; opraven společně s celým serverovým grafem. Lokální oficiální builder následně úspěšně sestavil a spustil všech devět Node.js 24 artefaktů. Kontroly neodesílají e-maily, nespouštějí synchronizaci, nepřistupují ke skutečné DB a mají externí fetch zakázaný. Samostatné procesy Vercel artefaktů dostávají pouze PATH a syntetickou testovací konfiguraci.

## Finální výsledky a omezení

Prošly lint, typecheck, 31/31 testů, produkční build (včetně nové kontroly všech devíti emitovaných funkcí) a `check:vercel` všech devíti oficiálních Node.js 24 Lambda artefaktů. Regresní mutace importu `http.js` na neexistující `http.ts` vyvolala očekávanou chybu ERR_MODULE_NOT_FOUND a byla automaticky obnovena v testovacím artefaktu.

Pokus o skutečný nepřihlášený GET veřejného Preview nebyl doručen Vercelu: síťová HTTPS proxy Codexu odmítla vytvoření tunelu s HTTP 403. Toto není HTTP stav aplikace ani důkaz funkčnosti/nefunkčnosti nasazené verze. Nejsou žádány nové tokeny/oprávnění a blokace není obcházena. Nasazený endpoint musí uživatel po automatickém deploymentu ověřit přímo: HTTP 200 + authenticated:false, bez ERR_MODULE_NOT_FOUND v Runtime Logs. Lokální kontrola builderu nezastupuje ověření vzdáleného deploymentu.

Builder vytvořil pouze lokální `.vercel/node/package-manifest.json` cache; přidáno ignorování `.vercel/`, nic z tohoto metadata adresáře není commitováno. Diff a známé tajné hodnoty zkontrolovány bez jejich vypisování. Lokální autor je RostislavHanza s GitHub noreply e-mailem; globální konfigurace nezměněna.
