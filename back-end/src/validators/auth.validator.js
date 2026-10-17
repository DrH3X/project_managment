const { z } = require('zod');

const loginBodySchema = z.object({
  email: z.string().email("Format d'email invalide"),
  motDePasse: z.string().min(1, 'Le mot de passe est requis'),
});

module.exports = { loginBodySchema };
