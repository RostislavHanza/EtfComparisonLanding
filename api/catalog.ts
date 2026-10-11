import { cookie, guard, handler, runtime } from '../server/http.js'
export default handler(async req=>{guard(req,['GET'],false);return runtime().app.catalog(req.query.comparison,cookie(req))})
