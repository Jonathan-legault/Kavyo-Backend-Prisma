import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query(`
    WITH candidates AS (
      SELECT
        p.id,
        COALESCE(
          (
            SELECT NULLIF(a.raw_payload #>> '{detail,image_url}', '')
            FROM advertised_offers a
            WHERE a.product_id = p.id
            ORDER BY a.observed_at DESC NULLS LAST
            LIMIT 1
          ),
          (
            SELECT NULLIF(a.raw_payload #>> '{item,cutout_image_url}', '')
            FROM advertised_offers a
            WHERE a.product_id = p.id
            ORDER BY a.observed_at DESC NULLS LAST
            LIMIT 1
          ),
          (
            SELECT NULLIF(s.image_url, '')
            FROM product_evidence pe
            JOIN staged_offers s
              ON s.id::text = pe.raw_payload ->> 'sourceStagedOfferId'
            WHERE pe.product_id = p.id
            ORDER BY s.observed_at DESC NULLS LAST
            LIMIT 1
          ),
          (
            SELECT NULLIF(s.image_url, '')
            FROM staged_offers s
            WHERE s.matched_product_id = p.id
            ORDER BY s.observed_at DESC NULLS LAST
            LIMIT 1
          )
        ) AS image_url
      FROM products p
      WHERE p.image_url IS NULL
    )
    UPDATE products p
    SET image_url = regexp_replace(c.image_url, '^http://', 'https://', 'i')
    FROM candidates c
    WHERE p.id = c.id
      AND c.image_url IS NOT NULL
    RETURNING p.id
  `);

  console.log(`Backfilled ${rows.length} product images.`);
} finally {
  await client.end();
}
