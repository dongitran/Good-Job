import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { requireEnv } from '../config/helpers';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: requireEnv('DATABASE_URL'),
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
