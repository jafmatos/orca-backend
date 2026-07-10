export const $constants = {
  defaultUserPassword: process.env.SEED_USER_DEFAULT_PASSWORD || 'secret',
  defaultOtpCode: process.env.SEED_DEFAULT_OTP_CODE || '000000',
  defaultSuperUserEmail:
    process.env.SEED_SUPER_USER_DEFAULT_EMAIL || 'superuser@orca.app',
  defaultSuperUserPassword:
    process.env.SEED_SUPER_USER_DEFAULT_PASSWORD || 'secret',
};
