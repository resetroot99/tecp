# TECP Specification Versioning

**Status**: Draft  
**Version**: 1.0  
**Date**: December 2024

## Overview

This document defines the versioning policy for the Trusted Ephemeral Computation Protocol (TECP) specification to ensure backward compatibility and clear upgrade paths.

## Versioning Scheme

TECP uses semantic versioning with the format `TECP-MAJOR.MINOR.PATCH`:

- **MAJOR**: Breaking changes to receipt format or verification rules
- **MINOR**: Backward-compatible additions (new optional fields, policy types)
- **PATCH**: Clarifications, examples, non-normative changes

### Version Examples

- `TECP-0.1`: Initial experimental version
- `TECP-1.0`: First stable release
- `TECP-1.1`: Added optional extensions
- `TECP-2.0`: Breaking change to core format

## Backward Compatibility Policy

### Pre-1.0 Versions (Experimental)

- **v0.x**: No compatibility guarantees
- Breaking changes allowed between minor versions
- Rapid iteration expected
- Not recommended for production use

### Post-1.0 Versions (Stable)

- **v1.x**: MUST support all v1.x receipts in perpetuity
- **v2.x+**: SHOULD support previous major version for 2+ years
- **Patch versions**: MUST be fully backward compatible
- **Minor versions**: MUST be backward compatible

### Compatibility Matrix

| Verifier Version | Receipt Version | Support Level |
|------------------|-----------------|---------------|
| TECP-1.0 | TECP-1.0 | Full |
| TECP-1.1 | TECP-1.0 | Full |
| TECP-1.1 | TECP-1.1 | Full |
| TECP-2.0 | TECP-1.x | Deprecated (2 years) |
| TECP-2.0 | TECP-2.0 | Full |

## Extension Points

TECP is designed with extension points to enable evolution without breaking changes:

### Receipt Extensions

New optional fields can be added without breaking existing verifiers:

```json
{
  // Core fields (never change in same major version)
  "version": "TECP-1.0",
  "code_ref": "...",
  // ... other core fields
  
  // Extensions (can be added in minor versions)
  "new_extension": {
    "field": "value"
  }
}
```

### Policy Registry Evolution

- New policy IDs can be added at any time
- Existing policy IDs MUST NOT change meaning
- Deprecated policies marked with `deprecated: true`

### Verification Profiles

Future profiles (TECP-B, TECP-G) are additive:

- `TECP-0`: Software-only (current)
- `TECP-B`: Hardware-backed attestation
- `TECP-G`: Zero-knowledge proofs

## Change Process

### Specification Changes

1. **Proposal**: Submit GitHub issue with change proposal
2. **Discussion**: Community review and feedback (minimum 2 weeks)
3. **Draft**: Create draft specification update
4. **Implementation**: Reference implementation updated
5. **Testing**: Interoperability testing with other implementations
6. **Approval**: TECP Working Group consensus
7. **Publication**: Updated specification published

### Breaking Changes (Major Version)

Breaking changes require:
- 6-month advance notice
- Migration guide documentation
- Reference implementation supporting both versions
- Community consensus through working group

### Backward Compatible Changes (Minor Version)

Minor changes require:
- 1-month advance notice
- Updated test vectors
- Reference implementation update
- Working group approval

### Editorial Changes (Patch Version)

Editorial changes can be made immediately:
- Typo corrections
- Clarifications that don't change behavior
- Additional examples
- Formatting improvements

## Deprecation Policy

### Feature Deprecation

1. **Announcement**: Feature marked as deprecated in specification
2. **Grace Period**: Minimum 2 years for major features, 1 year for minor
3. **Removal**: Feature removed in next major version

### Version Support Lifecycle

- **Current**: Latest major version, full support
- **Previous**: Previous major version, security updates only
- **Legacy**: Older versions, no support

### Example Timeline

```
TECP-1.0 Released: January 2025
├─ TECP-1.1 Released: June 2025 (minor update)
├─ TECP-2.0 Released: January 2026 (breaking changes)
│  ├─ TECP-1.x: Deprecated but supported
│  └─ TECP-0.x: End of life
└─ TECP-1.x End of Life: January 2028 (2 years)
```

## Implementation Requirements

### Version Declaration

All implementations MUST:
- Clearly declare supported TECP versions
- Reject receipts with unsupported versions
- Provide clear error messages for version mismatches

### Forward Compatibility

Implementations SHOULD:
- Ignore unknown extension fields
- Warn about unknown policy IDs
- Gracefully handle minor version differences

### Testing Requirements

All implementations MUST:
- Pass test vectors for supported versions
- Demonstrate interoperability with reference implementation
- Provide version compatibility matrix

## Migration Guidelines

### For Receipt Generators

When upgrading TECP versions:

1. **Review Changes**: Understand new requirements and features
2. **Update Implementation**: Modify code to support new version
3. **Test Compatibility**: Verify receipts work with existing verifiers
4. **Gradual Rollout**: Phase in new version over time
5. **Monitor**: Watch for verification failures

### For Receipt Verifiers

When supporting new TECP versions:

1. **Backward Compatibility**: Ensure old receipts still verify
2. **New Features**: Implement new verification rules
3. **Error Handling**: Provide clear messages for unsupported versions
4. **Documentation**: Update supported version list

## Version History

### TECP-0.1 (December 2024)

- Initial experimental release
- 9-field receipt format
- Ed25519 + CBOR signing
- Basic policy registry
- Software key erasure simulation

### Planned Future Versions

- **TECP-1.0**: First stable release with frozen core format
- **TECP-1.1**: Hardware attestation extensions (TECP-B profile)
- **TECP-1.2**: Zero-knowledge proof extensions (TECP-G profile)
- **TECP-2.0**: Multi-step workflow support with breaking changes

## Governance

### TECP Working Group

The TECP Working Group is responsible for:
- Specification version approval
- Breaking change decisions
- Deprecation timeline management
- Community consensus building

### Decision Process

1. **Proposal**: Any community member can propose changes
2. **Discussion**: Open discussion period (minimum 2 weeks)
3. **Consensus**: Working group seeks rough consensus
4. **Approval**: Formal approval by working group chairs
5. **Implementation**: Reference implementation updated

## Conclusion

This versioning policy ensures TECP can evolve while maintaining stability and interoperability. By following semantic versioning principles and providing clear migration paths, we enable ecosystem growth while protecting existing investments.

The policy will be reviewed annually and updated as the TECP ecosystem matures.

---

**Authors**: TECP Working Group  
**Approved**: December 2024  
**Next Review**: December 2025