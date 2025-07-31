#!/bin/bash

echo "🚀 Setting up 1Balancer Orchestration Service"
echo "==========================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher"
    exit 1
fi

echo "✅ Node.js version check passed"

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Installing yarn..."
    npm install -g yarn
fi

echo "✅ Yarn is installed"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs

# Check if Redis is running (optional)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running (optional)"
    else
        echo "⚠️  Redis is not running (optional for development)"
    fi
else
    echo "⚠️  Redis is not installed (optional for development)"
fi

echo ""
echo "✨ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'yarn dev' to start the development server"
echo "3. Visit http://localhost:8080/health to check the service"
echo ""
echo "For more commands, run 'make help'"