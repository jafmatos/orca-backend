import { request } from "../../../helpers/request";

export type SignUpCreateBody = {
  confirmUrl: string;
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
};

export type SignUpUpdateBody = {
  otp: string;
};

export type SignUpResendBody = {
  confirmUrl: string;
};

export class SignUpApi {
  public create(body: SignUpCreateBody) {
    return request.post("/sign-up").send(body);
  }

  public update(key: string, body: SignUpUpdateBody) {
    return request.put(`/sign-up/${key}`).send(body);
  }

  public resend(key: string, body: SignUpResendBody) {
    return request.put(`/sign-up/resend/${key}`).send(body);
  }
}
