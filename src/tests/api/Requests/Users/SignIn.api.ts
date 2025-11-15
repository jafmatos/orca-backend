import { request } from "../../../helpers/request";

export type SignInCreateBody = {
  email: string;
  password: string;
};

export class SignInApi {
  public show(authorization: string) {
    return request.get("/sign-in").set(`Authorization`, authorization);
  }

  public create(body: SignInCreateBody) {
    return request.post("/sign-in").send(body);
  }
}
