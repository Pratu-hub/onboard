const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * GET /api/users
 * HR only — list all users.
 */
router.get('/', authenticate, requireRole('HR', 'IT_ADMIN'), async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT id, email, name, role, department, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.recordset });
  } catch (err) {
    console.error('List users error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 * Authenticated users can view their own profile; HR roles can view anyone.
 */
router.get('/:id', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id);

  // Non-HR roles can only view themselves
  if (req.user.role === 'NEW_HIRE' && req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own profile' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT id, email, name, role, department, employee_id, joining_date, manager_name, created_at FROM users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.recordset[0] });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:id
 * Users can update their own profile; HR can update anyone.
 */
router.put('/:id', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId && !['HR'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden. You can only update your own profile.' });
  }

  const { name, department, employee_id, joining_date, manager_name } = req.body;

  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, userId)
      .input('name', sql.NVarChar, name || null)
      .input('department', sql.NVarChar, department || null)
      .input('employee_id', sql.NVarChar, employee_id || null)
      .input('joining_date', sql.Date, joining_date || null)
      .input('manager_name', sql.NVarChar, manager_name || null)
      .query(`
        UPDATE users 
        SET 
          name = COALESCE(@name, name),
          department = COALESCE(@department, department),
          employee_id = COALESCE(@employee_id, employee_id),
          joining_date = COALESCE(@joining_date, joining_date),
          manager_name = COALESCE(@manager_name, manager_name)
        WHERE id = @id
      `);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
