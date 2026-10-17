const ApiError = require('../utils/ApiError');

/**
 * Valide req[location] (body | query | params) avec un schéma Zod.
 * En cas d'échec, lève une ApiError 400 VALIDATION_ERROR avec le détail.
 * En cas de succès, remplace req[location] par les données validées/transformées.
 */
function validate(schema, location = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[location]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: (i.path || []).join('.'),
        message: i.message,
      }));
      return next(new ApiError(400, 'VALIDATION_ERROR', 'Données invalides', details));
    }
    req[location] = result.data;
    next();
  };
}

module.exports = { validate };
