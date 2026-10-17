const userRepository = require('../repositories/user.repository');
const { serializeUser } = require('../utils/serializers');

/**
 * Un employé est un utilisateur de rôle EMPLOYE.
 * Cette liste servira à l'affectation des tâches (sprint 2).
 */
const employeeService = {
  async listEmployees() {
    const users = await userRepository.findAll({ role: 'EMPLOYE' });
    return users.map(serializeUser);
  },
};

module.exports = employeeService;
