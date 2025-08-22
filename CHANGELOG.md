## vX.Y.0 — Verifiable Receipts & Unified Log API

### Added
- **Deterministic receipts (JSON-C14N)** with `leaf = sha256(canonical_receipt_bytes)` for transparency proofs.
- **Client-side Merkle verification** (0x00/0x01 domain sep) in JS SDK, plus **JWKS keyring** for KID-based key rotation.
- **Unified Transparency Log API** across services:
  - `POST /v1/log/entries`, `GET /v1/log/proof?leaf=HEX`, `GET /v1/log/sth`
  - Public log keys: `/.well-known/tecp-log-jwks`
- **STRICT profile enforcement** (requires valid `log_inclusion` + non-empty `policy_ids`)
  and **stable machine-readable verifier output**.
- **Gateway env toggles** to enable LITE/STRICT receipts and optional anchoring:
  - `TECP_PROFILE`, `TECP_LOG_URL`, `TECP_PRIVATE_KEY`, `TECP_KID`
  - Gateway JWKS: `/.well-known/tecp-gateway-jwks`
  - `/health` exposes `profile`, `kid`, `log_url`

### Changed
- Sign/verify now use canonical JSON bytes across all paths.
- Time skew constants: **LITE ±120s**, **STRICT ±10s** (configurable).

### Docs & Vectors
- `spec/PROTOCOL.md#canonicalization`, new `spec/LOGGING.md`
- Test vectors for **c14n**, **leaf**, **merkle** (valid/negative).

### Notes
- LITE remains backward-compatible.
- STRICT receipts will fail verification if `log_inclusion` or `policy_ids` requirements are not met.


