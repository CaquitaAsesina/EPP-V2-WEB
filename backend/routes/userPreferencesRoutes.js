const express = require('express');
const router = express.Router();
const UserPreferencesController = require('../controllers/userPreferencesController');
const authenticate = require('../middleware/auth');

router.use(authenticate);
router.get('/', UserPreferencesController.get);
router.put('/', UserPreferencesController.update);

module.exports = router;
