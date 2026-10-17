const mongoose = require('mongoose');

const ROLES = ['ADMIN', 'CHEF_PROJET', 'EMPLOYE'];

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'email invalide"],
    },
    motDePasse: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      select: false, // Jamais renvoyé par défaut par les requêtes Mongoose.
    },
    role: {
      type: String,
      required: true,
      enum: ROLES,
      default: 'EMPLOYE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
