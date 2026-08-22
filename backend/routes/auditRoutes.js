const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);
router.get('/', authorize('admin'), AuditController.getAll);
router.get('/export', authorize('admin'), AuditController.export);

module.exports = router;
