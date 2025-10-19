# BACKEND SETUP - 4 STEPS

## STEP 1
Go to your Backend/SignalDesk service in Railway
Click the "Variables" tab

## STEP 2  
Delete ALL existing variables in the Backend service
(Click the X next to each one)

## STEP 3
Add exactly these 5 variables to the Backend service:

### Variable 1:
- **NAME:** DATABASE_URL
- **VALUE:** postgresql://postgres:DYAydOolIzPbnMQzkdgjIHRXHijWVPTF@shuttle.proxy.rlwy.net:33148/railway

### Variable 2:
- **NAME:** ANTHROPIC_API_KEY  
- **VALUE:** (paste your Anthropic API key that starts with sk-ant-)

### Variable 3:
- **NAME:** JWT_SECRET
- **VALUE:** mysecretkey123

### Variable 4:
- **NAME:** NODE_ENV
- **VALUE:** production

### Variable 5:
- **NAME:** PORT
- **VALUE:** 3000

## STEP 4
Click the "Redeploy" button on the Backend service

---

After Step 4, wait 2 minutes for deployment to complete.