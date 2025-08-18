# TECP Operations Guide

**Version**: TECP-0.1  
**Date**: December 2024

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Ed25519 key pair for transparency log
- DeepSeek API key (for Private-GPT demo)

### Installation

```bash
# Clone repository
git clone https://github.com/tecp-protocol/tecp.git
cd tecp

# Install dependencies
npm install

# Generate development keys
npm run gen:keys

# Build all packages
npm run build

# Run interoperability tests
npm run test:interop
```

### Development Environment

```bash
# Start all services (demo, log, verifier, UI)
npm run dev:all

# Services will be available at:
# - Private-GPT Demo: http://localhost:3001
# - Transparency Log: http://localhost:3002  
# - Web Verifier: http://localhost:3004
# - Reference UI: http://localhost:3003
```

## Production Deployment

### Environment Configuration

Create `.env` file from template:

```bash
cp env.template .env
```

Required environment variables:

```bash
# DeepSeek API (for Private-GPT demo)
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Transparency Log Keys (REQUIRED in production)
LOG_PRIVATE_KEY=base64_encoded_private_key
LOG_PUBLIC_KEY=base64_encoded_public_key
LOG_KEY_ID=log-202412

# Service URLs
TECP_LOG_URL=https://log.yourdomain.com
TECP_VERIFIER_URL=https://verify.yourdomain.com

# Security
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
NODE_ENV=production

# Database
DB_PATH=/data/tecp.db
```

### Key Generation

**⚠️ CRITICAL: Never use development keys in production**

Generate production keys:

```bash
# Generate new Ed25519 key pair
node -e "
const { generateKeyPair } = require('crypto');
generateKeyPair('ed25519', (err, publicKey, privateKey) => {
  const pubKey = publicKey.export({ type: 'spki', format: 'der' });
  const privKey = privateKey.export({ type: 'pkcs8', format: 'der' });
  console.log('LOG_PRIVATE_KEY=' + Buffer.from(privKey).toString('base64'));
  console.log('LOG_PUBLIC_KEY=' + Buffer.from(pubKey).toString('base64'));
});
"
```

Store keys securely:
- Use environment variables or secrets manager
- Never commit keys to version control
- Implement key rotation schedule (recommended: quarterly)
- Maintain key escrow for compliance

### Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.9'
services:
  demo:
    build: .
    command: node demo/private-gpt/dist/index.js
    environment:
      - PORT=3001
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - TECP_LOG_URL=http://log:3002
      - VERIFIER_URL=http://verifier:3004
    depends_on: [log]
    ports: ["3001:3001"]

  log:
    build: .
    command: node services/tecp-log/dist/index.js
    environment:
      - PORT=3002
      - DB_PATH=/data/tecp.db
      - LOG_PRIVATE_KEY=${LOG_PRIVATE_KEY}
      - LOG_PUBLIC_KEY=${LOG_PUBLIC_KEY}
      - LOG_KEY_ID=${LOG_KEY_ID}
    volumes:
      - tecp-log-data:/data
    ports: ["3002:3002"]

  verifier:
    build: .
    command: node packages/tecp-verifier/dist/web.js
    environment:
      - PORT=3004
      - TECP_LOG_URL=http://log:3002
    ports: ["3004:3004"]

  proxy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  tecp-log-data:
  caddy_data:
  caddy_config:
```

Create `Caddyfile` for TLS termination:

```
api.yourdomain.com {
    reverse_proxy demo:3001
}

log.yourdomain.com {
    reverse_proxy log:3002
}

verify.yourdomain.com {
    reverse_proxy verifier:3004
}
```

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

USER node
EXPOSE 3001 3002 3004

# Command will be overridden by docker-compose
CMD ["node", "--version"]
```

### Managed Platform Deployment

#### Fly.io

Create `fly.toml` for each service:

```toml
# fly-demo.toml
app = "tecp-demo"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[[services]]
  http_checks = []
  internal_port = 3001
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
```

Deploy:

```bash
# Deploy transparency log with volume
fly apps create tecp-log
fly volumes create tecp_data --region sjc --size 1
fly deploy -c fly-log.toml

# Deploy demo and verifier
fly apps create tecp-demo
fly deploy -c fly-demo.toml

fly apps create tecp-verifier  
fly deploy -c fly-verifier.toml

# Set secrets
fly secrets set -a tecp-log LOG_PRIVATE_KEY=xxx LOG_PUBLIC_KEY=yyy
fly secrets set -a tecp-demo DEEPSEEK_API_KEY=zzz
```

