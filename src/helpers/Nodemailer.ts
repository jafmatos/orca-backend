import nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";

export class Nodemailer {
  private static readonly transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: +process.env.SMTP_PORT!,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  public static async send(mail: MailOptions) {
    return await this.transport.sendMail(mail);
  }
}
