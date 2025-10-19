#!/usr/bin/env node

const Anthropic = require("@anthropic-ai/sdk");

// Your specific API key - get from environment or pass as argument
const API_KEY = process.env.ANTHROPIC_API_KEY || process.argv[2] || "YOUR_API_KEY_HERE";

console.log("🔧 Testing Claude API Key...");
console.log("📏 Key length:", API_KEY.length);
console.log("🔐 Key prefix:", API_KEY.substring(0, 20) + "...");

async function testClaudeAPI() {
  try {
    const client = new Anthropic({
      apiKey: API_KEY,
    });

    console.log("\n📡 Sending test message to Claude...");
    
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Respond with just 'SUCCESS' if you receive this message."
        }
      ]
    });

    console.log("\n✅ Claude API Response:", response.content[0].text);
    console.log("🎉 API Key is VALID and WORKING!");
    
    return true;
  } catch (error) {
    console.error("\n❌ Claude API Error:", error.message);
    console.error("Status:", error.status);
    
    if (error.status === 401) {
      console.error("🔑 API Key is INVALID or EXPIRED");
    } else if (error.status === 429) {
      console.error("⏳ Rate limit exceeded");
    } else if (error.status === 500) {
      console.error("🔥 Claude API server error");
    }
    
    return false;
  }
}

// Run the test
testClaudeAPI().then(success => {
  if (success) {
    console.log("\n✅ Your Claude API key is configured correctly!");
    console.log("\n📝 Next steps:");
    console.log("1. Set this key in Railway dashboard:");
    console.log("   Variable Name: ANTHROPIC_API_KEY");
    console.log("   Variable Value: " + API_KEY);
    console.log("\n2. Redeploy your Railway service");
    console.log("\n3. Test with: curl https://signaldesk-production.up.railway.app/api/health/detailed");
  } else {
    console.log("\n❌ API key test failed. Please check the key and try again.");
  }
  process.exit(success ? 0 : 1);
});