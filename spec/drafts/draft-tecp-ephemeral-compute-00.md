# Internet-Draft: Trusted Ephemeral Computation Protocol (TECP)

**Network Working Group**  
**Internet-Draft**  
**Intended status: Experimental**  
**Expires: June 15, 2025**

**Document:** draft-tecp-ephemeral-compute-00  
**Category:** Experimental  
**Date:** December 15, 2024

## Abstract

The Trusted Ephemeral Computation Protocol (TECP) defines a framework for verifiable, ephemeral computation workflows that provide cryptographic guarantees of data processing without persistent storage. TECP enables privacy-preserving computation through self-destructing execution environments that produce portable attestation proofs, making privacy violations mathematically impossible rather than merely prohibited.

This protocol addresses the fundamental tension between computational utility and privacy preservation by introducing ephemeral-by-design execution with composable verification. TECP is designed to become the foundational protocol for privacy-sensitive computation, analogous to how TLS enables secure communications.

## Status of This Memo

This Internet-Draft is submitted in full conformance with the provisions of BCP 78 and BCP 79.

Internet-Drafts are working documents of the Internet Engineering Task Force (IETF). Note that other groups may also distribute working documents as Internet-Drafts. The list of current Internet-Drafts is at https://datatracker.ietf.org/drafts/current/.

Internet-Drafts are draft documents valid for a maximum of six months and may be updated, replaced, or obsoleted by other documents at any time. It is inappropriate to use Internet-Drafts as reference material or to cite them other than as "work in progress."

This Internet-Draft will expire on June 15, 2025.

## Copyright Notice

Copyright (c) 2024 IETF Trust and the persons identified as the document authors. All rights reserved.

