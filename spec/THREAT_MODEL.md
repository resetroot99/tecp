# TECP Threat Model v0.1

**Status**: Draft  
**Version**: TECP-0.1  
**Date**: December 2024

## Executive Summary

TECP v0.1 provides cryptographic receipts for ephemeral computation with **conservative security claims**. This document explicitly defines what TECP proves and what it does NOT prove to set appropriate expectations.

## What TECP v0.1 Claims

### ✅ Proven Guarantees

**Non-retention by design**: Receipt proves computation was designed to be ephemeral with no persistent storage mechanisms.

**Input/output integrity**: Cryptographic proof of exactly what data was processed and what results were produced.

**Policy enforcement**: Machine-verifiable claims about privacy rules that were applied during computation.

**Temporal bounds**: Freshness guarantees prevent replay attacks and ensure recent computation.

**Verifiable transparency**: Optional public logging with Merkle proofs for non-repudiation.

### ✅ Attack Vectors Addressed

- **Replay attacks**: Nonce + timestamp prevent reuse of old receipts
- **Data substitution**: Input/output hashes prevent tampering with computation results
- **Policy bypass**: Machine-readable policies with cryptographic enforcement proofs
- **Long-term retention**: Ephemeral design with mathematical proof of processing claims

## What TECP v0.1 Does NOT Claim

### ❌ Explicitly Out of Scope

**RAM wipe proof**: We do NOT prove memory was physically erased from hardware.

**Side-channel immunity**: No guarantees against timing attacks, cache attacks, or power analysis.

**Hardware attestation**: Software signatures only - no TEE or secure enclave verification.

**Perfect forward secrecy**: Key compromise could theoretically reveal past computation inputs.

**Covert channel protection**: No protection against information leakage through system resources.

**Malicious hardware protection**: No defense against compromised processors or firmware.

### ❌ Attack Vectors NOT Addressed (v0.1)

- **Malicious hardware**: No TEE/secure enclave protection
- **Implementation bugs**: Software-only trust in receipt generation
- **Side channels**: No protection against timing/power analysis  
- **Social engineering**: Human verification of policy meanings required
- **Physical attacks**: No protection against hardware tampering
- **Advanced persistent threats**: No protection against sophisticated state-level attacks

## Security Assumptions

### Core Assumptions

1. **Ed25519 signature scheme is secure** against chosen-message attacks
2. **SHA-256 hash function** provides collision resistance and preimage resistance
3. **Implementation correctly deletes keys** after signing (software simulation in v0.1)
4. **System clock is reasonably accurate** (±5 minutes acceptable)
5. **Code references map to auditable implementations** that can be independently verified
6. **Random number generation** is cryptographically secure for nonce generation

### Trust Model

**Computation Provider**: Trusted to implement the protocol correctly but verification is independent.

**Verifiers**: Can independently validate all claims without trusting the original provider.

**Policy Registry**: Trusted source for policy definitions and compliance mappings.

**Transparency Log**: Optional but provides additional non-repudiation guarantees.

## Threat Scenarios

### Scenario 1: Honest-but-Curious Provider

**Threat**: Provider attempts to extract information from computation but follows protocol.

**Mitigation**: Ephemeral design and key erasure proofs limit information retention.

**Residual Risk**: Provider could potentially extract information during computation window.

### Scenario 2: Malicious Provider

**Threat**: Provider attempts to violate privacy policies or forge receipts.

**Mitigation**: Cryptographic signatures prevent receipt forgery. Policy enforcement is verifiable.

**Residual Risk**: Provider could lie about policy enforcement (detected through auditing).

### Scenario 3: Network Adversary

**Threat**: Attacker observes network traffic to infer computation details.

**Mitigation**: Input/output hashes hide actual data content. Transport encryption recommended.

**Residual Risk**: Traffic analysis could reveal computation patterns.

### Scenario 4: Compromised Keys

**Threat**: Signing keys are compromised, allowing receipt forgery.

**Mitigation**: Ephemeral keys limit exposure window. Key rotation recommended.

**Residual Risk**: Compromise during computation window allows forgery.

## Risk Assessment

### High Confidence Claims

- Receipt authenticity (cryptographic signatures)
- Input/output integrity (cryptographic hashes)
- Timestamp validity (temporal bounds checking)
- Policy specification (machine-readable definitions)

### Medium Confidence Claims

- Key erasure (software simulation, not cryptographically proven)
- Policy enforcement (depends on implementation auditing)
- Ephemeral execution (architectural design, not hardware-enforced)

### Low Confidence Claims

- Complete privacy (depends on implementation and environment)
- Side-channel resistance (not addressed in v0.1)
- Hardware-level security (explicitly out of scope)

## Future Threat Model Evolution

### TECP-B (Hardware-Backed)

Will address:
- Hardware attestation through TEE integration
- Stronger key erasure proofs via hardware counters
- Side-channel resistance through hardware isolation

### TECP-G (Math-Backed)

Will address:
- Zero-knowledge proofs for computation correctness
- Hardware-independent security guarantees
- Formal verification of privacy properties

## Compliance Considerations

### Regulatory Alignment

**GDPR Article 25 (Data Protection by Design)**: TECP supports privacy-by-design through ephemeral architecture.

**HIPAA Technical Safeguards**: Cryptographic receipts provide audit trails and access controls.

**SOX Compliance**: Receipts enable automated compliance reporting and audit trails.

### Limitations for Compliance

- Human interpretation required for policy meanings
- Legal review needed for regulatory mapping
- Audit procedures must verify implementation claims

## Recommendations

### For Implementers

1. **Conservative claims**: Never overstate security guarantees
2. **Clear documentation**: Explicitly state what is and isn't protected
3. **Regular auditing**: Independent verification of policy enforcement
4. **Key management**: Implement secure key generation and destruction
5. **Monitoring**: Log all receipt generation and verification events

### For Users

1. **Understand limitations**: TECP v0.1 is not a complete privacy solution
2. **Verify implementations**: Audit code and infrastructure before trusting
3. **Policy review**: Ensure policy definitions match your requirements
4. **Risk assessment**: Evaluate threats specific to your use case
5. **Defense in depth**: Use TECP as part of broader security strategy

## Conclusion

TECP v0.1 provides a solid foundation for verifiable ephemeral computation with **conservative, well-defined security guarantees**. By explicitly stating limitations, we enable informed decision-making and set appropriate expectations for this emerging protocol.

The threat model will evolve with future TECP versions to address additional attack vectors and provide stronger guarantees through hardware attestation and mathematical proofs.

---

**Authors**: TECP Working Group  
**Last Updated**: December 2024  
**Next Review**: March 2025