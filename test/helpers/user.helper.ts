import { User } from '@/user/entities/user.entity';
import { api } from './api.helper';
import { AuthHelper } from './auth.helper';

export class UserHelper {
  public static async getOneByRole(role: string): Promise<User> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(`/administrative/users?filter[role]=${role}&filter[isEmailConfirmed]=true&order[column]=createdAt&order[mode]=ASC`)
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    const maxIndex = Math.min(users.length, 20);
		
    return users[Math.floor(Math.random() * maxIndex)];
  }

  public static async getManyByRole(role: string): Promise<User[]> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(`/administrative/users?filter[role]=${role}&filter[isEmailConfirmed]=true&order[column]=createdAt&order[mode]=ASC`)
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    const seededUsers = users.slice(0, 50);
    for (let i = seededUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seededUsers[i], seededUsers[j]] = [seededUsers[j], seededUsers[i]];
    }

    return seededUsers;
  }

  public static async getManySubscribed(): Promise<User[]> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(
        `/administrative/users?filter[role]=user&filter[subscription][status]=active&filter[isEmailConfirmed]=true&paginated=false&order[column]=createdAt&order[mode]=ASC`,
      )
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    return users.slice(0, 50);
  }

  public static async getOneSubscribed(role: string): Promise<User> {
    const superToken = await AuthHelper.getSuperToken();
    const {
      body: { data: users },
    } = await api()
      .get(
        `/administrative/users?filter[role]=${role}&filter[subscription][status]=active&filter[isEmailConfirmed]=true&paginated=false&order[column]=createdAt&order[mode]=ASC`,
      )
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);

    const maxIndex = Math.min(users.length, 20);
    return users[Math.floor(Math.random() * maxIndex)];
  }
}
