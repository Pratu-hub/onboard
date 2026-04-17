const { getPool } = require('./src/db/init');

async function reset() {
  const pool = await getPool();
  await pool.request().query("UPDATE documents SET status = 'pending', filename = NULL, original_name = NULL");
  console.log('Reset complete');
  process.exit(0);
}

reset().catch(console.error);
