const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { loginValidation } = require('../middleware/validation');

router.post('/login', loginValidation, AuthController.login);
router.get('/profile', authenticate, AuthController.profile);

module.exports = router;
