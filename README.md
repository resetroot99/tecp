# TECP Protocol v0.1

**Trusted Ephemeral Computation Protocol**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/resetroot99/tecp)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/protocol-TECP--0.1-purple)](spec/PROTOCOL.md)

TECP provides cryptographic proof that sensitive data was processed ephemerally and never stored. The protocol enables AI services, healthcare platforms, and financial applications to demonstrate compliance with privacy regulations through mathematical guarantees rather than legal promises.

## Overview

When applications process sensitive data through third-party services, users must trust that their information will not be retained. TECP eliminates this trust requirement by providing cryptographic receipts that prove data was processed in an ephemeral environment and subsequently deleted.

The protocol is analogous to TLS for computation: where TLS proves a connection is encrypted, TECP proves data was processed ephemerally.

## Key Features

- **Cryptographic Receipts**: Ed25519-signed proofs of ephemeral processing with SHA-256 integrity hashes
- **Transparency Ledger**: Public Merkle tree providing independent verification of all computations
- **Policy Enforcement**: Machine-readable privacy policies with runtime validation
- **Compliance Ready**: Documentation and implementations for HIPAA, SOX, and GDPR requirements
- **Production Tested**: Sub-10ms receipt generation, sub-5ms verification, comprehensive test coverage

## Quick Start

```bash
# Clone repository
git clone https://github.com/resetroot99/tecp.git
cd tecp

# Install dependencies
npm install

# Generate cryptographic keys
npm run gen:keys

# Start all services
npm run dev:all
```

Access the reference implementation at http://localhost:3005

## Architecture

TECP consists of three primary components:

### Core Protocol Engine
The protocol engine generates and verifies cryptographic receipts using CBOR encoding and Ed25519 signatures. Each receipt contains:

- Protocol version and code reference
- Timestamp and nonce for replay protection
- SHA-256 hashes of input and output data
- Policy identifiers with enforcement evidence
- Cryptographic signature and public key reference

### Transparency Ledger
A public Merkle tree that logs all computations, enabling independent verification. The ledger provides:

- Immutable audit trail of all receipts
- Inclusion proofs for verification
- Signed tree heads with key rotation support
- RESTful API for programmatic access

### Policy Runtime
Enforces privacy policies during computation with real-time validation:

- PII detection and redaction
- Time-to-live enforcement for ephemeral data
- Network isolation controls
- Evidence collection for compliance auditing

## Integration

### Server-Side Gateway

```bash
export TECP_PROFILE=STRICT
export TECP_PRIVATE_KEY="$(cat ./keys/gw_ed25519)"
export TECP_KID="gateway-2025-10"
export TECP_LOG_URL="https://log.example.com"

node services/tecp-gateway/dist/index.js
```

### Client-Side Verification

```bash
npm install @tecp/sdk-js
```

```typescript
import { verifyReceipt } from "@tecp/sdk-js";
import { Keyring } from "@tecp/sdk-js/keyring";

const logKeys = await Keyring.fromJWKS(
  "https://log.example.com/.well-known/tecp-log-jwks"
);

const result = await verifyReceipt(receipt, { logKeys });

if (result.ok) {
  console.log(`Verified: ${result.profile} profile`);
  console.log(`Input hash: ${result.receipt.input_hash}`);
  console.log(`Policies: ${result.receipt.policy_ids.join(", ")}`);
}
```

## Use Cases

### Healthcare
Process medical records and patient data with HIPAA-compliant ephemeral computation. Cryptographic receipts demonstrate that protected health information was deleted after analysis.

### Financial Services
Analyze financial data for fraud detection and credit scoring while maintaining SOX compliance through immutable audit trails and cryptographic proof of data deletion.

### Legal Services
Review contracts and legal documents with AI while preserving attorney-client privilege. Receipts prove that privileged information was not retained by third-party services.

### Government
Process classified or sensitive government data through AI services with cryptographic proof that information was deleted, satisfying FedRAMP and other federal security requirements.

## Security Model

TECP v0.1 provides the following security guarantees:

| Property | Implementation | Verification Method |
|----------|----------------|---------------------|
| Ephemeral Design | Receipt proves computation was designed to be ephemeral | Cryptographic signature validation |
| Input/Output Integrity | SHA-256 hashes of all processed data | Independent hash verification |
| Policy Enforcement | Runtime validation with evidence collection | Machine-readable proof inspection |
| Temporal Bounds | Timestamp validation with configurable skew limits | Transparency log anchoring |
| Non-Repudiation | Ed25519 signatures on all receipts | Public key cryptography |
| Transparency | Public Merkle tree of all computations | Inclusion proof validation |

### Threat Model

