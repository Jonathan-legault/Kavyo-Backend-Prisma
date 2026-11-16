// One-time setup: create the local dev ADMIN reviewer account used by the
// batch review workflow. Safe to re-run; only inserts when missing.
import "dotenv/config";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import pg from "pg";

const EMAIL = "admin@kavyo.dev";
const PASSWORD = "KavyoAdmin2026!";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const existing = await client.query(`select id from users where email = $1`, [
  EMAIL,
]);

if (existing.rows.length > 0) {
  console.log(`admin user ${EMAIL} already exists (${existing.rows[0].id})`);
} else {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const userId = randomUUID();
  const now = new Date();
  const user = await client.query(
    `insert into users (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
     values ($1, $2, $3, $4, $5, true, $6, $6) returning id`,
    [userId, EMAIL, passwordHash, "Kavyo", "Admin", now],
  );
  const role = await client.query(`select id from roles where name = 'ADMIN'`);
  await client.query(
    `insert into user_roles (user_id, role_id) values ($1, $2)
     on conflict do nothing`,
    [userId, role.rows[0].id],
  );
  console.log(`created admin user ${EMAIL} (${userId}) with ADMIN role`);
}

await client.end();
