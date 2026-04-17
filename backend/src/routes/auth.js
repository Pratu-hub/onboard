const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../db/init');
const { generateToken, validateB2CToken } = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Mock login — accepts a role and returns a JWT + user object.
 * Used during development to simulate different user personas.
 */
router.post('/login', async (req, res) => {
  const { role } = req.body;

  if (!role || !['NEW_HIRE', 'HR_REVIEWER', 'HR_ADMIN', 'IT_ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: NEW_HIRE, HR_REVIEWER, HR_ADMIN, IT_ADMIN' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('role', sql.NVarChar, role)
      .query('SELECT TOP 1 id, email, name, role, department FROM users WHERE role = @role');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: `No user found with role '${role}'. Run npm run db:seed first.` });
    }

    const user = result.recordset[0];
    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/b2c
 * Azure AD B2C token exchange.
 * Accepts a B2C idToken, validates it against Azure's JWKS endpoint,
 * then looks up / creates the user in our DB and returns our own JWT.
 */
router.post('/b2c', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    // Step 1: Validate the B2C token against Azure's public keys
    const rawDecoded = jwt.decode(idToken);
    console.log('🔍 Received B2C Token Issuer:', rawDecoded?.iss);
    
    const decoded = await validateB2CToken(idToken);

    // B2C tokens typically have these claims:
    // - sub (subject/user id)
    // - emails (array of email addresses)
    // - given_name, family_name
    // - extension_Role (custom claim, if configured)
    const email = decoded.emails?.[0] || decoded.email || decoded.preferred_username || decoded.sub;
    const name = [decoded.given_name, decoded.family_name].filter(Boolean).join(' ') || decoded.name || email;

    // Step 2: Find or create the user in our database
    const pool = await getPool();
    
    // Try to find existing user by email
    let result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id, email, name, role, department FROM users WHERE email = @email');

    let user;

    if (result.recordset.length > 0) {
      // Existing user
      user = result.recordset[0];
    } else {
      // Role Mapping from CIAM
      // Parse custom claims or groups to determine proper enterprise role
      let role = 'NEW_HIRE';
      if (decoded.extension_Role) {
        role = decoded.extension_Role;
      } else if (decoded.roles && Array.isArray(decoded.roles) && decoded.roles.length > 0) {
        // App roles assigned in Entra ID
        const validRoles = ['NEW_HIRE', 'HR_REVIEWER', 'HR_ADMIN', 'IT_ADMIN'];
        const matchedRole = decoded.roles.find(r => validRoles.includes(r.toUpperCase()));
        if (matchedRole) role = matchedRole.toUpperCase();
      } else if (decoded.jobTitle) {
        const title = decoded.jobTitle.toLowerCase();
        if (title.includes('hr admin') || title.includes('manager')) role = 'HR_ADMIN';
        else if (title.includes('hr reviewer') || title.includes('recruiter')) role = 'HR_REVIEWER';
        else if (title.includes('it admin') || title.includes('system')) role = 'IT_ADMIN';
      } else if (decoded.groups && Array.isArray(decoded.groups)) {
        if (decoded.groups.includes('HR_ADMIN_GROUP')) role = 'HR_ADMIN';
        else if (decoded.groups.includes('IT_ADMIN_GROUP')) role = 'IT_ADMIN';
        else if (decoded.groups.includes('HR_REVIEWER_GROUP')) role = 'HR_REVIEWER';
      }
      
      const validDbRoles = ['NEW_HIRE', 'HR_REVIEWER', 'HR_ADMIN', 'IT_ADMIN'];
      if (!validDbRoles.includes(role)) {
        role = 'NEW_HIRE';
      }
      
      const insertResult = await pool.request()
        .input('email', sql.NVarChar, email)
        .input('name', sql.NVarChar, name)
        .input('role', sql.NVarChar, role)
        .query(`
          INSERT INTO users (email, name, role)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.role, INSERTED.department
          VALUES (@email, @name, @role)
        `);

      user = insertResult.recordset[0];

      // Also seed default document slots for a new hire
      if (user.role === 'NEW_HIRE') {
        const docTypes = ['government_id', 'offer_letter', 'education_cert', 'bank_details', 'nda'];
        for (const docType of docTypes) {
          await pool.request()
            .input('user_id', sql.Int, user.id)
            .input('doc_type', sql.NVarChar, docType)
            .query(`
              INSERT INTO documents (user_id, doc_type, status) VALUES (@user_id, @doc_type, 'pending')
            `);
        }

        // Seed onboarding progress
        await pool.request()
          .input('user_id', sql.Int, user.id)
          .query(`
            INSERT INTO onboarding_progress (user_id, current_step, total_steps, status)
            VALUES (@user_id, 1, 4, 'in_progress')
          `);
      }
    }

    // Step 3: Issue our own JWT for all subsequent API calls
    const token = generateToken(user);
    console.log(`✅ CIAM Auth Successful: ${user.email} as ${user.role}`);
    res.json({ token, user });

  } catch (err) {
    console.error('B2C auth error:', err.message);
    
    // Provide actionable error messages
    if (err.message.includes('jwt expired')) {
      return res.status(401).json({ error: 'B2C token has expired. Please try logging in again.' });
    }
    if (err.message.includes('invalid signature') || err.message.includes('getSigningKey')) {
      return res.status(401).json({ error: 'Invalid B2C token signature. Check your B2C tenant configuration.' });
    }
    
    res.status(401).json({ error: 'B2C token validation failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user from the JWT.
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
