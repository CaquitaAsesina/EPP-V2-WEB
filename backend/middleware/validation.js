const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const loginValidation = [
  body('username').notEmpty().withMessage('El usuario es obligatorio'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  validate
];

const profileUpdateValidation = [
  body('username').optional({ checkFalsy: true }).matches(/^[a-zA-Z0-9._-]{3,100}$/).withMessage('Usuario inválido: mínimo 3 caracteres (letras, números, . _ -)'),
  body('new_password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  body('current_password').optional({ checkFalsy: true }),
  validate
];

const periodValidation = [
  body('name').notEmpty().withMessage('El nombre del período es obligatorio'),
  body('start_date').isISO8601().withMessage('La fecha de inicio es obligatoria'),
  validate
];

const eppTypeValidation = [
  body('name').notEmpty().withMessage('El nombre del tipo de EPP es obligatorio'),
  validate
];

const sizeValidation = [
  body('name').notEmpty().withMessage('El nombre de la talla es obligatorio'),
  validate
];

const workerValidation = [
  body('full_name').notEmpty().withMessage('El nombre completo es obligatorio'),
  body('dni').notEmpty().withMessage('El DNI es obligatorio').isLength({ min: 7, max: 15 }).withMessage('El DNI debe tener entre 7 y 15 caracteres'),
  validate
];

const stockInitialValidation = [
  body('period_id').isInt().withMessage('El período es obligatorio'),
  body('epp_type_id').isInt().withMessage('El tipo de EPP es obligatorio'),
  body('size_id').isInt().withMessage('La talla es obligatoria'),
  body('quantity').isInt({ min: 0 }).withMessage('La cantidad debe ser un entero no negativo'),
  validate
];

const incomeValidation = [
  body('period_id').isInt().withMessage('El período es obligatorio'),
  body('epp_type_id').isInt().withMessage('El tipo de EPP es obligatorio'),
  body('size_id').isInt().withMessage('La talla es obligatoria'),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
  body('reception_date').isISO8601().withMessage('La fecha de recepción es obligatoria'),
  validate
];

const deliveryValidation = [
  body('period_id').isInt().withMessage('El período es obligatorio'),
  body('epp_type_id').isInt().withMessage('El tipo de EPP es obligatorio'),
  body('size_id').isInt().withMessage('La talla es obligatoria'),
  body('worker_id').isInt().withMessage('El trabajador es obligatorio'),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
  validate
];

const returnValidation = [
  body('period_id').isInt().withMessage('El período es obligatorio'),
  body('epp_type_id').isInt().withMessage('El tipo de EPP es obligatorio'),
  body('size_id').isInt().withMessage('La talla es obligatoria'),
  body('worker_id').isInt().withMessage('El trabajador es obligatorio'),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
  validate
];

const laundryValidation = [
  body('period_id').isInt().withMessage('El período es obligatorio'),
  body('epp_type_id').isInt().withMessage('El tipo de EPP es obligatorio'),
  body('size_id').isInt().withMessage('La talla es obligatoria'),
  body('quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
  body('status').isIn(['para_lavar', 'mandado_lavar', 'lavado']).withMessage('Estado de lavado inválido'),
  validate
];

const physicalInventoryValidation = [
  body('period_id').isInt().withMessage('El período es obligatorio'),
  body('epp_type_id').isInt().withMessage('El tipo de EPP es obligatorio'),
  body('size_id').isInt().withMessage('La talla es obligatoria'),
  body('quantity').isInt({ min: 0 }).withMessage('La cantidad física debe ser un entero no negativo'),
  body('inventory_date').isISO8601().withMessage('La fecha de inventario es obligatoria'),
  validate
];

const userValidation = [
  body('username').notEmpty().withMessage('El usuario es obligatorio'),
  body('full_name').notEmpty().withMessage('El nombre completo es obligatorio'),
  body('role_id').isInt().withMessage('El rol es obligatorio'),
  validate
];

module.exports = {
  validate,
  loginValidation,
  profileUpdateValidation,
  periodValidation,
  eppTypeValidation,
  sizeValidation,
  workerValidation,
  stockInitialValidation,
  incomeValidation,
  deliveryValidation,
  returnValidation,
  laundryValidation,
  physicalInventoryValidation,
  userValidation
};
