import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs-extra';
import Handlebars from 'handlebars';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { logger } from 'src/utils/logger';

@Injectable()
export class EmailsService {
  private transporter: Mail;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, any>,
  ): Promise<void> {
    try {
      const templateContent = await this.loadTemplate(templateName);
      const htmlBody = this.compileTemplate(templateContent, variables);

      const mailOptions = {
        from: this.configService.get('SMTP_EMAIL_FROM'),
        to: to,
        subject: subject,
        html: htmlBody,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      logger.error('Erro ao enviar e-mail:', error);
      throw new Error('Falha ao enviar e-mail');
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const filePath = join('templates', `${templateName}.hbs`);
    return readFile(filePath, 'utf8');
  }

  private compileTemplate(
    template: string,
    variables: Record<string, any>,
  ): string {
    const compiled = Handlebars.compile(template);
    return compiled(variables);
  }
}
