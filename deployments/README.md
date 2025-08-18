# TECP Deployment Guide

This directory contains production-ready deployment configurations for the Trusted Ephemeral Computation Protocol (TECP) stack.

## Quick Start

### Docker Compose (Recommended for Development)

```bash
# Clone and setup
git clone https://github.com/tecp-protocol/tecp.git
cd tecp

# Generate keys
npm run gen:keys

# Deploy with Docker
chmod +x deployments/scripts/deploy-docker.sh
./deployments/scripts/deploy-docker.sh
```

### Fly.io (Recommended for Production)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
flyctl auth login

# Set environment variables
export LOG_PRIVATE_KEY="your_base64_private_key"
export LOG_PUBLIC_KEY="your_base64_public_key"
export DEEPSEEK_API_KEY="your_deepseek_api_key"

# Deploy
chmod +x deployments/scripts/deploy-fly.sh
./deployments/scripts/deploy-fly.sh
```

## Architecture

The TECP stack consists of four main services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Reference UI  │    │ Private-GPT API │    │  Web Verifier   │
│     (React)     │    │   (Express)     │    │   (Express)     │
│     :3003       │    │     :3001       │    │     :3004       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │Transparency Log │
                    │   (Express)     │
                    │     :3002       │
                    └─────────────────┘
```

### Services

1. **Transparency Log** (`:3002`)
   - Append-only cryptographic log
   - Merkle tree with inclusion proofs
   - Key rotation and signed roots
   - SQLite with WAL mode

2. **Private-GPT Demo** (`:3001`)
   - OpenAI-compatible API endpoint
   - DeepSeek integration for AI processing
   - TECP receipt generation
   - Policy enforcement

3. **Web Verifier** (`:3004`)
   - Receipt verification service
   - Transparency log validation
   - REST API and web interface

4. **Reference UI** (`:3003`)
   - React-based dashboard
   - Receipt verification interface
   - Transparency log explorer
   - Policy documentation

## Deployment Options

### 1. Docker Compose

**Best for**: Development, testing, self-hosting

**Features**:
- Single-command deployment
- Local development with hot reload
- Persistent volumes for data
- Nginx reverse proxy with TLS
- Health checks and auto-restart

**Files**:
- `docker-compose.yml` - Main orchestration
- `Dockerfile.*` - Service-specific builds
- `Caddyfile` - Reverse proxy configuration
- `nginx.conf` - Static file serving

### 2. Fly.io

**Best for**: Production, global deployment

**Features**:
- Global edge deployment
- Automatic TLS certificates
- Volume persistence for log data
- Auto-scaling and health checks
- Built-in monitoring

**Files**:
- `fly/fly-*.toml` - App configurations
- `scripts/deploy-fly.sh` - Deployment script

### 3. Render.com

**Best for**: Simple production deployment

**Features**:
- Zero-config deployment from Git
- Automatic builds and deploys
- Managed databases available
- Built-in monitoring

**Files**:
- `render/render.yaml` - Service definitions

### 4. Manual/VPS

**Best for**: Custom infrastructure, compliance requirements

See `OPERATIONS.md` for detailed manual deployment instructions.

## Environment Variables

### Required for All Deployments

```bash
# Transparency Log Keys (CRITICAL - generate with npm run gen:keys)
LOG_PRIVATE_KEY=base64_encoded_ed25519_private_key
LOG_PUBLIC_KEY=base64_encoded_ed25519_public_key
LOG_KEY_ID=log-202412

# DeepSeek API (for Private-GPT demo)
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### Optional Configuration

```bash
# Service URLs (auto-configured in most deployments)
TECP_LOG_URL=https://log.yourdomain.com
TECP_VERIFIER_URL=https://verify.yourdomain.com

# Security
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
NODE_ENV=production

# Database
DB_PATH=/data/tecp.db  # SQLite path for transparency log
```

## Security Considerations

### Key Management

**🔴 CRITICAL**: Never use development keys in production

```bash
# Generate production keys
npm run gen:keys

# Store securely (examples)
export LOG_PRIVATE_KEY=$(cat .keys/ed25519.priv | base64)
export LOG_PUBLIC_KEY=$(cat .keys/ed25519.pub | base64)

# Use secrets management
flyctl secrets set LOG_PRIVATE_KEY="$LOG_PRIVATE_KEY" -a tecp-log
kubectl create secret generic tecp-keys --from-literal=private-key="$LOG_PRIVATE_KEY"
```

### Network Security

- All services use HTTPS in production
- CORS configured for known origins only
- Rate limiting enabled (100 req/min per IP)
- Security headers applied

### Data Protection

- Transparency log uses WAL mode for durability
- Regular database backups recommended
- Volume encryption available on most platforms
- No sensitive data stored (only hashes and proofs)

## Monitoring and Maintenance

### Health Checks

All services provide `/health` endpoints:

```bash
curl https://log.yourdomain.com/health
curl https://api.yourdomain.com/health
curl https://verify.yourdomain.com/health
```

### Logging

```bash
# Docker Compose
docker-compose logs -f tecp-log

# Fly.io
flyctl logs -a tecp-log

# Render
# View logs in dashboard
```

### Metrics

Services expose Prometheus metrics at `/metrics`:

```bash
curl https://log.yourdomain.com/metrics
```

### Backup

```bash
# Backup transparency log database
docker exec tecp-log sqlite3 /data/tecp.db ".backup /data/backup-$(date +%Y%m%d).db"

# Copy to host
docker cp tecp-log:/data/backup-$(date +%Y%m%d).db ./backups/
```

## Scaling

### Horizontal Scaling

- **Transparency Log**: Single instance (append-only log)
- **Demo API**: Multiple instances behind load balancer
- **Verifier**: Multiple instances (stateless)
- **UI**: CDN distribution

### Vertical Scaling

```bash
# Fly.io
flyctl scale vm shared-cpu-2x -a tecp-demo

# Docker Compose
# Edit docker-compose.yml resources limits
```

### Database Scaling

For high-throughput scenarios, consider:

- PostgreSQL backend for transparency log
- Read replicas for verification
- Sharded logs by time period

## Troubleshooting

### Common Issues

#### "LOG_PRIVATE_KEY environment variable required"
```bash
# Generate keys
npm run gen:keys

# Set environment variables
export LOG_PRIVATE_KEY=$(base64 < .keys/ed25519.priv)
export LOG_PUBLIC_KEY=$(base64 < .keys/ed25519.pub)
```

#### "Receipt verification failed"
- Check timestamp validity (not too old/future)
- Verify signature with correct public key
- Ensure CBOR encoding is canonical

#### "Transparency log unavailable"
- Check service health: `curl https://log.yourdomain.com/health`
- Verify network connectivity between services
- Check database disk space and permissions

#### "Policy violation"
- Review policy enforcement logs
- Check policy ID spelling and registration
- Validate input data against policy rules

### Debug Mode

```bash
# Enable debug logging
export DEBUG=tecp:*
export LOG_LEVEL=debug

# Docker Compose
docker-compose up --build
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Monitor database performance
sqlite3 /data/tecp.db "PRAGMA optimize;"

# Check network latency
curl -w "@curl-format.txt" https://log.yourdomain.com/health
```

## Support

- **Documentation**: https://tecp.dev/docs
- **Issues**: https://github.com/tecp-protocol/tecp/issues
- **Security**: security@tecp.dev
- **Community**: https://discord.gg/tecp

## License

Apache-2.0 - see [LICENSE](../LICENSE) file for details.
