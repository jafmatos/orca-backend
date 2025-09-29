import { Nodemailer } from "Src/services/Email/Nodemailer";
import { EmailTemplateService } from "./EmailTemplateService";

type SendSignUpEmailArgs = {
  to: string;
  name: string;
  otp: string;
  confirmUrl: string;
};

type SendResetPasswordEmailArgs = {
  to: string;
  name: string;
  otp: string;
  confirmUrl: string;
};

type SendDeleteAccountEmailArgs = {
  to: string;
  name: string;
  otp: string;
  confirmUrl: string;
};

export class EmailService {
  private static readonly templateService = new EmailTemplateService();

  public static async sendSignUpEmail(options: SendSignUpEmailArgs) {
    const html = await this.templateService.render("sign-up-email", options);

    await Nodemailer.send({
      from: process.env.SMTP_ORIGIN!,
      to: options.to,
      subject: "Confirmação de Cadastro",
      html,
    });
  }

  public static async sendResetPasswordEmail(options: SendResetPasswordEmailArgs) {
    const html = await this.templateService.render("reset-password-email", options);

    await Nodemailer.send({
      from: process.env.SMTP_ORIGIN!,
      to: options.to,
      subject: "Recuperação de Senha",
      html,
    });
  }

  public static async sendDeleteAccountEmail(options: SendDeleteAccountEmailArgs) {
    const html = await this.templateService.render("delete-account-email", options);

    await Nodemailer.send({
      from: process.env.SMTP_ORIGIN!,
      to: options.to,
      subject: "Encerramento de Conta",
      html,
    });
  }
}
