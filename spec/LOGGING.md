# TECP Transparency Logging

## Leaf Materialization

- `leaf = sha256(canonical_receipt_bytes)`
- `canonical_receipt_bytes` are produced via JSON-C14N (sorted keys, integers only, base64url, compact JSON)

## Unified HTTP API

- POST `/v1/log/entries` ->
```
{
  "leaf_index": number,
  "proof": ["hex", ...],
  "sth": {"size": number, "root": "hex", "sig": "base64", "kid": "string"},
  "algo": "sha256",
  "domain": {"leaf":"00","node":"01"}
}
```

- GET `/v1/log/proof?leaf=HEX` -> same structure
- GET `/v1/log/sth` -> `{ "size": number, "root": "hex", "sig": "base64", "kid": "string" }`

## Merkle Proof Semantics

- Domain separation bytes: `0x00` for leaf, `0x01` for node
- Proof order: bottom-up siblings, left-to-right semantics
- Root recomputation: fold over audit path using node hashing

## JWKS

- Log STH signing key is published at `/.well-known/tecp-log-jwks`
- JWK format: `{ kty: 'OKP', crv: 'Ed25519', x: base64url, kid }`
