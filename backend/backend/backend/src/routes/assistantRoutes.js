// backend/routes/assistantRoutes.js
const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

// Chat with AI Assistant
router.post('/chat', assistantController.chat);

// Get chat history
router.get('/history/:projectId?', assistantController.getHistory);

// Clear chat history
router.delete('/history/:projectId?', assistantController.clearHistory);

module.exports = router;
