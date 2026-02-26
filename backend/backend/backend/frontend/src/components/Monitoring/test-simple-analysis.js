// Run this in browser console to test simple analysis
(async () => {
  const token = localStorage.getItem('token');
  
  console.log('Testing simple analysis...');
  
  try {
    const response = await fetch('http://localhost:5001/api/monitoring/test-analysis-simple', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "This is a test of sentiment analysis"
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.parsed) {
      console.log('✅ Sentiment:', data.parsed.sentiment);
      console.log('✅ Score:', data.parsed.score);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();