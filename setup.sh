#!/bin/bash

# Job Card Management System - Startup Script
# Run this script after cloning the repository

echo "==================================="
echo "Job Card Management System Setup"
echo "==================================="
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    echo "   source ~/.bashrc"
    exit 1
fi

echo "✅ Bun is installed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
bun install

# Create database directory if it doesn't exist
echo ""
echo "📁 Creating database directory..."
mkdir -p db

# Generate Prisma client
echo ""
echo "⚙️  Generating Prisma client..."
bun run db:generate

# Push database schema
echo ""
echo "🗄️  Setting up database..."
bun run db:push

# Check if database file was created
if [ -f "db/custom.db" ]; then
    echo "✅ Database created successfully"
    ls -la db/custom.db
else
    echo "❌ Database creation failed. Please check for errors above."
    exit 1
fi

# Set proper permissions
echo ""
echo "🔐 Setting file permissions..."
chmod 664 db/custom.db 2>/dev/null || true
chmod 775 db 2>/dev/null || true

echo ""
echo "==================================="
echo "✅ Setup complete!"
echo "==================================="
echo ""
echo "To start the development server:"
echo "   bun run dev"
echo ""
echo "To start in production mode:"
echo "   bun run build"
echo "   pm2 start npm --name \"job-card-system\" -- start"
echo ""
