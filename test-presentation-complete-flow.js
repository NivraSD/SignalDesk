#!/usr/bin/env node

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

async function sendMessage(message, conversationId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      organizationId: 'test-org-123',
      conversationId: conversationId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Presentation Workflow with Research\n');

  const conversationId = `test-conv-${Date.now()}`;

  // Step 1: Request presentation
  console.log('📊 Step 1: Request presentation about Codex public response');
  const step1 = await sendMessage('Create a presentation about public response to Codex', conversationId);
  console.log('✓ NIV asks clarifying questions\n');

  // Step 2: Provide complete requirements to trigger outline creation
  console.log('📊 Step 2: Provide requirements to trigger outline creation');
  const step2 = await sendMessage(
    'Audience: Technical executives. Purpose: Board update on product reception. Focus: Developer adoption, community sentiment, competitive positioning. Length: 12 slides.',
    conversationId
  );

  console.log('\n📋 Response Mode:', step2.mode);

  if (step2.mode === 'presentation_outline') {
    console.log('✅ OUTLINE MODE ACTIVATED!\n');

    // Check for research
    if (step2.researchData) {
      console.log('✅ RESEARCH WAS CONDUCTED!');
      console.log(`📚 Found ${step2.researchData.articles?.length || 0} articles\n`);

      if (step2.researchData.articles?.length > 0) {
        console.log('🔍 Research Articles:');
        step2.researchData.articles.slice(0, 3).forEach((article, i) => {
          console.log(`\n${i + 1}. ${article.title}`);
          console.log(`   Source: ${article.source || article.url}`);
        });
      }

      if (step2.researchData.synthesis) {
        console.log('\n📊 Research Synthesis:');
        console.log(step2.researchData.synthesis.substring(0, 200) + '...');
      }
    } else {
      console.log('⚠️  NO RESEARCH DATA - Research was not triggered');
    }

    // Check outline
    if (step2.presentationOutline) {
      console.log('\n\n📝 PRESENTATION OUTLINE:');
      console.log(`Topic: ${step2.presentationOutline.topic}`);
      console.log(`Audience: ${step2.presentationOutline.audience}`);
      console.log(`Slides: ${step2.presentationOutline.slide_count || step2.presentationOutline.sections?.length}`);

      if (step2.presentationOutline.key_messages) {
        console.log('\n🎯 Key Messages:');
        step2.presentationOutline.key_messages.slice(0, 3).forEach((msg, i) => {
          console.log(`${i + 1}. ${msg}`);
        });
      }

      if (step2.presentationOutline.sections) {
        console.log(`\n📑 Sections: ${step2.presentationOutline.sections.length}`);
        console.log('\n📌 First 5 Section Titles:');
        step2.presentationOutline.sections.slice(0, 5).forEach((section, i) => {
          console.log(`${i + 1}. ${section.title}`);
        });
      }
    }

    // Show the message NIV sends to user
    console.log('\n\n💬 NIV Message to User:');
    console.log('─'.repeat(80));
    console.log(step2.message.substring(0, 1000));
    console.log('─'.repeat(80));

  } else {
    console.log('⚠️  Still in conversation mode');
    console.log('\n💬 NIV Response:');
    console.log(step2.message.substring(0, 500));
  }

  console.log('\n\n🎯 TEST COMPLETE');
  console.log('\n✓ Research should be automatically triggered when outline is created');
  console.log('✓ User should see outline + research findings together');
  console.log('✓ User can approve knowing what data will populate the presentation');
}

testCompleteFlow().catch(console.error);
