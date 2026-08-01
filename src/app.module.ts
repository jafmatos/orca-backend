import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { validate } from '@/config/.env.validate';
import { DatabaseModule } from '@/database/database.module';
import { UserModule } from '@/user/user.module';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AdministrativeModule } from './administrative/administrative.module';
import { AnalysisModule } from './analysis/analysis.module';
import { CategoryModule } from './category/category.module';
import { EntryModule } from './entry/entry.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OverviewModule } from './overview/overview.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SupportModule } from './support/support.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: process.env.NODE_ENV === 'testing' ? 9999 : 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath:
        process.env.NODE_ENV === 'testing'
          ? '.env.docker.testing'
          : process.env.NODE_ENV === 'production'
            ? '.env.docker.production'
            : '.devcontainer/.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AdministrativeModule,
    AnalysisModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    NotificationsModule,
    CategoryModule,
    EntryModule,
    OverviewModule,
    ScheduleModule,
    SubscriptionModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
        limiter: {
          max: 10,
          duration: 5000,
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    SupportModule,
    ChatModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
