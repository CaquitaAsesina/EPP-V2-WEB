const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');

router.use(authenticate);
router.get('/', DashboardController.getData);

module.exports = router;
