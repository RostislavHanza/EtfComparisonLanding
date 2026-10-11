import { handler } from '../server/http.js'
import { requireAdmin } from '../server/admin.js'
import { HttpError } from '../server/application.js'
import { readSmtpConfig,SmtpMailer,MailConfigurationError } from '../server/mail.js'
import { logMailFailure } from '../server/logging.js'
export default handler(async req=>{
 if(req.method!=='GET')throw new HttpError(405,'Nepovolená metoda.')
 requireAdmin(req)
 try{await new SmtpMailer(readSmtpConfig(process.env)).verify();return{ok:true,smtp:'verified',delivery:'not_tested'}}
 catch(error){logMailFailure('smtp_verify_failed',error);throw new HttpError(503,error instanceof MailConfigurationError?error.message:'SMTP spojení nebo přihlášení nebylo ověřeno. Zkontrolujte bezpečné serverové logy.')}
})
