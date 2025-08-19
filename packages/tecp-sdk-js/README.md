# TECP SDK for JavaScript/TypeScript

The official JavaScript/TypeScript SDK for the Trusted Ephemeral Computation Protocol (TECP).

## Installation

```bash
npm install @tecp/sdk
```

## Quick Start

```typescript
import { TECPClient, generateKeyPair } from '@tecp/sdk';

// Generate a key pair for signing receipts
const { privateKey, publicKey } = await generateKeyPair();

// Create a TECP client
const client = new TECPClient({ 
  privateKey,
  profile: 'tecp-v0.1' 
});

// Create a receipt for ephemeral computation
const receipt = await client.createReceipt({
  input: 'sensitive user data',
  output: 'processed result',
  policies: ['no_retention', 'eu_region'],
  codeRef: 'git:abc123def456'
});

console.log('Receipt created:', receipt.version);
console.log('Policies enforced:', receipt.policy_ids);

// Verify the receipt
const verification = await client.verifyReceipt(receipt);
console.log('Receipt valid:', verification.valid);

if (!verification.valid) {
  console.error('Verification errors:', verification.errors);
}
```

## API Reference

### TECPClient

The main client class for creating and verifying TECP receipts.

#### Constructor

```typescript
new TECPClient(options?: TECPClientOptions)
```

## AI Proof Plug-In (One-line Wrapper)

Wrap any async function and automatically issue (and optionally verify) a TECP receipt:

```typescript
import { wrap, generateKeyPair } from '@tecp/sdk';

const { privateKey } = await generateKeyPair();

// Your business logic
async function callLLM(input: string) {
  return await fetch('/api/llm', { method: 'POST', body: input }).then(r => r.json());
}

// One-line proof wrapper
const callLLMWithProof = wrap(callLLM, {
  privateKey,
  policies: ['no_retention', 'no_pii'],
  verify: true,
  codeRef: process.env.GIT_COMMIT
});

const { result, tecp_receipt, tecp_verification } = await callLLMWithProof('Hello');
```

### Next.js example

```typescript
// app/api/complete/route.ts
import { wrap, generateKeyPair } from '@tecp/sdk';

const keys = await generateKeyPair();

async function completeInternal(input: string) {
  // ... call provider ...
  return { text: 'result' };
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const handler = wrap(completeInternal, { privateKey: keys.privateKey, policies: ['no_retention'] });
  const { result, tecp_receipt } = await handler(body.prompt);
  return Response.json({ result, tecp_receipt });
};
```

### Python Flask example

```python
# pip install tecp-sdk-py
from tecp_sdk import wrap, generate_keypair

priv, pub = generate_keypair()

def complete_internal(prompt: str):
    return { 'text': 'result' }

complete_with_proof = wrap(complete_internal, private_key=priv, policies=['no_retention'])

@app.post('/api/complete')
def complete():
    body = request.get_json()
    result, receipt = complete_with_proof(body['prompt'])
    return jsonify({ 'result': result, 'tecp_receipt': receipt })
```

### Trust badge

```typescript
import { injectTrustBadge } from '@tecp/sdk';
injectTrustBadge(); // Adds a small "Powered by TECP" badge in the corner
```

Options:
- `privateKey?: Uint8Array` - Ed25519 private key for signing receipts
- `profile?: TECPProfile` - TECP profile: 'tecp-lite', 'tecp-v0.1', or 'tecp-strict'
- `logUrl?: string` - Transparency log URL for verification
- `verifierUrl?: string` - External verifier service URL

#### Methods

##### createReceipt(options)

Create a cryptographic receipt for ephemeral computation.

```typescript
await client.createReceipt({
  input: 'data to process',
  output: 'processing result',
  policies: ['no_retention', 'key_erasure'],
  codeRef: 'git:commit-hash',
  extensions: { custom: 'metadata' }
});
```

##### verifyReceipt(receipt, options?)

Verify a TECP receipt's cryptographic integrity.

```typescript
const result = await client.verifyReceipt(receipt, {
  requireLog: true,
  profile: 'tecp-strict'
});
```

##### enforcePolicies(policyIds, input, context?)

Enforce policies on input data with runtime checks.

