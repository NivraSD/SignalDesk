// Content Generation API - Main endpoint that ContentGenerator uses
// This endpoint wraps the ai-generate endpoint for consistency

export default async function handler(req, res) {
  // Import the actual AI generation handler
  const aiGenerateHandler = (await import('./ai-generate.js')).default;
  
  // Pass through to the AI generation handler
  return aiGenerateHandler(req, res);
}