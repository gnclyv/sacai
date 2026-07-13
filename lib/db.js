// Neon Postgres bağlantı hovuzu (serverless mühitlərdə hovuzu təkrar-təkrar
// yaratmamaq üçün modul səviyyəsində saxlanılır)

const { Pool } = require('pg');

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1 // serverless funksiyalarda hər invocation öz bağlantısını açır, azlıq saxla
    });
  }
  return pool;
}

module.exports = { getPool };
