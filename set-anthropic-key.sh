#!/bin/bash

echo "====================================="
echo "  Set Anthropic API Key for Supabase"
echo "====================================="
echo ""
echo "This script will help you set the ANTHROPIC_API_KEY in Supabase secrets."
echo ""
echo "You need an Anthropic API key to use the intelligence features."
echo "You can get one from: https://console.anthropic.com/settings/keys"
echo ""
echo "Your key should look like: sk-ant-api03-..."
echo ""
read -p "Please enter your Anthropic API key: " api_key

if [ -z "$api_key" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

# Check if the key looks valid (starts with sk-ant)
if [[ ! "$api_key" =~ ^sk-ant- ]]; then
    echo "⚠️  Warning: The key doesn't start with 'sk-ant-' which is unusual for Anthropic keys."
    read -p "Do you want to continue anyway? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Exiting."
        exit 1
    fi
fi

echo ""
echo "Setting ANTHROPIC_API_KEY in Supabase secrets..."
npx supabase secrets set ANTHROPIC_API_KEY="$api_key"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! The ANTHROPIC_API_KEY has been set."
    echo ""
    echo "The edge functions will use this key automatically."
    echo "You may need to wait a minute for the changes to propagate."
    echo ""
    echo "You can now use the Intelligence features in SignalDesk!"
else
    echo ""
    echo "❌ Failed to set the API key. Please check your Supabase connection."
fi