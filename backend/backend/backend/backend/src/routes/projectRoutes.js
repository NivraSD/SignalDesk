// backend/routes/projectRoutes.js
const express = require('express');
const router = express.Router();

// Mock project data
let mockProjects = [
  {
    id: 1,
    name: 'Product Launch Campaign',
    status: 'active',
    createdAt: new Date('2025-01-15'),
    lastModified: new Date('2025-01-20')
  },
  {
    id: 2,
    name: 'Q1 Media Relations',
    status: 'planning',
    createdAt: new Date('2025-01-10'),
    lastModified: new Date('2025-01-18')
  }
];

// Get all projects
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      projects: mockProjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = mockProjects.find(p => p.id === parseInt(req.params.id));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const newProject = {
      id: mockProjects.length + 1,
      name,
      description,
      status: 'planning',
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    mockProjects.push(newProject);
    
    res.json({
      success: true,
      project: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectIndex = mockProjects.findIndex(p => p.id === parseInt(req.params.id));
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...req.body,
      lastModified: new Date()
    };
    
    res.json({
      success: true,
      project: mockProjects[projectIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectIndex = mockProjects.findIndex(p => p.id === parseInt(req.params.id));
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    mockProjects.splice(projectIndex, 1);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

module.exports = router;
