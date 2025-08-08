/**
 * Unified Claude Response Handler
 * Ensures consistent response format across all Claude-powered endpoints
 */

const claudeService = require("../../config/claude");

/**
 * Standard Claude API call wrapper
 * Ensures consistent error handling and response format
 */
const callClaude = async (prompt) => {
  try {
    console.log("📤 Calling Claude API...");
    const response = await claudeService.sendMessage(prompt);
    console.log("✅ Claude response received, length:", response?.length || 0);
    return response;
  } catch (error) {
    console.error("❌ Claude API error:", error);
    throw new Error(`Claude API error: ${error.message}`);
  }
};

/**
 * Parse JSON response from Claude with fallback
 */
const parseClaudeJSON = (response, fallbackStructure = null) => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.warn("Failed to parse Claude JSON response, using fallback");
    return fallbackStructure || { content: response };
  }
};

/**
 * Standard success response wrapper
 * Ensures frontend always gets expected format
 */
const successResponse = (res, data, additionalFields = {}) => {
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    ...data,
    ...additionalFields
  };
  
  console.log("📨 Sending success response with keys:", Object.keys(response));
  return res.json(response);
};

/**
 * Standard error response wrapper
 */
const errorResponse = (res, error, statusCode = 500) => {
  console.error("Error in Claude endpoint:", error);
  return res.status(statusCode).json({
    success: false,
    error: error.message || "An error occurred",
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware to handle Claude endpoints consistently
 */
const claudeEndpointHandler = (handlerFunction) => {
  return async (req, res) => {
    try {
      await handlerFunction(req, res, {
        callClaude,
        parseClaudeJSON,
        successResponse: (data, additionalFields) => successResponse(res, data, additionalFields),
        errorResponse: (error, statusCode) => errorResponse(res, error, statusCode)
      });
    } catch (error) {
      errorResponse(res, error);
    }
  };
};

module.exports = {
  callClaude,
  parseClaudeJSON,
  successResponse,
  errorResponse,
  claudeEndpointHandler
};