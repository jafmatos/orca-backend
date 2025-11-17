import { request } from "Src/tests/helpers/request";

export type DeleteAccountCreateBody = {
  confirmUrl: string;
};

export type DeleteAccountUpdateBody = {
  otp: string;
};

export type DeleteAccountResendBody = {
  confirmUrl: string;
};

export class DeleteAccountApi {
  public create(body: DeleteAccountCreateBody) {
    return request.post("/delete-account").send(body);
  }

  public update(key: string, body: DeleteAccountUpdateBody) {
    return request.put(`/delete-account/${key}`).send(body);
  }

  public resend(key: string, body: DeleteAccountResendBody) {
    return request.put(`/delete-account/resend/${key}`).send(body);
  }
}