This document is subject to BCP 78 and the IETF Trust's Legal Provisions Relating to IETF Documents (https://trustee.ietf.org/license-info) in effect on the date of publication of this document.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Protocol Overview](#3-protocol-overview)
4. [Receipt Format](#4-receipt-format)
5. [Verification Process](#5-verification-process)
6. [Security Considerations](#6-security-considerations)
7. [IANA Considerations](#7-iana-considerations)
8. [References](#8-references)

## 1. Introduction

### 1.1 Motivation

Current distributed computation models assume persistent execution environments that accumulate sensitive data over time. This architecture creates fundamental privacy and security vulnerabilities:

- **Persistent Attack Surface**: Long-lived servers accumulate secrets and become high-value targets
- **Trust-Based Privacy**: Data protection relies on legal agreements rather than cryptographic guarantees
- **Compliance Complexity**: Regulatory requirements demand extensive audit trails of data processing
- **Collaboration Barriers**: Multi-party computation impossible due to data exposure risks

### 1.2 Overview

TECP introduces a new computation paradigm where:

1. **Computation is ephemeral by design**: Execution environments have cryptographically enforced lifetimes
2. **Results are verifiable forever**: Computations produce portable attestation proofs
3. **Privacy is mathematically guaranteed**: Data processing leaves only cryptographic shadows
4. **Workflows are composable**: Multi-step processes can be chained with end-to-end verification

### 1.3 Requirements Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC2119].

## 2. Terminology

**Ephemeral Execution Environment (EEE)**: A sealed computation environment with cryptographically enforced maximum lifetime and mandatory key destruction.

**TECP Receipt**: A cryptographic proof of ephemeral computation containing input/output commitments, policy attestations, and verification metadata.

**Policy Identifier**: A machine-readable string specifying privacy and compliance requirements that were enforced during computation.

**Key-Erasure Proof**: Cryptographic attestation that encryption keys have been irreversibly destroyed, making future data decryption mathematically impossible.

**Transparency Log**: A public, append-only log of TECP receipts with Merkle tree inclusion proofs for non-repudiation.

## 3. Protocol Overview

### 3.1 Architecture

TECP defines a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│              (Privacy Policies, Workflows)                  │
├─────────────────────────────────────────────────────────────┤
│                     TECP Protocol Layer                     │
│        (Receipt Generation, Verification, Routing)          │
├─────────────────────────────────────────────────────────────┤
│                  Attestation Substrate                      │
│            (Software Simulation, TEE, zkVM)                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Protocol Flow

1. **Job Submission**: Client submits computation request with privacy policies
2. **Environment Provisioning**: Provider instantiates ephemeral execution environment
3. **Computation Execution**: Workflow executes with policy enforcement
4. **Receipt Generation**: Environment produces cryptographic receipt with key-erasure proof
5. **Environment Destruction**: Execution environment destroyed with attestation
6. **Verification**: Any party can independently verify the receipt

### 3.3 Trust Model

TECP operates under a "trust-but-verify" model where:

- **Providers** are trusted to correctly implement the protocol but verification is independent
- **Attestation Substrates** provide software or hardware roots of trust
- **Verifiers** can independently validate all claims without trusting the original provider
- **No persistent trust** is required beyond the initial attestation keys

## 4. Receipt Format

### 4.1 Core Receipt Structure

A TECP receipt consists of exactly nine required fields encoded in CBOR [RFC8949]:

```
Receipt {
  version: "TECP-0.1"
  code_ref: tstr
  ts: uint
  nonce: tstr
  input_hash: tstr
  output_hash: tstr
  policy_ids: [* tstr]
  sig: tstr
  pubkey: tstr
}
```

### 4.2 Field Definitions

**version**: MUST be "TECP-0.1" for this specification version.

**code_ref**: Reference to the computation code. Format is implementation-specific but SHOULD be verifiable (e.g., "git:commit_hash", "build:sha256_hash").

**ts**: Timestamp when the receipt was created, in Unix milliseconds. MUST be within 5 minutes of current time when verified.

**nonce**: Cryptographic nonce to prevent replay attacks. MUST be at least 16 bytes of cryptographically secure random data, encoded as base64.

**input_hash**: SHA-256 hash of the computation input, encoded as base64.

**output_hash**: SHA-256 hash of the computation output, encoded as base64.

**policy_ids**: Array of policy identifiers that were enforced during computation. Policy IDs MUST be defined in a TECP Policy Registry.

**sig**: Ed25519 signature of the canonical CBOR encoding of the core receipt fields, encoded as base64.

**pubkey**: Ed25519 public key used to create the signature, encoded as base64.

### 4.3 Optional Extensions

Receipts MAY include optional extension fields that are NOT included in signature verification:

```
ReceiptExtensions {
  key_erasure?: {
    scheme: "counter+seal@tee" / "sw-sim"
    evidence: tstr
  }
  environment?: {
    region?: tstr
    provider?: tstr
  }
  log_inclusion?: {
    leaf_index: uint
    merkle_proof: [* tstr]
    log_root: tstr
  }
}
```

### 4.4 Canonical Encoding

For signature generation and verification, the core receipt fields MUST be encoded in deterministic CBOR with:
- Keys sorted in lexicographic order
- No indefinite-length encodings
- Minimal encoding of integers and strings

## 5. Verification Process

### 5.1 Basic Verification Algorithm

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

### 5.2 Extended Verification

If `log_inclusion` extension is present, verifiers SHOULD:

1. Fetch current log root from transparency log
2. Verify Merkle inclusion proof
3. Validate log root signature

### 5.3 Performance Requirements

Conforming implementations SHOULD achieve:
- Receipt creation: ≤ 10ms
- Receipt verification: ≤ 5ms
- Maximum receipt size: ≤ 8KB

## 6. Security Considerations

### 6.1 Cryptographic Assumptions

TECP security relies on:
- Ed25519 signature scheme security [RFC8032]
- SHA-256 hash function collision resistance
- Cryptographically secure random number generation for nonces

### 6.2 Threat Model

TECP v0.1 provides protection against:
- **Replay attacks**: Nonce + timestamp prevent reuse
- **Data substitution**: Input/output hashes prevent tampering
- **Policy bypass**: Machine-readable policies with enforcement proofs
- **Long-term retention**: Ephemeral design with cryptographic receipts

TECP v0.1 does NOT protect against:
- **RAM wipe attacks**: No proof of physical memory erasure
- **Side-channel attacks**: No protection against timing/cache attacks
- **Hardware attacks**: Software-only trust model
- **Implementation bugs**: Relies on correct protocol implementation

### 6.3 Key Management

- Signing keys SHOULD be ephemeral and destroyed after use
- Key destruction SHOULD be cryptographically provable
- Public keys MUST be distributed through secure channels
- Key rotation SHOULD be supported for long-term deployments

### 6.4 Timestamp Validation

Implementations MUST validate receipt timestamps to prevent:
- Replay attacks using old receipts
- Future-dated receipts that bypass time-based policies

Maximum acceptable clock skew is 5 minutes. Receipts older than 24 hours MUST be rejected unless explicitly configured otherwise.

## 7. IANA Considerations

### 7.1 Media Type Registration

This specification requests registration of the following media type:

**Type name**: application  
**Subtype name**: tecp-receipt  
**Required parameters**: None  
**Optional parameters**: None  
**Encoding considerations**: Binary (CBOR) or text (JSON)  
**Security considerations**: See Section 6  
**Interoperability considerations**: None  
**Published specification**: This document  
**Applications that use this media type**: TECP implementations  
**Fragment identifier considerations**: None  
**Additional information**: None  
**Person & email address to contact**: TECP Working Group <tecp-dev@ietf.org>  
**Intended usage**: COMMON  
**Restrictions on usage**: None  
**Author**: TECP Working Group  
**Change controller**: IETF  

### 7.2 Port Assignment

This specification requests assignment of:
- TCP port 8443 for TECP over TLS
- UDP port 8443 for TECP discovery protocol (future use)

### 7.3 URI Scheme Registration

This specification requests registration of the following URI schemes:

**tecp**: For TECP provider endpoints  
**tecp-verify**: For verification service endpoints

## 8. References

### 8.1 Normative References

[RFC2119] Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, DOI 10.17487/RFC2119, March 1997.

[RFC8032] Josefsson, S. and I. Liusvaara, "Edwards-Curve Digital Signature Algorithm (EdDSA)", RFC 8032, DOI 10.17487/RFC8032, January 2017.

[RFC8949] Bormann, C. and P. Hoffman, "Concise Binary Object Representation (CBOR)", STD 94, RFC 8949, DOI 10.17487/RFC8949, December 2020.

### 8.2 Informative References

[GDPR] European Parliament, "General Data Protection Regulation", 2016.

[HIPAA] U.S. Department of Health and Human Services, "Health Insurance Portability and Accountability Act", 1996.

## Authors' Addresses

TECP Working Group  
Email: tecp-dev@ietf.org  
URI: https://tecp.dev

---

**Document Information**

This Internet-Draft is submitted to IETF in full conformance with the provisions of BCP 78 and BCP 79.

**Revision History**

- **00**: Initial version (December 2024)

**Expiration Date**: June 15, 2025
