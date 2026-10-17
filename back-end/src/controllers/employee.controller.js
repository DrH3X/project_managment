const asyncHandler = require('../utils/asyncHandler');
const employeeService = require('../services/employee.service');

const listEmployees = asyncHandler(async (req, res) => {
  const employees = await employeeService.listEmployees();
  res.status(200).json({ data: employees });
});

module.exports = { listEmployees };
