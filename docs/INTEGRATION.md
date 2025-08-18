# TECP Integration Guide

How to integrate TECP into your API for verifiable ephemeral computation.

## Quick Start

### 1. Install TECP SDK

**Node.js/TypeScript:**
```bash
npm install @tecp/core
```

**Python:**
```bash
pip install tecp
```

**Rust:**
```bash
cargo add tecp
```

### 2. Generate Keys

```bash
# Generate Ed25519 key pair
openssl genpkey -algorithm Ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```

### 3. Basic Integration

**Express.js Example:**
```javascript
import { ReceiptSigner } from '@tecp/core';
import { readFileSync } from 'fs';

// Load keys
const privateKey = readFileSync('private.pem');
const publicKey = readFileSync('public.pem');
const signer = new ReceiptSigner(privateKey, publicKey);

app.post('/api/process', async (req, res) => {
  const input = JSON.stringify(req.body);
  
  // Your computation here
  const result = await processData(req.body);
  const output = JSON.stringify(result);
  
  // Generate TECP receipt
  const receipt = await signer.createReceipt({
    code_ref: 'git:' + process.env.GIT_COMMIT,
    input: Buffer.from(input),
    output: Buffer.from(output),
    policy_ids: ['no_retention', 'key_erasure']
  });
  
  res.json({
    result,
    tecp_receipt: receipt
  });
});
```

**FastAPI Example:**
```python
from tecp import ReceiptSigner
from fastapi import FastAPI
import json

# Load keys
with open('private.pem', 'rb') as f:
    private_key = f.read()
with open('public.pem', 'rb') as f:
    public_key = f.read()

signer = ReceiptSigner(private_key, public_key)
app = FastAPI()

@app.post("/api/process")
async def process_data(data: dict):
    input_data = json.dumps(data).encode()
    
    # Your computation here
    result = await process_data_logic(data)
    output_data = json.dumps(result).encode()
    
    # Generate TECP receipt
    receipt = signer.create_receipt(
        code_ref=f"git:{os.getenv('GIT_COMMIT')}",
        input_data=input_data,
        output_data=output_data,
        policy_ids=["no_retention", "key_erasure"]
    )
    
    return {
        "result": result,
        "tecp_receipt": receipt.dict()
    }
```

## Integration Patterns

### 1. API Proxy Pattern

Wrap existing APIs with TECP receipts:

```javascript
// TECP proxy middleware
function tecpProxy(options) {
  const signer = new ReceiptSigner(options.privateKey, options.publicKey);
  
  return async (req, res, next) => {
    // Capture original response
    const originalSend = res.json;
    
    res.json = async function(data) {
      const input = JSON.stringify(req.body || {});
      const output = JSON.stringify(data);
      
      // Generate receipt
      const receipt = await signer.createReceipt({
        code_ref: options.codeRef,
        input: Buffer.from(input),
        output: Buffer.from(output),
        policy_ids: options.policyIds || ['no_retention']
      });
      
      // Return data with receipt
      return originalSend.call(this, {
        ...data,
        tecp_receipt: receipt
      });
    };
    
    next();
  };
}

// Usage
app.use('/api', tecpProxy({
  privateKey: process.env.TECP_PRIVATE_KEY,
  publicKey: process.env.TECP_PUBLIC_KEY,
  codeRef: `git:${process.env.GIT_COMMIT}`,
  policyIds: ['no_retention', 'key_erasure']
}));
```

### 2. Sidecar Pattern

Deploy TECP as a sidecar service:

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: your-app:latest
    environment:
      - TECP_SIDECAR_URL=http://tecp-sidecar:3000
  
  tecp-sidecar:
    image: tecp/sidecar:latest
    environment:
      - TECP_PRIVATE_KEY_PATH=/keys/private.pem
      - TECP_PUBLIC_KEY_PATH=/keys/public.pem
    volumes:
      - ./keys:/keys:ro
```

Application code:
```javascript
// Submit computation to TECP sidecar
async function processWithTECP(input, policyIds) {
  const response = await fetch('http://tecp-sidecar:3000/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      code_ref: `git:${process.env.GIT_COMMIT}`,
      policy_ids: policyIds,
      computation: 'your-computation-logic'
    })
  });
  
  return response.json(); // Returns { result, tecp_receipt }
}
```

### 3. Serverless Pattern

TECP in serverless functions:

```javascript
// AWS Lambda with TECP
import { ReceiptSigner } from '@tecp/core';

const signer = new ReceiptSigner(
  Buffer.from(process.env.TECP_PRIVATE_KEY, 'base64'),
  Buffer.from(process.env.TECP_PUBLIC_KEY, 'base64')
);

