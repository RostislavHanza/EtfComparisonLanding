import { body, guard, handler } from '../server/http.ts'
import { HttpError } from '../server/application.ts'
import { adminCookie, confirmPreviewAccess, logoutPreview, previewAuthenticated, previewConfig, requestPreviewAccess } from '../server/preview-admin.ts'
export default handler(async(req,res)=>{
 previewConfig()
 if(req.method==='GET')return {authenticated:await previewAuthenticated(req)}
 guard(req,['POST'])
 const input=body(req)
 if(!input||typeof input!=='object')throw new HttpError(400,'Neplatný požadavek.')
 if(input.action==='request')return requestPreviewAccess(req)
 if(input.action==='confirm'){res.setHeader('Set-Cookie',adminCookie(await confirmPreviewAccess(input.token)));return {authenticated:true}}
 if(input.action==='logout'){await logoutPreview(req);res.setHeader('Set-Cookie',adminCookie(''));return {authenticated:false}}
 throw new HttpError(400,'Neznámá akce.')
})
