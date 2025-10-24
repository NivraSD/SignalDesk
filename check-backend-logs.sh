#!/bin/bash
# Get recent logs from real-time-prediction-generator

echo "📊 Checking real-time-prediction-generator logs..."
echo ""

# Use the Supabase CLI to get logs
npx supabase functions list 2>&1 | grep "real-time-prediction-generator"
