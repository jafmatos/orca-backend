import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/.env.validate';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { apiReference } from '@scalar/nestjs-api-reference';
import basicAuth from 'express-basic-auth';
import { DataSource } from 'typeorm';
import { User, UserRoles } from '@/user/entities/user.entity';
import * as Bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'validator.swagger.io',
            'https://cdn.jsdelivr.net',
          ],
        },
      },
    }),
  );
  app.enableCors();
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('v1');

  app.use(
    ['/v1/api/docs', '/v1/api/docs-json', '/admin/queues', '/v1/api/queues'],
    basicAuth({
      challenge: true,
      authorizeAsync: true,
      authorizer: async (username, password, cb) => {
        try {
          const dataSource = app.get(DataSource);
          const userRepository = dataSource.getRepository(User);
          const user = await userRepository.findOne({
            where: { email: username },
          });

          if (!user || user.role !== UserRoles.SuperUser) {
            return cb(null, false);
          }

          const isMatch = await Bcrypt.compare(password, user.password);
          return cb(null, isMatch);
        } catch {
          return cb(null, false);
        }
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Orca Backend')
    .setDescription('The API documentation for the Orca Backend.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/v1/api/docs',
    apiReference({
      spec: {
        content: cleanupOpenApiDoc(document) as any,
      },
      theme: 'purple',
    }),
  );

  app.set('query parser', 'extended');

  const configService = app.get(ConfigService<Env, true>);

  await app.listen(configService.get('APP_PORT'));
}

bootstrap();
