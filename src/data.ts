// Layout fixtures only. No real fund identities or financial data are asserted.
export const funds = [
  { id: 'a', name: 'Ukázkový fond A', category: 'Široký americký trh', mark: 'A', description: 'Místo pro ověřený název a zaměření ETF.' },
  { id: 'b', name: 'Ukázkový fond B', category: 'Velké americké společnosti', mark: 'B', description: 'Místo pro ověřený název a zaměření ETF.' },
  { id: 'c', name: 'Ukázkový fond C', category: 'Střední americké společnosti', mark: 'C', description: 'Místo pro ověřený název a zaměření ETF.' },
  { id: 'd', name: 'Ukázkový fond D', category: 'Dividendové zaměření', mark: 'D', description: 'Místo pro ověřený název a zaměření ETF.' },
] as const
export const concepts = [
  { id: 'editorial', name: '01 · Redakční', note: 'Velká serifová typografie, otevřený seznam a klidná stránka.' },
  { id: 'steps', name: '02 · V krocích', note: 'Výrazný titulek, oblý panel a výběr ve dvou krocích.' },
  { id: 'terminal', name: '03 · Pracovní panel', note: 'Tmavá plocha, monospace popisky a dlaždicový výběr.' },
  { id: 'guide', name: '04 · Průvodce', note: 'Asymetrická sazba, očíslovaná cesta a rozbalovací karty.' },
  { id: 'compact', name: '05 · Kompaktní', note: 'Stručný split layout, jednoduché přepínače a formulář v centru.' },
] as const
export type Concept = typeof concepts[number]['id']

// Round two pairs share structure; only palette changes within a concept.
export const designs = [
  { id: 'editorial-blue', concept: 'editorial', palette: 'blue', name: 'Editorial – Blue' },
  { id: 'editorial-green', concept: 'editorial', palette: 'green', name: 'Editorial – Green' },
  { id: 'compact-blue', concept: 'compact', palette: 'blue', name: 'Compact – Blue' },
  { id: 'compact-green', concept: 'compact', palette: 'green', name: 'Compact – Green' },
  { id: 'steps-blue', concept: 'steps', palette: 'blue', name: 'Steps – Blue' },
  { id: 'steps-green', concept: 'steps', palette: 'green', name: 'Steps – Green' },
] as const
export type DesignId = typeof designs[number]['id'] | 'terminal' | 'guide'
