import { guard, handler, runtime } from '../server/http.ts'
export default handler(async req=>{guard(req,['GET'],false);return runtime().app.catalog()})
