// Formatting never replaces the precise model value; only explicit input edits do.
export const displayNumber = (value: number) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(value)
export function parseDecimal(value: string): number | null {
  const normalized = value.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}
