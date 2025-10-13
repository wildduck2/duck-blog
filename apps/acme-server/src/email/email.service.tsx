import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { EmailTemplate } from './email.types'
import { renderEmailTemplate } from './emails'

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  private transporter = nodemailer.createTransport({
    from: this.config.get('MAIL_FROM_ADDRESS'),
    host: this.config.get('MAIL_HOST'),
    name: this.config.get('MAIL_FROM_NAME'),
    port: Number.parseInt(this.config.get('MAIL_PORT') as string, 10),
    // auth: {
    //   user: this.config.get('MAIL_USERNAME'),
    //   pass: this.config.get('MAIL_PASSWORD'),
    // },
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  })

  async sendEmail({
    from = this.config.get('MAIL_FROM_ADDRESS'),
    to,
    subject,
    text,
    template,
  }: {
    from?: string
    to: string
    subject: string
    text: string
    template: EmailTemplate
  }) {
    const html = await renderEmailTemplate(template.name, template.args)
    await this.transporter.sendMail({
      from,
      html: html,
      subject,
      text,
      to,
    })
  }
}
