# Security Policy

## Supported Versions

| Version | Supported | Status |
|---------|-----------|--------|
| 0.1.x   | ✅ | Active development - breaking changes expected |

## Reporting Vulnerabilities

### Contact Information
- **Email**: security@tecp.dev
- **Response Time**: Acknowledgment within 48 hours
- **Disclosure**: Coordinated disclosure after fix deployment

### Vulnerability Scope

#### ✅ **In Scope - High Priority**
- Cryptographic vulnerabilities in receipt signing/verification
- Implementation bugs that could lead to false verification results
- Protocol design flaws enabling replay or substitution attacks
- Deterministic CBOR encoding inconsistencies affecting interoperability
- Policy enforcement bypass vulnerabilities

#### ✅ **In Scope - Medium Priority**  
- Receipt size constraint violations (>8KB)
- Performance degradation attacks (>10ms create, >5ms verify)
- Timestamp validation bypass (>24h age, >5min skew)
- Policy registry inconsistencies or compliance mapping errors

#### ❌ **Out of Scope**
- Denial of service attacks (this is research/demo code)
- Social engineering or operational security issues
- Physical attacks on hardware or infrastructure
- Side-channel attacks (explicitly out of scope for v0.1)
- Third-party dependencies (report to upstream projects)

### Vulnerability Classification

#### **Critical Severity**
- Ability to forge valid TECP receipts without proper keys
- Cryptographic signature bypass vulnerabilities
- Complete policy enforcement bypass

#### **High Severity**
- Receipt verification bypass for invalid receipts
- Deterministic encoding inconsistencies breaking interoperability
- Timestamp validation bypass enabling replay attacks

#### **Medium Severity**
- Performance target violations causing DoS
- Policy registry inconsistencies
- Receipt size constraint violations

#### **Low Severity**
- Documentation errors or unclear specifications
- Non-security related implementation bugs
- Performance optimizations

## Security Response Process

### 1. **Initial Response (0-48 hours)**
- Acknowledge receipt of vulnerability report
- Assign unique tracking identifier
- Initial severity assessment
- Establish secure communication channel if needed

### 2. **Investigation (2-14 days)**
- Reproduce vulnerability in controlled environment
- Assess impact and exploitability
- Determine affected versions and components
- Develop fix strategy

### 3. **Fix Development (1-30 days)**
- Implement security fix with minimal breaking changes
- Add regression tests to prevent reintroduction
- Update test vectors if protocol changes required
- Internal security review of fix

### 4. **Coordinated Disclosure**
- Notify reporter of fix timeline
- Prepare security advisory with details
- Deploy fix to all supported versions
- Public disclosure with credit to reporter

### 5. **Post-Disclosure**
- Monitor for exploitation attempts
- Update documentation and threat model
- Consider additional preventive measures
- Lessons learned integration

## Security Best Practices

### For Implementers

#### **Cryptographic Implementation**
```typescript
// ✅ Good: Use established cryptographic libraries
import { sign, verify } from '@noble/ed25519';

// ❌ Bad: Never implement cryptography from scratch
// const customSign = (data, key) => { /* custom crypto */ };
```

#### **Key Management**
```typescript
// ✅ Good: Clear keys after use
try {
  const signature = await sign(data, privateKey);
  return signature;
} finally {
  privateKey.fill(0); // Clear from memory
}

// ❌ Bad: Leave keys in memory
const signature = await sign(data, privateKey);
return signature; // Key remains in memory
```

#### **Input Validation**
```typescript
// ✅ Good: Validate all inputs
if (!receipt.version || receipt.version !== 'TECP-0.1') {
  throw new Error('Invalid version');
}

// ❌ Bad: Trust user input
const result = processReceipt(receipt); // No validation
```

### For Deployers

#### **Environment Security**
- Use secure key generation and storage
- Enable TLS 1.3 for all network communications
- Implement proper logging and monitoring
- Regular security updates and patches

#### **Operational Security**
- Separate development and production keys
- Implement proper access controls
- Monitor for unusual receipt patterns
- Regular security assessments

## Known Security Limitations

### **TECP v0.1 Conservative Scope**

As documented in our threat model, TECP v0.1 has intentional limitations:

1. **No Hardware Attestation**: Software-only trust model
2. **No Side-Channel Protection**: Timing/cache attacks not addressed
3. **No Perfect Forward Secrecy**: Key compromise affects past computations
4. **No RAM Wipe Proof**: Physical memory erasure not guaranteed

These limitations are by design to enable rapid deployment and validation of the core concept. Future versions will address these concerns.

### **Dependencies**

Current security depends on:
- `@noble/ed25519`: Ed25519 cryptographic operations
- `cbor-x`: Deterministic CBOR encoding
- `@noble/hashes`: SHA-256 hashing
- Node.js runtime security

Regular dependency updates and security monitoring are essential.

## Bug Bounty Program

**Status**: Not currently offered (open source research project)

**Alternative**: We encourage responsible disclosure and offer:
- Public recognition in security advisories
- Contribution credit in project documentation
- Priority consideration for future bounty programs

## Security Audit History

### **Internal Reviews**
- **2024-Q4**: Initial protocol design review
- **2024-Q4**: Cryptographic implementation review
- **2024-Q4**: Test vector validation

### **External Audits**
- **Planned**: Independent security assessment for v1.0 release
- **Future**: Formal verification of protocol properties

## Compliance and Certifications

### **Current Status**
- TECP v0.1 is research/development software
- No formal security certifications
- Conservative threat model with clear limitations

### **Future Goals**
- Common Criteria evaluation for production versions
- FIPS 140-2 compliance for cryptographic components
- SOC 2 Type II for production services

## Contact Information

### **Security Team**
- **Lead**: TECP Security Team
- **Email**: security@tecp.dev
- **PGP Key**: [To be published]

### **General Security Questions**
- **Documentation**: See [THREAT_MODEL.md](spec/THREAT_MODEL.md)
- **Implementation**: See source code comments and tests
- **Community**: GitHub Discussions for non-sensitive questions

---

**Remember**: TECP v0.1 is intentionally conservative. We prefer to under-promise and over-deliver on security guarantees. Report issues responsibly and help us build a more secure privacy-preserving computation protocol.**
