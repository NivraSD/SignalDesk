# Update Frontend API URL

Once your new Railway service is deployed, you'll get a new URL like:
`https://[service-name].up.railway.app`

## Update this file:
`frontend/src/config/api.js`

Change:
```javascript
const API_BASE_URL = 'https://signaldesk-api-production.up.railway.app/api';
```

To:
```javascript
const API_BASE_URL = 'https://[your-new-url].up.railway.app/api';
```

Then commit and push:
```bash
git add frontend/src/config/api.js
git commit -m "Update API URL to new Railway deployment"
git push
```

Your frontend will then connect to the new backend!