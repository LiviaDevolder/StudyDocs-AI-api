import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { getDataSourceOptions } from './config/typeorm.config';

config();

export const AppDataSource = new DataSource(
  getDataSourceOptions({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'studydocs_ai',
  }),
);
