# ETF přehled — pět návrhů frontendu

Mobilní návrhy české landing page podle [plánu](docs/PLAN.md). React, Vite, TypeScript strict a Tailwind CSS. **Pouze frontend:** bez Supabase, backendu, ukládání adres, skutečných e-mailů a analytiky.

## Spuštění

Node.js 22.12+ nebo 24, npm:

```sh
npm ci
npm run dev
```

Otevřete adresu vypsanou Vitem. Návrhy přepínejte horní lištou (na mobilu select). Přímé adresy používají tyto query parametry:

| Parametr | Návrh | Rozložení a interakce |
| --- | --- | --- |
| `?variant=editorial` | Redakční | Serifový úvod, otevřený seznam fondů a formulář vedle textu |
| `?variant=steps` | V krocích | Centrovaný úvod, oblý panel, výběr → e-mail |
| `?variant=terminal` | Pracovní panel | Tmavé rozhraní, monospace popisky, dlaždice |
| `?variant=guide` | Průvodce | Asymetrická sazba, rozbalovací položky, očíslované výhody |
| `?variant=compact` | Kompaktní | Stručný split, přepínače, formulář v centru pozornosti |

Výběr a formulář se při přepnutí varianty resetují, aby šlo porovnávat výchozí zkušenost. URL podporuje obnovení stránky i historii zpět/vpřed. Vybrat lze dvě až tři položky; předvybrané A a B lze změnit. Všechny varianty umožňují vyzkoušet formulář s testovací adresou. Výsledek výslovně sděluje, že se nic neodeslalo.

```sh
npm run typecheck
npm run build
npm run preview
```

## Pořadí sekcí a konverzní strategie

Příslib → interaktivní výběr a formulář → obsah nabídky → FAQ → závěrečné CTA → informační patička. U varianty „V krocích“ je e-mail až v druhém kroku. Úvod vede k vlastnímu výběru a formulář vysvětluje, že v budoucí službě bude srovnání dostupné až po potvrzení e-mailu. Opakované CTA vede zpět ke stejnému výběru, nevytváří další formulář. Upozornění na PRIIPs/KID je před formulářem.

## Technické řešení a Vercel

`src/App.tsx` sdílí obsah a chování, ale mění skutečné struktury výběru a pomocí pěti CSS kompozic rozložení i typografii. `src/data.ts` obsahuje pouze layoutové fixtures. Tailwind se načítá oficiálním Vite pluginem; vlastní vizuální kompozice jsou v `src/styles.css`. Použity systémové fonty bez externího stahování.

Vercel: nastavit kořen projektu na tento checkout, framework **Vite**, install `npm ci`, build `npm run build`, output `dist`. Žádné proměnné prostředí nejsou potřeba. Všechny varianty jsou na kořenové cestě s query parametrem, takže nepotřebují serverové routování. Nasazení zatím nebylo provedeno.

Návrhy jsou určeny pro větev `design-exploration`. Při propojení GitHub repozitáře s Vercelem použijte tuto větev pro Preview Deployment; produkční větev ponechte `main`. Samotný push neprokazuje vytvoření ani úspěch Vercel preview.

## Omezení a další práce

- A–D jsou jasně označené zástupné položky, nikoli skutečná ETF. Neobsahují finanční údaje ani reference. Primární stránky emitenta při pokusu o kontrolu vrátily HTTP 403. Ověřený dataset se zdroji a daty kontroly musí být doplněn samostatně.
- Formulář používá pouze klientskou validaci pro demonstraci. Žádná konfirmace, serverová bezpečnost ani doručování nejsou implementovány. Nezadávejte skutečné osobní údaje.
- Plánované srovnání se před potvrzením nesmí dostat do klientského bundle; tento prototyp jej vůbec neobsahuje.
- Provozovatel, skutečné kontaktní a právní texty, souhlasy, retence a marketing budou doplněny až pro funkční službu. Prototyp nemá marketingový odběr.
- Události funnelu, A/B experimenty a konverzní odhady zatím nemají výsledky z provozu.
- Frontendové kontroly nejsou důkazem funkčnosti produkční služby ani kompletního WCAG auditu.

Průběh práce a skutečné prompty: [ai-log](ai-log/2026-10-09-frontend.md).

## Provedené kontroly

Build a typecheck prošly. V Chromium byly ověřeny všechny varianty na šířkách 320, 390, 768 a 1440 px včetně výběru a demo formuláře; bez horizontálního přetékání a JS chyb. Ověřeny byly také přepínání, historie, minimum/maximální výběr, neplatný e-mail a načtení produkčního buildu. Kompletní audit přístupnosti ani reálné konverze zatím neproběhly.
