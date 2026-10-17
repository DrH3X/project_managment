const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/project.service');

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user, req.body);
  res.status(201).json({ project });
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user);
  res.status(200).json({ data: projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.user, req.params.id);
  res.status(200).json({ project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user, req.params.id, req.body);
  res.status(200).json({ project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.user, req.params.id);
  res.status(204).send();
});

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };
