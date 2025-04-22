#!/bin/bash

# Smart Shopper Startup Script

echo "🔄 Starting Smart Shopper with real API keys..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
    echo "❌ Node.js version is too old. Current: v$NODE_VERSION. Required: v16 or higher."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the correct directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example - using REAL API keys"
    else
        echo "❌ .env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Check for required API keys in .env
echo "🔑 Checking API keys in .env file..."
API_KEYS_PRESENT=true

# Function to check if a key is present in .env
check_key() {
    KEY_NAME=$1
    KEY_PATTERN=$2
    
    # Get the value from .env file
    KEY_VALUE=$(grep "^$KEY_NAME=" .env | cut -d'=' -f2)
    
    if [ -z "$KEY_VALUE" ]; then
        echo "❌ $KEY_NAME is missing in .env file"
        API_KEYS_PRESENT=false
    else
        # Check if the key matches the expected pattern
        if [[ "$KEY_VALUE" =~ $KEY_PATTERN ]]; then
            echo "✅ $KEY_NAME is present and valid"
        else
            echo "⚠️  $KEY_NAME is present but doesn't match expected pattern"
        fi
    fi
}

# Check all required API keys
check_key "SERPAPI_API_KEY" "^sk_c"
check_key "SEARCH1_API_KEY" "^sk_s1_"
check_key "PERPLEXITY_API_KEY" "^pplx_"
check_key "CLAUDE_API_KEY" "^sk_ant"

if [ "$API_KEYS_PRESENT" = false ]; then
    echo "❌ Some API keys are missing. Please check your .env file."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting Smart Shopper server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Server will be available at: http://localhost:3001"
echo "💡 Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run the server with environment variables
NODE_ENV=development SERVER_PORT=3001 node server.js