#### Render

Create `render.yaml`:

```yaml
services:
  - type: web
    name: tecp-log
    env: node
    buildCommand: npm ci && npm run build
    startCommand: node services/tecp-log/dist/index.js
    disk:
      name: tecp-data
      mountPath: /data
      sizeGB: 1
    envVars:
      - key: PORT
        value: 3002
      - key: DB_PATH
        value: /data/tecp.db
      - key: LOG_PRIVATE_KEY
        sync: false
      - key: LOG_PUBLIC_KEY
        sync: false

  - type: web
    name: tecp-demo
    env: node
    buildCommand: npm ci && npm run build
    startCommand: node demo/private-gpt/dist/index.js
    envVars:
      - key: PORT
        value: 3001
      - key: DEEPSEEK_API_KEY
        sync: false
      - key: TECP_LOG_URL
        value: https://tecp-log.onrender.com
```

## Monitoring and Maintenance

### Health Checks

All services provide `/health` endpoints:

```bash
# Check service health
curl https://log.yourdomain.com/health
curl https://api.yourdomain.com/health
curl https://verify.yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "tecp-transparency-log",
  "version": "TECP-0.1",
  "uptime_seconds": 3600
}
```

### Monitoring Setup

#### Prometheus Metrics

Add to each service:

```javascript
const promClient = require('prom-client');
const register = new promClient.Registry();

// Custom metrics
const receiptCounter = new promClient.Counter({
  name: 'tecp_receipts_total',
  help: 'Total number of receipts created',
  labelNames: ['policy_id', 'status']
});

const verificationDuration = new promClient.Histogram({
  name: 'tecp_verification_duration_seconds',
  help: 'Receipt verification duration',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

register.registerMetric(receiptCounter);
register.registerMetric(verificationDuration);

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

#### Grafana Dashboard

Key metrics to monitor:

- Receipt creation rate and latency
- Verification success/failure rates  
- Transparency log growth and health
- Policy violation frequency
- Key rotation status
- Service uptime and response times

#### Alerting Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: tecp
    rules:
      - alert: TECPVerificationFailures
        expr: rate(tecp_verifications_failed_total[5m]) > 0.1
        for: 2m
        annotations:
          summary: "High TECP verification failure rate"
          
      - alert: TECPLogDown
        expr: up{job="tecp-log"} == 0
        for: 1m
        annotations:
          summary: "TECP transparency log is down"
          
      - alert: TECPKeyRotationDue
        expr: time() - tecp_key_created_timestamp > 7776000  # 90 days
        annotations:
          summary: "TECP key rotation due"
```

### Database Maintenance

#### SQLite Optimization

```sql
-- Run weekly
PRAGMA optimize;
PRAGMA wal_checkpoint(TRUNCATE);

-- Monitor database size
SELECT 
  page_count * page_size / 1024 / 1024 as size_mb,
  freelist_count * page_size / 1024 / 1024 as free_mb
FROM pragma_page_count(), pragma_page_size(), pragma_freelist_count();
```

#### Backup Procedures

```bash
#!/bin/bash
# backup-tecp-log.sh

DB_PATH="/data/tecp.db"
BACKUP_PATH="/backups/tecp-$(date +%Y%m%d-%H%M%S).db"
S3_BUCKET="your-backup-bucket"

# Create backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"

# Verify backup
sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;"

# Upload to S3
aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/tecp-logs/"

# Cleanup old local backups (keep 7 days)
find /backups -name "tecp-*.db" -mtime +7 -delete
```

### Key Rotation

#### Quarterly Key Rotation

```bash
#!/bin/bash
# rotate-tecp-keys.sh

# Generate new key pair
NEW_KID="log-$(date +%Y%m)"
echo "Generating new key pair: $NEW_KID"

# Generate keys (use your preferred method)
NEW_KEYS=$(node generate-keys.js)
NEW_PRIVATE_KEY=$(echo "$NEW_KEYS" | grep PRIVATE | cut -d= -f2)
NEW_PUBLIC_KEY=$(echo "$NEW_KEYS" | grep PUBLIC | cut -d= -f2)

# Add new key to transparency log
curl -X POST https://log.yourdomain.com/admin/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"kid\": \"$NEW_KID\",
    \"public_key\": \"$NEW_PUBLIC_KEY\",
    \"status\": \"next\"
  }"

# Wait for propagation
sleep 30

# Activate new key
curl -X PUT https://log.yourdomain.com/admin/keys/$NEW_KID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"active\"}"

# Update environment variables
echo "Update LOG_PRIVATE_KEY and LOG_KEY_ID in your deployment"
echo "LOG_PRIVATE_KEY=$NEW_PRIVATE_KEY"
echo "LOG_KEY_ID=$NEW_KID"

# Schedule old key revocation (after 30 days)
echo "Schedule revocation of old key in 30 days"
```

