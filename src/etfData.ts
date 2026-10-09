export interface Etf {
  ticker: string
  name: string
  index: string
  expenseRatioPercent: number
  dividends: string
  description: string
  source: string
}

// All parameters are DEMONSTRATION values pending primary-source verification.
// Primary-source requests returned HTTP 403 on 2026-10-09. No live/current claim.
export const etfs: readonly Etf[] = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', index: 'S&P 500', expenseRatioPercent: 0.0945, dividends: 'Distribuční · čtvrtletně', description: 'Americké velké společnosti; struktura trustu.', source: 'https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', index: 'S&P 500', expenseRatioPercent: 0.03, dividends: 'Distribuční · čtvrtletně', description: 'ETF zaměřené na americké velké společnosti.', source: 'https://fund-docs.vanguard.com/F0968.pdf' },
  { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', index: 'S&P 500', expenseRatioPercent: 0.03, dividends: 'Distribuční · čtvrtletně', description: 'Indexové ETF na americké velké společnosti.', source: 'https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf' },
]
export const MAX_AMOUNT = 10_000_000
export function validAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && amount <= MAX_AMOUNT
}
export function annualCost(amount: number, expenseRatioPercent: number): number {
  if (!validAmount(amount) || !Number.isFinite(expenseRatioPercent) || expenseRatioPercent < 0) throw new RangeError('Invalid calculator input')
  return amount * expenseRatioPercent / 100
}
export const money = (value: number) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 2 }).format(value)
export const percent = (value: number) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 4 }).format(value) + ' %'
