import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { HttpError } from './application.ts'
import type { SyncStore, SyncResult, EtfCandidate, SyncFailure } from './tickerinside.ts'
export function syncStore():SyncStore {
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)throw new HttpError(503,'Synchronizace není nakonfigurovaná.')
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(5000)})}})
 return{
  async begin(){const {data,error}=await db.rpc('begin_etf_sync',{p_id:randomUUID()});if(error)throw new HttpError(503,'Synchronizace není dostupná. Ověřte novou migraci.');if(data.state==='already_attempted'&&data.id){
   const previous=await db.from('etf_sync_runs').select('result').eq('id',data.id).single()
   if(previous.error)throw new HttpError(503,'Výsledek předchozí synchronizace není dostupný.')
   return {...(previous.data.result as SyncResult),state:'already_attempted',previousState:previous.data.result?.state}
  }return data as SyncResult},
  async finish(id:string,records:EtfCandidate[],failures:SyncFailure[]){const {data,error}=await db.rpc('finish_etf_sync',{p_id:id,p_records:records,p_failures:failures});if(error)throw new HttpError(503,'Výsledek synchronizace nebyl uložen.');return data as SyncResult},
 }
}
