/**
 * TECP Core - Trusted Ephemeral Computation Protocol
 *
 * Making privacy violations mathematically impossible through:
 * - Ephemeral execution with cryptographic receipts
 * - Deterministic CBOR+COSE signing for interoperability
 * - Conservative threat model with clear boundaries
 *
 * @version TECP-0.1
 * @license Apache-2.0
 */
// Core receipt implementation
export { ReceiptSigner, ReceiptVerifier, ReceiptUtils } from './receipt.js';
// Test vectors for interoperability
export { TEST_VECTORS } from './test-vectors.js';
// Policy runtime for enforcement
export { PolicyRuntime, NoPIIEnforcer, TTLEnforcer, NoNetworkEnforcer } from './policy-runtime.js';
// Constants
export const TECP_VERSION = 'TECP-0.1';
export const MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_RECEIPT_SIZE_BYTES = 8192; // 8KB
export const PERFORMANCE_TARGET_CREATE_MS = 10;
export const PERFORMANCE_TARGET_VERIFY_MS = 5;
//# sourceMappingURL=index.js.map