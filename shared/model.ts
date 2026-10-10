export const MAX_AMOUNT_CZK = 10_000_000
export interface SourceEvidence { field: string; url: string; verified_at: string; as_of: string; evidence: string }
export interface EtfRecord {
  ticker: string; name: string; exchange: 'NYSE Arca'; index: string; expenseRatioPercent: number;
  dividends: string; description: string; verifiedAt: string; dataAsOf: string; sources: SourceEvidence[];
}
export interface SavedComparison { id: string; tickers: string[]; amountCzk: number; funds: EtfRecord[]; createdAt: string; updatedAt: string }
export const annualCost = (amount: number, percent: number) => amount * percent / 100
export const money = (value: number) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 2 }).format(value)
export const percent = (value: number) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 4 }).format(value) + ' %'
