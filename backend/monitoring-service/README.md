# SignalDesk Monitoring Service

Standalone monitoring service that runs continuously to collect news and generate opportunities.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your database URL:
```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

3. Run the service:
```bash
npm start
```

## Deployment Options

### Option 1: Railway (Recommended)
- Deploy directly to Railway
- Runs 24/7
- Auto-restarts on crash

### Option 2: Render
- Deploy as background worker
- Runs continuously

### Option 3: VPS
- Deploy to any VPS (DigitalOcean, Linode, etc.)
- Use PM2 for process management

## Features
- Runs every 5 minutes
- Monitors all active organizations
- Collects news from configured sources
- Generates intelligence summaries
- Identifies opportunities