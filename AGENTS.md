# Pravidla vývoje

## Záměr projektu

Česká mobilní landing page pro získání e-mailu výměnou za užitečné srovnání ETF. Vycházej z `docs/PLAN.md`. Zachovej jednoduchou cestu k jednomu hlavnímu formuláři; nové funkce přidávej jen v rámci zadání.

## Stack a struktura

- React + Vite + TypeScript (strict) + Tailwind, hosting Vercel, kontakty Supabase.
- Preferuj malé komponenty, standardní HTML a minimum závislostí. Nepřidávej router, stavovou knihovnu ani UI framework bez konkrétní potřeby.
- Odděl prezentační komponenty, typovaná data ETF a serverovou integraci. Privilegované databázové operace patří pouze do serverové funkce.
- Používej existující checkout; cloudová úloha je již izolovaná. Nevytvářej worktree bez výslovného požadavku.

## UX a obsah

- Navrhuj nejprve pro mobil od 320 px. Zamez horizontálnímu přetékání, zachovej čitelnost a dotykové cíle alespoň 44 × 44 px.
- Používej češtinu, sémantické HTML, viditelné labely, ovládání klávesnicí, viditelný focus a dostupné chybové i úspěšné stavy. Cílem je WCAG 2.2 AA.
- Formulář vyžaduje jen e-mail; další marketingový souhlas je samostatný, nepovinný a nepředvyplněný. Neskrývej důležité podmínky do patičky.
- Nevymýšlej finanční data, reference ani výnosy. U ETF ověř ticker, burzu, zdroj a datum dat. Viditelně vysvětli omezení PRIIPs/KID pro český retail a investiční rizika.
- Optimalizuj velikost obrázků, fontů a JavaScriptu. Žádná rušivá okna, automatické video ani zbytečné animace.

## Kontakty a bezpečnost

- Validuj vstupy i na serveru. Zamez dvojímu odeslání, nastav ochranu proti spamu a distribuované omezení frekvence. Klientská validace sama nestačí.
- Supabase musí mít RLS; anonymní klient nesmí číst ani zapisovat kontakty. Privilegované klíče nikdy nedávej do klientského bundle ani proměnných `VITE_*`.
- Necommituj tajné hodnoty; `.env.example` obsahuje jen názvy a bezpečné ukázky. Nezapisuj e-maily, klíče ani potvrzovací tokeny do logů, analytiky nebo URL parametrů pro měření.
- U tokenů používej hash v úložišti a expiraci. Uživatelský e-mailový odkaz k uloženému srovnání je opakovaně použitelný i bez původní session; potvrzení zaznamenej jen poprvé. Administrátorské přihlášení zůstává jednorázové. Zajisti opakovatelné bezpečné zpracování a obnovu při selhání doručování.
- Pro nové i existující adresy vracej stejnou veřejnou odpověď. Preview a testy musí používat oddělená data a bezpečné testovací doručování.
- Neukládej zbytečné osobní údaje. Změny účelu zpracování, souhlasů a retence musí respektovat schválené informační texty.

## Ověření a spolupráce

- Před změnou zkontroluj stav Gitu a zachovej cizí úpravy. Necommituj, nenasazuj do produkce a nespouštěj kampaně bez výslovného zadání.
- Pro všechny nové commity používej Conventional Commits v angličtině: `type(scope): description` (scope je volitelný), například `docs: update landing page plan`. Anglicky piš i případné tělo a patičky commit zprávy. Dosavadní commity kvůli tomuto pravidlu neměň.
- Po implementaci spusť dostupný build a typecheck. Testy zaměř na důležité chování: formulář, serverovou validaci, souhlasy, duplicity, potvrzení adresy a chybové stavy.
- Mobilní stránku ověř v prohlížeči a serverovou integraci skutečným testovacím požadavkem. Pouhé spuštění procesu nebo mock nepotvrzuje funkční doručení.
- V reportu uveď změny, provedené kontroly a konkrétní neověřené části. Neoznačuj neprovedené testy ani produkční integraci za funkční.

## Doplněný rozsah do 16. října 2026

- Schválený funkční rozsah: rozšiřitelný katalog přibližně 15–20 ručně ověřených ETF na NYSE Arca, hledání tickeru/názvu a výběr od jednoho fondu bez pevného maxima (neprázdný, bez duplicit a v rámci ověřeného katalogu). Od 12. října 2026 veřejný vstup nabízí pouze výběr a e-mail; parametry, kalkulačka a historie vyžadují serverově ověřenou session z automaticky zpracovaného e-mailového odkazu. Zachovej původní redakční vzhled.
- Veřejná ověřená metadata jsou z katalogového API. Uložený výběr a částku chraň serverovou session, včetně přímých požadavků na endpoint. První automatické potvrzení může proběhnout na jiném zařízení; platný e-mailový odkaz opakovaně vytvoří novou session i bez původní cookie. Pravdivě vysvětli omezení aktivních browser skenerů, expiraci a ochranu přístupového odkazu. Demo data patří pouze do výslovně označených archivních návrhů a testů.
- Používej jen skutečné, ověřené údaje. Ke každému poli eviduj primární zdroj, datum platnosti a datum kontroly. AI není finanční zdroj; neověřené hodnoty vynech a popiš omezení.
- Implementuj funnel podle `docs/PLAN.md`: návštěvy, interakce, formulář, serverové přijetí, potvrzení a otevření srovnání. Zamez dvojímu započítání, úniku osobních údajů a míchání nesrovnatelných kohort. Respektuj souhlas se sledováním.
- Odhad konverze vždy označ jako předpoklad do ověření. A/B testy prováděj postupně; bez dostatečného vzorku neoznačuj variantu za vítěze.
- Při implementaci aktualizuj README: pořadí sekcí, konverzní strategie, technické řešení, spuštění, ověřování a konkrétní nedostatky. Rozlišuj hotové funkce od plánu.
- Do `ai-log/` průběžně ukládej skutečné prompty, kontroly výsledků, zjištěné chyby a opravy. Prompty nevymýšlej zpětně, tajné údaje rediguj a neprovedené kontroly označ.
- Ruční kontrola dat nejméně týdně; nepublikuj neověřené fondy. Automatický import neimplementuj bez schváleného zdroje a oprávnění. Supabase + Vercel Functions + Nodemailer/Gmail SMTP, bez zbytečných účtů/front a admin systémů.
- Termín 16. října není důvod přeskočit ověření dat, ochranu kontaktů nebo potvrzovací cestu. Odlož PDF, živá data a složitý screener; blokery popiš před předáním.