```typescript
const result = await client.enforcePolicies(
  ['no_pii', 'ttl_60s'],
  'user input with email@example.com',
  { maxDuration: 30000 }
);

if (!result.allowed) {
  console.error('Policy violations:', result.violations);
} else if (result.transformedInput !== input) {
  console.log('Input transformed by policies');
}
```

### Convenience Functions

For simple use cases, use the standalone functions:

```typescript
import { createReceipt, verifyReceipt, generateKeyPair } from '@tecp/sdk';

// Generate keys
const { privateKey } = await generateKeyPair();

// Create receipt
const receipt = await createReceipt(
  privateKey,
  'input data',
  'output data',
  ['no_retention']
);

// Verify receipt
const result = await verifyReceipt(receipt);
```

## TECP Profiles

The SDK supports three TECP profiles:

### tecp-lite
- Minimal requirements for development/testing
- 7-day timestamp validity
- Policy enforcement optional
- No transparency log required

### tecp-v0.1 (Default)
- Balanced security and usability
- 24-hour timestamp validity
- Policy enforcement recommended
- Transparency log optional

### tecp-strict
- Maximum security for production
- 1-hour timestamp validity
- Policy enforcement mandatory
- Transparency log required
- Key rotation support

## Policy Enforcement

The SDK includes built-in policy enforcers:

### no_pii
Automatically redacts common PII patterns:
- Email addresses → `[EMAIL_REDACTED]`
- Social Security Numbers → `[SSN_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`
- Credit card numbers → `[CC_REDACTED]`

### ttl_60s
Enforces time-to-live limits on processing:
- Aborts if processing exceeds 60 seconds
- Provides elapsed time evidence

### no_network
Network isolation enforcement (stub implementation):
- Claims network access is blocked
- Provides isolation evidence

## Error Handling

The SDK uses structured error codes for consistent error handling:

```typescript
try {
  const receipt = await client.createReceipt(options);
} catch (error) {
  if (error.code === 'E-SIG-002') {
    console.error('Signature verification failed');
  } else if (error.code === 'E-POLICY-001') {
    console.error('Unknown policy ID');
  }
}
```

Common error codes:
- `E-SIG-*`: Signature-related errors
- `E-TS-*`: Timestamp validation errors
- `E-POLICY-*`: Policy enforcement errors
- `E-LOG-*`: Transparency log errors

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type { 
  FullReceipt, 
  VerificationResult, 
  TECPProfile 
} from '@tecp/sdk';

function processReceipt(receipt: FullReceipt): VerificationResult {
  // Full type safety
}
```

## Examples

### Web Application

```typescript
// In a web app processing user data
import { TECPClient } from '@tecp/sdk';

const client = new TECPClient({ 
  privateKey: await loadPrivateKey(),
  profile: 'tecp-v0.1'
});

app.post('/api/process', async (req, res) => {
  const input = JSON.stringify(req.body);
  
  // Process data ephemerally
  const output = await processUserData(req.body);
  
  // Create receipt proving ephemeral processing
  const receipt = await client.createReceipt({
    input,
    output: JSON.stringify(output),
    policies: ['no_retention', 'eu_region'],
    codeRef: process.env.GIT_COMMIT
  });
  
  res.json({
    result: output,
    tecp_receipt: receipt
  });
});
```

### Serverless Function

```typescript
// AWS Lambda with TECP receipts
import { createReceipt } from '@tecp/sdk';

export const handler = async (event) => {
  const privateKey = Buffer.from(process.env.TECP_PRIVATE_KEY, 'base64');
  
  // Process event data
  const result = await processEvent(event);
  
  // Create receipt
  const receipt = await createReceipt(
    privateKey,
    JSON.stringify(event),
    JSON.stringify(result),
    ['no_retention', 'key_erasure']
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      tecp_receipt: receipt
    })
  };
};
```

### Policy Enforcement

```typescript
// Enforce policies before processing
const client = new TECPClient();

const policyResult = await client.enforcePolicies(
  ['no_pii', 'ttl_30s'],
  userInput,
  { maxDuration: 30000 }
);

if (!policyResult.allowed) {
  throw new Error(`Policy violation: ${policyResult.violations.join(', ')}`);
}

// Use transformed input if policies modified it
const processedInput = policyResult.transformedInput;
```

## Contributing

See the main [TECP repository](https://github.com/tecp-protocol/tecp) for contribution guidelines.

## License

Apache-2.0 - see [LICENSE](LICENSE) file for details.
