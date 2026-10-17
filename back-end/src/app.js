const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// CORS limité à l'origine du front-end.
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// Parsing JSON avec limite de taille.
app.use(express.json({ limit: '1mb' }));

// Routes API.
app.use('/api', routes);

// Gestion des routes inconnues et des erreurs.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
