const ApiError = require('../utils/ApiError');

/**
 * Restreint l'accès aux rôles fournis en argument.
 * Doit être placé après le middleware authenticate.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentification requise', []));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Rôle insuffisant', []));
    }
    next();
  };
}

module.exports = { authorize };
