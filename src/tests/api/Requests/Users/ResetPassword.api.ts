import { request } from "Src/tests/helpers/request";

export type SignUpCreateBody = {
  confirmUrl: string;
  email: string;
};

export type SignUpUpdateBody = {
  otp: string;
  password: string;
  passwordConfirmation: string;
};

export type SignUpResendBody = {
  confirmUrl: string;
};

export class ResetPasswordApi {
  public create(body: SignUpCreateBody) {
    return request.post("/reset-password").send(body);
  }

  public update(key: string, body: SignUpUpdateBody) {
    return request.put(`/reset-password/${key}`).send(body);
  }

  public resend(key: string, body: SignUpResendBody) {
    return request.put(`/reset-password/resend/${key}`).send(body);
  }
}
