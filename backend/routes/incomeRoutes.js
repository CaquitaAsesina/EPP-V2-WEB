const express = require('express');
const router = express.Router();
const IncomeController = require('../controllers/incomeController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { incomeValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', IncomeController.getAll);
router.get('/export', IncomeController.export);
router.get('/:id', IncomeController.getById);
router.post('/', authorize('admin'), incomeValidation, IncomeController.create);
router.put('/:id', authorize('admin'), IncomeController.update);
router.delete('/:id', authorize('admin'), IncomeController.delete);

module.exports = router;
