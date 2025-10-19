import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://postgres:habku2-gotraf-suVhan@db.zskaxjtyuaqazydouifp.supabase.co:5432/postgres';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection silently
pool.query('SELECT 1').catch(() => {
  // Fail silently
});
