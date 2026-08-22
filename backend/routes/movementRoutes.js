const express = require('express');
const router = express.Router();
const MovementController = require('../controllers/movementController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);
router.get('/', MovementController.getAll);
router.get('/export', MovementController.export);

module.exports = router;
