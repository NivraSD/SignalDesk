#!/usr/bin/env node

async function testSimpleImage() {
  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDAyNzMsImV4cCI6MjA0ODM3NjI3M30.NiXE4TQD1qGIuHxLDdS6j8Ojy5kUbR89n1rNfj58-fs';

  console.log('Testing direct image generation...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        prompt: "Modern tech office with AI visualizations",
        type: 'image',
        model: 'imagen-3',
        aspectRatio: '16:9',
        organization: 'OpenAI'
      })
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response success:', data.success);

    if (data.imageUrl || data.url || data.images?.[0]?.url) {
      const imageUrl = data.imageUrl || data.url || data.images?.[0]?.url;
      console.log('\n✅ Image generated successfully');
      console.log('URL type:', imageUrl.startsWith('data:image') ? 'Base64' : 'URL');
      console.log('URL length:', imageUrl.length);
      console.log('First 100 chars:', imageUrl.substring(0, 100));
    } else {
      console.log('\n❌ No image URL in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleImage();