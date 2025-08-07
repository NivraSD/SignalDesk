# SignalDesk Deployment Guide

## Current Deployment Status ✅

### Frontend
- **URL**: https://signal-desk-qmzk-6nocqg96t-nivra-sd.vercel.app
- **Platform**: Vercel
- **Auto-deploy**: Yes (from GitHub)

### Backend API  
- **URL**: https://signal-desk-hm9q013au-nivra-sd.vercel.app
- **Platform**: Vercel (Serverless Functions)
- **Auto-deploy**: Yes (from GitHub)

### Database
- **Platform**: Railway PostgreSQL
- **Connection**: Via DATABASE_URL environment variable

### Monitoring Service
- **Status**: Ready to deploy
- **Location**: `/monitoring-service`
- **Recommended Platform**: Railway or Render

## How to Update Deployments

### Update Backend API URL
1. When backend redeploys, get new URL from Vercel
2. Update `/frontend/src/config/api.js`
3. Push to GitHub - frontend auto-redeploys

### Deploy Backend Manually
```bash
cd backend
vercel --prod --yes
```

### Deploy Monitoring Service
```bash
cd monitoring-service
npm install

# For Railway:
railway init
railway add
railway up

# For local testing:
npm start
```

## Environment Variables

### Backend (Set in Vercel Dashboard)
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key  
- `JWT_SECRET` - Random secret for JWT
- `NODE_ENV` - Set to "production"

### Monitoring Service
- `DATABASE_URL` - Same PostgreSQL connection string
- `NODE_ENV` - Set to "production"

## Login Credentials
- **Email**: demo@signaldesk.com
- **Password**: demo123

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│  Backend    │────▶│   Database   │
│  (Vercel)   │     │  (Vercel)   │     │  (Railway)   │
└─────────────┘     └─────────────┘     └──────────────┘
                           ▲                     ▲
                           │                     │
                    ┌──────┴────────┐            │
                    │  Monitoring   │────────────┘
                    │   Service     │
                    │ (Railway/VPS) │
                    └───────────────┘
```

## Troubleshooting

### Frontend can't connect to backend
1. Check `/frontend/src/config/api.js` has correct URL
2. Verify backend is deployed and running
3. Check browser console for CORS errors

### Login not working
1. Ensure using correct credentials
2. Check backend logs in Vercel dashboard
3. Verify DATABASE_URL is set correctly

### Monitoring not running
1. Check monitoring service logs
2. Verify DATABASE_URL is accessible
3. Ensure cron schedule is correct

## Quick Commands

```bash
# Check backend status
curl https://signal-desk-hm9q013au-nivra-sd.vercel.app/api/health

# Test login
curl -X POST https://signal-desk-hm9q013au-nivra-sd.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"demo123"}'

# View frontend
open https://signal-desk-qmzk-6nocqg96t-nivra-sd.vercel.app
```