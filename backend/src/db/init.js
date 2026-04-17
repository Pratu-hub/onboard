const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

/**
 * Get or create the connection pool.
 * Returns a connected mssql pool instance.
 */
async function getPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to Azure SQL Database');
    return pool;
  } catch (err) {
    console.error('❌ Azure SQL connection failed:', err.message);
    throw err;
  }
}

/**
 * Run the schema.sql migration file against the database.
 */
async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    const pool = await getPool();
    await pool.request().query(schemaSql);
    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('❌ Schema initialization failed:', err.message);
    throw err;
  }
}

// If run directly: node src/db/init.js
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Done. Exiting.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { getPool, initDatabase, sql };
