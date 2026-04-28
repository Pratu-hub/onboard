const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { provisionEntraUser } = require('../utils/entraProvisioner');

/**
 * GET /api/onboarding/my-status
 * Returns whether the current user's onboarding is complete,
 * plus IT provisioning details for the Welcome Hub.
 */
router.get('/my-status', authenticate, async (req, res) => {
  try {
    const pool = await getPool();

    // Check onboarding progress status
    const progressResult = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`
        SELECT status, completed_at 
        FROM onboarding_progress 
        WHERE user_id = @user_id
      `);

    const progress = progressResult.recordset[0];
    const onboardingComplete = progress?.status === 'completed';

    // Mock IT provisioning checklist (in production, this would query real systems)
    const provisioning = onboardingComplete ? {
      items: [
        { id: 'email', label: 'Company Email', status: 'done', detail: `${req.user.name?.toLowerCase().replace(/\s+/g, '.')}@onboardiq.com` },
        { id: 'slack', label: 'Slack Workspace', status: 'done', detail: 'Added to #general, #engineering' },
        { id: 'jira', label: 'Jira Project Access', status: 'done', detail: 'Assigned to ONBOARD project' },
        { id: 'laptop', label: 'Laptop Shipment', status: 'in_progress', detail: 'MacBook Pro 14" — Ships in 2 days' },
        { id: 'vpn', label: 'VPN Configuration', status: 'pending', detail: 'Will be set up on Day 1' },
        { id: 'github', label: 'GitHub Organization', status: 'done', detail: 'Invited to onboardiq-dev org' },
      ]
    } : null;

    res.json({
      onboardingComplete,
      completedAt: progress?.completed_at || null,
      provisioning
    });

  } catch (err) {
    console.error('Get my-status error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/onboarding/progress
 * Returns the onboarding progress for the current user.
 * HR roles can optionally pass ?user_id= to view another user's progress.
 */
router.get('/progress', authenticate, async (req, res) => {
  let targetUserId = req.user.id;

  // HR roles can query other users
  if (req.query.user_id && ['HR'].includes(req.user.role)) {
    targetUserId = parseInt(req.query.user_id);
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, targetUserId)
      .query(`
        SELECT op.*, u.name AS user_name, u.email AS user_email
        FROM onboarding_progress op
        JOIN users u ON op.user_id = u.id
        WHERE op.user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No onboarding progress found for this user' });
    }

    res.json({ progress: result.recordset[0] });
  } catch (err) {
    console.error('Get progress error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/onboarding/all-cases
 * HR/IT only — list all users and their onboarding progress.
 */
router.get('/all-cases', authenticate, requireRole(['HR', 'IT_ADMIN']), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`
        SELECT 
          u.id, u.email, u.name, u.role, u.department,
          p.current_step, p.total_steps, p.status as onboarding_status, p.completed_at
        FROM users u
        LEFT JOIN onboarding_progress p ON u.id = p.user_id
        WHERE u.role = 'NEW_HIRE'
        ORDER BY u.created_at DESC
      `);
    res.json({ cases: result.recordset });
  } catch (err) {
    console.error('Get all cases error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/progress
 * Update step progress for the current user.
 */
router.patch('/progress', authenticate, async (req, res) => {
  const { current_step, status } = req.body;

  try {
    const pool = await getPool();
    const request = pool.request().input('user_id', sql.Int, req.user.id);

    let setClauses = [];
    if (current_step !== undefined) {
      request.input('current_step', sql.Int, current_step);
      setClauses.push('current_step = @current_step');
    }
    if (status) {
      request.input('status', sql.NVarChar, status);
      setClauses.push('status = @status');
      if (status === 'completed') {
        setClauses.push('completed_at = GETDATE()');
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update. Provide current_step or status.' });
    }

    const result = await request.query(`
      UPDATE onboarding_progress
      SET ${setClauses.join(', ')}
      OUTPUT INSERTED.*
      WHERE user_id = @user_id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No onboarding progress found' });
    }

    res.json({ progress: result.recordset[0] });
  } catch (err) {
    console.error('Update progress error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/onboarding/approve-case/:userId
 * HR only — finalize onboarding for a user.
 * 1. Checks if all docs are verified.
 * 2. Triggers Entra ID provisioning.
 * 3. Updates progress to 'completed'.
 */
router.post('/approve-case/:userId', authenticate, requireRole('HR'), async (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  try {
    const pool = await getPool();

    // Step 1: Verify all required documents are 'verified'
    const docs = await pool.request()
      .input('user_id', sql.Int, targetUserId)
      .query('SELECT status, doc_type FROM documents WHERE user_id = @user_id');

    const unverified = docs.recordset.filter(d => d.status !== 'verified');
    if (unverified.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot approve case. Some documents are still pending or rejected.',
        unverifiedDocs: unverified.map(d => d.doc_type)
      });
    }

    // Step 2: Fetch user info for provisioning
    const userResult = await pool.request()
      .input('id', sql.Int, targetUserId)
      .query('SELECT name, email, department FROM users WHERE id = @id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.recordset[0];

    // Step 3: Trigger Entra ID Provisioning
    console.log(`🚀 [PIPELINE] Starting provisioning for ${user.email}`);
    let provisionResult;
    try {
      provisionResult = await provisionEntraUser(user);
    } catch (pErr) {
      console.error('❌ [PIPELINE] Provisioning failed:', pErr.message);
      return res.status(502).json({ error: 'Auto-provisioning failed: ' + pErr.message });
    }

    // Step 4: Update Onboarding Progress
    await pool.request()
      .input('user_id', sql.Int, targetUserId)
      .query(`
        UPDATE onboarding_progress
        SET status = 'completed', completed_at = GETDATE()
        WHERE user_id = @user_id
      `);

    // Step 5: Log to Audit Logs
    await pool.request()
      .input('user_id', sql.Int, targetUserId)
      .input('reviewer_name', sql.NVarChar, req.user.name)
      .input('action_type', sql.NVarChar, 'CASE_APPROVED')
      .input('notes', sql.NVarChar, `Case approved. Entra ID account provisioned: ${provisionResult.userPrincipalName || 'Success'}`)
      .query(`
        INSERT INTO audit_logs (user_id, reviewer_name, action_type, notes)
        VALUES (@user_id, @reviewer_name, @action_type, @notes)
      `);

    res.json({ 
      message: 'Case approved and user provisioned successfully',
      provisioning: provisionResult
    });

  } catch (err) {
    console.error('Approve case error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
