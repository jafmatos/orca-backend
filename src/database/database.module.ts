import { Env } from '@/config/.env.validate';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingModule } from './seeding/seeding.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', { infer: true }),
        port: configService.get('DB_PORT', { infer: true }),
        username: configService.get('DB_USER', { infer: true }),
        password: configService.get('DB_PASS', { infer: true }),
        database: configService.get('DB_NAME', { infer: true }),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNCHRONIZE', { infer: true }),
        logging: configService.get('DB_LOGGING', { infer: true }),
      }),
    }),
    SeedingModule,
  ],
})
export class DatabaseModule {}
