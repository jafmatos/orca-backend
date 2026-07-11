import { config } from 'dotenv';
import { Env } from '@/config/.env.validate';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

config({ path: process.env.DOTENV_PATH || '.env.docker.development', override: false });

const configService = new ConfigService<Env, true>();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', { infer: true }),
  port: configService.get('DB_PORT', { infer: true }),
  username: configService.get('DB_USER', { infer: true }),
  password: configService.get('DB_PASS', { infer: true }),
  database: configService.get('DB_NAME', { infer: true }),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: configService.get('DB_SYNCHRONIZE', { infer: true }) === ('true' as any),
  logging: configService.get('DB_LOGGING', { infer: true }) === ('true' as any),
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