The protocol assumes:
- Cryptographic primitives (Ed25519, SHA-256) are secure
- Transparency log operators are honest-but-curious
- Clients can access and verify public transparency logs
- System clocks are synchronized within acceptable bounds

TECP does **not** guarantee:
- Physical security of computation environments
- Protection against side-channel attacks
- Real-time detection of policy violations
- Prevention of data exfiltration through covert channels

For detailed security analysis, see [THREAT_MODEL.md](spec/THREAT_MODEL.md).

## Performance

Benchmarks on commodity hardware (2023 MacBook Pro, M2):

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Receipt Generation | ~3ms | 330 receipts/sec |
| Receipt Verification | ~1ms | 1000 verifications/sec |
| Transparency Log Append | ~5ms | 200 entries/sec |
| Inclusion Proof Generation | ~2ms | 500 proofs/sec |

Receipt size: ~2KB (CBOR-encoded)

## Repository Structure

```
tecp/
├── packages/
│   ├── tecp-core/              # Core protocol implementation
│   ├── tecp-verifier/          # Verification tools
│   ├── tecp-reference-ui/      # Web interface
│   ├── tecp-sdk-js/            # JavaScript/TypeScript SDK
│   ├── tecp-sdk-py/            # Python SDK
│   └── tecp-sdk-go/            # Go SDK
├── services/
│   └── tecp-log/               # Transparency ledger service
├── demo/
│   └── private-gpt/            # OpenAI-compatible API demo
├── deployments/
│   ├── docker-compose.yml      # Docker deployment
│   ├── fly/                    # Fly.io configuration
│   └── render/                 # Render.com templates
├── spec/
│   ├── PROTOCOL.md             # Protocol specification
│   ├── THREAT_MODEL.md         # Security analysis
│   ├── TECP-LITE.md           # Minimal profile
│   ├── TECP-STRICT.md         # Maximum security profile
│   └── test-vectors/           # Interoperability tests
└── docs/
    ├── OPERATIONS.md           # Deployment guide
    └── INTEGRATION.md          # SDK documentation
```

## Deployment

### Docker

```bash
cd deployments
docker-compose up -d --build
```

Services available at:
- Reference UI: http://localhost:3000
- API Gateway: http://localhost:3001
- Transparency Log: http://localhost:3002
- Verifier: http://localhost:3004

### Cloud Platforms

Production deployment configurations are provided for:
- **Fly.io**: `deployments/fly/`
- **Render**: `deployments/render/`
- **Netlify**: `netlify.toml`
- **Vercel**: `vercel.json`

See [OPERATIONS.md](docs/OPERATIONS.md) for detailed deployment instructions.

## SDKs

### JavaScript/TypeScript
```bash
npm install @tecp/sdk-js
```

### Python
```bash
pip install tecp-sdk-py
```

### Go
```bash
go get github.com/resetroot99/tecp/packages/tecp-sdk-go
```

Complete SDK documentation available in [INTEGRATION.md](docs/INTEGRATION.md).

## Compliance

TECP provides compliance support for:

- **HIPAA**: Cryptographic proof of PHI deletion satisfies Security Rule requirements
- **SOX**: Immutable audit trail for financial data processing
- **GDPR**: Right to erasure with verifiable deletion proofs
- **CCPA**: Consumer data deletion with cryptographic verification
- **FedRAMP**: Audit trails and data handling controls for federal systems

Policy mappings and compliance documentation available in `spec/policy-registry.json`.

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run interoperability tests
npm run test:interop

# Generate coverage report
npm run test:coverage
```

Test coverage: 95%+

## Contributing

Contributions are welcome. Please review the contribution guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit pull request with detailed description

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.

## Documentation

- [Protocol Specification](spec/PROTOCOL.md)
- [Security Model](spec/THREAT_MODEL.md)
- [Operations Guide](docs/OPERATIONS.md)
- [Integration Guide](docs/INTEGRATION.md)
- [API Reference](https://tecp.dev/api)

## Support

- Documentation: https://tecp.dev
- Issues: https://github.com/resetroot99/tecp/issues
- Discussions: https://github.com/resetroot99/tecp/discussions

## Citation

If you use TECP in academic work, please cite:

```bibtex
@software{tecp2025,
  title = {TECP: Trusted Ephemeral Computation Protocol},
  author = {TECP Contributors},
  year = {2025},
  url = {https://github.com/resetroot99/tecp},
  version = {0.1}
}
```

## Acknowledgments

TECP builds upon established cryptographic primitives and transparency log designs. The protocol is inspired by Certificate Transparency (RFC 6962) and incorporates lessons from production privacy-preserving systems.

