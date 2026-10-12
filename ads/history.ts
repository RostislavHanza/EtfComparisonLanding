import { annualizedReturn, grossReturnFromNet } from '../shared/performance.js'
import type { HistoricalYears } from '../shared/performance.js'

// Static documented summaries, not raw prices; preserved source dates are not a new download.
export const history = [
  {
    "ticker": "SPY",
    "r1": 20.5,
    "r3": 87.1,
    "r5": 86.7,
    "as_of": "2026-10-09",
    "license": "CC BY 4.0",
    "sourceUrl": "https://tickerinside.com/api/v1/fund/spy.json",
    "retrievedAt": "2026-10-11T20:43:15.966915+00:00",
    "sha256": "9ba70f472e93176d17c1123019f2081923778dc7c69840914f0f5e1ed8a0b458"
  },
  {
    "ticker": "VOO",
    "r1": 20.5,
    "r3": 87.5,
    "r5": 87.2,
    "as_of": "2026-10-09",
    "license": "CC BY 4.0",
    "sourceUrl": "https://tickerinside.com/api/v1/fund/voo.json",
    "retrievedAt": "2026-10-11T20:43:16.436240+00:00",
    "sha256": "a5346f808bddff2c31f9a82a53afd6b3e3e2a56d89dede0acd97c5a12f24ce5b"
  }
] as const

export function historicalAssumption(cumulative: number | null, years: HistoricalYears, expense: number | null) {
  return grossReturnFromNet(annualizedReturn(cumulative, years), expense)
}
