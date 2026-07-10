export default async () => {
  console.log('\n[Global Teardown] Closing NestJS Application...');
  const app = (global as any).__APP__;
  if (app) {
    await app.close();
    console.log('[Global Teardown] NestJS Application closed.');
  }
};
