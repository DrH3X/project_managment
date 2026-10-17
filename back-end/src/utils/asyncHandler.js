/**
 * Enveloppe les contrôleurs asynchrones pour transmettre les erreurs
 * au middleware de gestion des erreurs via next(err).
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
