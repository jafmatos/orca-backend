import { DataSource, DataSourceOptions } from "typeorm";

export const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT!,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: true,
  synchronize: true,
  entities: [`${__dirname}/entities/*.{js,ts}`],
  migrations: [`${__dirname}/migrations/*.{js,ts}`],
  timezone: process.env.DB_TIMEZONE,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : null,
} as DataSourceOptions);
