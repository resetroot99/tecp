/**
 * TECP Test Vectors - Known Answer Tests (KATs) for interoperability
 *
 * These test vectors ensure that all TECP implementations produce
 * identical results for the same inputs (deterministic CBOR signing)
 */
import type { TestVector } from './types.js';
/**
 * Known Answer Tests for TECP v0.1 interoperability
 *
 * All implementations MUST pass these tests to be considered compliant
 * Same input MUST produce identical CBOR bytes across all platforms
 */
export declare const TEST_VECTORS: TestVector[];
/**
 * Generate test receipt for development/testing
 * NOT for production use - uses predictable keys
 */
export declare function generateTestReceipt(): {
    privateKey: string;
    publicKey: string;
    testData: {
        code_ref: string;
        input_data: string;
        output_data: string;
        policy_ids: string[];
    };
};
//# sourceMappingURL=test-vectors.d.ts.map