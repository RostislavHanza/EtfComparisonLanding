import { MAX_AMOUNT_CZK } from './model.js'
export class InputError extends Error {}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Neplatný požadavek.')
  return value as Record<string, unknown>
}
export function comparisonInput(value: unknown) {
  const body = object(value)
  if (!Array.isArray(body.tickers) || body.tickers.length < 2 || body.tickers.length > 5 || body.tickers.some(t => typeof t !== 'string' || !/^[A-Z0-9.-]{1,10}$/.test(t)) || new Set(body.tickers).size !== body.tickers.length) throw new InputError('Vyberte 2 až 5 různých ETF.')
  if (typeof body.amountCzk !== 'number' || !Number.isFinite(body.amountCzk) || body.amountCzk < 0 || body.amountCzk > MAX_AMOUNT_CZK || Math.abs(body.amountCzk * 100 - Math.round(body.amountCzk * 100)) > 0.00001) throw new InputError('Částka musí být od 0 do 10 milionů Kč, nejvýše se dvěma desetinnými místy.')
  return { tickers: body.tickers as string[], amountCzk: body.amountCzk }
}
export const TEXT_VERSION = '2026-10-10'
export const events = ['landing_view','comparison_interacted','comparison_configured','form_started','lead_submit_attempt','lead_accepted','email_sent','email_confirmed','comparison_opened'] as const
export type EventName = typeof events[number]
export function attribution(value: unknown) {
  if (value === undefined || value === null) return null
  const v = object(value)
  if (v.consent !== true) return null
  const visitId = uuid(v.visitId)
  const campaign = typeof v.campaign === 'string' && ['ad-a','ad-b','direct'].includes(v.campaign) ? v.campaign : 'direct'
  return { visitId, campaign }
}
export function leadInput(value: unknown) {
  const body = object(value), selection = comparisonInput(body)
  if (typeof body.email !== 'string') throw new InputError('Zadejte platný e-mail.')
  const email = body.email.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n]/.test(email)) throw new InputError('Zadejte platný e-mail.')
  if (typeof body.marketingConsent !== 'boolean') throw new InputError('Neplatná hodnota souhlasu.')
  if (body.website !== undefined && (typeof body.website !== 'string' || body.website.length > 0)) throw new InputError('Požadavek nelze přijmout.')
  return { ...selection, email, marketingConsent: body.marketingConsent, attribution: attribution(body.attribution) }
}
export function tokenInput(value: unknown) {
  const { token } = object(value)
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new InputError('Odkaz není platný.')
  return token
}
export function uuid(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw new InputError('Neplatné ID srovnání.')
  return value
}
