const express = require('express');
const router = express.Router();
const WorkerController = require('../controllers/workerController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { workerValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', WorkerController.getAll);
router.get('/:id', WorkerController.getById);
router.post('/', authorize('admin'), workerValidation, WorkerController.create);
router.put('/:id', authorize('admin'), WorkerController.update);
router.delete('/:id', authorize('admin'), WorkerController.delete);

module.exports = router;
