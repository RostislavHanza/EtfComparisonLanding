import { api } from './client'
import type { PerformanceCatalog } from '../shared/performance'
interface Cache {key:string;data?:PerformanceCatalog;expires:number;pending?:Promise<PerformanceCatalog>}
let current:Cache={key:'',expires:0}
export async function loadPerformance(comparisonId:string){
 if(current.key!==comparisonId)current={key:comparisonId,expires:0}
 const entry=current // An older in-flight request must not overwrite another comparison's cache.
 if(entry.data&&Date.now()<entry.expires)return entry.data
 if(entry.pending)return entry.pending
 entry.pending=api<PerformanceCatalog>(`/api/performance?schema=3&comparison=${encodeURIComponent(comparisonId)}`)
 try{entry.data=await entry.pending;entry.expires=Date.now()+300_000;return entry.data}finally{entry.pending=undefined}
}
