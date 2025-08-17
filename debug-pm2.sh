#!/bin/bash

# Debug script for PM2 deployment issues
echo "🔍 Debugging PM2 Deployment Issues..."

echo "1. Checking current directory and files:"
pwd
ls -la

echo -e "\n2. Checking if .env file exists and has content:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "Number of lines in .env: $(wc -l < .env)"
    echo "First few environment variables (without values):"
    grep -E '^[A-Z_]+=' .env | head -5 | cut -d'=' -f1
else
    echo "❌ .env file not found!"
fi

echo -e "\n3. Checking if build directory exists:"
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    echo "Files in dist:"
    ls -la dist/
    if [ -f "dist/server.js" ]; then
        echo "✅ dist/server.js exists"
        echo "Size: $(du -h dist/server.js | cut -f1)"
    else
        echo "❌ dist/server.js not found!"
    fi
else
    echo "❌ dist directory not found! Running build..."
    npm run build
fi

echo -e "\n4. Testing environment variable loading:"
if [ -f ".env" ]; then
    # Source the .env file in a subshell to test
    (
        set -a
        source .env
        set +a
        echo "GROQ_API_KEY is set: $([ -n "$GROQ_API_KEY" ] && echo "YES" || echo "NO")"
        echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"
        echo "PORT is set: $([ -n "$PORT" ] && echo "YES (value: $PORT)" || echo "NO")"
    )
fi

echo -e "\n5. Testing Node.js can read the server file:"
if [ -f "dist/server.js" ]; then
    echo "Checking for syntax errors in dist/server.js:"
    node -c dist/server.js && echo "✅ No syntax errors" || echo "❌ Syntax errors found"
fi

echo -e "\n6. Checking Node.js and npm versions:"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

echo -e "\n7. PM2 version and status:"
pm2 --version
pm2 list

echo -e "\n8. Testing manual server start (will run for 5 seconds):"
if [ -f ".env" ] && [ -f "dist/server.js" ]; then
    echo "Starting server manually with environment variables..."
    (
        set -a
        source .env
        set +a
        timeout 5s node dist/server.js
    ) || echo "Manual start test completed"
fi

echo -e "\n✅ Debug complete! Check the output above for any issues."
