#!/bin/bash
echo "🔍 Quick Connection Test"
echo ""
echo "Step 1: Checking .env.local file..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "✅ .env.local exists"
echo ""
echo "Step 2: Checking if credentials are set..."

# Check if placeholder values are still there
if grep -q "your_airtable_api_key_here" .env.local; then
    echo "⚠️  WARNING: AIRTABLE_API_KEY still has placeholder value!"
    echo "   👉 Update it with your real API key from https://airtable.com/create/tokens"
    echo ""
fi

if grep -q "your_base_id_here" .env.local; then
    echo "⚠️  WARNING: AIRTABLE_BASE_ID still has placeholder value!"
    echo "   👉 Update it with your real Base ID from Airtable"
    echo ""
fi

echo "Step 3: Ready to test connection"
echo "Run: node test-connection.js"
