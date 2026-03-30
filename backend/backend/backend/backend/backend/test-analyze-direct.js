require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// Import the controller directly
const monitoringController = require('./src/controllers/monitoringController');

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1 }; // Mock user
  next();
};

// Set up route
app.post('/test', mockAuth, monitoringController.analyzeSentiment);

// Start server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('');
  console.log('Test with curl:');
  console.log(`curl -X POST http://localhost:${PORT}/test \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "This is a test of sentiment analysis",
    "source": "test",
    "sentimentContext": {
      "positiveScenarios": "test success, working properly",
      "negativeScenarios": "test failure, not working"
    }
  }'`);
});