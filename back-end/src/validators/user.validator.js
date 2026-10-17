const { z } = require('zod');

const roleEnum = z.enum(['ADMIN', 'CHEF_PROJET', 'EMPLOYE']);

const createUserBodySchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').trim(),
  prenom: z.string().min(1, 'Le prénom est requis').trim(),
  email: z.string().email("Format d'email invalide").trim().toLowerCase(),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: roleEnum,
});

const updateUserBodySchema = z
  .object({
    nom: z.string().min(1).trim().optional(),
    prenom: z.string().min(1).trim().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    motDePasse: z.string().min(6).optional(),
    role: roleEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni',
  });

const userListQuerySchema = z.object({
  role: roleEnum.optional(),
});

module.exports = {
  createUserBodySchema,
  updateUserBodySchema,
  userListQuerySchema,
  roleEnum,
};
