import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/.env.validate';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.use(helmet());
  app.enableCors();
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('v1');

  app.set('query parser', 'extended');
  
  const configService = app.get(ConfigService<Env, true>);

  await app.listen(configService.get('APP_PORT'));
}

bootstrap();
