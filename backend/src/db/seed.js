const { getPool, sql } = require('./init');

/**
 * Seeds the database with mock users and initial data.
 * Uses MERGE to avoid duplicates on re-run.
 */
async function seed() {
  const pool = await getPool();

  // Seed users
  const users = [
    { email: 'alexander@sovereign.cloud', name: 'Alexander', role: 'NEW_HIRE', department: 'Engineering' },
    { email: 'sarah.jenkins@sovereign.cloud', name: 'Sarah Jenkins', role: 'HR_ADMIN', department: 'Human Resources' },
    { email: 'david.chen@sovereign.cloud', name: 'David Chen', role: 'IT_ADMIN', department: 'IT Operations' },
    { email: 'reviewer@sovereign.cloud', name: 'Maria Lopez', role: 'HR_REVIEWER', department: 'Human Resources' },
  ];

  for (const u of users) {
    await pool.request()
      .input('email', sql.NVarChar, u.email)
      .input('name', sql.NVarChar, u.name)
      .input('role', sql.NVarChar, u.role)
      .input('department', sql.NVarChar, u.department)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
          INSERT INTO users (email, name, role, department) VALUES (@email, @name, @role, @department)
      `);
  }
  console.log('✅ Users seeded');

  // Seed onboarding progress for the new hire
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM onboarding_progress WHERE user_id = (SELECT id FROM users WHERE email = 'alexander@sovereign.cloud'))
      INSERT INTO onboarding_progress (user_id, current_step, total_steps, status)
      SELECT id, 2, 4, 'in_progress' FROM users WHERE email = 'alexander@sovereign.cloud'
  `);
  console.log('✅ Onboarding progress seeded');

  // Seed documents for the new hire
  const newHireId = (await pool.request().query("SELECT id FROM users WHERE email = 'alexander@sovereign.cloud'")).recordset[0]?.id;

  if (newHireId) {
    const docs = [
      { type: 'government_id', status: 'uploaded', name: 'passport_scan.pdf' },
      { type: 'offer_letter', status: 'ai_processing', name: 'offer_letter_signed.pdf' },
      { type: 'education_cert', status: 'pending', name: null },
      { type: 'bank_details', status: 'pending', name: null },
      { type: 'nda', status: 'pending', name: null },
    ];

    for (const d of docs) {
      await pool.request()
        .input('user_id', sql.Int, newHireId)
        .input('doc_type', sql.NVarChar, d.type)
        .input('filename', sql.NVarChar, d.name)
        .input('original_name', sql.NVarChar, d.name)
        .input('status', sql.NVarChar, d.status)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM documents WHERE user_id = @user_id AND doc_type = @doc_type)
            INSERT INTO documents (user_id, doc_type, filename, original_name, status)
            VALUES (@user_id, @doc_type, @filename, @original_name, @status)
        `);
    }
    console.log('✅ Documents seeded');
  }

  // Seed hardware requests for the new hire
  if (newHireId) {
    const requests = [
      { device_type: 'laptop', specs: 'MacBook Pro 16" M3 Max, 32GB RAM, 1TB SSD', status: 'pending' },
      { device_type: 'monitor', specs: 'LG 27" 4K UltraFine Display', status: 'approved' },
      { device_type: 'keyboard', specs: 'Keychron K2 Wireless Mechanical Keyboard', status: 'shipping' },
      { device_type: 'phone', specs: 'iPhone 15 Pro, 256GB', status: 'pending' },
    ];

    for (const r of requests) {
      await pool.request()
        .input('user_id', sql.Int, newHireId)
        .input('device_type', sql.NVarChar, r.device_type)
        .input('specs', sql.NVarChar, r.specs)
        .input('status', sql.NVarChar, r.status)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM hardware_requests WHERE user_id = @user_id AND device_type = @device_type)
            INSERT INTO hardware_requests (user_id, device_type, specs, status)
            VALUES (@user_id, @device_type, @specs, @status)
        `);
    }
    console.log('✅ Hardware requests seeded');
  }

  console.log('🎉 Seed complete');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { seed };
