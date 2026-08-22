const express = require('express');
const router = express.Router();
const PeriodController = require('../controllers/periodController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { periodValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', PeriodController.getAll);
router.get('/active', PeriodController.getActive);
router.get('/:id', PeriodController.getById);
router.post('/', authorize('admin'), periodValidation, PeriodController.create);
router.put('/:id', authorize('admin'), PeriodController.update);
router.put('/:id/activate', authorize('admin'), PeriodController.setActive);
router.put('/:id/close', authorize('admin'), PeriodController.closePeriod);
router.delete('/:id', authorize('admin'), PeriodController.delete);

module.exports = router;
