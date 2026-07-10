import { api } from './helpers/api.helper';
import { AuthHelper } from './helpers/auth.helper';
import { $constants } from './constants';


describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    const token = await AuthHelper.signIn({ email: $constants.defaultSuperUserEmail });

    return api().get('/').expect(200).expect('Hello World!');
  });
});
