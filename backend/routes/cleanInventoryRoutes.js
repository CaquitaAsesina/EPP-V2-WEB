const express = require('express');
const router = express.Router();
const CleanInventoryController = require('../controllers/cleanInventoryController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { stockInitialValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', CleanInventoryController.getMatrix);
router.get('/matrix', CleanInventoryController.getMatrix);
router.put('/:id', authorize('admin'), CleanInventoryController.updateInitialStock);
router.post('/initial-stock', authorize('admin'), stockInitialValidation, CleanInventoryController.setInitialStock);

module.exports = router;
