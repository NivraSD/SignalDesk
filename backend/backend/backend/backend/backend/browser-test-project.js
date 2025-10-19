// PASTE THIS IN YOUR BROWSER CONSOLE ON THE FRONTEND SITE
// This will test project creation directly

async function testProjectCreation() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No token found! Please login first.');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 50) + '...');
  
  const projectData = {
    name: 'Test Project ' + new Date().toLocaleTimeString(),
    description: 'Created from browser console test'
  };
  
  console.log('📤 Sending project data:', projectData);
  
  try {
    const response = await fetch('https://signaldesk-production.up.railway.app/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.id) {
      console.log('✅ SUCCESS! Project created:', data);
      console.log('Project ID:', data.id);
      console.log('Project Name:', data.name);
      return data;
    } else {
      console.error('❌ Failed to create project:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Run the test
console.log('🚀 Testing project creation...');
testProjectCreation().then(result => {
  if (result) {
    console.log('🎉 Test complete! Project created successfully.');
    console.log('Now try creating a project through the UI - it should work!');
  } else {
    console.log('❌ Test failed. Check the errors above.');
  }
});