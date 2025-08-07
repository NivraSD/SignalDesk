// Centralized API configuration
// Change this ONE place to update the entire app
// Using stable production URL that won't change with deployments

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://signal-desk.vercel.app/api';

export default API_BASE_URL;