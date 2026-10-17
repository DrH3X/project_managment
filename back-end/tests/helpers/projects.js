const Project = require('../../src/models/project.model');

let counter = 0;
function uniqueName(prefix = 'Projet') {
  counter += 1;
  return `${prefix} ${counter}`;
}

/**
 * Crée un projet directement en base (pour les tests).
 * Par défaut : statut NON_COMMENCE, dates 2025-01-01 → 2025-12-31.
 * `chefProjet` est obligatoire (passé dans overrides).
 */
async function createProject(overrides = {}) {
  const { nom, description, dateDebut, dateFin, chefProjet } = overrides;
  return Project.create({
    nom: nom ?? uniqueName(),
    description: description ?? '',
    dateDebut: dateDebut ?? new Date('2025-01-01'),
    dateFin: dateFin ?? new Date('2025-12-31'),
    statut: 'NON_COMMENCE',
    chefProjet,
  });
}

module.exports = { createProject, uniqueName };
