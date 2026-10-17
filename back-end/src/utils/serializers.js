/**
 * Sérialise un document utilisateur en objet JSON plat.
 * L'identifiant ObjectId est renvoyé sous forme de chaîne (champ `id`),
 * et le mot de passe n'est jamais inclus.
 */
function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = { serializeUser };
