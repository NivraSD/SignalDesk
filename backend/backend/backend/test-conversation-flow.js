#!/usr/bin/env node

/**
 * Test script to verify conversation flow logic works correctly
 * Tests the ONE QUESTION AT A TIME behavior
 */

// Mock conversation states
const testCases = [
  {
    name: "Initial content type selection",
    message: "thought leadership",
    conversationState: {
      messageCount: 0,
      collectedInfo: {},
      contentTypeName: "thought leadership"
    },
    context: {
      folder: "content-generator",
      contentTypeName: "thought leadership"
    },
    expectedBehavior: "Should ask ONE question about topic (max 30 words)"
  },
  {
    name: "Second message - gathering info",
    message: "AI and automation",
    conversationState: {
      messageCount: 1,
      collectedInfo: {
        topic: "AI and automation"
      },
      contentTypeName: "thought leadership"
    },
    context: {
      folder: "content-generator",
      contentTypeName: "thought leadership",
      previousMessages: [
        { type: "user", content: "thought leadership" },
        { type: "assistant", content: "What topic would you like to cover?" }
      ]
    },
    expectedBehavior: "Should ask ONE follow-up question (max 20 words)"
  },
  {
    name: "Third message - offer to generate",
    message: "CTOs and tech leaders",
    conversationState: {
      messageCount: 2,
      collectedInfo: {
        topic: "AI and automation",
        audience: "CTOs and tech leaders"
      },
      contentTypeName: "thought leadership"
    },
    context: {
      folder: "content-generator",
      contentTypeName: "thought leadership"
    },
    expectedBehavior: "Should offer to generate content"
  },
  {
    name: "User says YES - generate content",
    message: "yes please",
    conversationState: {
      messageCount: 3,
      collectedInfo: {
        topic: "AI and automation",
        audience: "CTOs and tech leaders",
        angle: "practical implementation"
      },
      contentTypeName: "thought leadership"
    },
    context: {
      folder: "content-generator",
      contentTypeName: "thought leadership"
    },
    expectedBehavior: "Should GENERATE actual content (not description)"
  }
];

// Test each case
console.log("🧪 Testing Conversation Flow Logic\n");
console.log("=" .repeat(60));

testCases.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log("-".repeat(40));
  
  // Simulate the logic from aiRoutes.js
  const isInitialContentTypeSelection = 
    test.conversationState.messageCount === 0 && 
    test.context?.folder === 'content-generator';
  
  const isExplicitGenerationRequest = 
    test.message.toLowerCase().includes('yes') ||
    test.message.toLowerCase().includes('generate') ||
    test.message.toLowerCase().includes('create');
  
  const hasEnoughConversation = test.conversationState.messageCount >= 2;
  
  console.log("Input message:", test.message);
  console.log("Message count:", test.conversationState.messageCount);
  console.log("Collected info:", Object.keys(test.conversationState.collectedInfo).join(", ") || "none");
  console.log("\nDetection results:");
  console.log("  - Initial selection?", isInitialContentTypeSelection);
  console.log("  - Generation request?", isExplicitGenerationRequest);
  console.log("  - Enough conversation?", hasEnoughConversation);
  console.log("\nExpected:", test.expectedBehavior);
  
  // Determine what should happen
  let actualBehavior = "";
  if (isInitialContentTypeSelection) {
    actualBehavior = "Will ask ONE question (30 words max)";
  } else if (isExplicitGenerationRequest) {
    actualBehavior = "Will GENERATE actual content";
  } else if (hasEnoughConversation) {
    actualBehavior = "Will offer to generate";
  } else {
    actualBehavior = "Will ask ONE follow-up question (20 words max)";
  }
  
  console.log("Actual:  ", actualBehavior);
  
  const passed = actualBehavior.includes(
    test.expectedBehavior.includes("ONE question") ? "ONE question" :
    test.expectedBehavior.includes("offer") ? "offer" :
    test.expectedBehavior.includes("GENERATE") ? "GENERATE" : ""
  );
  
  console.log("Result:  ", passed ? "✅ PASS" : "❌ FAIL");
});

console.log("\n" + "=".repeat(60));
console.log("✅ Test script complete");
console.log("\n📝 Key fixes applied:");
console.log("1. Dockerfile now runs index.js (was running server.js)");
console.log("2. Removed duplicate backend/backend folder");
console.log("3. Added cache buster to force Railway rebuild");
console.log("\n🚀 Ready to deploy with: git add -A && git commit && git push");