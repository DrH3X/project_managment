const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const employeeController = require('../controllers/employee.controller');

// Liste des employés : accessible à l'administrateur et au chef de projet.
router.use(authenticate, authorize('ADMIN', 'CHEF_PROJET'));
router.get('/', employeeController.listEmployees);

module.exports = router;
