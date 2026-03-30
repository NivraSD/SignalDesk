# Deploy SignalDesk to Render - Direct Method

## Option 1: Deploy via Render CLI (Fastest)

### Install Render CLI:
```bash
# macOS
brew install render

# Or via npm
npm install -g @render/cli
```

### Deploy:
```bash
render deploy
```

## Option 2: Use Public Git URL

1. Create GitHub repo: https://github.com/new
2. Name it: `signaldesk-backend`
3. Run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/signaldesk-backend.git
git push -u origin main
```

4. In Render, paste: `https://github.com/YOUR_USERNAME/signaldesk-backend`

## Option 3: Deploy via ZIP Upload

Render doesn't support direct ZIP upload, but you can:

1. Fork this template: https://github.com/render-examples/express-hello-world
2. Replace the code with yours
3. Connect that repo to Render

## Option 4: Use Heroku Instead (Alternative)

Since Render is being difficult:

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create signaldesk-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="postgresql://postgres:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@crossover.proxy.rlwy.net:56706/railway"
heroku config:set CLAUDE_API_KEY="your-key-here"
heroku config:set JWT_SECRET="signaldesk-jwt-secret-2024"

# Deploy
git push heroku main
```

## Environment Variables for Any Platform:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@crossover.proxy.rlwy.net:56706/railway
CLAUDE_API_KEY=your_anthropic_api_key_here
JWT_SECRET=signaldesk-jwt-secret-2024
```