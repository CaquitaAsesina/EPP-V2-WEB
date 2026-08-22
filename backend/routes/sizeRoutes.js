const express = require('express');
const router = express.Router();
const SizeController = require('../controllers/sizeController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const { sizeValidation } = require('../middleware/validation');

router.use(authenticate);
router.get('/', SizeController.getAll);
router.get('/active', SizeController.getActive);
router.get('/by-epp-type/:eppTypeId', SizeController.getByEppType);
router.get('/:id', SizeController.getById);
router.post('/', authorize('admin'), sizeValidation, SizeController.create);
router.put('/:id', authorize('admin'), SizeController.update);
router.delete('/:id', authorize('admin'), SizeController.delete);
router.post('/associate', authorize('admin'), SizeController.associateEppType);
router.post('/dissociate', authorize('admin'), SizeController.dissociateEppType);

module.exports = router;
