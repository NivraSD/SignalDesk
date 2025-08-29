// Claude Service Initialization Helper
// Ensures Claude is properly initialized with the API key

const initializeClaude = () => {
  console.log('🔧 Claude Initialization Check');
  console.log('================================');
  
  // Check for API key in multiple locations
  const apiKey = process.env.ANTHROPIC_API_KEY || 
                 process.env.CLAUDE_API_KEY || 
                 process.env.CLAUDE_KEY;
  
  if (!apiKey) {
    console.error('❌ No Claude API key found in environment variables!');
    console.error('Please set ANTHROPIC_API_KEY in Railway Dashboard');
    
    // Set a flag that routes can check
    global.CLAUDE_INITIALIZED = false;
    return false;
  }
  
  // Check if it's a placeholder
  if (apiKey === 'YOUR_NEW_CLAUDE_API_KEY_HERE' || 
      apiKey === 'YOUR_API_KEY_HERE' ||
      apiKey.length < 20) {
    console.error('❌ Claude API key appears to be a placeholder!');
    console.error('Please set a valid ANTHROPIC_API_KEY in Railway Dashboard');
    global.CLAUDE_INITIALIZED = false;
    return false;
  }
  
  // Valid key found
  console.log('✅ Claude API key found');
  console.log(`   Length: ${apiKey.length} characters`);
  console.log(`   Prefix: ${apiKey.substring(0, 10)}...`);
  console.log(`   Model: ${process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'}`);
  
  // Set global flag
  global.CLAUDE_INITIALIZED = true;
  global.CLAUDE_API_KEY = apiKey;
  
  // Ensure environment variable is set (for child processes)
  if (!process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = apiKey;
    console.log('✅ Set ANTHROPIC_API_KEY environment variable');
  }
  
  return true;
};

// Run initialization on module load
const isInitialized = initializeClaude();

module.exports = {
  initializeClaude,
  isInitialized,
  checkClaude: () => global.CLAUDE_INITIALIZED,
  getApiKey: () => global.CLAUDE_API_KEY
};