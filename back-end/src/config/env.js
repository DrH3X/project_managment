require('dotenv').config();

/**
 * Configuration centralisée chargée depuis les variables d'environnement.
 * Les valeurs requises (MONGODB_URI, JWT_SECRET) sont vérifiées au démarrage
 * dans src/server.js ; ici on reste tolérant pour permettre les tests.
 */
module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
};
