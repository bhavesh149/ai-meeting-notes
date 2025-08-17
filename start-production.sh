#!/bin/bash

# Production PM2 startup script with proper environment handling
set -e

echo "🚀 Starting AI Meeting Notes with proper environment loading..."

# Stop any existing processes
pm2 delete ai-meeting-notes 2>/dev/null || echo "No existing process to stop"

# Ensure we're in the right directory
cd /home/ubuntu/ai-meeting-notes

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
set -a
source .env
set +a

# Verify critical environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    exit 1
fi

if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ GROQ_API_KEY not found in environment"
    exit 1
fi

# Test database connection
echo "🔗 Testing database connection..."
npx prisma db push --skip-generate

# Build if needed
if [ ! -f "dist/server.js" ]; then
    echo "🔨 Building application..."
    npm run build
fi

# Start PM2 with all environment variables
echo "▶️  Starting PM2 with environment variables..."
pm2 start dist/server.js --name ai-meeting-notes \
  --env NODE_ENV=production \
  --env PORT="$PORT" \
  --env DATABASE_URL="$DATABASE_URL" \
  --env GROQ_API_KEY="$GROQ_API_KEY" \
  --env SMTP_HOST="$SMTP_HOST" \
  --env SMTP_PORT="$SMTP_PORT" \
  --env SMTP_USER="$SMTP_USER" \
  --env SMTP_PASS="$SMTP_PASS" \
  --env MAIL_FROM="$MAIL_FROM" \
  --env WEB_ORIGIN="$WEB_ORIGIN" \
  --env DB_NAME="$DB_NAME" \
  --env DB_USER="$DB_USER" \
  --env DB_PASSWORD="$DB_PASSWORD" \
  --env DB_HOST="$DB_HOST" \
  --env DB_PORT="$DB_PORT"

# Save PM2 configuration
pm2 save

echo "✅ Application started successfully!"
echo "📊 Status:"
pm2 status

echo "📝 Use 'pm2 logs ai-meeting-notes' to view logs"
