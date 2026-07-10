import { User } from '@/user/entities/user.entity';
import { api } from './api.helper';
import { $constants } from '../constants';
import { $faker } from './$faker';

export class AuthHelper {
  public static superToken: string = '';

  public static async getSuperToken(): Promise<string> {
    if (this.superToken) return this.superToken;

    const response = await api()
      .post('/sign-in')
      .send({
        email: $constants.defaultSuperUserEmail,
        password: $constants.defaultSuperUserPassword,
      })
      .expect(201);

    this.superToken = response.body.token;

    return this.superToken;
  }

  public static async signIn({ email }: { email: string }): Promise<string> {
    const response = await api()
      .post('/sign-in')
      .send({
        email,
        password: $constants.defaultUserPassword,
      })
      .expect(201);

    return response.body.token;
  }

  public static async initiateSignUp(): Promise<{ id: string; otp: string; expiresAt: string }> {
    const email = $faker.internet.email();
    const password = $constants.defaultUserPassword;
    const name = $faker.person.fullName();
    const confirmUrl = $faker.internet.url();

    const signUpResponse = await api()
      .post('/sign-up')
      .send({
        acceptedTerms: true,
        email,
        name,
        password,
        passwordConfirmation: password,
        confirmUrl,
      })
      .expect(201);

    return signUpResponse.body.key;
  }

  public static async confirmSignUp({ id }: { id: string }): Promise<User> {
    const response = await api()
      .put(`/sign-up/${id}`)
      .send({ otp: $constants.defaultOtpCode })
      .expect(200);

    return response.body.user;
  }

  public static async signUp(): Promise<User> {
    const key = await this.initiateSignUp();
    const user = await this.confirmSignUp(key);

    return user;
  }

  public static async initiateResetPassword({ email }: { email: string }): Promise<{ id: string; otp: string; expiresAt: string }> {
    const response = await api()
      .post('/reset-password')
      .send({
        email,
        confirmUrl: $faker.internet.url(),
      })
      .expect(201);

    return response.body.key;
  }

  public static async confirmResetPassword({
    id,
    newPassword,
  }: {
    id: string;
    newPassword: string;
  }): Promise<User> {
    const response = await api()
      .put(`/reset-password/${id}`)
      .send({
        otp: $constants.defaultOtpCode,
        password: newPassword,
        passwordConfirmation: newPassword,
      })
      .expect(200);

    return response.body.user;
  }

  public static async resetPassword(
    user: User,
    newPassword = $constants.defaultUserPassword,
  ): Promise<User> {
    const key = await this.initiateResetPassword(user);
    const resetedUser = await this.confirmResetPassword({
      id: key.id,
      newPassword,
    });

    return resetedUser;
  }

  public static async initiateDeleteAccount(
    { email }: { email: string },
    token: string,
  ): Promise<{ id: string; otp: string; expiresAt: string }> {
    const response = await api()
      .post('/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({
        confirmUrl: $faker.internet.url(),
      })
      .expect(201);

    return response.body.key;
  }

  public static async confirmDeleteAccount(
    { id }: { id: string },
    token?: string,
  ): Promise<User> {
    const response = await api()
      .put(`/delete-account/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        otp: $constants.defaultOtpCode,
      })
      .expect(200);

    return response.body.user;
  }

  public static async deleteAccount(user: User): Promise<User> {
    const token = await this.signIn(user);
    const key = await this.initiateDeleteAccount(user, token);
    const resetedUser = await this.confirmDeleteAccount(key, token);

    return resetedUser;
  }
}
