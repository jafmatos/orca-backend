import 'dotenv/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import 'tsconfig-paths/register';
import { AppModule } from '../src/app.module';

export default async () => {
  console.log('\n[Global Setup] Bootstrapping NestJS Application...');
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.set('query parser', 'extended');
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('v1');

  await app.init();
  await app.listen(3333);
  console.log('[Global Setup] NestJS Application is listening on port 3333');

  (global as any).__APP__ = app;
};
