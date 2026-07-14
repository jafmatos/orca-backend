import { validate } from '@/config/.env.validate';
import { AppService } from '@/app.service';
import { AdminModule } from './admin/admin.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { NotificationsModule } from './notifications/notifications.module';
import { CategoryModule } from './category/category.module';
import { EntryModule } from './entry/entry.module';
import { OverviewModule } from './overview/overview.module';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { ScheduleModule } from './schedule/schedule.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SupportModule } from './support/support.module';

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
    AdminModule,
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
