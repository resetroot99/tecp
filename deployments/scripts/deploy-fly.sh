#!/bin/bash
# TECP Fly.io Deployment Script

set -e

echo "🚀 Deploying TECP to Fly.io"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
fi

# Function to create app if it doesn't exist
create_app_if_needed() {
    local app_name=$1
    local config_file=$2
    
    if ! flyctl apps list | grep -q "^$app_name"; then
        echo "📦 Creating app: $app_name"
        flyctl apps create "$app_name" --org personal
    else
        echo "✅ App $app_name already exists"
    fi
}

# Function to create volume if needed
create_volume_if_needed() {
    local app_name=$1
    local volume_name=$2
    local size_gb=$3
    local region=${4:-sjc}
    
    if ! flyctl volumes list -a "$app_name" | grep -q "$volume_name"; then
        echo "💾 Creating volume: $volume_name for $app_name"
        flyctl volumes create "$volume_name" --region "$region" --size "$size_gb" -a "$app_name"
    else
        echo "✅ Volume $volume_name already exists for $app_name"
    fi
}

# Deploy transparency log first (other services depend on it)
echo "🌳 Deploying Transparency Log..."
create_app_if_needed "tecp-log" "fly/fly-log.toml"
create_volume_if_needed "tecp-log" "tecp_log_data" 1

# Set secrets for log
echo "🔐 Setting secrets for transparency log..."
if [ -z "$LOG_PRIVATE_KEY" ] || [ -z "$LOG_PUBLIC_KEY" ]; then
    echo "⚠️  LOG_PRIVATE_KEY and LOG_PUBLIC_KEY environment variables not set"
    echo "   Generate keys with: npm run gen:keys"
    echo "   Then export LOG_PRIVATE_KEY and LOG_PUBLIC_KEY"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    flyctl secrets set LOG_PRIVATE_KEY="$LOG_PRIVATE_KEY" LOG_PUBLIC_KEY="$LOG_PUBLIC_KEY" -a tecp-log
fi

flyctl deploy -c deployments/fly/fly-log.toml

# Wait for log to be healthy
echo "⏳ Waiting for transparency log to be healthy..."
sleep 30

# Deploy other services
echo "🤖 Deploying Private-GPT Demo..."
create_app_if_needed "tecp-demo" "fly/fly-demo.toml"

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "⚠️  DEEPSEEK_API_KEY environment variable not set"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    flyctl secrets set DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" -a tecp-demo
fi

flyctl deploy -c deployments/fly/fly-demo.toml

echo "🔍 Deploying Web Verifier..."
create_app_if_needed "tecp-verifier" "fly/fly-verifier.toml"
flyctl deploy -c deployments/fly/fly-verifier.toml

echo "🎨 Deploying Reference UI..."
create_app_if_needed "tecp-ui" "fly/fly-ui.toml"
flyctl deploy -c deployments/fly/fly-ui.toml

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your TECP services are available at:"
echo "   • Transparency Log: https://tecp-log.fly.dev"
echo "   • Private-GPT Demo: https://tecp-demo.fly.dev"
echo "   • Web Verifier: https://tecp-verifier.fly.dev"
echo "   • Reference UI: https://tecp-ui.fly.dev"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: flyctl logs -a <app-name>"
echo "   • Scale app: flyctl scale count 2 -a <app-name>"
echo "   • SSH into app: flyctl ssh console -a <app-name>"
echo "   • View status: flyctl status -a <app-name>"
