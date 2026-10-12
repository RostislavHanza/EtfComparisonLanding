import { test } from 'node:test'
import assert from 'node:assert/strict'
import { annualCost, validAmount } from '../src/etfData.ts'

test('annual cost converts a percentage into CZK, including decimal inputs and zero', () => {
  assert.equal(annualCost(100_000, 0.03), 30)
  assert.equal(annualCost(100_000, 0.0945), 94.5)
  assert.equal(annualCost(250_000, 0.03), 75)
  assert.equal(annualCost(0, 0.03), 0)
  assert.equal(annualCost(100_000, 0), 0)
  assert.ok(Math.abs(annualCost(125_000.5, 0.03) - 37.50015) < 1e-9)
})
test('invalid and out-of-range amounts or rates cannot produce misleading chart values', () => {
  for (const amount of [-1, NaN, Infinity, 10_000_001]) {
    assert.equal(validAmount(amount), false)
    assert.throws(() => annualCost(amount, 0.03), RangeError)
  }
  assert.equal(validAmount(10_000_000), true)
  for (const rate of [-0.03, NaN, Infinity]) assert.throws(() => annualCost(100_000, rate), RangeError)
})
