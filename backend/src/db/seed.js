const { getPool, sql } = require('./init');

/**
 * Seeds the database with mock users and initial data.
 * Uses MERGE to avoid duplicates on re-run.
 */
async function seed() {
  const pool = await getPool();

  // Mock data has been removed for production Azure AD B2C SSO integration.
  // Users will be dynamically provisioned in the database via the /api/auth/b2c route
  // when they successfully authenticate with a valid B2C token.
  
  const users = [];
  console.log('✅ Mock data seeding disabled for production.');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { seed };
