// Centralized API configuration
// Change this ONE place to update the entire app
// Now using microservices architecture!

// New API Gateway - clean, fast, reliable!
const API_BASE_URL = 'https://signaldesk-production.up.railway.app/api';

// Original backend (backup)
const BACKUP_URL = 'https://signaldesk-production.up.railway.app/api';

export default API_BASE_URL;
export { BACKUP_URL };