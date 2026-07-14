import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { renderToString } from 'react-dom/server';
import { Env } from '@/config/.env.validate';
import { SignUpEmail } from '@/auth/services/emails/templates/SignUpEmail';
import { ResetPasswordEmail } from '@/auth/services/emails/templates/ResetPasswordEmail';
import { DeleteAccountEmail } from '@/auth/services/emails/templates/DeleteAccountEmail';

type SendEmailArgs = {
  to: string;
  name: string;
  otp: string;
  confirmUrl: string;
};

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: this.configService.get('SMTP_USER')
        ? {
            user: this.configService.get('SMTP_USER'),
            pass: this.configService.get('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async sendSignUpEmail(options: SendEmailArgs) {
    const html = renderToString(SignUpEmail(options));

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_ORIGIN'),
      to: options.to,
      subject: 'Confirmação de Cadastro',
      html,
    });
  }

  async sendResetPasswordEmail(options: SendEmailArgs) {
    const html = renderToString(ResetPasswordEmail(options));

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_ORIGIN'),
      to: options.to,
      subject: 'Recuperação de Senha',
      html,
    });
  }

  async sendDeleteAccountEmail(options: SendEmailArgs) {
    const html = renderToString(DeleteAccountEmail(options));

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_ORIGIN'),
      to: options.to,
      subject: 'Exclusão de Conta',
      html,
    });
  }
}
