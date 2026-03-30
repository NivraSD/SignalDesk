const fetch = require('node-fetch');

async function testLogin() {
  console.log('Testing login endpoint...\n');
  
  try {
    const response = await fetch('https://signaldesk-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@signaldesk.com',
        password: 'Demo1234!'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token ? data.token.substring(0, 20) + '...' : 'No token');
      console.log('User:', data.user?.email);
    } else {
      console.log('❌ Login failed:');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Request failed:');
    console.log(error.message);
  }
}

testLogin();