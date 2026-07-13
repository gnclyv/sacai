// Neon Postgres bazasinda cedvelleri yaradir
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('XETA: .env faylinda DATABASE_URL tapilmadi. .env.example-i .env kimi kopyalayib doldurun.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  try {
    await pool.query(schema);
    console.log('✓ Neon bazasinda "analyses" cedveli hazirdir.');
  } catch (err) {
    console.error('Baza sxemi yaradilarken xeta:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
