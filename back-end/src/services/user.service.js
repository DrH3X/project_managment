const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const { serializeUser } = require('../utils/serializers');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

const userService = {
  async listUsers(role) {
    const filter = role ? { role } : {};
    const users = await userRepository.findAll(filter);
    return users.map(serializeUser);
  },

  async getUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable', []);
    }
    return serializeUser(user);
  },

  async createUser(data) {
    const exists = await userRepository.emailExists(data.email);
    if (exists) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Cet email est déjà utilisé', []);
    }
    const motDePasse = await hashPassword(data.motDePasse);
    const user = await userRepository.create({ ...data, motDePasse });
    return serializeUser(user);
  },

  async updateUser(id, data) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable', []);
    }
    if (data.email && data.email !== user.email) {
      const exists = await userRepository.emailExists(data.email, id);
      if (exists) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Cet email est déjà utilisé', []);
      }
    }
    const update = { ...data };
    if (data.motDePasse) {
      update.motDePasse = await hashPassword(data.motDePasse);
    }
    const updated = await userRepository.findByIdAndUpdate(id, update);
    return serializeUser(updated);
  },

  async deleteUser(id, currentUserId) {
    // Règle métier : un administrateur ne peut pas supprimer son propre compte.
    // (Suppression interdite -> 409, conformément au contrat d'API.)
    if (String(id) === String(currentUserId)) {
      throw new ApiError(
        409,
        'CANNOT_DELETE_SELF',
        'Vous ne pouvez pas supprimer votre propre compte',
        []
      );
    }
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable', []);
    }
    // NOTE (sprint 2) : un employé ne pourra pas être supprimé s'il possède
    // encore des tâches en cours (règle EMPLOYEE_HAS_ACTIVE_TASKS).
    await userRepository.findByIdAndDelete(id);
  },
};

module.exports = userService;
