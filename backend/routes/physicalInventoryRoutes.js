const express = require('express');
const router = express.Router();
const PhysicalInventoryController = require('../controllers/physicalInventoryController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { physicalInventoryValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', PhysicalInventoryController.getAll);
router.post('/', authorize('admin'), physicalInventoryValidation, PhysicalInventoryController.createOrUpdate);
router.delete('/:id', authorize('admin'), PhysicalInventoryController.delete);

module.exports = router;
