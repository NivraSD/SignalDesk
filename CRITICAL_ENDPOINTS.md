# 🚨 CRITICAL ENDPOINTS - DO NOT BREAK

## ⚠️ BEFORE ANY DEPLOYMENT

**ALWAYS RUN:** `node test-critical-endpoints.js`

If ANY test fails, DO NOT DEPLOY until fixed.

---

## 🔴 CRITICAL ENDPOINTS (Never Break These)

### 1. **LOGIN** - `/api/auth/login`
- **Method:** POST
- **Body:** `{ email, password }`
- **Response:** `{ success: true, token, user }`
- **Why Critical:** Users cannot access the platform without this
- **Test:** Login with demo@signaldesk.com / demo123

### 2. **AUTH VERIFY** - `/api/auth/verify`
- **Method:** GET
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ success: true, userId, user? }`
- **Why Critical:** Every protected route depends on this
- **Test:** Use token from login

### 3. **PROJECTS** - `/api/projects`
- **Method:** GET
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Array of projects or empty array
- **Why Critical:** Core functionality requires project context
- **Test:** Should return array (even if empty)

---

## 🟡 IMPORTANT ENDPOINTS (Test Before Deploy)

### 4. **CONTENT GENERATION** - `/api/content/ai-generate`
- **Method:** POST
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ type, prompt, tone, formData? }`
- **Response:** `{ success: true, content, metadata }`
- **Why Important:** Core feature users pay for

### 5. **MEMORY VAULT** - `/api/projects/[id]/memoryvault`
- **Method:** GET/POST
- **Headers:** `Authorization: Bearer <token>`
- **Why Important:** Data persistence layer

---

## 📋 DEPLOYMENT CHECKLIST

Before EVERY deployment:

1. [ ] Run `node test-critical-endpoints.js`
2. [ ] All tests pass (especially LOGIN)
3. [ ] Check Vercel environment variables are set:
   - JWT_SECRET
   - DATABASE_URL
   - ANTHROPIC_API_KEY
4. [ ] Verify `/api` folder exists at root (for Vercel)
5. [ ] Clear browser cache after deployment
6. [ ] Test login on production immediately after deploy

---

## 🛠️ COMMON FIXES

### Login returns 404
```bash
# Ensure API folder is at root for Vercel
cp -r backend/api api
vercel --prod
```

### Login returns 401
```bash
# Check demo credentials in /api/auth/login.js
# Should accept: demo@signaldesk.com / demo123
```

### CORS errors
```javascript
// Add to EVERY endpoint:
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
```

### Frontend can't find API
```javascript
// Check frontend/src/config/api.js
const API_BASE_URL = 'https://signal-desk.vercel.app/api';
```

---

## 🚀 QUICK TEST

```bash
# Test login works
curl -X POST https://signal-desk.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"demo123"}'

# Should return:
# {"success":true,"token":"...","user":{...}}
```

---

## 📝 NOTES

- Login is THE most critical endpoint - if it breaks, users are locked out
- Always test with demo credentials first
- Clear cache is often the solution for login issues
- Keep test-critical-endpoints.js updated with new critical paths
- Run tests before AND after deployment

**Remember:** A broken login = angry users = lost trust