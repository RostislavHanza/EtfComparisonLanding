import { handler } from '../server/http.ts'
import { requireAdmin } from '../server/admin.ts'
import { HttpError } from '../server/application.ts'
import { synchronizeEtfs } from '../server/tickerinside.ts'
import { syncStore } from '../server/etf-sync-store.ts'
export default handler(async req=>{
 if(req.method!=='GET')throw new HttpError(405,'Nepovolená metoda.')
 requireAdmin(req)
 const result=await synchronizeEtfs(syncStore())
 if(result.state==='busy')throw new HttpError(409,'Synchronizace již probíhá.')
 if(result.state==='failed')throw new HttpError(503,'Synchronizace selhala. Poslední platná data zůstala zachovaná.')
 return result
})
