# ETF přehled — druhé kolo vizuálních návrhů

Mobilní návrhy české landing page podle [plánu](docs/PLAN.md). React, Vite, TypeScript strict a Tailwind CSS. **Pouze frontend:** bez Supabase, backendu, ukládání adres, skutečných e-mailů a analytiky.

## Spuštění

Node.js 22.12+ nebo 24, npm:

```sh
npm ci
npm run dev
```

Otevřete adresu vypsanou Vitem. Návrhy přepínejte horní lištou (na mobilu select). Přímé adresy používají tyto query parametry:

| Parametr | Koncept | Paleta |
| --- | --- | --- |
| `?variant=editorial-blue` | Redakční seznam se serifovou typografií | Bílá + modrá |
| `?variant=editorial-green` | Stejný redakční seznam | Bílá + zelená |
| `?variant=compact-blue` | Kompaktní panel s přepínači | Bílá + modrá |
| `?variant=compact-green` | Stejný kompaktní panel | Bílá + zelená |
| `?variant=steps-blue` | Samostatný výběr, nastavení a e-mail | Bílá + modrá |
| `?variant=steps-green` | Stejný postup v krocích | Bílá + zelená |

V rámci barevné dvojice se mění jen paleta, ne geometrie. Přepnutí barvy zachovává výběr, nastavení i fázi; přepnutí konceptu je resetuje. URL podporuje obnovení a historii. Výchozí koncept je Editorial – Blue; neznámý parametr na něj bezpečně spadne. Původní `editorial`, `compact` a `steps` jsou aliasy modrých návrhů; první kolo Terminal a Guide lze stále otevřít přes `?variant=terminal` a `?variant=guide`, ale nejsou v přepínači druhého kola.

Vyberte dvě až tři ukázkové položky, nastavte náklady / zaměření / dividendy a rizika (minimálně jeden parametr) a pokračujte k e-mailu. E-mail není na úvodní obrazovce. Formulář vyzkoušejte testovací adresou: následná ukázka výslovně sděluje, že se nic neodeslalo. Skutečné srovnání prototyp neposkytuje.

```sh
npm run typecheck
npm run build
npm run preview
```

## Pořadí sekcí a konverzní strategie

Příslib → výběr ETF → nastavení srovnání → e-mail → ukázka dalšího kroku; poté výhody nabídky, FAQ, závěrečné CTA a patička. Editorial a Compact mají výběr a nastavení v jednom panelu; Steps je odděluje do dvou kroků. Ve všech šesti variantách se e-mail objeví až po pokračování. Úvod vede k vlastnímu výběru a formulář vysvětluje, že v budoucí službě bude srovnání dostupné až po potvrzení e-mailu. Opakované CTA vede zpět ke stejnému výběru, nevytváří další formulář. Upozornění na PRIIPs/KID je před formulářem.

## Technické řešení a Vercel

`src/App.tsx` sdílí obsah a chování, ale mění skutečné struktury výběru a pomocí konceptových CSS kompozic rozložení i typografii. `src/data.ts` obsahuje pouze layoutové fixtures. Tailwind se načítá oficiálním Vite pluginem; původní kompozice jsou v `src/styles.css`, párové palety a úpravy druhého kola v `src/round-two.css`. Barevné varianty jsou definovány v `src/data.ts`. Použity systémové fonty bez externího stahování.

Vercel: nastavit kořen projektu na tento checkout, framework **Vite**, install `npm ci`, build `npm run build`, output `dist`. Žádné proměnné prostředí nejsou potřeba. Všechny varianty jsou na kořenové cestě s query parametrem, takže nepotřebují serverové routování. Nasazení zatím nebylo provedeno.

Návrhy jsou určeny pro větev `design-exploration`. Při propojení GitHub repozitáře s Vercelem použijte tuto větev pro Preview Deployment; produkční větev ponechte `main`. Samotný push neprokazuje vytvoření ani úspěch Vercel preview.

## Omezení a další práce

- A–D jsou jasně označené zástupné položky, nikoli skutečná ETF. Neobsahují finanční údaje ani reference. Primární stránky emitenta při pokusu o kontrolu vrátily HTTP 403. Ověřený dataset se zdroji a daty kontroly musí být doplněn samostatně.
- Formulář používá pouze klientskou validaci pro demonstraci. Žádná konfirmace, serverová bezpečnost ani doručování nejsou implementovány. Nezadávejte skutečné osobní údaje.
- Plánované srovnání se před potvrzením nesmí dostat do klientského bundle; tento prototyp jej vůbec neobsahuje.
- Provozovatel, skutečné kontaktní a právní texty, souhlasy, retence a marketing budou doplněny až pro funkční službu. Prototyp nemá marketingový odběr.
- Události funnelu, A/B experimenty a konverzní odhady zatím nemají výsledky z provozu.
- Frontendové kontroly nejsou důkazem funkčnosti produkční služby ani kompletního WCAG auditu.

Průběh práce a skutečné prompty: [první kolo](ai-log/2026-10-09-frontend.md) a [druhé kolo](ai-log/2026-10-09-round-two.md).

## Provedené kontroly

Build a typecheck prošly. V Chromium bylo ve druhém kole ověřeno všech šest variant na šířkách 320, 390, 768 a 1440 px včetně výběru a demo formuláře; bez horizontálního přetékání a JS chyb. Ověřeny byly také přepínání, historie, minimum/maximální výběr, neplatný e-mail a načtení produkčního buildu. Kompletní audit přístupnosti ani reálné konverze zatím neproběhly.

Ve druhém kole byly navíc porovnány rozměry a pozice prvků mezi modrou a zelenou, zachování stavu při změně palety, nastavení alespoň jednoho parametru a všechny původní URL. Backend, doručování a Vercel nasazení se tím neověřují.
