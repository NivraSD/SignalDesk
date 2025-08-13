/**
 * Helper to ensure Claude returns valid JSON
 * Based on patterns that work in the content generator
 */

const claudeService = require('../../config/claude');

/**
 * Send a message to Claude and ensure JSON response
 * @param {string} prompt - The prompt to send
 * @param {object} fallbackData - Fallback data if parsing fails
 * @returns {object} Parsed JSON response or fallback
 */
async function getClaudeJSON(prompt, fallbackData = {}) {
  try {
    // Add strong JSON enforcement to prompt
    const jsonPrompt = `${prompt}

CRITICAL: You MUST respond with ONLY valid JSON. No explanatory text before or after.
Start your response with { and end with }
Do not include any markdown formatting or code blocks.
Return ONLY the JSON object requested.`;

    const response = await claudeService.sendMessage(jsonPrompt);
    
    // Try to extract JSON from response
    let parsed;
    
    // First try direct parse
    try {
      parsed = JSON.parse(response);
      return parsed;
    } catch (e) {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', e2);
        }
      }
      
      // Try to clean common issues
      let cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '')  // Remove everything before first {
        .replace(/[^}]*$/, '');  // Remove everything after last }
      
      try {
        parsed = JSON.parse(cleaned);
        return parsed;
      } catch (e3) {
        console.error('Failed to parse cleaned response:', e3);
        console.log('Original response:', response.substring(0, 500));
      }
    }
    
    // If all parsing fails, return fallback
    console.warn('Claude did not return valid JSON, using fallback');
    return fallbackData;
    
  } catch (error) {
    console.error('Error getting JSON from Claude:', error);
    return fallbackData;
  }
}

/**
 * Alternative: Convert text response to structured data
 * For when we want Claude's natural language response but need structure
 */
async function textToStructure(prompt, structure) {
  try {
    // Get natural language response
    const textResponse = await claudeService.sendMessage(prompt);
    
    // Ask Claude to structure the response
    const structurePrompt = `Given this text:
"${textResponse}"

Convert it to this JSON structure:
${JSON.stringify(structure, null, 2)}

Return ONLY valid JSON matching the structure above.`;
    
    return await getClaudeJSON(structurePrompt, structure);
    
  } catch (error) {
    console.error('Error converting text to structure:', error);
    return structure;
  }
}

module.exports = {
  getClaudeJSON,
  textToStructure
};