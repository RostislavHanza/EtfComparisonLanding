import { body, guard, handler, ip, runtime } from '../server/http.ts'
export default handler(async req=>{guard(req,['POST']);return runtime().app.event(body(req),ip(req))})
