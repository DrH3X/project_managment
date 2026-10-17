const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/env');

/**
 * Point d'entrée du serveur : valide la configuration, connecte MongoDB
 * puis démarre l'API sur le port configuré.
 */
async function start() {
  if (!config.mongodbUri) {
    console.error(
      'Erreur : MONGODB_URI est manquant. Copiez .env.example en .env et configurez-le.'
    );
    process.exit(1);
  }
  if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-insecure-secret') {
    console.error('Erreur : JWT_SECRET doit être défini en production.');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connecté à MongoDB');
    app.listen(config.port, () => {
      console.log(`API en écoute sur le port ${config.port}`);
    });
  } catch (err) {
    console.error('Erreur de connexion à MongoDB :', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
