import type { FundPerformance,HistoricalYears } from './performance.js'
export interface WeeklyReturn {weekEnd:string;returnFraction:number|null}
export interface HistoryLine {ticker:string;points:{date:string;value:number}[]}
// Calendar week boundaries from the documented Saturday–Friday grid, not invented daily quote dates.
export function weeklyGrid(weekly:unknown,weeksEnd:unknown,asOf:string):WeeklyReturn[]{
 if(weekly===undefined||weekly===null||Array.isArray(weekly)&&weekly.length===0)return []
 if(!Array.isArray(weekly)||weekly.length!==156||weeksEnd!==asOf)throw new Error('invalid_weekly_series')
 const end=Date.parse(asOf);if(!Number.isFinite(end))throw new Error('invalid_weekly_date')
 const endDay=new Date(end).getUTCDay(),friday=end+((5-endDay+7)%7)*86400000
 return weekly.map((value,i)=>{
  if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value< -1||value>100))throw new Error('invalid_weekly_return')
  const date=i===weekly.length-1?end:friday-(weekly.length-1-i)*7*86400000
  return {weekEnd:new Date(date).toISOString().slice(0,10),returnFraction:value as number|null}
 })
}
export function historicalLines(records:FundPerformance[],period:HistoricalYears):HistoryLine[]{
 const segments=records.filter(r=>r.weeklyReturns?.length).map(r=>{
  const window=r.weeklyReturns!.slice(-(period===1?52:156))
  const lastGap=window.reduce((last,p,i)=>p.returnFraction===null?i:last,-1)
  return {ticker:r.ticker,weeks:window.slice(lastGap+1)}
 }).filter(r=>r.weeks.length)
 if(!segments.length)return []
 const dates=segments[0].weeks.map(p=>p.weekEnd).filter(date=>segments.every(s=>s.weeks.some(p=>p.weekEnd===date)))
 if(!dates.length)return []
 return segments.flatMap(segment=>{
  const weeks=segment.weeks.filter(p=>p.weekEnd>=dates[0]&&p.weekEnd<=dates.at(-1)!)
  // Never skip missing interior weeks, interpolate or count an unknown return as zero.
  if(weeks.length!==dates.length||weeks.some((p,i)=>p.weekEnd!==dates[i]))return []
  let value=100
  const first=Date.parse(dates[0]),day=new Date(first).getUTCDay()
  const start=new Date(first-(((day-5+7)%7)||7)*86400000).toISOString().slice(0,10)
  return [{ticker:segment.ticker,points:[{date:start,value},...weeks.map(p=>{value*=1+p.returnFraction!;return{date:p.weekEnd,value}})]}]
 })
}
