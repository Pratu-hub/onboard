const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/telemetry', authenticate, requireRole('IT_ADMIN'), (req, res) => {
  res.json({
    metrics: {
      apiLatency: Math.floor(Math.random() * 50) + 20,
      authErrors: (Math.random() * 3).toFixed(1),
      activeNodes: 8,
      criticalAlerts: Math.floor(Math.random() * 2)
    },
    logs: [
      { id: 1, timestamp: new Date().toISOString(), level: 'INFO', service: 'AuthService', message: 'Validated JWT token' },
      { id: 2, timestamp: new Date(Date.now() - 5000).toISOString(), level: 'INFO', service: 'Provisioning', message: 'Dispatched MDM payload' },
      { id: 3, timestamp: new Date(Date.now() - 15000).toISOString(), level: 'ERR', service: 'Database', message: 'Connection timeout. Attempting failover.' },
      { id: 4, timestamp: new Date(Date.now() - 25000).toISOString(), level: 'WARN', service: 'Database', message: 'Failover successful. Latency elevated.' },
    ]
  });
});

module.exports = router;
