import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'test-pg-1-nbgzl5',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'test-pg-1',
  user: process.env.POSTGRES_USER || 'test-pg-1',
  password: process.env.POSTGRES_PASSWORD || 'gZT2u4fDubYIVc9ItuKxIgMRWNwthOJT',
});

export default pool;