export const $constants = {
  defaultUserPassword: process.env.TESTING_USER_DEFAULT_PASSWORD || 'secret',
  defaultOtpCode: process.env.TESTING_DEFAULT_OTP_CODE || '000000',
  defaultSuperUserEmail:
    process.env.TESTING_SUPER_USER_DEFAULT_EMAIL || 'superuser@orca.app',
  defaultSuperUserPassword:
    process.env.TESTING_SUPER_USER_DEFAULT_PASSWORD || 'secret',
};