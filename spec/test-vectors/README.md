# TECP Test Vectors

Known Answer Tests (KATs) for TECP interoperability verification.

## Purpose

These test vectors ensure that all TECP implementations produce identical results for the same inputs. Every implementation MUST pass all test vectors to claim TECP compliance.

## Test Vector Format

Each test vector includes:
- **Input data**: Raw computation input and parameters
- **Expected receipt**: Complete TECP receipt in JSON format
- **CBOR bytes**: Canonical CBOR encoding (hex)
- **Verification result**: Expected verification outcome
- **Error codes**: Expected error codes for invalid cases

## Test Categories

### 1. Valid Receipts (`valid/`)
- Basic valid receipt
- Receipt with all extensions
- Receipt with transparency log inclusion
- Receipt with multiple policies

### 2. Invalid Signatures (`invalid-sig/`)
- Tampered signature
- Wrong public key
- Malformed signature encoding

### 3. Expired Receipts (`expired/`)
- Receipt older than 24 hours
- Receipt with future timestamp
- Receipt with excessive clock skew

### 4. Schema Violations (`schema/`)
- Missing required fields
- Invalid field types
- Unknown receipt version
- Malformed CBOR encoding

### 5. Policy Violations (`policy/`)
- Unknown policy IDs
- Invalid policy combinations
- Policy enforcement failures

## Usage

### For Implementers

1. Load test vector JSON files
2. Parse expected receipt and CBOR bytes
3. Verify your implementation produces identical results
4. Check error codes match for invalid cases

### For CI/CD

```bash
# Run all test vectors
tecp test-vectors spec/test-vectors/

# Run specific category
tecp test-vectors spec/test-vectors/valid/

# Generate interop report
tecp test-vectors --report interop-report.json
```

### For Verification

```bash
# Verify a specific test vector
tecp verify spec/test-vectors/valid/basic-receipt.json

# Batch verify all valid receipts
find spec/test-vectors/valid/ -name "*.json" | xargs tecp verify
```

## Adding New Test Vectors

1. Create test case in appropriate category directory
2. Include complete JSON receipt
3. Generate CBOR bytes using reference implementation
4. Document expected verification result
5. Add to test suite and verify all implementations pass

## Interoperability Requirements

All TECP implementations MUST:
- Generate identical CBOR bytes for same input
- Produce same verification results
- Handle all error cases consistently
- Pass 100% of test vectors

## Test Vector Validation

Test vectors are validated using:
- JSON schema validation
- CBOR encoding verification
- Cryptographic signature validation
- Cross-implementation testing

---

**Last Updated**: December 2024  
**Test Vector Version**: 1.0
