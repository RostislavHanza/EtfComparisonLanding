import { createClient } from '@supabase/supabase-js'
import type { EtfRecord, SavedComparison } from '../shared/model.js'
import type { EventName } from '../shared/validation.js'
export interface LeadRecord { id: string; email: string; tickers: string[]; amountCzk: number; tokenHash: string; marketingConsent: boolean; attribution: {visitId: string; campaign: string} | null }
export interface Repository {
  catalog(): Promise<EtfRecord[]>; limit(key: string, count: number, seconds: number): Promise<boolean>;
  create(lead: LeadRecord): Promise<void>; sent(id: string, providerId: string): Promise<void>; failed(id: string): Promise<void>;
  redeem(tokenHash: string, sessionHash: string): Promise<string | null>;
  reopen?(tokenHash:string,sessionHash:string):Promise<string|null>;
  read(sessionHash: string, id: string): Promise<SavedComparison | null>;
  update(sessionHash: string, id: string, tickers: string[], amountCzk: number): Promise<boolean>;
  event(name: EventName, attribution: {visitId: string; campaign: string}, comparisonId?: string): Promise<void>;
  withdrawAnalytics(visitId:string):Promise<void>;
}
export class DatabaseError extends Error {}
export class SupabaseRepository implements Repository {
  private db
  constructor(url: string, key: string) { this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) }
  private async rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.db.rpc(name, args)
    if (error) throw new DatabaseError(error.message.includes('unavailable_etf') ? 'unavailable_etf' : 'database_operation_failed')
    return data as T
  }
  async catalog() {
    const { data, error } = await this.db.from('etfs').select('ticker,name,exchange,tracked_index,expense_ratio_percent,dividends,description,verified_at,data_as_of,sources').eq('published', true).gte('verified_at', new Date(Date.now() - 14*86400000).toISOString()).order('ticker')
    if (error) throw new DatabaseError('catalog_unavailable')
    return (data ?? []).map(r => ({ ticker: r.ticker, name: r.name, exchange: r.exchange, index: r.tracked_index, expenseRatioPercent: Number(r.expense_ratio_percent), dividends: r.dividends, description: r.description, verifiedAt: r.verified_at, dataAsOf: r.data_as_of, sources: r.sources })) as EtfRecord[]
  }
  limit(key: string, count: number, seconds: number) { return this.rpc<boolean>('consume_rate_limit', { p_key: key, p_limit: count, p_seconds: seconds }) }
  async create(l: LeadRecord) { await this.rpc('create_comparison', { p_id:l.id,p_email:l.email,p_tickers:l.tickers,p_amount_halere:Math.round(l.amountCzk*100),p_token_hash:l.tokenHash,p_marketing:l.marketingConsent,p_text_version:'2026-10-12',p_attribution:l.attribution }) }
  async sent(id: string, providerId: string) { const {error}=await this.db.from('email_messages').update({provider_id:providerId,status:'sent',sent_at:new Date().toISOString()}).eq('comparison_id',id); if(error)throw new DatabaseError('email_status_failed') }
  async failed(id: string) { const {error}=await this.db.from('email_messages').update({status:'failed',failed_at:new Date().toISOString()}).eq('comparison_id',id).eq('status','pending'); if(error)throw new DatabaseError('email_status_failed') }
  redeem(tokenHash: string, sessionHash: string) { return this.rpc<string|null>('redeem_comparison',{p_token_hash:tokenHash,p_session_hash:sessionHash}) }
  reopen(tokenHash:string,sessionHash:string){return this.rpc<string|null>('reopen_comparison',{p_token_hash:tokenHash,p_session_hash:sessionHash})}
  read(sessionHash: string,id:string) { return this.rpc<SavedComparison|null>('read_comparison',{p_session_hash:sessionHash,p_id:id}) }
  update(sessionHash: string,id:string,tickers:string[],amount:number) { return this.rpc<boolean>('update_comparison',{p_session_hash:sessionHash,p_id:id,p_tickers:tickers,p_amount_halere:Math.round(amount*100)}) }
  async event(name:EventName,a:{visitId:string;campaign:string},comparisonId?:string) {
    const {error}=await this.db.from('funnel_events').insert({name,visit_id:a.visitId,campaign:a.campaign,comparison_id:comparisonId??null});
    if(error && error.code!=='23505')throw new DatabaseError('event_failed')
  }
  async withdrawAnalytics(visitId:string){await this.rpc('withdraw_analytics',{p_visit_id:visitId})}
}
