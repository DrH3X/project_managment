const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createProjectBodySchema,
  updateProjectBodySchema,
} = require('../validators/project.validator');
const { idParamsSchema } = require('../validators/common.validator');
const projectController = require('../controllers/project.controller');

// Toutes les routes projets nécessitent une authentification.
// Le contrôle d'accès par rôle (création CHEF_PROJET, visibilité, propriétaire)
// est appliqué dans le service.
router.use(authenticate);

router.post('/', validate(createProjectBodySchema, 'body'), projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:id', validate(idParamsSchema, 'params'), projectController.getProject);
router.put(
  '/:id',
  validate(idParamsSchema, 'params'),
  validate(updateProjectBodySchema, 'body'),
  projectController.updateProject
);
router.delete('/:id', validate(idParamsSchema, 'params'), projectController.deleteProject);

module.exports = router;
