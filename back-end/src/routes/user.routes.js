const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createUserBodySchema,
  updateUserBodySchema,
  userListQuerySchema,
} = require('../validators/user.validator');
const { idParamsSchema } = require('../validators/common.validator');
const userController = require('../controllers/user.controller');

// Toutes les routes utilisateurs sont réservées à l'administrateur.
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate(userListQuerySchema, 'query'), userController.listUsers);
router.get('/:id', validate(idParamsSchema, 'params'), userController.getUser);
router.post('/', validate(createUserBodySchema, 'body'), userController.createUser);
router.put(
  '/:id',
  validate(idParamsSchema, 'params'),
  validate(updateUserBodySchema, 'body'),
  userController.updateUser
);
router.delete('/:id', validate(idParamsSchema, 'params'), userController.deleteUser);

module.exports = router;
