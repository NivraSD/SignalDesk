const express = require('express');
const router = express.Router();
const stakeholderController = require('../controllers/stakeholderController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Strategy development chat
router.post('/strategy-chat', stakeholderController.strategyChat);

module.exports = router;