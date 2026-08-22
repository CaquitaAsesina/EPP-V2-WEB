const express = require('express');
const router = express.Router();
const ReturnController = require('../controllers/returnController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { returnValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', ReturnController.getAll);
router.get('/export', ReturnController.export);
router.get('/:id', ReturnController.getById);
router.post('/', authorize('admin'), returnValidation, ReturnController.create);
router.put('/:id', authorize('admin'), ReturnController.update);
router.delete('/:id', authorize('admin'), ReturnController.delete);

module.exports = router;
