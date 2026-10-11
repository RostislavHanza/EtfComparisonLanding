import { api } from './client'
import type { PerformanceCatalog } from '../shared/performance'
let cached:PerformanceCatalog|undefined,expires=0,pending:Promise<PerformanceCatalog>|undefined
export async function loadPerformance(){
 if(cached&&Date.now()<expires)return cached
 if(pending)return pending
 pending=api<PerformanceCatalog>('/api/performance')
 try{cached=await pending;expires=Date.now()+300_000;return cached}finally{pending=undefined}
}
