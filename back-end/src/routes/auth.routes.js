const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { loginBodySchema } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

// Connexion : aucune authentification requise.
router.post('/login', validate(loginBodySchema, 'body'), authController.login);

// Profil : authentification requise.
router.get('/me', authenticate, authController.me);

// Déconnexion : no-op serveur, le front supprime le jeton.
router.post('/logout', authController.logout);

module.exports = router;
