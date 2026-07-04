import { Injectable, Logger } from '@nestjs/common';

type SendEmailArgs = {
  to: string;
  name: string;
  otp: string;
  confirmUrl: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendSignUpEmail(options: SendEmailArgs) {
    this.logger.log(`[MOCK] Sending SignUp Email to ${options.to}. OTP: ${options.otp}, Confirm: ${options.confirmUrl}`);
  }

  async sendResetPasswordEmail(options: SendEmailArgs) {
    this.logger.log(`[MOCK] Sending Reset Password Email to ${options.to}. OTP: ${options.otp}, Confirm: ${options.confirmUrl}`);
  }

  async sendDeleteAccountEmail(options: SendEmailArgs) {
    this.logger.log(`[MOCK] Sending Delete Account Email to ${options.to}. OTP: ${options.otp}, Confirm: ${options.confirmUrl}`);
  }
}
