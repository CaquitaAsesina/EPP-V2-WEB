const express = require('express');
const router = express.Router();
const EppTypeController = require('../controllers/eppTypeController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { eppTypeValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', EppTypeController.getAll);
router.get('/active', EppTypeController.getActive);
router.get('/:id', EppTypeController.getById);
router.get('/:id/sizes', EppTypeController.getSizes);
router.post('/', authorize('admin'), eppTypeValidation, EppTypeController.create);
router.put('/:id', authorize('admin'), EppTypeController.update);
router.delete('/:id', authorize('admin'), EppTypeController.delete);

module.exports = router;
