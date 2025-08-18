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
export { ReceiptSigner, ReceiptVerifier, ReceiptUtils } from './receipt.js';
export type { Receipt, ReceiptExtensions, FullReceipt, CreateReceiptParams, VerificationResult, PolicyDefinition, PolicyRegistry, TestVector, TECPProfile } from './types.js';
export { TEST_VECTORS } from './test-vectors.js';
export { PolicyRuntime, NoPIIEnforcer, TTLEnforcer, NoNetworkEnforcer } from './policy-runtime.js';
export type { PolicyEnforcer, PolicyContext, PolicyResult } from './policy-runtime.js';
export declare const TECP_VERSION = "TECP-0.1";
export declare const MAX_RECEIPT_AGE_MS: number;
export declare const MAX_CLOCK_SKEW_MS: number;
export declare const MAX_RECEIPT_SIZE_BYTES = 8192;
export declare const PERFORMANCE_TARGET_CREATE_MS = 10;
export declare const PERFORMANCE_TARGET_VERIFY_MS = 5;
//# sourceMappingURL=index.d.ts.map