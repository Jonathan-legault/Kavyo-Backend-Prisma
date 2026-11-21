import 'dotenv/config';
import pg from 'pg';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });

await c.connect();

try {
  const r = await c.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'stores'
      AND table_schema = 'public'
    ORDER BY ordinal_position
  `);

  console.table(r.rows);
} finally {
  await c.end();
}
