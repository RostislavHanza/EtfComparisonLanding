import type { WeeklyReturn } from './history.js'
import { MAX_AMOUNT_CZK } from './model.js'
export const PERFORMANCE_TICKERS=['SPY','VOO','IVV','VTI','IWM'] as const
export type HistoricalYears=1|3|5
export interface FundPerformance {ticker:string;r1:number|null;r3:number|null;r5:number|null;asOf:string;retrievedAt:string;sourceUrl:string;attributionUrl:string;license:'CC BY 4.0';currency:'USD';weeklyReturns?:WeeklyReturn[];historyUnavailable?:boolean;stale?:boolean}
export interface PerformanceCatalog {funds:FundPerformance[];unavailable:string[]}
function amount(value:number){if(!Number.isFinite(value)||value<0||value>MAX_AMOUNT_CZK)throw new RangeError('Neplatná investice.')}
export function historicalValue(investment:number,cumulative:number|null){amount(investment);if(cumulative===null)return null;if(!Number.isFinite(cumulative)||cumulative< -100)throw new RangeError('Neplatný výnos.');return investment*(1+cumulative/100)}
export function annualizedReturn(cumulative:number|null,years:HistoricalYears){if(![1,3,5].includes(years))throw new RangeError('Neplatné období.');if(cumulative===null)return null;historicalValue(1,cumulative);return ((1+cumulative/100)**(1/years)-1)*100}
export function scenarioSeries(initial:number,rate:number,years:number){amount(initial);if(!Number.isInteger(years)||years<1||years>30||!Number.isFinite(rate)||rate< -100||rate>100)throw new RangeError('Zadejte horizont 1–30 let a roční výnos −100 až 100 %.');return Array.from({length:years+1},(_,year)=>({year,value:initial*(1+rate/100)**year}))}
