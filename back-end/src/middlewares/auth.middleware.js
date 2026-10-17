const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Vérifie la présence et la validité d'un jeton Bearer JWT.
 * En cas de succès, place { id, role } dans req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentification requise', []));
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'Jeton invalide ou expiré', []));
  }
}

module.exports = { authenticate };
