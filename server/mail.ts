import { Resend } from 'resend'
export interface Mailer { send(email: string, link: string, comparisonId: string): Promise<string> }
export class ResendMailer implements Mailer {
  private resend
  constructor(key: string, private from: string) { this.resend = new Resend(key) }
  async send(email: string, link: string, id: string) {
    const {data,error}=await this.resend.emails.send({from:this.from,to:[email],subject:'Vaše ETF srovnání je připravené',text:`Dobrý den,\n\npro otevření vyžádaného srovnání a potvrzení přístupu ke schránce použijte tento odkaz:\n${link}\n\nNa stránce zvolte „Potvrdit a otevřít srovnání“. Odkaz lze potvrdit jednou a platí 7 dní. Poté se můžete v tomto prohlížeči vracet k uloženému přehledu po dobu 30 dní.\n\nNejde o marketingový odběr ani investiční doporučení. Pokud jste o přehled nežádali, zprávu ignorujte.`,headers:{'X-Entity-Ref-ID':id}}, {idempotencyKey:`comparison/${id}`})
    if(error||!data?.id)throw new Error('email_send_failed')
    return data.id
  }
}
