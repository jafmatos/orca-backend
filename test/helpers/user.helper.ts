import { User } from '@/user/entities/user.entity';
import { api } from './api.helper';
import { AuthHelper } from './auth.helper';

export class UserHelper {
  public static async getOneByRole(role: string): Promise<User> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(`/admin/users?filter[role]=${role}&filter[isEmailConfirmed]=true`)
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    return users[Math.floor(Math.random() * users.length)];
  }

  public static async getManyByRole(role: string): Promise<User[]> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(`/admin/users?filter[role]=${role}&filter[isEmailConfirmed]=true`)
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    for (let i = users.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [users[i], users[j]] = [users[j], users[i]];
    }

    return users;
  }

  public static async getManySubscribed(): Promise<User[]> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(
        `/admin/users?filter[role]=user&filter[subscription][status]=active&filter[isEmailConfirmed]=true&paginated=false`,
      )
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    return users;
  }

  public static async getOneSubscribed(role: string): Promise<User> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(
        `/admin/users?filter[role]=${role}&filter[subscription][status]=active&filter[isEmailConfirmed]=true&paginated=false`,
      )
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    return users[Math.floor(Math.random() * users.length)];
  }
}