### Incident Response

#### Receipt Verification Failures

1. Check transparency log health
2. Verify key rotation status  
3. Validate time synchronization
4. Review policy changes
5. Check for network issues

#### Transparency Log Issues

1. Verify database integrity
2. Check disk space and I/O
3. Validate backup procedures
4. Review recent entries for corruption
5. Consider log reconstruction from backups

#### Security Incidents

1. Immediately revoke compromised keys
2. Invalidate affected receipts
3. Notify stakeholders
4. Preserve audit logs
5. Conduct forensic analysis
6. Update security procedures

### Compliance Auditing

#### Audit Log Collection

```bash
# Collect logs for compliance audit
docker logs tecp-log > tecp-log-audit.log
docker logs tecp-demo > tecp-demo-audit.log
docker logs tecp-verifier > tecp-verifier-audit.log

# Extract receipt statistics
sqlite3 /data/tecp.db "
SELECT 
  DATE(timestamp/1000, 'unixepoch') as date,
  COUNT(*) as receipts_created,
  COUNT(DISTINCT code_ref) as unique_builds
FROM entries 
WHERE timestamp > strftime('%s', 'now', '-90 days') * 1000
GROUP BY DATE(timestamp/1000, 'unixepoch')
ORDER BY date;
"
```

#### Compliance Reports

Generate monthly compliance reports:

```bash
#!/bin/bash
# generate-compliance-report.sh

MONTH=$(date +%Y-%m)
REPORT_FILE="tecp-compliance-$MONTH.json"

# Collect metrics
TOTAL_RECEIPTS=$(sqlite3 /data/tecp.db "SELECT COUNT(*) FROM entries WHERE strftime('%Y-%m', timestamp/1000, 'unixepoch') = '$MONTH'")
POLICY_VIOLATIONS=$(grep "Policy violation" /var/log/tecp/*.log | wc -l)
VERIFICATION_FAILURES=$(grep "verification failed" /var/log/tecp/*.log | wc -l)

# Generate report
cat > "$REPORT_FILE" << EOF
{
  "period": "$MONTH",
  "receipts_created": $TOTAL_RECEIPTS,
  "policy_violations": $POLICY_VIOLATIONS,
  "verification_failures": $VERIFICATION_FAILURES,
  "uptime_percentage": 99.9,
  "key_rotations": 0,
  "security_incidents": 0,
  "compliance_status": "COMPLIANT"
}
EOF

echo "Compliance report generated: $REPORT_FILE"
```

## Troubleshooting

### Common Issues

#### "LOG_PRIVATE_KEY environment variable required"
- Ensure LOG_PRIVATE_KEY and LOG_PUBLIC_KEY are set
- Verify base64 encoding is correct
- Check environment variable loading

#### "Receipt verification failed"
- Check timestamp validity (not too old/future)
- Verify signature with correct public key
- Ensure CBOR encoding is canonical
- Validate policy IDs against registry

#### "Transparency log unavailable"
- Check log service health endpoint
- Verify network connectivity
- Review log service logs for errors
- Ensure database is accessible

#### "Policy violation"
- Review policy enforcement logs
- Check policy ID spelling and registration
- Verify policy runtime configuration
- Validate input data against policy rules

### Debug Mode

Enable debug logging:

```bash
export DEBUG=tecp:*
export LOG_LEVEL=debug
npm run dev:all
```

### Performance Tuning

#### SQLite Optimization

```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
PRAGMA temp_store=MEMORY;
PRAGMA mmap_size=268435456;
```

#### Node.js Optimization

```bash
export NODE_OPTIONS="--max-old-space-size=2048"
export UV_THREADPOOL_SIZE=16
```

## Support

- **Documentation**: https://tecp.dev/docs
- **Issues**: https://github.com/tecp-protocol/tecp/issues
- **Security**: security@tecp.dev
- **Community**: https://discord.gg/tecp
