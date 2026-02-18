import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { requireEnv } from '../config/helpers';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default new DataSource({
  type: 'postgres',
  url: requireEnv('DATABASE_URL'),
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
