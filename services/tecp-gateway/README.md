# 🚀 TECP Enterprise AI Guardrail Gateway

A transparent proxy service that wraps LLM API calls with cryptographic privacy receipts and policy enforcement.

## 🎯 What It Does

- **Transparent Proxy**: Drop-in replacement for OpenAI/Anthropic APIs
- **Policy Enforcement**: Automatic privacy policy application (no_retention, no_pii, etc.)
- **Cryptographic Receipts**: Mathematical proof of compliant processing
- **PII Detection**: Automatic detection and optional redaction of sensitive data
- **Compliance Reporting**: Built-in audit trails for GDPR, HIPAA, SOX compliance

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
vim .env
```

### 2. Install & Run

```bash
npm install
npm run dev
```

### 3. Use as Drop-in Replacement

```javascript
// Instead of:
// export OPENAI_API_BASE_URL=https://api.openai.com

// Use:
export OPENAI_API_BASE_URL=https://your-tecp-gateway.com/v1
export OPENAI_API_KEY=your-openai-key
export TECP_API_KEY=tecp-demo-key
```

## 📡 API Usage

### Chat Completions with TECP

```bash
curl -X POST https://your-gateway.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "x-tecp-api-key: tecp-demo-key" \
  -H "x-tecp-policies: no_retention,no_pii,audit_trail" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Analyze this patient data..."}
    ]
  }'
```

### Enhanced Response Format

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1699123456,
  "model": "gpt-4",
  "choices": [...],
  "usage": {...},
  
  "tecp_receipt": {
    "receipt_id": "rcpt_abc123",
    "input_hash": "sha256:...",
    "output_hash": "sha256:...",
    "policy_ids": ["no_retention", "no_pii", "audit_trail"],
    "timestamp": 1699123456,
    "signature": "ed25519:...",
    "transparency_log_entry": "log_entry_xyz789"
  },
  
  "tecp_policy_enforcement": {
    "policies_applied": ["no_retention", "no_pii", "audit_trail"],
    "pii_detected": false,
    "pii_redacted": false,
    "compliance_tags": ["GDPR-Art17", "HIPAA-164.514", "SOX-404"]
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=production

# Authentication
JWT_SECRET=your-super-secret-key
API_KEY_HEADER=x-tecp-api-key

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# TECP Features
POLICY_ENFORCEMENT_ENABLED=true
RECEIPT_GENERATION_ENABLED=true
DEFAULT_POLICIES=no_retention,audit_trail

# PII Protection
PII_DETECTION_ENABLED=true
PII_REDACTION_ENABLED=false

# Transparency Log
TRANSPARENCY_LOG_URL=https://log.tecp.dev
TRANSPARENCY_LOG_ENABLED=true
```

### Supported Models

- **OpenAI**: gpt-4, gpt-3.5-turbo, text-davinci-003
- **Anthropic**: claude-3-opus, claude-3-sonnet, claude-3-haiku

## 🏥 Healthcare Example

```javascript
const openai = new OpenAI({
  baseURL: 'https://your-tecp-gateway.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'x-tecp-api-key': 'your-tecp-key',
    'x-tecp-policies': 'no_retention,no_pii,hipaa_compliant,audit_trail',
    'x-tecp-user-id': 'doctor_123',
    'x-tecp-session-id': 'session_abc'
  }
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'user', 
      content: 'Summarize this patient chart: [PATIENT DATA]'
    }
  ]
});

// Response includes cryptographic receipt proving:
// - No patient data was retained
// - PII was detected and handled appropriately  
// - HIPAA compliance policies were enforced
// - Full audit trail is available
console.log(response.tecp_receipt);
```

## 🏢 Enterprise Deployment

### Docker

```bash
docker build -t tecp-gateway .
docker run -p 3001:3001 --env-file .env tecp-gateway
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

### Monitoring

- **Health Check**: `GET /health`
- **Metrics**: `GET /admin/metrics` 
- **Dashboard**: `GET /admin/dashboard`

## 🔒 Security Features

- **Rate Limiting**: Configurable per-client limits
- **Input Validation**: Zod schema validation
- **PII Detection**: Automatic sensitive data detection
- **Audit Logging**: Complete request/response logging
- **Policy Enforcement**: Runtime privacy policy validation

## 📊 Compliance

### Supported Standards

- **GDPR**: Articles 6, 17, 30, 44
- **HIPAA**: 164.312, 164.514
- **SOX**: Section 404
- **ISO 27001**: Information security controls

### Audit Reports

```bash
# Generate compliance report
curl -H "x-tecp-api-key: admin-key" \
  https://your-gateway.com/admin/compliance-report?standard=GDPR&period=30d
```

## 🚀 Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerting
- [ ] Enable transparency log
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS termination
- [ ] Review security headers
- [ ] Test disaster recovery

## 📈 Roadmap

- **Phase 1**: ✅ Core proxy functionality
- **Phase 2**: 🔄 Advanced PII detection
- **Phase 3**: 📋 Compliance dashboard
- **Phase 4**: 🏥 Healthcare pilot
- **Phase 5**: 💼 Enterprise packaging

## 🤝 Support

- **Documentation**: https://tecp.dev/docs/gateway
- **Issues**: https://github.com/resetroot99/tecp/issues
- **Enterprise**: enterprise@tecp.dev

---

**TECP Gateway transforms any LLM API into a compliance-grade, privacy-preserving service with cryptographic guarantees.**
