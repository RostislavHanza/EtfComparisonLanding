import { guard, handler } from '../server/http.ts'
import { requireAdmin } from '../server/admin.ts'
import { HttpError } from '../server/application.ts'
import { synchronizeEtfs } from '../server/tickerinside.ts'
import { syncStore } from '../server/etf-sync-store.ts'
import { previewAuthenticated } from '../server/preview-admin.ts'
export default handler(async req=>{
 if(req.method==='POST'){
  guard(req,['POST'])
  if(!await previewAuthenticated(req))throw new HttpError(401,'Nejprve se přihlaste jako administrátor.')
  // The browser proves its session; only this server constructs the Cron authorization.
  const internalRequest=Object.create(req) as typeof req
  internalRequest.headers={authorization:`Bearer ${process.env.CRON_SECRET??''}`}
  requireAdmin(internalRequest)
 }else{
  if(req.method!=='GET')throw new HttpError(405,'Nepovolená metoda.')
  requireAdmin(req)
 }
 const result=await synchronizeEtfs(syncStore())
 if(result.state==='busy')throw new HttpError(409,'Synchronizace již probíhá.')
 if(result.state==='failed'&&req.method==='GET')throw new HttpError(503,'Synchronizace selhala. Poslední platná data zůstala zachovaná.')
 return result
})
