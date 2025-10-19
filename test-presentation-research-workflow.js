#!/usr/bin/env node

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

async function testPresentationWorkflow() {
  console.log('🧪 Testing Presentation Research Workflow\n');

  const conversationId = `test-conv-${Date.now()}`;

  // Step 1: Request presentation about public response
  console.log('📊 Step 1: Requesting presentation about Codex public response...');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Create a presentation about public response to Codex',
      organizationId: 'test-org-123',
      conversationId: conversationId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error:', response.status, errorText);
    return;
  }

  const data = await response.json();

  console.log('\n📋 Response Mode:', data.mode);
  console.log('\n💬 NIV Response:\n');
  console.log(data.message);

  // Check if research was conducted
  if (data.researchData) {
    console.log('\n\n✅ RESEARCH WAS CONDUCTED!');
    console.log(`📚 Found ${data.researchData.articles?.length || 0} articles`);

    if (data.researchData.articles?.length > 0) {
      console.log('\n🔍 Research Articles:');
      data.researchData.articles.slice(0, 3).forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`);
        console.log(`   Source: ${article.source || article.url}`);
        if (article.summary) {
          console.log(`   Summary: ${article.summary.substring(0, 100)}...`);
        }
      });
    }

    if (data.researchData.synthesis) {
      console.log('\n📊 Research Synthesis:');
      console.log(data.researchData.synthesis);
    }
  } else {
    console.log('\n\n⚠️  NO RESEARCH DATA FOUND');
    console.log('This means research was not triggered by the workflow.');
  }

  // Check if outline was created
  if (data.presentationOutline) {
    console.log('\n\n📝 PRESENTATION OUTLINE CREATED!');
    console.log(`Topic: ${data.presentationOutline.topic}`);
    console.log(`Audience: ${data.presentationOutline.audience}`);
    console.log(`Purpose: ${data.presentationOutline.purpose}`);
    console.log(`Slides: ${data.presentationOutline.slide_count || data.presentationOutline.sections?.length}`);

    if (data.presentationOutline.sections) {
      console.log(`\n📑 Section Count: ${data.presentationOutline.sections.length}`);
      console.log('\n📌 First 3 Sections:');
      data.presentationOutline.sections.slice(0, 3).forEach((section, i) => {
        console.log(`\n${i + 1}. ${section.title}`);
        console.log(`   Visual: ${section.visual_suggestion}`);
        console.log(`   Talking Points: ${section.talking_points?.length || 0}`);
      });
    }
  }

  console.log('\n\n🎯 WORKFLOW TEST COMPLETE');
  console.log('\nExpected behavior:');
  console.log('✓ NIV asks clarifying questions OR creates outline directly');
  console.log('✓ Backend extracts research topics from outline sections');
  console.log('✓ Backend conducts research automatically');
  console.log('✓ Response includes both outline AND research data');
  console.log('✓ User can see what factual information will populate presentation');
}

testPresentationWorkflow().catch(console.error);
