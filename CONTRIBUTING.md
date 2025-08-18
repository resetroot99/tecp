# Contributing to TECP

Thank you for your interest in contributing to the Trusted Ephemeral Computation Protocol (TECP). This document outlines how to contribute to the protocol specification and reference implementation.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Issues

- Use the GitHub issue tracker to report bugs or request features
- Search existing issues before creating a new one
- Provide clear, detailed descriptions with steps to reproduce
- Include relevant system information and TECP version

### Protocol Changes

TECP follows a formal specification process for protocol changes:

1. **Discussion**: Start with a GitHub issue to discuss the proposed change
2. **Proposal**: Create a detailed proposal document
3. **Review**: Community review and feedback (minimum 2 weeks)
4. **Implementation**: Reference implementation updated
5. **Testing**: Interoperability testing with other implementations
6. **Approval**: TECP Working Group consensus required

### Types of Contributions

#### Specification Changes

- **Breaking Changes**: Require major version bump and 6-month notice
- **Extensions**: New optional fields or features (minor version)
- **Clarifications**: Editorial improvements (patch version)

#### Implementation Changes

- Bug fixes in reference implementation
- Performance improvements
- New SDK language bindings
- Additional test vectors

#### Documentation

- Specification improvements
- Implementation guides
- Security analysis
- Compliance mappings

## Development Process

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/tecp-protocol/tecp.git
cd tecp

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Generate keys for development
npm run gen:keys
```

### Code Standards

#### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Include JSDoc comments for public APIs
- Write tests for new functionality

#### Python

- Follow PEP 8 style guide
- Use type hints for all functions
- Include docstrings for public APIs
- Use pytest for testing

#### Rust

- Follow standard Rust formatting (`cargo fmt`)
- Use Clippy for linting (`cargo clippy`)
- Include documentation comments
- Write unit and integration tests

### Testing Requirements

All contributions must include appropriate tests:

- **Unit tests**: For individual functions and classes
- **Integration tests**: For component interactions
- **Interoperability tests**: For cross-language compatibility
- **Test vectors**: For cryptographic functions

### Pull Request Process

1. **Fork** the repository and create a feature branch
2. **Implement** your changes with tests
3. **Test** locally: `npm test` and `npm run test:interop`
4. **Document** changes in commit messages and PR description
5. **Submit** pull request with clear description
6. **Review** process: Address feedback from maintainers
7. **Merge** after approval and CI passes

#### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Test vectors updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
```

## Working Group Participation

### TECP Working Group

The TECP Working Group makes decisions about protocol evolution:

- **Membership**: Open to all contributors
- **Meetings**: Monthly virtual meetings
- **Decisions**: Rough consensus model
- **Communication**: GitHub discussions and mailing list

### Decision Process

1. **Proposal**: Submit detailed proposal
2. **Discussion**: Open discussion period (2+ weeks)
3. **Consensus**: Working group seeks rough consensus
4. **Approval**: Formal approval by working group chairs
5. **Implementation**: Changes implemented in reference

### Roles and Responsibilities

#### Contributors
- Submit proposals and feedback
- Implement approved changes
- Participate in discussions
- Test implementations

#### Maintainers
- Review pull requests
- Maintain code quality
- Coordinate releases
- Facilitate discussions

#### Working Group Chairs
- Facilitate meetings
- Guide consensus process
- Make final decisions when needed
- Represent TECP in standards bodies

## Security Contributions

### Reporting Security Issues

**DO NOT** report security vulnerabilities through public GitHub issues.

Instead:
- Email: security@tecp.dev
- PGP Key: [Available on website]
- Response time: 48 hours acknowledgment

### Security Review Process

1. **Assessment**: Evaluate severity and impact
2. **Fix**: Develop and test fix
3. **Coordination**: Coordinate disclosure timeline
4. **Release**: Security release with advisory
5. **Disclosure**: Public disclosure after fix deployment

### Scope

Security reports should focus on:
- Cryptographic vulnerabilities
- Protocol design flaws
- Implementation bugs affecting security
- Verification bypass techniques

## Intellectual Property

### Licensing

- **Code**: Apache License 2.0
- **Specifications**: Creative Commons Attribution 4.0
- **Patents**: Contributors grant patent licenses per Apache 2.0

### Contributor License Agreement

By contributing, you agree that:
- Your contributions are your original work
- You have rights to submit the contribution
- You grant the project rights to use your contribution
- Your contribution is under the project's license

## Recognition

### Contributors

All contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Annual contributor recognition

### Maintainer Nomination

Active contributors may be nominated as maintainers based on:
- Consistent high-quality contributions
- Deep understanding of TECP
- Positive community interactions
- Commitment to project goals

## Resources

### Documentation

- [Protocol Specification](spec/PROTOCOL.md)
- [Threat Model](spec/THREAT_MODEL.md)
- [Implementation Guide](docs/IMPLEMENTATION.md)
- [API Documentation](docs/API.md)

### Communication

- **GitHub Discussions**: General discussion and Q&A
- **Mailing List**: tecp-dev@googlegroups.com
- **IRC**: #tecp on Libera.Chat
- **Matrix**: #tecp:matrix.org

### Standards Bodies

TECP participates in:
- **IETF**: Internet Engineering Task Force
- **W3C**: World Wide Web Consortium (future)
- **ISO**: International Organization for Standardization (future)

## Getting Help

### For Contributors

- Check existing documentation first
- Search GitHub issues and discussions
- Ask questions in GitHub discussions
- Join community chat channels

### For Implementers

- Review reference implementation
- Check interoperability test suite
- Consult implementation guides
- Engage with working group

### For Users

- Check user documentation
- Review FAQ and troubleshooting
- Report issues through GitHub
- Join user community discussions

## Roadmap Participation

### Current Focus

See [ROADMAP.md](ROADMAP.md) for current priorities:
- Protocol stabilization (v1.0)
- Multi-language SDK completion
- Standards body engagement
- Enterprise adoption

### Future Directions

- Hardware attestation (TECP-B profile)
- Zero-knowledge proofs (TECP-G profile)
- Multi-step workflows
- Browser integration

## Thank You

Your contributions help make privacy violations mathematically impossible. Every contribution, no matter how small, helps build a more private and secure internet.

---

**Questions?** Contact the TECP Working Group at tecp-dev@googlegroups.com
