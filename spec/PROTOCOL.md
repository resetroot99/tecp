# TECP Protocol Specification v0.1

**Status**: Draft  
**Version**: TECP-0.1  
**Date**: December 2024

## Abstract

The Trusted Ephemeral Computation Protocol (TECP) defines a cryptographic receipt format for verifiable, ephemeral computation. TECP receipts provide mathematical proof that computation occurred according to specified policies without persistent data storage.

## 1. Introduction

TECP addresses the fundamental challenge of proving privacy-preserving computation. Traditional systems rely on legal agreements and trust-based assurances. TECP provides cryptographic receipts that can be independently verified without access to the original computation environment.

### 1.1 Requirements Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 2. Receipt Format

### 2.1 Core Receipt Structure

A TECP receipt consists of exactly nine required fields:

```
Receipt {
  version: "TECP-0.1"
  code_ref: string
  ts: number (Unix milliseconds)
  nonce: string (base64)
  input_hash: string (SHA-256, base64)
  output_hash: string (SHA-256, base64)
  policy_ids: array of strings
  sig: string (Ed25519 signature, base64)
  pubkey: string (Ed25519 public key, base64)
}
```
## Canonicalization

All TECP signatures MUST use JSON-C14N canonicalization:

- Objects: keys sorted ascending by UTF-8
- Numbers: integers only (floats forbidden)
- Strings: UTF-8 JSON encoding
- Binary fields: base64url without padding
- Output: compact JSON (no spaces, no trailing newline)

The canonical bytes are produced by `canonicalBytes(obj)` and used as the signature body. The transparency log leaf for a receipt is defined as:

```
leaf = sha256(canonical_receipt_bytes)
```

This rule is frozen to ensure cross-SDK interoperability and verifiability.


### 2.2 Field Definitions

**version**: MUST be "TECP-0.1" for this specification version.

**code_ref**: Reference to the computation code. Format is implementation-specific but SHOULD be verifiable (e.g., "git:commit_hash", "build:sha256_hash").

**ts**: Timestamp when the receipt was created, in Unix milliseconds. MUST be within 5 minutes of current time when verified.

**nonce**: Cryptographic nonce to prevent replay attacks. MUST be at least 16 bytes of cryptographically secure random data, encoded as base64.

**input_hash**: SHA-256 hash of the computation input, encoded as base64.

**output_hash**: SHA-256 hash of the computation output, encoded as base64.

**policy_ids**: Array of policy identifiers that were enforced during computation. Policy IDs MUST be defined in the TECP Policy Registry.

**sig**: Ed25519 signature of the canonical CBOR encoding of the core receipt fields (excluding extensions), encoded as base64.

**pubkey**: Ed25519 public key used to create the signature, encoded as base64.

### 2.3 Optional Extensions

Receipts MAY include optional extension fields that are NOT included in signature verification:

```
ReceiptExtensions {
  key_erasure?: {
    scheme: "counter+seal@tee" | "sw-sim"
    evidence: string (base64)
  }
  environment?: {
    region?: string
    provider?: string
  }
  log_inclusion?: {
    leaf_index: number
    merkle_proof: array of strings
    log_root: string
  }
}
```

## 3. Canonical Encoding

### 3.1 CBOR Encoding

Receipts MUST be encoded using Concise Binary Object Representation (CBOR) as defined in RFC 8949.

For signature generation and verification, the core receipt fields MUST be encoded in deterministic CBOR with:
- Keys sorted in lexicographic order
- No indefinite-length encodings
- Minimal encoding of integers and strings

### 3.2 Signature Process

1. Create core receipt object with all required fields except `sig`
2. Encode using deterministic CBOR
3. Generate Ed25519 signature of CBOR bytes
4. Add signature as `sig` field
5. Optionally add extension fields

## 4. Verification Algorithm

### 4.1 Basic Verification

```
function verify_receipt(receipt):
  // 1. Validate schema
  if not valid_schema(receipt):
    return INVALID("Schema validation failed")
  
  // 2. Check timestamp bounds
  now = current_time_ms()
  if receipt.ts > now + 300000:  // 5 minutes
    return INVALID("Receipt timestamp in future")
  if now - receipt.ts > 86400000:  // 24 hours
    return INVALID("Receipt expired")
  
  // 3. Extract core fields for signature verification
  core = extract_core_fields(receipt)
  cbor_bytes = canonical_cbor_encode(core)
  
  // 4. Verify Ed25519 signature
  if not ed25519_verify(receipt.sig, cbor_bytes, receipt.pubkey):
    return INVALID("Signature verification failed")
  
  // 5. Validate policy IDs
  for policy_id in receipt.policy_ids:
    if not known_policy(policy_id):
      return WARNING("Unknown policy ID: " + policy_id)
  
  return VALID
```

### 4.2 Extended Verification

If `log_inclusion` extension is present, verifiers SHOULD:

1. Fetch current log root from transparency log
2. Verify Merkle inclusion proof
3. Validate log root signature

## 5. Error Codes

TECP defines standardized error codes for consistent reporting:

- **E-SIG-001**: Invalid signature format
- **E-SIG-002**: Signature verification failed
- **E-TS-002**: Clock skew exceeded
- **E-TS-003**: Receipt expired
- **E-SCHEMA-001**: Missing required field
- **E-SCHEMA-004**: Unknown receipt version
- **E-LOG-002**: Log inclusion proof invalid

## 6. Security Considerations

### 6.1 Cryptographic Assumptions

TECP security relies on:
- Ed25519 signature scheme security
- SHA-256 hash function collision resistance
- Cryptographically secure random number generation for nonces

### 6.2 Timestamp Validation

Implementations MUST validate receipt timestamps to prevent:
- Replay attacks using old receipts
- Future-dated receipts that bypass time-based policies

Maximum acceptable clock skew is 5 minutes. Receipts older than 24 hours MUST be rejected.

### 6.3 Key Management

- Signing keys SHOULD be ephemeral and destroyed after use
- Key destruction SHOULD be cryptographically provable
- Public keys MUST be distributed through secure channels

## 7. Implementation Requirements

### 7.1 Performance Targets

Conforming implementations SHOULD achieve:
- Receipt creation: ≤ 10ms
- Receipt verification: ≤ 5ms
- Maximum receipt size: ≤ 8KB

### 7.2 Interoperability

All implementations MUST:
- Generate identical CBOR encodings for the same input
- Successfully verify receipts from other implementations
- Pass the standard test vector suite

## 8. IANA Considerations

This specification requests registration of:
- Media type: `application/tecp-receipt`
- File extension: `.tecp`

## 9. References

### 9.1 Normative References

- RFC 2119: Key words for use in RFCs
- RFC 8949: Concise Binary Object Representation (CBOR)
- RFC 8032: Edwards-Curve Digital Signature Algorithm (EdDSA)

### 9.2 Informative References

- TECP Policy Registry: Machine-readable policy definitions
- TECP Test Vectors: Known Answer Tests for interoperability

---

**Authors**: TECP Working Group  
**Copyright**: This document is placed in the public domain.
