const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * GET /api/hardware
 * IT Admin sees all hardware. New Hires see their own.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    let result;

    if (req.user.role === 'IT_ADMIN') {
      result = await pool.request().query(`
        SELECT h.*, u.name AS user_name, u.email AS user_email, u.department
        FROM hardware_requests h
        JOIN users u ON h.user_id = u.id
        ORDER BY h.requested_at DESC
      `);
    } else {
      result = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .query('SELECT * FROM hardware_requests WHERE user_id = @user_id ORDER BY requested_at DESC');
    }

    res.json({ requests: result.recordset });
  } catch (err) {
    console.error('List hardware error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/hardware/:id/status
 * IT Admin only - update hardware status.
 */
router.patch('/:id/status', authenticate, requireRole('IT_ADMIN'), async (req, res) => {
  const reqId = parseInt(req.params.id);
  const { status } = req.body;

  const validStatuses = ['pending', 'approved', 'shipping', 'delivered'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, reqId)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE hardware_requests 
        SET status = @status, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Hardware request not found' });
    }

    res.json({ hardware: result.recordset[0] });
  } catch (err) {
    console.error('Update hardware status error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
