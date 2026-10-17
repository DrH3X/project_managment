/**
 * Erreur opérationnelle normalisée, convertie par le middleware d'erreurs
 * en réponse JSON au format { error: { code, message, details } }.
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
