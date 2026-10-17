const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');

let counter = 0;
function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}+${counter}@test.com`;
}

/**
 * Crée un utilisateur directement en base (mot de passe haché).
 * Identifiants par défaut : Password123!, rôle EMPLOYE.
 */
async function createUser(overrides = {}) {
  const data = {
    nom: 'Test',
    prenom: 'User',
    email: uniqueEmail(),
    motDePasse: 'Password123!',
    role: 'EMPLOYE',
    ...overrides,
  };
  const salt = await bcrypt.genSalt(10);
  const motDePasse = await bcrypt.hash(data.motDePasse, salt);
  return User.create({ ...data, motDePasse });
}

module.exports = { createUser, uniqueEmail };
