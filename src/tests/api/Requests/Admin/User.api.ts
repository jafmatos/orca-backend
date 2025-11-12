import { request } from "Tests/helpers/request";
import { UserRoles } from "Tests/api/Models";
import qs from "qs";

export type ListOptions = {
  query?: {
    order?: {
      entity?: string;
      column: string;
      mode: "ASC" | "DESC";
    };
    filter: {
      stripeId?: string;
      role?: UserRoles;
      text?: string;
      email?: string;
      name?: string;
      isEmailConfirmed?: boolean;
    };
    pagination: {
      skip: number;
      take: number;
    };
  };
};

export class UserApi {
  public list({ query }: ListOptions) {
    const queryString = qs.stringify(query);

    return request.get(`/admin/users?${queryString}`);
  }
}
