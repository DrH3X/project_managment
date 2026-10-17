const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.query.role);
  res.status(200).json({ data: users });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.status(200).json({ user });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id);
  res.status(204).send();
});

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
