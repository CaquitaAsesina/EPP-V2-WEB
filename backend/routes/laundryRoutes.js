const express = require('express');
const router = express.Router();
const LaundryController = require('../controllers/laundryController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { laundryValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', LaundryController.getAll);
router.get('/export', LaundryController.export);
router.get('/:id', LaundryController.getById);
router.post('/', authorize('admin'), laundryValidation, LaundryController.create);
router.put('/:id/status', authorize('admin'), LaundryController.updateStatus);
router.delete('/:id', authorize('admin'), LaundryController.delete);

module.exports = router;
