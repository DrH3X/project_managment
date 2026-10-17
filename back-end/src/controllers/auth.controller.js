const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body.email, req.body.motDePasse);
  res.status(200).json({ token, user });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  res.status(200).json({ user });
});

/**
 * Déconnexion : le jeton est purement côté client, le serveur renvoie 204
 * et le front-end supprime le jeton localement.
 */
const logout = (req, res) => {
  res.status(204).send();
};

module.exports = { login, me, logout };
