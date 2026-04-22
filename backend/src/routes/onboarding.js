const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/init');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
