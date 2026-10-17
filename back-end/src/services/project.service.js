const projectRepository = require('../repositories/project.repository');
const ApiError = require('../utils/ApiError');

function serializeProject(p) {
  if (!p) return null;
  return {
    id: p._id.toString(),
    nom: p.nom,
    description: p.description ?? '',
    dateDebut: p.dateDebut ? p.dateDebut.toISOString() : null,
    dateFin: p.dateFin ? p.dateFin.toISOString() : null,
    statut: p.statut,
    chefProjet: p.chefProjet ? p.chefProjet.toString() : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toValidDate(value) {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const projectService = {
  async createProject(user, data) {
    // Seul un chef de projet peut créer un projet.
    if (user.role !== 'CHEF_PROJET') {
      throw new ApiError(403, 'FORBIDDEN', 'Seul un chef de projet peut créer un projet', []);
    }

    const debut = toValidDate(data.dateDebut);
    const fin = toValidDate(data.dateFin);
    if (!debut || !fin) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Dates invalides', []);
    }
    // Règle métier : date de fin >= date de début (422).
    if (fin < debut) {
      throw new ApiError(
        422,
        'DATE_RANGE_INVALID',
        'La date de fin doit être postérieure ou égale à la date de début',
        []
      );
    }

    // Unicité du nom, insensible à la casse (409 PROJECT_NAME_TAKEN).
    const exists = await projectRepository.nameExists(data.nom);
    if (exists) {
      throw new ApiError(409, 'PROJECT_NAME_TAKEN', 'Ce nom de projet est déjà utilisé', []);
    }

    const project = await projectRepository.create({
      nom: data.nom,
      description: data.description ?? '',
      dateDebut: debut,
      dateFin: fin,
      statut: 'NON_COMMENCE', // Statut initial forcé, non modifiable par l'API.
      chefProjet: user.id,
    });
    return serializeProject(project);
  },

  async listProjects(user) {
    let projects;
    if (user.role === 'ADMIN') {
      projects = await projectRepository.findAll();
    } else if (user.role === 'CHEF_PROJET') {
      projects = await projectRepository.findAll({ chefProjet: user.id });
    } else {
      // EMPLOYE : projets auxquels il participe (via tâches).
      // Complété au sprint 2 : liste vide tant que les tâches n'existent pas.
      projects = [];
    }
    return projects.map(serializeProject);
  },

  async getProject(user, id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projet introuvable', []);
    }
    this._checkVisibility(user, project);
    return serializeProject(project);
  },

  async updateProject(user, id, data) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projet introuvable', []);
    }
    this._checkOwner(user, project);

    const update = {};

    if (data.nom !== undefined && data.nom !== project.nom) {
      const exists = await projectRepository.nameExists(data.nom, id);
      if (exists) {
        throw new ApiError(409, 'PROJECT_NAME_TAKEN', 'Ce nom de projet est déjà utilisé', []);
      }
      update.nom = data.nom;
    }

    if (data.description !== undefined) {
      update.description = data.description;
    }

    // Revalidation de la cohérence des dates si l'une d'elles change.
    const debut = data.dateDebut !== undefined ? toValidDate(data.dateDebut) : project.dateDebut;
    const fin = data.dateFin !== undefined ? toValidDate(data.dateFin) : project.dateFin;
    if (!debut || !fin) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Dates invalides', []);
    }
    if (fin < debut) {
      throw new ApiError(
        422,
        'DATE_RANGE_INVALID',
        'La date de fin doit être postérieure ou égale à la date de début',
        []
      );
    }
    if (data.dateDebut !== undefined) update.dateDebut = debut;
    if (data.dateFin !== undefined) update.dateFin = fin;

    // Le statut n'est jamais modifié par cette route.
    const updated = await projectRepository.findByIdAndUpdate(id, update);
    return serializeProject(updated);
  },

  async deleteProject(user, id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Projet introuvable', []);
    }
    this._checkOwner(user, project);
    // NOTE (sprint 2) : blocage de suppression si le projet possède des tâches
    // (409 PROJECT_HAS_TASKS).
    await projectRepository.findByIdAndDelete(id);
  },

  /**
   * Visibilité en consultation :
   * - ADMIN : tous les projets.
   * - CHEF_PROJET : ses projets seulement.
   * - EMPLOYE : projets auxquels il participe (via tâches, sprint 2).
   */
  _checkVisibility(user, project) {
    if (user.role === 'ADMIN') return;
    if (user.role === 'CHEF_PROJET') {
      if (String(project.chefProjet) !== String(user.id)) {
        throw new ApiError(403, 'FORBIDDEN', 'Accès non autorisé à ce projet', []);
      }
      return;
    }
    // EMPLOYE : aucune visibilité au sprint 1 (complété au sprint 2).
    throw new ApiError(403, 'FORBIDDEN', 'Accès non autorisé à ce projet', []);
  },

  /**
   * Modification / suppression : réservées au chef de projet propriétaire.
   * ADMIN consulte seulement.
   */
  _checkOwner(user, project) {
    if (user.role !== 'CHEF_PROJET' || String(project.chefProjet) !== String(user.id)) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Seul le chef de projet propriétaire peut modifier ou supprimer ce projet',
        []
      );
    }
  },
};

module.exports = projectService;
module.exports.serializeProject = serializeProject;
