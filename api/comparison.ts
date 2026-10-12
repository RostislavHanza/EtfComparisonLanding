import { body, cookie, guard, handler, ip, runtime } from '../server/http.js'
export default handler(async req=>{guard(req,['GET','PUT'],req.method==='PUT');const app=runtime().app;return req.method==='GET'?app.read(req.query.id,cookie(req)):app.update(req.query.id,cookie(req),body(req),ip(req))})
