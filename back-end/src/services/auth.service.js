const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const { serializeUser } = require('../utils/serializers');

const authService = {
  /**
   * Authentifie un utilisateur et renvoie un jeton JWT (validité 8h par défaut).
   */
  async login(email, motDePasse) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect', []);
    }
    const valid = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!valid) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect', []);
    }
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    return { token, user: serializeUser(user) };
  },

  /**
   * Renvoie l'utilisateur authentifié (depuis req.user.id positionné par le middleware).
   */
  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable', []);
    }
    return serializeUser(user);
  },
};

module.exports = authService;
