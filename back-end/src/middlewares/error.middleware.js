const ApiError = require('../utils/ApiError');

/**
 * Convertit n'importe quelle erreur en réponse JSON normalisée :
 * { error: { code, message, details } }.
 */
function buildError(err) {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      body: { error: { code: err.code, message: err.message, details: err.details } },
    };
  }

  // Erreur de validation Zod (sécurité, si une erreur brute remonte ici).
  if (err.name === 'ZodError') {
    return {
      statusCode: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Données invalides',
          details: (err.issues || []).map((i) => ({
            field: (i.path || []).join('.'),
            message: i.message,
          })),
        },
      },
    };
  }

  // Doublon d'index unique (email).
  if (err.code === 11000) {
    return {
      statusCode: 409,
      body: { error: { code: 'DUPLICATE_KEY', message: 'Ressource déjà existante', details: [] } },
    };
  }

  // Erreur de validation Mongoose.
  if (err.name === 'ValidationError') {
    return {
      statusCode: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Données invalides',
          details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
        },
      },
    };
  }

  // Identifiant ou valeur cast invalide.
  if (err.name === 'CastError') {
    return {
      statusCode: 400,
      body: { error: { code: 'INVALID_ID', message: 'Identifiant ou valeur invalide', details: [] } },
    };
  }

  // Erreurs JWT.
  if (err.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      body: { error: { code: 'INVALID_TOKEN', message: 'Jeton invalide', details: [] } },
    };
  }
  if (err.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      body: { error: { code: 'TOKEN_EXPIRED', message: 'Jeton expiré', details: [] } },
    };
  }

  // Erreur inattendue.
  return {
    statusCode: 500,
    body: { error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur', details: [] } },
  };
}

function errorHandler(err, req, res, next) {
  const { statusCode, body } = buildError(err);
  if (statusCode >= 500) {
    console.error(err);
  }
  res.status(statusCode).json(body);
}

/**
 * Toute route non reconnue renvoie un 404 normalisé.
 */
function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Ressource introuvable', []));
}

module.exports = { errorHandler, notFoundHandler };
