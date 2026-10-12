// Never log SMTP response text, credentials, recipient, URLs or raw Error objects.
const safeCodes=new Set(['EAUTH','ETIMEDOUT','ESOCKET','ENOTFOUND','EAI_AGAIN','ECONNECTION','ECONNREFUSED','EENVELOPE','EMESSAGE'])
export function logMailFailure(stage:'email_delivery_failed'|'smtp_verify_failed',error:unknown){
 const code=error&&typeof error==='object'&&'code' in error&&typeof error.code==='string'&&safeCodes.has(error.code)?error.code:'unclassified'
 console.error(JSON.stringify({event:stage,code}))
}
