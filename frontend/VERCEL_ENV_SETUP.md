# Vercel Environment Variables Configuration

## Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Core Configuration
| Variable | Value | Environment |
|----------|-------|-------------|
| `REACT_APP_SUPABASE_URL` | `https://zskaxjtyuaqazydouifp.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your key) | Production, Preview, Development |

### Claude AI Integration (if using)
| Variable | Value | Environment |
|----------|-------|-------------|
| `REACT_APP_CLAUDE_API_KEY` | Your Anthropic API key | Production only |
| `REACT_APP_CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Production, Preview |

### Build Configuration
| Variable | Value | Environment |
|----------|-------|-------------|
| `CI` | `false` | Production, Preview |
| `GENERATE_SOURCEMAP` | `false` | Production |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Production, Preview |

## How to Add:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `signaldesk-frontend` project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add Variable**
5. Enter each variable name and value
6. Select appropriate environments (Production, Preview, Development)
7. Click **Save**

## After Adding Variables:

Trigger a new deployment to apply the changes:
```bash
vercel --prod --force
```

## Verify Configuration:
```bash
vercel env ls
```