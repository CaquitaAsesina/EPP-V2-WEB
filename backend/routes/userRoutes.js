const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { userValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', authorize('admin'), UserController.getAll);
router.get('/:id', authorize('admin'), UserController.getById);
router.post('/', authorize('admin'), userValidation, UserController.create);
router.put('/:id', authorize('admin'), UserController.update);
router.put('/:id/password', authorize('admin'), UserController.updatePassword);
router.delete('/:id', authorize('admin'), UserController.delete);

module.exports = router;
