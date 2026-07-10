import { api } from '@Test/helpers/api.helper';
import { AuthHelper } from '@Test/helpers/auth.helper';
import { UserHelper } from '@Test/helpers/user.helper';


describe('Permissions (e2e)', () => {
  let superUserToken: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
		const superUser = await UserHelper.getOneByRole('super-user');
		const admin = await UserHelper.getOneByRole('admin');
		const user = await UserHelper.getOneByRole('user');

		superUserToken = await AuthHelper.signIn({ email: superUser.email });
		adminToken = await AuthHelper.signIn({ email: admin.email });
		userToken = await AuthHelper.signIn({ email: user.email });
  })

  const endpoints = [
    // Admin & SuperUser Only
    {
      path: '/admin/users',
      method: 'get',
      allowedRoles: ['admin', 'super-user'],
    },
    {
      path: '/admin/overview/kpis',
      method: 'get',
      allowedRoles: ['admin', 'super-user'],
    },

    // SuperUser Only
    { path: '/plans', method: 'post', allowedRoles: ['super-user'] },
    { path: '/plans/fake-id', method: 'put', allowedRoles: ['super-user'] },
    { path: '/plans/fake-id', method: 'delete', allowedRoles: ['super-user'] },

    // User Only
    { path: '/limits', method: 'get', allowedRoles: ['user'] },
    { path: '/limits', method: 'post', allowedRoles: ['user'] },
    { path: '/limits/fake-id', method: 'put', allowedRoles: ['user'] },
    { path: '/limits/fake-id', method: 'delete', allowedRoles: ['user'] },

    { path: '/entries', method: 'get', allowedRoles: ['user'] },
    { path: '/entries', method: 'post', allowedRoles: ['user'] },
    { path: '/entries/bulk', method: 'post', allowedRoles: ['user'] },
    { path: '/entries/smart-extract', method: 'post', allowedRoles: ['user'] },
    { path: '/entries/fake-id', method: 'put', allowedRoles: ['user'] },
    { path: '/entries/fake-id', method: 'delete', allowedRoles: ['user'] },
    { path: '/entries/export/csv', method: 'get', allowedRoles: ['user'] },

    { path: '/schedules', method: 'get', allowedRoles: ['user'] },
    { path: '/schedules', method: 'post', allowedRoles: ['user'] },
    { path: '/schedules/fake-id', method: 'put', allowedRoles: ['user'] },
    { path: '/schedules/fake-id', method: 'delete', allowedRoles: ['user'] },
    {
      path: '/schedules/fake-id/occurrence',
      method: 'post',
      allowedRoles: ['user'],
    },

    { path: '/delete-account', method: 'post', allowedRoles: ['user'] },
    { path: '/delete-account/fake-id', method: 'put', allowedRoles: ['user'] },
    {
      path: '/delete-account/resend/fake-id',
      method: 'put',
      allowedRoles: ['user'],
    },

    { path: '/categories', method: 'get', allowedRoles: ['user'] },
    { path: '/categories/fake-id', method: 'get', allowedRoles: ['user'] },
    { path: '/categories', method: 'post', allowedRoles: ['user'] },
    { path: '/categories/fake-id', method: 'put', allowedRoles: ['user'] },
    { path: '/categories/fake-id', method: 'delete', allowedRoles: ['user'] },

    { path: '/users/overview/kpis', method: 'get', allowedRoles: ['user'] },
    {
      path: '/users/overview/expense-by-category',
      method: 'get',
      allowedRoles: ['user'],
    },
    {
      path: '/users/overview/monthly-evolution',
      method: 'get',
      allowedRoles: ['user'],
    },

    {
      path: '/analyses',
      method: 'get',
      allowedRoles: ['user'],
    },
    {
      path: '/analyses',
      method: 'post',
      allowedRoles: ['user'],
    },
    {
      path: '/analyses/00000000-0000-0000-0000-000000000000',
      method: 'get',
      allowedRoles: ['user'],
    },
    {
      path: '/analyses/00000000-0000-0000-0000-000000000000',
      method: 'delete',
      allowedRoles: ['user'],
    },

    {
      path: '/billing-portal',
      method: 'post',
      allowedRoles: ['user'],
    },
    {
      path: '/checkout',
      method: 'post',
      allowedRoles: ['user'],
    },

    // All authenticated users
    {
      path: '/push-subscriptions',
      method: 'post',
      allowedRoles: ['user', 'admin', 'super-user'],
    },
    {
      path: '/push-subscriptions',
      method: 'delete',
      allowedRoles: ['user', 'admin', 'super-user'],
    },

    {
      path: '/plans',
      method: 'get',
      allowedRoles: ['user', 'admin', 'super-user'],
    },
    {
      path: '/plans/00000000-0000-0000-0000-000000000000',
      method: 'get',
      allowedRoles: ['user', 'admin', 'super-user'],
    },

    {
      path: '/users/me',
      method: 'get',
      allowedRoles: ['user', 'admin', 'super-user'],
    },
    {
      path: '/users/me',
      method: 'put',
      allowedRoles: ['user', 'admin', 'super-user'],
    },
    {
      path: '/users/me/avatar',
      method: 'put',
      allowedRoles: ['user', 'admin', 'super-user'],
    },
    {
      path: '/users/me/avatar',
      method: 'delete',
      allowedRoles: ['user', 'admin', 'super-user'],
    },
  ];

  for (const endpoint of endpoints) {
    describe(`${endpoint.method.toUpperCase()} ${endpoint.path}`, () => {
      const testRole = async (role: string, token: string) => {
        const isAllowed = endpoint.allowedRoles.includes(role);

        const response = await (api() as any)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${token}`)
          .send();

        if (!isAllowed) {
          expect(response.status).toBe(403);
          expect(response.body.message).toContain(
            'permissão para acessar este recurso',
          );
        } else {
          expect(response.status).not.toBe(403);
        }
      };

      it(`Normal User access - should be ${endpoint.allowedRoles.includes('user') ? 'ALLOWED' : 'FORBIDDEN'}`, async () => {
        await testRole('user', userToken);
      });

      it(`Admin access - should be ${endpoint.allowedRoles.includes('admin') ? 'ALLOWED' : 'FORBIDDEN'}`, async () => {
        await testRole('admin', adminToken);
      });

      it(`SuperUser access - should be ${endpoint.allowedRoles.includes('super-user') ? 'ALLOWED' : 'FORBIDDEN'}`, async () => {
        await testRole('super-user', superUserToken);
      });
    });
  }
});
