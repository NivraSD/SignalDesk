#!/bin/bash

# Set Vercel environment variables for production
echo "Setting Vercel environment variables..."

# Set Supabase URL
echo "https://zskaxjtyuaqazydouifp.supabase.co" | vercel env add REACT_APP_SUPABASE_URL production

# Set Supabase Anon Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0" | vercel env add REACT_APP_SUPABASE_ANON_KEY production

echo "Environment variables set. Triggering new deployment..."
vercel --prod --force