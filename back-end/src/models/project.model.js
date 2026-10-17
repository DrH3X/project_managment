const mongoose = require('mongoose');

const PROJECT_STATUSES = ['NON_COMMENCE', 'EN_COURS', 'TERMINE'];

const projectSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du projet est requis'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    dateDebut: {
      type: Date,
      required: [true, 'La date de début est requise'],
    },
    dateFin: {
      type: Date,
      required: [true, 'La date de fin est requise'],
    },
    statut: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'NON_COMMENCE',
    },
    // Chef de projet propriétaire (utilisateur de rôle CHEF_PROJET).
    chefProjet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index unique sur le nom, insensible à la casse (collation strength 2 =
// insensible à la casse, sensible aux accents).
projectSchema.index(
  { nom: 1 },
  { unique: true, collation: { locale: 'fr', strength: 2 } }
);
// Index sur le chef de projet (consultation par propriétaire).
projectSchema.index({ chefProjet: 1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