export const handler = async (event) => {
  const input = JSON.stringify(event);
  
  // Your serverless logic
  const result = await processEvent(event);
  const output = JSON.stringify(result);
  
  // Generate receipt
  const receipt = await signer.createReceipt({
    code_ref: `lambda:${context.functionName}:${context.functionVersion}`,
    input: Buffer.from(input),
    output: Buffer.from(output),
    policy_ids: ['no_retention', 'serverless_execution'],
    extensions: {
      environment: {
        region: process.env.AWS_REGION,
        provider: 'aws-lambda'
      }
    }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      tecp_receipt: receipt
    })
  };
};
```

## Policy Configuration

### Common Policy Sets

**Healthcare/HIPAA:**
```javascript
const healthcarePolicies = [
  'no_retention',
  'hipaa_safe',
  'no_export_pii',
  'key_erasure',
  'audit_trail'
];
```

**Financial/PCI:**
```javascript
const financialPolicies = [
  'no_retention',
  'pci_dss_compliant',
  'key_erasure',
  'sox_compliant',
  'audit_trail'
];
```

**GDPR Compliance:**
```javascript
const gdprPolicies = [
  'no_retention',
  'eu_region',
  'gdpr_compliant',
  'gdpr_art6_lawful',
  'key_erasure'
];
```

### Custom Policies

Define custom policies in your policy registry:

```json
{
  "custom_retention_24h": {
    "description": "Data retained for maximum 24 hours",
    "enforcement_type": "runtime",
    "machine_check": "ttl_validation",
    "compliance_tags": ["Custom.Retention"],
    "technical_details": "Automated deletion after 24 hours"
  }
}
```

## Transparency Log Integration

### Submit to Transparency Log

```javascript
async function submitToTransparencyLog(receipt) {
  const logUrl = process.env.TECP_LOG_URL;
  if (!logUrl) return null;
  
  try {
    const response = await fetch(`${logUrl}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code_ref: receipt.code_ref,
        receipt_hash: createHash('sha256')
          .update(JSON.stringify(receipt))
          .digest('hex')
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        leaf_index: result.leaf_index,
        merkle_proof: result.proof?.audit_path || [],
        log_root: result.root
      };
    }
  } catch (error) {
    console.warn('Failed to submit to transparency log:', error);
  }
  
  return null;
}

// Add to receipt
const logInclusion = await submitToTransparencyLog(receipt);
if (logInclusion) {
  receipt.log_inclusion = logInclusion;
}
```

### Verify Log Inclusion

```javascript
async function verifyLogInclusion(receipt) {
  if (!receipt.log_inclusion) return false;
  
  const logUrl = process.env.TECP_LOG_URL;
  const { leaf_index, merkle_proof, log_root } = receipt.log_inclusion;
  
  // Fetch current root
  const rootResponse = await fetch(`${logUrl}/root`);
  const currentRoot = await rootResponse.json();
  
  // Verify proof
  return verifyMerkleProof(leaf_index, merkle_proof, log_root, currentRoot);
}
```

## Key Management

### Development Keys

```bash
# Generate development keys
npm run gen:keys

# Keys stored in .keys/
# - ed25519.priv (private key)
# - ed25519.pub (public key)
```

### Production Keys

**AWS KMS:**
```javascript
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

class KMSReceiptSigner {
  constructor(keyId) {
    this.kms = new KMSClient();
    this.keyId = keyId;
  }
  
  async createReceipt(params) {
    // Create receipt data
    const receiptData = this.buildReceiptData(params);
    
    // Sign with KMS
    const signCommand = new SignCommand({
      KeyId: this.keyId,
      Message: Buffer.from(JSON.stringify(receiptData)),
      SigningAlgorithm: 'ECDSA_SHA_256'
    });
    
    const signature = await this.kms.send(signCommand);
    
    return {
      ...receiptData,
      sig: Buffer.from(signature.Signature).toString('base64')
    };
  }
}
```

**HashiCorp Vault:**
```javascript
import vault from 'node-vault';

class VaultReceiptSigner {
  constructor(vaultUrl, token, keyName) {
    this.vault = vault({ endpoint: vaultUrl, token });
    this.keyName = keyName;
  }
  
  async createReceipt(params) {
    const receiptData = this.buildReceiptData(params);
    
    // Sign with Vault
    const signature = await this.vault.write(
      `transit/sign/${this.keyName}`,
      {
        input: Buffer.from(JSON.stringify(receiptData)).toString('base64')
      }
    );
    
    return {
      ...receiptData,
      sig: signature.data.signature
    };
  }
}
```

## Monitoring & Observability

### Metrics Collection

```javascript
import { createPrometheusMetrics } from '@prometheus/client';

const metrics = {
  receiptsGenerated: new Counter({
    name: 'tecp_receipts_generated_total',
    help: 'Total number of TECP receipts generated',
    labelNames: ['policy_set', 'status']
  }),
  
  receiptGenerationTime: new Histogram({
    name: 'tecp_receipt_generation_duration_seconds',
    help: 'Time spent generating TECP receipts',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
  }),
  
  transparencyLogSubmissions: new Counter({
    name: 'tecp_transparency_log_submissions_total',
    help: 'Total transparency log submissions',
    labelNames: ['status']
  })
};

// Instrument receipt generation
async function instrumentedCreateReceipt(signer, params) {
  const timer = metrics.receiptGenerationTime.startTimer();
  
  try {
    const receipt = await signer.createReceipt(params);
    metrics.receiptsGenerated.inc({ 
      policy_set: params.policy_ids.join(','), 
      status: 'success' 
    });
    return receipt;
  } catch (error) {
    metrics.receiptsGenerated.inc({ 
      policy_set: params.policy_ids.join(','), 
      status: 'error' 
    });
    throw error;
  } finally {
    timer();
  }
}
```

### Health Checks

```javascript
app.get('/health/tecp', async (req, res) => {
  const health = {
    status: 'healthy',
    tecp_version: 'TECP-0.1',
    features: [],
    checks: {}
  };
  
  // Check key availability
  try {
    await signer.createReceipt({
      code_ref: 'health:check',
      input: Buffer.from('test'),
      output: Buffer.from('test'),
      policy_ids: ['no_retention']
    });
    health.checks.key_signing = 'ok';
    health.features.push('receipt_generation');
  } catch (error) {
    health.checks.key_signing = 'error';
    health.status = 'unhealthy';
  }
  
  // Check transparency log
  if (process.env.TECP_LOG_URL) {
    try {
      const response = await fetch(`${process.env.TECP_LOG_URL}/health`);
      health.checks.transparency_log = response.ok ? 'ok' : 'error';
      if (response.ok) health.features.push('transparency_log');
    } catch (error) {
      health.checks.transparency_log = 'error';
    }
  }
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

## Testing

### Unit Tests

```javascript
import { ReceiptSigner, ReceiptVerifier } from '@tecp/core';
import { generateKeyPair } from 'crypto';

describe('TECP Integration', () => {
  let signer, verifier, keyPair;
  
  beforeAll(async () => {
    keyPair = generateKeyPair('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    signer = new ReceiptSigner(
      Buffer.from(keyPair.privateKey),
      Buffer.from(keyPair.publicKey)
    );
    verifier = new ReceiptVerifier();
  });
  
  test('generates valid receipt', async () => {
    const receipt = await signer.createReceipt({
      code_ref: 'test:unit',
      input: Buffer.from('test input'),
      output: Buffer.from('test output'),
      policy_ids: ['no_retention']
    });
    
    expect(receipt.version).toBe('TECP-0.1');
    expect(receipt.policy_ids).toContain('no_retention');
    
    const result = await verifier.verify(receipt);
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

```javascript
describe('API Integration', () => {
  test('API returns receipt with response', async () => {
    const response = await request(app)
      .post('/api/process')
      .send({ test: 'data' })
      .expect(200);
    
    expect(response.body).toHaveProperty('result');
    expect(response.body).toHaveProperty('tecp_receipt');
    
    const receipt = response.body.tecp_receipt;
    expect(receipt.version).toBe('TECP-0.1');
    
    // Verify receipt
    const verifier = new ReceiptVerifier();
    const result = await verifier.verify(receipt);
    expect(result.valid).toBe(true);
  });
});
```

## Deployment Considerations

### Environment Variables

```bash
# Required
TECP_PRIVATE_KEY=base64_encoded_private_key
TECP_PUBLIC_KEY=base64_encoded_public_key
GIT_COMMIT=current_git_commit_hash

# Optional
TECP_LOG_URL=https://log.tecp.dev
TECP_VERIFIER_URL=https://verify.tecp.dev
TECP_POLICY_REGISTRY_URL=https://policies.tecp.dev
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

# Install TECP dependencies
RUN npm install -g @tecp/core

# Copy application
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm install

# Create keys directory
RUN mkdir -p /app/.keys
VOLUME ["/app/.keys"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health/tecp || exit 1

EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tecp-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tecp-app
  template:
    metadata:
      labels:
        app: tecp-app
    spec:
      containers:
      - name: app
        image: your-app:latest
        env:
        - name: TECP_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: tecp-keys
              key: private-key
        - name: TECP_PUBLIC_KEY
          valueFrom:
            secretKeyRef:
              name: tecp-keys
              key: public-key
        - name: GIT_COMMIT
          value: "{{ .Values.gitCommit }}"
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health/tecp
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/tecp
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Secret
metadata:
  name: tecp-keys
type: Opaque
data:
  private-key: <base64-encoded-private-key>
  public-key: <base64-encoded-public-key>
```

## Troubleshooting

### Common Issues

**Receipt verification fails:**
- Check timestamp is within 24 hours and not in future
- Verify signature with correct public key
- Ensure CBOR encoding is deterministic

**Performance issues:**
- Use connection pooling for transparency log
- Cache policy registry locally
- Consider async receipt generation

**Key management:**
- Rotate keys regularly
- Use hardware security modules in production
- Implement proper key backup and recovery

### Debug Mode

```javascript
// Enable debug logging
process.env.TECP_DEBUG = 'true';

// Detailed verification
const result = await verifier.verify(receipt, { verbose: true });
console.log('Verification details:', result.details);
```

## Support

- **Documentation**: https://tecp.dev/docs
- **GitHub Issues**: https://github.com/tecp-protocol/tecp/issues
- **Community**: https://github.com/tecp-protocol/tecp/discussions
- **Security**: security@tecp.dev

---

**Ready to make privacy violations mathematically impossible? Start integrating TECP today!** 🔒
