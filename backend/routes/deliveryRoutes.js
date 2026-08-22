const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/deliveryController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { deliveryValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', DeliveryController.getAll);
router.get('/export', DeliveryController.export);
router.get('/:id', DeliveryController.getById);
router.post('/', authorize('admin'), deliveryValidation, DeliveryController.create);
router.put('/:id', authorize('admin'), DeliveryController.update);
router.delete('/:id', authorize('admin'), DeliveryController.delete);

module.exports = router;
