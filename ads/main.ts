import { funds } from './funds.js'
import { history, historicalAssumption } from './history.js'
import type { HistoricalYears } from '../shared/performance.js'
import { MAX_AMOUNT_CZK, money } from '../shared/model.js'
import { profitScale, scenarioProfit } from '../shared/performance.js'

const investment = document.querySelector<HTMLInputElement>('#investment')!
const slider = document.querySelector<HTMLInputElement>('#investment-range')!
investment.max = slider.max = String(MAX_AMOUNT_CZK)
const horizon = document.querySelector<HTMLInputElement>('#horizon')!
const error = document.querySelector<HTMLParagraphElement>('#error')!
const body = document.querySelector<HTMLTableSectionElement>('#funds')!
for (const fund of funds) {
  const row = document.createElement('tr')
  row.innerHTML = `<th scope="row"><strong>${fund.ticker}</strong><span class="name">${fund.name}</span><span class="fee">Nákladovost ${String(fund.expenseRatioPercent).replace('.', ',')} % / rok</span></th>
    <td><label class="sr-only" for="rate-${fund.ticker}">Předpokládaný roční výnos ${fund.ticker} (%)</label><input id="rate-${fund.ticker}" type="number" min="-100" max="100" step="any" required inputmode="decimal"></td>
    <td><output id="profit-${fund.ticker}"></output><div class="track" aria-hidden="true"><span class="zero"></span><span class="bar"></span></div></td>`
  body.append(row)
}
const rates = funds.map(f => document.querySelector<HTMLInputElement>(`#rate-${f.ticker}`)!)
function update() {
  if (investment.checkValidity()) {
    slider.value = investment.value
    slider.setAttribute('aria-valuetext', money(investment.valueAsNumber))
  }
  const validSettings = investment.checkValidity() && horizon.checkValidity()
  const profits = funds.map((fund, i) => validSettings && rates[i].checkValidity()
    ? scenarioProfit(investment.valueAsNumber, rates[i].valueAsNumber, horizon.valueAsNumber, fund.expenseRatioPercent) : null)
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
  const dates = new Set<string>()
  funds.forEach((fund, i) => {
    const snapshot = history.find(h => h.ticker === fund.ticker)
    const cumulative = snapshot?.[`r${period}`] ?? null
    const rate = historicalAssumption(cumulative, period, fund.expenseRatioPercent)
    rates[i].value = rate === null ? '' : String(rate)
    rates[i].placeholder = rate === null ? 'Nedostupné' : ''
    if (snapshot) dates.add(new Date(`${snapshot.as_of}T00:00:00Z`).toLocaleDateString('cs-CZ', { timeZone: 'UTC' }))
  })
  document.querySelector<HTMLParagraphElement>('#reference')!.textContent =
    `Historické referenční období: ${period === 1 ? '1 rok' : period === 3 ? '3 roky' : '5 let'}. Údaje k ${[...dates].join(', ')}. Procenta jsou odvozena z historie a přepočtena před modelovanými náklady. Nejde o předpověď.`
  periodButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.period) === period)))
  update()
}
for (const button of periodButtons) button.addEventListener('click', () => {
  period = Number(button.dataset.period) as HistoricalYears
  restoreHistory()
})
document.querySelector<HTMLButtonElement>('#restore')!.addEventListener('click', restoreHistory)
slider.addEventListener('input', () => { investment.value = slider.value; update() })
for (const input of [investment, horizon, ...rates]) input.addEventListener('input', update)
restoreHistory()
