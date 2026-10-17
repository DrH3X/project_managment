const Project = require('../models/project.model');

/**
 * Couche d'accès aux données pour les projets.
 */
const projectRepository = {
  findAll(filter = {}) {
    return Project.find(filter).sort({ createdAt: -1 });
  },

  findById(id) {
    return Project.findById(id);
  },

  create(data) {
    return Project.create(data);
  },

  findByIdAndUpdate(id, data) {
    return Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  findByIdAndDelete(id) {
    return Project.findByIdAndDelete(id);
  },

  /**
   * Vérifie l'unicité du nom de façon insensible à la casse (collation strength 2).
   * `excludeId` permet d'exclure le projet courant lors d'une mise à jour.
   */
  async nameExists(nom, excludeId = null) {
    const filter = { nom };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const found = await Project.findOne(filter)
      .collation({ locale: 'fr', strength: 2 })
      .lean()
      .exec();
    return !!found;
  },
};

module.exports = projectRepository;
