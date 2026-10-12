import type { WeeklyReturn } from './history.js'
import { MAX_AMOUNT_CZK } from './model.js'
export const PERFORMANCE_TICKERS=['SPY','VOO','IVV','VTI','IWM','DIA','IJH','IJR','ITOT','MDY','RSP','SCHB','SCHD','SPYD','VEA','VT','VTV','VUG','VWO','VYM'] as const
export type HistoricalYears=1|3|5
export interface FundPerformance {ticker:string;r1:number|null;r3:number|null;r5:number|null;asOf:string;retrievedAt:string;sourceUrl:string;attributionUrl:string;license:'CC BY 4.0';currency:'USD';weeklyReturns?:WeeklyReturn[];historyUnavailable?:boolean;stale?:boolean}
export interface PerformanceCatalog {funds:FundPerformance[];unavailable:string[]}
function amount(value:number){if(!Number.isFinite(value)||value<0||value>MAX_AMOUNT_CZK)throw new RangeError('Neplatná investice.')}
export function historicalValue(investment:number,cumulative:number|null){amount(investment);if(cumulative===null)return null;if(!Number.isFinite(cumulative)||cumulative< -100)throw new RangeError('Neplatný výnos.');return investment*(1+cumulative/100)}
export function annualizedReturn(cumulative:number|null,years:HistoricalYears){if(![1,3,5].includes(years))throw new RangeError('Neplatné období.');if(cumulative===null)return null;historicalValue(1,cumulative);return ((1+cumulative/100)**(1/years)-1)*100}
export function scenarioSeries(initial:number,rate:number,years:number){amount(initial);if(!Number.isInteger(years)||years<1||years>30||!Number.isFinite(rate)||rate< -100||rate>100)throw new RangeError('Zadejte horizont 1–30 let a roční výnos −100 až 100 %.');return Array.from({length:years+1},(_,year)=>({year,value:initial*(1+rate/100)**year}))}

// Shared zero and linear scale for every selected fund; unavailable values are not zero.
export function profitScale(profits:(number|null)[]){
 const values=profits.filter((p):p is number=>p!==null&&Number.isFinite(p))
 const min=Math.min(0,...values),max=Math.max(0,...values),span=max-min||1
 const zero=min===0?0:-min/span*100
 return {zero,bars:profits.map(p=>p===null||!Number.isFinite(p)?null:{start:Math.min(zero,(p-min)/span*100),width:Math.abs(p)/span*100})}
}
function expenseFactor(expense:number|null){return typeof expense==='number'&&Number.isFinite(expense)&&expense>=0&&expense<100?1-expense/100:null}
export function grossReturnFromNet(net:number|null,expense:number|null){
 const factor=expenseFactor(expense)
 if(net===null||factor===null)return null
 if(!Number.isFinite(net)||net< -100)throw new RangeError('Neplatný výnos.')
 return ((1+net/100)/factor-1)*100
}
export function scenarioProfit(initial:number,grossRate:number,years:number,expense:number|null){
 // Reuse the existing investment, rate and horizon validation; costs are not optional zeroes.
 scenarioSeries(initial,grossRate,years)
 const factor=expenseFactor(expense)
 if(factor===null)return null
 return initial*((1+grossRate/100)*factor)**years-initial
}
