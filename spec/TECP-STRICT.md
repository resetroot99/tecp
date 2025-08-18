# TECP-STRICT Profile Specification

**Version**: TECP-0.1  
**Status**: Draft  
**Date**: December 2024

## Overview

TECP-STRICT is the production-grade profile of the Trusted Ephemeral Computation Protocol designed for high-assurance ephemeral computation with comprehensive verification and auditability.

## Profile Requirements

### Mandatory Fields

All TECP-STRICT receipts MUST contain the 9 core fields plus mandatory extensions:

#### Core Fields
- `version`: "TECP-0.1"
- `code_ref`: Git commit or build hash with cryptographic verification
- `ts`: Unix timestamp in milliseconds
- `nonce`: 16-byte base64 cryptographically secure random value
- `input_hash`: SHA-256 hash of input data (base64)
- `output_hash`: SHA-256 hash of output data (base64)
- `policy_ids`: Array of policy identifiers (MUST NOT be empty)
- `sig`: Ed25519 signature over core fields (base64)
- `pubkey`: Ed25519 public key (base64)

#### Mandatory Extensions
- `log_inclusion`: Transparency log inclusion proof
- `key_erasure`: Cryptographic key erasure evidence
- `anchors.signed_time`: Signed timestamp from trusted time source

### Required Extensions Structure

```typescript
interface StrictReceiptExtensions {
  log_inclusion: {
    leaf_index: number;
    merkle_proof: string[];
    log_root: string;
  };
  key_erasure: {
    scheme: 'counter+seal@tee' | 'hw-hsm' | 'sw-secure';
    evidence: string; // base64 attestation
  };
  anchors: {
    signed_time: {
      timestamp: number;
      signature: string;
      kid: string; // Key ID for rotation
    };
  };
  ext: {
    policy_enforced: Record<string, unknown>; // Runtime enforcement evidence
    compliance_claims: string[];
  };
}
```

### Verification Requirements

#### Timestamp Validation
- Maximum age: 1 hour (3600 seconds)
- Clock skew tolerance: 1 minute (60 seconds)
- MUST verify against signed time anchor
- MUST reject receipts with future timestamps beyond skew

#### Policy Enforcement
- ALL policy IDs MUST be recognized and validated
- Runtime policy enforcement MUST be cryptographically proven
- Policy violations MUST cause verification failure
- Policy evidence MUST be included in `ext.policy_enforced`

#### Transparency Log Verification
- MUST verify Merkle inclusion proof
- MUST validate against current signed root
- MUST check root signature against known log keys
- MUST support key rotation via `/keys` endpoint

#### Signature Validation
- Standard Ed25519 signature verification
- CBOR canonicalization with deterministic key ordering
- MUST verify against current or valid historical keys
- MUST support key rotation and revocation

## Mandatory Policies

TECP-STRICT receipts MUST include at least one of:

- `no_retention`: Data not stored after processing
- `key_erasure`: Cryptographic keys destroyed
- `ttl_*`: Time-bounded processing
- `no_network`: Network isolation enforced
- `no_pii`: PII redaction applied

## Security Requirements

### Cryptographic Standards
- Ed25519 signatures with SHA-512
- SHA-256 for all hash operations
- Cryptographically secure random number generation
- Deterministic CBOR encoding (RFC 8949)

### Key Management
- Key rotation support via transparency log `/keys` endpoint
- Key revocation with immediate effect
- Minimum key lifetime: 30 days
- Maximum key lifetime: 1 year

### Transparency Log Requirements
- Public append-only log with Merkle tree structure
- Signed tree heads with key rotation support
- Inclusion proofs verifiable by third parties
- Minimum retention: 7 years

## Compliance Guarantees

TECP-STRICT provides cryptographically verifiable evidence for:

### GDPR Compliance
- **Article 17** (Right to Erasure): Cryptographic proof of data deletion
- **Article 25** (Data Protection by Design): Technical safeguards proven
- **Article 32** (Security of Processing): Cryptographic integrity

### HIPAA Compliance
- **§164.312(a)(1)**: Access control via policy enforcement
- **§164.312(c)(1)**: Integrity controls via cryptographic hashing
- **§164.312(e)(1)**: Transmission security via signed receipts

### SOC 2 Type II
- **CC6.1**: Logical access controls via policy enforcement
- **CC6.7**: Data transmission controls via cryptographic verification
- **CC7.1**: System operations via transparency log

## Implementation Requirements

### Receipt Generation
```typescript
// TECP-STRICT receipt creation
const receipt = await signer.createReceipt({
  code_ref: verifiedGitCommit,
  input: inputData,
  output: outputData,
  policy_ids: ['no_retention', 'key_erasure', 'ttl_60s'],
  profile: 'tecp-strict',
  extensions: {
    // All extensions mandatory for STRICT profile
  }
});
```

### Verification Process
1. Validate core receipt structure and signatures
2. Verify timestamp against signed time anchor
3. Validate transparency log inclusion proof
4. Verify policy enforcement evidence
5. Check key rotation status via `/keys` endpoint
6. Validate compliance claims against policy registry

## Operational Requirements

### Monitoring
- Real-time verification failure alerts
- Policy violation tracking and reporting
- Key rotation status monitoring
- Transparency log health checks

### Incident Response
- Immediate key revocation capability
- Receipt invalidation procedures
- Compliance violation reporting
- Audit trail preservation

### Backup and Recovery
- Transparency log backup with 99.9% availability
- Key escrow for compliance investigations
- Receipt archive with 7-year retention
- Disaster recovery procedures

## Migration from TECP-LITE

To upgrade from TECP-LITE to TECP-STRICT:

1. **Enable Transparency Log**: Configure log URL and verify inclusion
2. **Implement Policy Runtime**: Add policy enforcement with evidence
3. **Add Key Rotation**: Configure key management and rotation schedule
4. **Reduce Time Windows**: Tighten timestamp validation to 1 hour
5. **Enable Monitoring**: Set up compliance monitoring and alerting

## Example Strict Receipt

```json
{
  "version": "TECP-0.1",
  "code_ref": "git:abc123def456",
  "ts": 1703001600000,
  "nonce": "dGVzdC1ub25jZS0xMjM=",
  "input_hash": "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=",
  "output_hash": "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=",
  "policy_ids": ["no_retention", "key_erasure", "ttl_60s"],
  "sig": "signature_base64_here",
  "pubkey": "pubkey_base64_here",
  "log_inclusion": {
    "leaf_index": 12345,
    "merkle_proof": ["hash1", "hash2", "hash3"],
    "log_root": "root_hash_base64"
  },
  "key_erasure": {
    "scheme": "counter+seal@tee",
    "evidence": "attestation_base64"
  },
  "anchors": {
    "signed_time": {
      "timestamp": 1703001600000,
      "signature": "time_signature_base64",
      "kid": "log-202412"
    }
  },
  "ext": {
    "policy_enforced": {
      "no_retention": {"verified": true},
      "key_erasure": {"destroyed_at": 1703001660000},
      "ttl_60s": {"elapsed_ms": 45000}
    },
    "compliance_claims": ["GDPR.Art17", "HIPAA.164.312"]
  }
}
```

## Security Considerations

TECP-STRICT provides the highest level of assurance but requires:

- Robust key management infrastructure
- Reliable transparency log service
- Real-time policy enforcement
- Comprehensive monitoring and alerting
- Incident response procedures

Organizations should carefully evaluate their security requirements and operational capabilities before implementing TECP-STRICT.
