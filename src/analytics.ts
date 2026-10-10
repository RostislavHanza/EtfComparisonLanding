import { api } from './client'
export type ClientEvent='landing_view'|'comparison_interacted'|'comparison_configured'|'form_started'|'lead_submit_attempt'
let consent=false
let visitId=''
const emitted=new Set<string>()
let pending:ReturnType<typeof attribution>=null
export async function setAnalyticsConsent(allowed:boolean){
 const previous=attribution()
 try{pending=pending??JSON.parse(localStorage.getItem('etf_pending_withdrawal')??'null')}catch{/* Only transient opt-out bookkeeping. */}
 if(!allowed&&previous){pending=previous;try{localStorage.setItem('etf_pending_withdrawal',JSON.stringify(pending))}catch{/* In-memory retry. */}}
 consent=allowed
 try{localStorage.setItem('etf_analytics_consent',allowed?'granted':'denied');if(!allowed)sessionStorage.removeItem('etf_visit_id')}catch{/* Storage unavailable: use in-memory consent. */}
 if(allowed){try{visitId=sessionStorage.getItem('etf_visit_id')??crypto.randomUUID();sessionStorage.setItem('etf_visit_id',visitId)}catch{visitId=crypto.randomUUID()}}
 else{visitId='';emitted.clear()}
 if(pending){try{await api('/api/events',{method:'POST',body:JSON.stringify({withdraw:true,attribution:pending})});pending=null;try{localStorage.removeItem('etf_pending_withdrawal')}catch{/* No storage. */}}catch{return false}}
 return true
}
export function initialConsent():boolean|null{try{const value=localStorage.getItem('etf_analytics_consent');return value==='granted'?true:value==='denied'?false:null}catch{return null}}
export function attribution(){if(!consent||!visitId)return null;const source=new URLSearchParams(window.location.search).get('utm_campaign');return{consent:true,visitId,campaign:source==='ad-a'||source==='ad-b'?source:'direct'}}
export function track(name:ClientEvent){const a=attribution();if(!a||emitted.has(name))return;emitted.add(name);void api('/api/events',{method:'POST',body:JSON.stringify({name,attribution:a})}).catch(()=>{emitted.delete(name)})}
