import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Prefer a single connection string when provided, otherwise fall back to the
// individual PG* environment variables (both are supported via .env).
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'student_db',
    });

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Thin helper so callers can do `query(text, params)` without grabbing a client.
export const query = (text, params) => pool.query(text, params);

export default pool;
