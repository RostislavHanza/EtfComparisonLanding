import { requireAdmin } from '../server/admin.ts'
import { createClient } from '@supabase/supabase-js'
import { handler } from '../server/http.ts'
import { HttpError } from '../server/application.ts'
export default handler(async req => {
 if(req.method !== 'GET') throw new HttpError(405,'Nepovolená metoda.')
 requireAdmin(req)
 const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url || !key) throw new HttpError(503,'Údržba není nakonfigurovaná.')
 const {error} = await createClient(url,key,{auth:{persistSession:false}}).rpc('purge_expired_data')
 if(error) throw new HttpError(503,'Údržba se nezdařila.')
 return {ok:true}
})
