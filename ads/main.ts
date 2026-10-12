import { displayNumber, parseDecimal } from './display.js'
import { funds } from './funds.js'
import { history, historicalAssumption } from './history.js'
import type { HistoricalYears } from '../shared/performance.js'
import { MAX_AMOUNT_CZK, money } from '../shared/model.js'
import { profitScale, scenarioProfit } from '../shared/performance.js'

const investment = document.querySelector<HTMLInputElement>('#investment')!
const slider = document.querySelector<HTMLInputElement>('#investment-range')!
slider.max = String(MAX_AMOUNT_CZK)
const precise = new Map<HTMLInputElement, number | null>([[investment, 100000]])
const horizon = document.querySelector<HTMLInputElement>('#horizon')!
const horizonSlider = document.querySelector<HTMLInputElement>('#horizon-range')!
const error = document.querySelector<HTMLParagraphElement>('#error')!
const body = document.querySelector<HTMLTableSectionElement>('#funds')!
for (const fund of funds) {
  const row = document.createElement('tr')
  row.innerHTML = `<th scope="row"><strong>${fund.ticker}</strong><span class="name">${fund.name}</span><span class="fee"><span class="fee-label">Nákladovost /rok</span> ${String(fund.expenseRatioPercent).replace('.', ',')} %</span></th>
    <td><label class="sr-only" for="rate-${fund.ticker}">Předpokládaný roční výnos ${fund.ticker} (%)</label><input id="rate-${fund.ticker}" type="text" required inputmode="decimal"></td>
    <td><output id="profit-${fund.ticker}"></output><div class="track" aria-hidden="true"><span class="zero"></span><span class="bar"></span></div></td>`
  body.append(row)
}
const rates = funds.map(f => document.querySelector<HTMLInputElement>(`#rate-${f.ticker}`)!)
function update() {
  const amount = precise.get(investment) ?? null
  const validAmount = amount !== null && amount >= 0 && amount <= MAX_AMOUNT_CZK
  if (validAmount) {
    slider.value = String(amount)
    slider.setAttribute('aria-valuetext', money(amount))
  }
  if (horizon.checkValidity()) horizonSlider.value = horizon.value
  const profits = funds.map((fund, i) => {
    const rate = precise.get(rates[i]) ?? null
    return validAmount && horizon.checkValidity() && rate !== null && rate >= -100 && rate <= 100
      ? scenarioProfit(amount, rate, horizon.valueAsNumber, fund.expenseRatioPercent) : null
  })
  const scale = profitScale(profits)
  error.hidden = profits.every(p => p !== null)
  error.textContent = error.hidden ? '' : 'Zadejte částku 0–10 000 000 Kč, horizont 1–30 celých let a roční výnos −100 až 100 %.'
  funds.forEach((fund, i) => {
    const output = document.querySelector<HTMLOutputElement>(`#profit-${fund.ticker}`)!
    const row = output.closest('tr')!
    const bar = row.querySelector<HTMLElement>('.bar')!
    const value = profits[i]
    output.textContent = value === null ? '—' : `${value > 0 ? '+' : ''}${money(value)}`
    output.classList.toggle('negative', value !== null && value < 0)
    bar.classList.toggle('negative', value !== null && value < 0)
    bar.style.left = `${scale.bars[i]?.start ?? 0}%`
    bar.style.width = `${scale.bars[i]?.width ?? 0}%`
    row.querySelector<HTMLElement>('.zero')!.style.left = `${scale.zero}%`
  })
}
let period: HistoricalYears = 5
const periodButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-period]')]
function restoreHistory() {
  funds.forEach((fund, i) => {
    const snapshot = history.find(h => h.ticker === fund.ticker)
    const cumulative = snapshot?.[`r${period}`] ?? null
    const rate = historicalAssumption(cumulative, period, fund.expenseRatioPercent)
    precise.set(rates[i], rate)
    rates[i].value = rate === null ? '' : displayNumber(rate)
    rates[i].placeholder = rate === null ? 'Nedostupné' : ''
  })
  document.querySelector<HTMLParagraphElement>('#reference')!.textContent = 'Historické referenční období.'
  periodButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.period) === period)))
  update()
}
for (const button of periodButtons) button.addEventListener('click', () => {
  period = Number(button.dataset.period) as HistoricalYears
  restoreHistory()
})
document.querySelector<HTMLButtonElement>('#restore')!.addEventListener('click', restoreHistory)
slider.addEventListener('input', () => {
  precise.set(investment, slider.valueAsNumber)
  investment.value = displayNumber(slider.valueAsNumber)
  update()
})
horizonSlider.addEventListener('input', () => { horizon.value = horizonSlider.value; update() })
horizon.addEventListener('input', update)
for (const input of [investment, ...rates]) {
  input.addEventListener('input', () => { precise.set(input, parseDecimal(input.value)); update() })
  input.addEventListener('blur', () => {
    const value = precise.get(input)
    if (typeof value === 'number') input.value = displayNumber(value)
  })
}
investment.value = displayNumber(100000)
restoreHistory()
