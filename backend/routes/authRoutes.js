const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { loginValidation, profileUpdateValidation } = require('../middleware/validation');

router.post('/login', loginValidation, AuthController.login);
router.get('/profile', authenticate, AuthController.profile);
router.put('/profile', authenticate, profileUpdateValidation, AuthController.updateProfile);
router.put('/photo', authenticate, AuthController.updatePhoto);
router.get('/photo', authenticate, AuthController.getPhoto);

module.exports = router;
