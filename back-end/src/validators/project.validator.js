const { z } = require('zod');

/**
 * Création de projet : le statut est volontairement absent du schéma.
 * Il est forcé à NON_COMMENCE côté service et ne peut pas être modifié par l'API.
 */
const createProjectBodySchema = z.object({
  nom: z.string().min(1, 'Le nom du projet est requis').trim(),
  description: z.string().trim().default(''),
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
});

const updateProjectBodySchema = z
  .object({
    nom: z.string().min(1).trim().optional(),
    description: z.string().trim().optional(),
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni',
  });

module.exports = {
  createProjectBodySchema,
  updateProjectBodySchema,
};
