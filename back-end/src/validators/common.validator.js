const { z } = require('zod');

const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant invalide'),
});

module.exports = { idParamsSchema };
