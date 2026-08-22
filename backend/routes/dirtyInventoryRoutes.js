const express = require('express');
const router = express.Router();
const DirtyInventoryController = require('../controllers/dirtyInventoryController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(authenticate);
router.get('/', DirtyInventoryController.getMatrix);
router.get('/matrix', DirtyInventoryController.getMatrix);
router.put('/classify', authorize('admin'), DirtyInventoryController.classifyItems);

module.exports = router;
