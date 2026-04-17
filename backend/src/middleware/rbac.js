/**
 * Role-Based Access Control middleware.
 * Usage: router.get('/admin', authenticate, requireRole('HR_ADMIN'), handler)
 * 
 * @param  {...string} roles - Allowed roles for this route
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Role '${req.user.role}' does not have access to this resource. Required: ${roles.join(', ')}` 
      });
    }

    next();
  };
}

module.exports = { requireRole };
