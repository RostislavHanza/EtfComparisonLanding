import { funds } from './funds.js'
import { money } from '../shared/model.js'
import { profitScale, scenarioProfit } from '../shared/performance.js'

const investment = document.querySelector<HTMLInputElement>('#investment')!
const horizon = document.querySelector<HTMLInputElement>('#horizon')!
const error = document.querySelector<HTMLParagraphElement>('#error')!
const body = document.querySelector<HTMLTableSectionElement>('#funds')!
for (const fund of funds) {
  const row = document.createElement('tr')
  row.innerHTML = `<th scope="row"><strong>${fund.ticker}</strong><span class="name">${fund.name}</span><span class="fee">Nákladovost ${String(fund.expenseRatioPercent).replace('.', ',')} % / rok</span></th>
    <td><label class="sr-only" for="rate-${fund.ticker}">Předpokládaný roční výnos ${fund.ticker} (%)</label><input id="rate-${fund.ticker}" type="number" min="-100" max="100" step="any" value="6" required inputmode="decimal"></td>
    <td><output id="profit-${fund.ticker}"></output><div class="track" aria-hidden="true"><span class="zero"></span><span class="bar"></span></div></td>`
  body.append(row)
}
const rates = funds.map(f => document.querySelector<HTMLInputElement>(`#rate-${f.ticker}`)!)
function update() {
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
for (const input of [investment, horizon, ...rates]) input.addEventListener('input', update)
update()
