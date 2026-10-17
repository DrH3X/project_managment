const User = require('../models/user.model');

/**
 * Couche d'accès aux données : encapsule les requêtes Mongoose.
 * Le mot de passe n'est sélectionné que par findByEmail (connexion).
 */
const userRepository = {
  findAll(filter = {}) {
    return User.find(filter).sort({ createdAt: -1 });
  },

  findById(id) {
    return User.findById(id);
  },

  findByEmail(email) {
    return User.findOne({ email: String(email).toLowerCase() }).select('+motDePasse');
  },

  create(data) {
    return User.create(data);
  },

  findByIdAndUpdate(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  findByIdAndDelete(id) {
    return User.findByIdAndDelete(id);
  },

  async emailExists(email, excludeId = null) {
    const query = { email: String(email).toLowerCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const user = await User.findOne(query).lean().exec();
    return !!user;
  },
};

module.exports = userRepository;
