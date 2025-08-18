#!/bin/bash
# TECP Docker Compose Deployment Script

set -e

echo "🐳 Deploying TECP with Docker Compose"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine docker compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Check for required environment variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "⚠️  Please edit .env file with your configuration:"
    echo "   • Set DEEPSEEK_API_KEY"
    echo "   • Set LOG_PRIVATE_KEY and LOG_PUBLIC_KEY (generate with: npm run gen:keys)"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Source environment variables
set -a
source .env
set +a

# Validate required variables
if [ -z "$LOG_PRIVATE_KEY" ] || [ -z "$LOG_PUBLIC_KEY" ]; then
    echo "❌ LOG_PRIVATE_KEY and LOG_PUBLIC_KEY must be set in .env"
    echo "   Generate keys with: npm run gen:keys"
    exit 1
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "⚠️  DEEPSEEK_API_KEY not set - Private-GPT demo will not work"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build and start services
echo "🔨 Building Docker images..."
cd deployments
$DOCKER_COMPOSE build

echo "🚀 Starting services..."
$DOCKER_COMPOSE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
check_service() {
    local service=$1
    local port=$2
    local path=${3:-/health}
    
    echo -n "Checking $service... "
    if curl -f -s "http://localhost:$port$path" > /dev/null; then
        echo "✅ healthy"
    else
        echo "❌ unhealthy"
        return 1
    fi
}

echo "🏥 Health checks:"
check_service "Transparency Log" 3002
check_service "Private-GPT Demo" 3001
check_service "Web Verifier" 3004
check_service "Reference UI" 3003 "/"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your TECP services are available at:"
echo "   • Transparency Log: http://localhost:3002"
echo "   • Private-GPT Demo: http://localhost:3001"
echo "   • Web Verifier: http://localhost:3004"
echo "   • Reference UI: http://localhost:3003"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: $DOCKER_COMPOSE logs -f <service>"
echo "   • Stop services: $DOCKER_COMPOSE down"
echo "   • Restart service: $DOCKER_COMPOSE restart <service>"
echo "   • View status: $DOCKER_COMPOSE ps"
echo ""
echo "📊 Monitor with:"
echo "   • Docker stats: docker stats"
echo "   • Service logs: $DOCKER_COMPOSE logs -f"
