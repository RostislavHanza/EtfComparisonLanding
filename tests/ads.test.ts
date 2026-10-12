import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { funds, verifiedAt } from '../ads/funds.js'
import { scenarioProfit, profitScale } from '../shared/performance.js'

test('standalone ad metadata matches the approved snapshot without rounding SPY fees', async () => {
  const catalog = JSON.parse(await readFile('data/priority-five.approved.json', 'utf8')).records
  for (const fund of funds) {
    const approved = catalog.find((r: { ticker: string }) => r.ticker === fund.ticker)
    assert.equal(fund.name, approved.name)
    assert.equal(fund.expenseRatioPercent, approved.expenseRatioPercent)
    assert.equal(verifiedAt, approved.verifiedAt)
  }
  assert.deepEqual(funds.map(f => f.ticker), ['SPY', 'VOO'])
})
test('ad scenarios use the main model including fees for positive, zero and negative assumptions', () => {
  for (const years of [1, 3, 5, 10, 20, 30]) {
    for (const rate of [-10, 0, 6]) {
      const results = funds.map(f => scenarioProfit(100000, rate, years, f.expenseRatioPercent)!)
      funds.forEach((f, i) => assert.ok(Math.abs(results[i] - (100000 * ((1 + rate / 100) * (1 - f.expenseRatioPercent / 100)) ** years - 100000)) < 1e-8))
      assert.ok(results[0] < results[1])
      if (rate === 0) assert.ok(results.every(r => r < 0))
      const scale = profitScale(results)
      assert.equal(scale.bars.length, 2)
      assert.ok(scale.bars.every(b => b !== null && b.width <= 100))
    }
  }
  assert.ok(Math.abs(scenarioProfit(100000, 0, 1, funds[0].expenseRatioPercent)! + 94.5) < 1e-8)
  assert.ok(Math.abs(scenarioProfit(100000, 0, 1, funds[1].expenseRatioPercent)! + 30) < 1e-8)
})

test('ad history preserves the documented per-fund cumulative returns, source and dates', async () => {
  const { history } = await import('../ads/history.js')
  const observed = JSON.parse(await readFile('data/review/performance-observations.json', 'utf8')).funds
  for (const snapshot of history) {
    const original = observed.find((f: { ticker: string }) => f.ticker === snapshot.ticker)
    for (const key of Object.keys(snapshot)) assert.equal(snapshot[key as keyof typeof snapshot], original[key])
  }
  assert.deepEqual(history.map(h => [h.r1, h.r3, h.r5]), [[20.5, 87.1, 86.7], [20.5, 87.5, 87.2]])
})
test('ad annualizes history and restores gross assumptions without subtracting expenses twice', async () => {
  const { history, historicalAssumption } = await import('../ads/history.js')
  for (const years of [1, 3, 5] as const) {
    for (const fund of funds) {
      const cumulative = history.find(h => h.ticker === fund.ticker)![`r${years}`]
      const gross = historicalAssumption(cumulative, years, fund.expenseRatioPercent)!
      const net = ((1 + cumulative / 100) ** (1 / years) - 1) * 100
      assert.ok(Math.abs((1 + gross / 100) * (1 - fund.expenseRatioPercent / 100) - (1 + net / 100)) < 1e-12)
      assert.ok(Math.abs(scenarioProfit(100000, gross, years, fund.expenseRatioPercent)! - 100000 * cumulative / 100) < 1e-7)
    }
  }
  assert.equal(historicalAssumption(null, 5, .03), null)
  assert.equal(historicalAssumption(20, 3, null), null)
  assert.ok(historicalAssumption(-20, 3, .03)! < 0)
})
