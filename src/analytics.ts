import { api } from './client'
export type ClientEvent='landing_view'|'comparison_interacted'|'comparison_configured'|'form_started'|'lead_submit_attempt'
let consent=false
let visitId=''
const emitted=new Set<string>(),inflight=new Set<Promise<unknown>>()
type Attribution={consent:true;visitId:string;campaign:string}
let pending:Attribution|null=null
function loadPending(){try{const value=JSON.parse(localStorage.getItem('etf_pending_withdrawal')??'null');return value?.consent===true&&typeof value.visitId==='string'&&/^[a-f0-9-]{36}$/i.test(value.visitId)&&['ad-a','ad-b','direct'].includes(value.campaign)?value as Attribution:null}catch{return null}}
export function hasPendingWithdrawal(){return Boolean(pending||loadPending())}
export async function setAnalyticsConsent(allowed:boolean){
 const previous=attribution()
 pending=pending??loadPending()
 consent=false // Stop immediately, before any asynchronous deletion or state update.
 if(!allowed&&previous){pending=previous;try{localStorage.setItem('etf_pending_withdrawal',JSON.stringify(pending))}catch{/* In-memory retry. */}}
 let retained=''
 if(allowed&&!pending){try{retained=visitId||sessionStorage.getItem('etf_visit_id')||''}catch{/* No storage. */}}
 visitId='';emitted.clear()
 if(!allowed||pending)try{localStorage.setItem('etf_analytics_consent','denied');sessionStorage.removeItem('etf_visit_id')}catch{/* In-memory opt-out still applies. */}
 if(pending){
  await Promise.allSettled([...inflight])
  try{await api('/api/events',{method:'POST',body:JSON.stringify({withdraw:true,attribution:pending})});pending=null;try{localStorage.removeItem('etf_pending_withdrawal')}catch{/* No storage. */}}catch{return false}
 }
 if(allowed){
  consent=true
  try{visitId=retained||crypto.randomUUID();sessionStorage.setItem('etf_visit_id',visitId);localStorage.setItem('etf_analytics_consent','granted')}catch{visitId=crypto.randomUUID()}
 }
 return true
}
export function initialConsent():boolean|null{if(hasPendingWithdrawal())return false;try{const value=localStorage.getItem('etf_analytics_consent');return value==='granted'?true:value==='denied'?false:null}catch{return null}}
export function attribution():Attribution|null{if(!consent||!visitId)return null;const source=new URLSearchParams(window.location.search).get('utm_campaign');return{consent:true,visitId,campaign:source==='ad-a'||source==='ad-b'?source:'direct'}}
export function track(name:ClientEvent){
 const a=attribution();if(!a||emitted.has(name))return;emitted.add(name)
 const promise=api('/api/events',{method:'POST',body:JSON.stringify({name,attribution:a})}).catch(()=>{if(visitId===a.visitId)emitted.delete(name)})
 inflight.add(promise);void promise.finally(()=>inflight.delete(promise))
}
