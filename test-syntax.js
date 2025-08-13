const pool = require('../config/db');
const ClaudeService = require('../../config/claude');

const cleanJsonResponse = (response) => {
  return response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
};

const getDefaultCrisisTeam = () => [];
const getUniversalScenarios = () => [];

// Paste just the getFallbackData function here
const getFallbackData = (industry) => ({
  test: "test"
});

console.log("File loaded successfully");
