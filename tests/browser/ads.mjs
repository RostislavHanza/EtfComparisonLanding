import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || undefined, args: ['--no-sandbox'] })
const format = value => `${value > 0 ? '+' : ''}${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 2 }).format(value)}`
const expected = (amount, rate, years, fee) => format(amount * ((1 + rate / 100) * (1 - fee / 100)) ** years - amount)
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const requests = [], errors = []
    page.on('request', request => requests.push(request.url()))
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/add`)
    await page.locator('#profit-SPY').waitFor()
    assert.equal(await page.title(), 'Ukázka ETF kalkulačky · SPY a VOO')
    const check = async (amount, spy, voo, years) => {
      assert.equal(await page.locator('#profit-SPY').textContent(), expected(amount, spy, years, .0945))
      assert.equal(await page.locator('#profit-VOO').textContent(), expected(amount, voo, years, .03))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    }
    await check(100000, 6, 6, 10)
    await page.reload(); await check(100000, 6, 6, 10)
    await page.locator('#investment').fill('200000'); await check(200000, 6, 6, 10)
    await page.locator('#horizon').fill('3'); await check(200000, 6, 6, 3)
    await page.locator('#rate-SPY').fill('0'); await check(200000, 0, 6, 3)
    assert.equal(await page.locator('#rate-VOO').inputValue(), '6')
    assert.equal(await page.locator('tr:has(#rate-SPY) .bar.negative').count(), 1)
    await page.locator('#rate-VOO').fill('-4'); await check(200000, 0, -4, 3)
    await page.locator('#horizon').fill('1')
    await page.locator('#rate-VOO').fill('0'); await check(200000, 0, 0, 1)
    assert.equal(await page.locator('.bar.negative').count(), 2)
    const widths = await page.locator('.bar').evaluateAll(bars => bars.map(b => parseFloat(b.style.width)))
    // CSSOM serializes percentage styles with fewer digits than the numeric model.
    assert.ok(Math.abs(widths[1] / widths[0] - .03 / .0945) < 1e-6)
    await page.locator('#rate-SPY').fill('')
    assert.equal(await page.locator('#profit-SPY').textContent(), '—')
    assert.equal(await page.locator('#error').isVisible(), true)
    await page.locator('#rate-SPY').fill('6'); assert.equal(await page.locator('#error').isVisible(), false)
    for (const input of await page.locator('input').all()) assert.ok((await input.boundingBox()).height >= 44)
    assert.equal(await page.getByRole('link', { name: 'Vytvořit vlastní srovnání →' }).getAttribute('href'), '/#comparator')
    assert.equal(await page.locator('#root').count(), 0)
    assert.equal(requests.some(url => new URL(url).origin !== new URL(base).origin || new URL(url).pathname.startsWith('/api/')), false)
    assert.deepEqual(errors, [])
    if (width === 320) await page.screenshot({ path: '.cache/ads-320.png', fullPage: true })
    // Root remains the separate React app with its normal public selection and email gate.
    await page.route('**/api/catalog', route => route.fulfill({ json: { funds: [], privacy: null } }))
    await page.getByRole('link', { name: 'Vytvořit vlastní srovnání →' }).click()
    await page.locator('#comparator').waitFor()
    assert.equal(new URL(page.url()).pathname, '/')
    assert.equal(new URL(page.url()).hash, '#comparator')
    assert.equal(await page.locator('#rate-SPY').count(), 0)
    console.log(`PASS /add direct/reload, standalone requests, inputs/costs/common bars, CTA and root at ${width}px`)
    await page.close()
  }
} finally { await browser.close() }
