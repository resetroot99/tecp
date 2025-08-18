# TECP-LITE Profile Specification

**Version**: TECP-0.1  
**Status**: Draft  
**Date**: December 2024

## Overview

TECP-LITE is a minimal profile of the Trusted Ephemeral Computation Protocol designed for basic ephemeral computation verification with reduced overhead and simplified requirements.

## Profile Requirements

### Mandatory Fields

All TECP-LITE receipts MUST contain the 9 core fields:

- `version`: "TECP-0.1"
- `code_ref`: Git commit or build hash
- `ts`: Unix timestamp in milliseconds
- `nonce`: 16-byte base64 random value
- `input_hash`: SHA-256 hash of input data (base64)
- `output_hash`: SHA-256 hash of output data (base64)
- `policy_ids`: Array of policy identifiers (may be empty)
- `sig`: Ed25519 signature over core fields (base64)
- `pubkey`: Ed25519 public key (base64)

### Optional Extensions

TECP-LITE MAY include:

- `environment`: Basic environment metadata
- `ext`: Custom compliance metadata

### Excluded Features

TECP-LITE profiles MUST NOT require:

- Transparency log inclusion (`log_inclusion`)
- Key erasure proofs (`key_erasure`)
- Signed time anchors (`anchors.signed_time`)
- Hardware attestation

### Verification Requirements

#### Timestamp Validation
- Maximum age: 7 days (vs 24 hours in strict mode)
- Clock skew tolerance: 15 minutes (vs 5 minutes in strict mode)

#### Policy Enforcement
- Policy IDs are informational only
- No runtime policy enforcement required
- Verifiers MAY warn about unknown policies but MUST NOT fail verification

#### Signature Validation
- Standard Ed25519 signature verification
- CBOR canonicalization with sorted keys
- No additional cryptographic requirements

## Use Cases

TECP-LITE is appropriate for:

- Development and testing environments
- Low-stakes ephemeral computation
- Integration testing and demos
- Educational purposes
- Environments with relaxed compliance requirements

## Security Considerations

TECP-LITE provides:

✅ **Cryptographic integrity** of input/output data  
✅ **Non-repudiation** via digital signatures  
✅ **Replay protection** via nonces and timestamps  
✅ **Basic ephemeral attestation** via policy claims  

TECP-LITE does NOT provide:

❌ **Strong temporal bounds** (7-day vs 24-hour validity)  
❌ **Policy enforcement verification** (claims only)  
❌ **Transparency log inclusion** (no public auditability)  
❌ **Key rotation support** (single key model)  

## Migration Path

TECP-LITE receipts can be upgraded to TECP-STRICT by:

1. Adding transparency log inclusion proofs
2. Implementing policy runtime enforcement
3. Reducing timestamp validity windows
4. Adding key rotation support

## Example Receipt

```json
{
  "version": "TECP-0.1",
  "code_ref": "git:abc123def456",
  "ts": 1703001600000,
  "nonce": "dGVzdC1ub25jZS0xMjM=",
  "input_hash": "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=",
  "output_hash": "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=",
  "policy_ids": ["no_retention"],
  "sig": "signature_base64_here",
  "pubkey": "pubkey_base64_here",
  "environment": {
    "region": "us-west-2",
    "provider": "demo-service"
  }
}
```

## Compliance

TECP-LITE receipts provide basic evidence for:

- **GDPR Article 17** (Right to Erasure): Claims of non-retention
- **HIPAA Safe Harbor**: Claims of ephemeral processing
- **SOC 2 Type II**: Process integrity attestation

Note: Claims are cryptographically signed but not independently verified in TECP-LITE mode.
