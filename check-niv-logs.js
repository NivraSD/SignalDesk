const https = require('https');

const SUPABASE_URL = 'zskaxjtyuaqazydouifp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

// Fetch logs using HTTPS
const options = {
  hostname: SUPABASE_URL,
  path: '/rest/v1/analytics_debug_logs?select=*&order=timestamp.desc&limit=50',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const logs = JSON.parse(data);

      if (Array.isArray(logs)) {
        // Filter for recent NIV logs
        const nivLogs = logs.filter(log =>
          log.event_message && (
            log.event_message.includes('NIV') ||
            log.event_message.includes('Strategic') ||
            log.event_message.includes('Framework') ||
            log.event_message.includes('📦 Sending') ||
            log.event_message.includes('📊 Research data')
          )
        ).slice(0, 20);

        console.log(`\n🔍 Recent NIV Strategic Framework Logs:\n`);

        nivLogs.forEach(log => {
          const time = new Date(log.timestamp / 1000).toLocaleTimeString();
          const msg = log.event_message.replace(/\n/g, ' ').trim();

          // Highlight important messages
          if (msg.includes('📦 Sending') || msg.includes('📊 Research data')) {
            console.log(`⭐ [${time}] ${msg}`);
          } else {
            console.log(`[${time}] ${msg}`);
          }
        });

        // Look for the most recent framework generation
        const recentFramework = nivLogs.find(log =>
          log.event_message.includes('Framework ready') ||
          log.event_message.includes('📊 Research data')
        );

        if (recentFramework) {
          console.log('\n✅ Most recent framework generation:');
          console.log(recentFramework.event_message);
        }
      } else {
        console.log('Response is not an array:', data.substring(0, 200));
      }

    } catch (error) {
      console.error('Error parsing logs:', error);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();