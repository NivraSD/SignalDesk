#!/bin/bash

echo "🚂 Railway Token Setup Script"
echo "============================="
echo ""
echo "This script will help you get your Railway token for GitHub Actions deployment."
echo ""
echo "Step 1: Login to Railway CLI"
echo "-----------------------------"
railway login

echo ""
echo "Step 2: Get your Railway token"
echo "-------------------------------"
echo "Your Railway token will be displayed below."
echo "Copy this token and add it to GitHub Secrets as RAILWAY_TOKEN"
echo ""
railway whoami --token

echo ""
echo "Step 3: Add to GitHub Secrets"
echo "------------------------------"
echo "1. Go to: https://github.com/NivraSD/SignalDesk/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: RAILWAY_TOKEN"
echo "4. Value: [paste the token from above]"
echo ""
echo "✅ Once you've added the token to GitHub, your automated deployments will work!"