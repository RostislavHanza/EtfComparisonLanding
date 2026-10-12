# Ikony jednoduché reklamy a konverzní atribuce

## Skutečné zadání — doslovné výňatky

> Z nové jednoduché reklamy úplně odstraň nadpis: „Co získáte ve svém srovnání?“

> Odhadovaný zisk → dollar-sign
> Historický vývoj → chart-no-axes-combined
> Detailní srovnání → list-checks
> Vlastní přehled na e-mail → mail-check

> /add → ad-a
> /add-simple → ad-b
> návštěva bez reklamního zdroje → direct

> Bez souhlasu neodesílej volitelné funnel události ani neukládej nové identifikátory návštěvníků.

> Commitni a pushni pouze na design-exploration. main neměň.

## Zjištění a změny

Čistá větev navazující na 1022b926, AGENTS.md známý. Dosavadní backend již validuje tři hodnoty kampaně, ukládá atribuční JSON u srovnání a používá jej pro lead_accepted/email_sent a potvrzení/otevření v SQL. Rozhodnutí o odvolání a retenční mechanismus se nemění. Klient dříve četl kampaň pouze z URL; přechod bez UTM v rámci návštěvy tak mohl vracet direct. Doplněna pouze persistence validované kampaně v sessionStorage při již uděleném souhlasu; před souhlasem žádné ID nebo kampaň. Odvolání oba údaje vymaže. Neznámé utm_campaign se mapuje na direct; backendová validace zůstává.

Statické ikony získány z oficiálních https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/{name}.svg, licence z oficiálního LICENSE. Převzaté přesné aktuální geometrie (dollar-sign a list-checks byly shodné, chart a mail aktualizovány proti skutečnému zdroji). Plná licence v ads/simple/LUCIDE-LICENSE.txt, příslušné ISC/MIT notice v HTML komentáři přítomném i v sestaveném souboru. Bez JS balíčku nebo runtime síťového načítání. Nadpis odstraněn, čtyři názvy/popisy zachovány, ikony jen v této reklamě, dekorativní aria-hidden a focusable=false. Oba relativní odkazy mají vlastní utm_campaign a původní kotvu comparator.

## Ověření a opravy

Browser kontrola napojena na kliknutí ze skutečných statických reklam a izolované API fixtures; serverové eventy testovány přes Application, uložení/potvrzení/otevření/úpravy/nová session přes skutečné lokální SQL v PGlite. Bez vzdálených DB zápisů nebo skutečných e-mailů. Lint browseru opraven na explicitní globalThis.sessionStorage. Kopie oficiálních SVG obsahovaly neviditelné whitespace textové uzly a přesný textový test selhal; inter-tag whitespace byl odstraněn, geometrie se nezměnila. Dodatečný test ukázal, že původní serverová validace neznámou kampaň normalizuje na direct, nikoli vyhazuje výjimku; opraveno očekávání testu a formulace dokumentace bez změny validátoru. Finálně prošly lint, typecheck, všech 78 unit/backend testů, produkční build všech HTML vstupů, 10 NodeNext endpointů a oficiální lokální Vercel builder/runtime test všech 10 funkcí. Celá browser sada prošla (hlavní MVP, soukromí, admin, atribuce, investice, obě reklamy a kampaň). Reklama s ikonami zkontrolována na 320×568, 360×640, 390×740, 393×852 a 1440×900, bez scrollu a overflow; screenshot 390 px vizuálně prohlédnut. Pro každé ad-a/ad-b/direct ověřeno, že před souhlasem nejsou ID/události, po souhlasu stejné kampaně u landing/form/submit a žádosti, pokračování bez UTM zachová zdroj, odvolání zastaví měření a odstraní campaign/visitId. Application test zachová kampaně v lead_accepted/email_sent a bez souhlasu nic neemituje. Lokální SQL test s opakovaně použitelným odkazem ověřuje zachování kampaně při potvrzení, čtení, editaci a vytvoření nové session po vymazání staré. Neznámé UTM/atribuce jsou direct, libovolný text se neukládá. Diff, tajné hodnoty a lokální author/noreply ověřeny. Nová migrace není potřeba; žádné vzdálené zápisy či skutečné e-maily. Nasazený Preview netestován.
