require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/env');
const User = require('../src/models/user.model');

/**
 * Données de départ : un administrateur, un chef de projet et deux employés.
 * Les mots de passe sont volontairement documentés pour les tests fonctionnels.
 */
const seedUsers = [
  { nom: 'Admin', prenom: 'Système', email: 'admin@plateforme.local', motDePasse: 'Admin123!', role: 'ADMIN' },
  { nom: 'Dupont', prenom: 'Marie', email: 'chef@plateforme.local', motDePasse: 'Chef123!', role: 'CHEF_PROJET' },
  { nom: 'Martin', prenom: 'Paul', email: 'employe1@plateforme.local', motDePasse: 'Employe123!', role: 'EMPLOYE' },
  { nom: 'Bernard', prenom: 'Sophie', email: 'employe2@plateforme.local', motDePasse: 'Employe123!', role: 'EMPLOYE' },
];

async function run() {
  if (!config.mongodbUri) {
    console.error(
      'Erreur : MONGODB_URI est manquant. Copiez .env.example en .env et configurez-le.'
    );
    process.exit(1);
  }

  await mongoose.connect(config.mongodbUri);
  console.log('Connecté à MongoDB');

  await User.deleteMany({});
  for (const u of seedUsers) {
    const salt = await bcrypt.genSalt(10);
    const motDePasse = await bcrypt.hash(u.motDePasse, salt);
    await User.create({ ...u, motDePasse });
  }

  console.log('Données de départ insérées :');
  seedUsers.forEach((u) =>
    console.log(`  - ${u.role.padEnd(11)} ${u.email}  /  ${u.motDePasse}`)
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Erreur lors du seed :', err.message);
  process.exit(1);
});
