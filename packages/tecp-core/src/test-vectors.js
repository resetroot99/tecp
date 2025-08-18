/**
 * TECP Test Vectors - Known Answer Tests (KATs) for interoperability
 *
 * These test vectors ensure that all TECP implementations produce
 * identical results for the same inputs (deterministic CBOR signing)
 */
/**
 * Known Answer Tests for TECP v0.1 interoperability
 *
 * All implementations MUST pass these tests to be considered compliant
 * Same input MUST produce identical CBOR bytes across all platforms
 */
export const TEST_VECTORS = [
    {
        name: 'valid_basic_receipt',
        description: 'Minimal valid receipt with required fields only',
        input: {
            private_key: 'MC4CAQAwBQYDK2VwBCIEIF5mN5Z8xF6B7n9xI8+3JlLqtRjQ1mU8YYIzT7ZOjR7p',
            public_key: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA==',
            code_ref: 'git:abc123',
            input_data: 'hello world',
            output_data: 'Hello, World!',
            policy_ids: ['no_retention'],
            timestamp: 1692115200000,
            nonce: 'dGVzdC1ub25jZS0xMjM='
        },
        verification_result: true
    },
    {
        name: 'multiple_policies_receipt',
        description: 'Receipt with multiple policy IDs (sorted deterministically)',
        input: {
            private_key: 'MC4CAQAwBQYDK2VwBCIEIF5mN5Z8xF6B7n9xI8+3JlLqtRjQ1mU8YYIzT7ZOjR7p',
            public_key: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA==',
            code_ref: 'build:sha256:def456',
            input_data: '{"sensitive": "medical data"}',
            output_data: '{"diagnosis": "healthy", "confidence": 0.95}',
            policy_ids: ['hipaa_safe', 'eu_region', 'no_retention'], // Will be sorted
            timestamp: 1692115260000,
            nonce: 'dGVzdC1ub25jZS00NTY='
        },
        verification_result: true
    },
    {
        name: 'invalid_signature',
        description: 'Receipt with tampered signature should fail verification',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: 1692115200000,
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'INVALID_SIGNATURE_HERE_SHOULD_FAIL_VERIFICATION',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Invalid cryptographic signature']
    },
    {
        name: 'missing_required_field',
        description: 'Receipt missing required field should fail validation',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: 1692115200000,
            // Missing nonce field
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'valid_signature_but_missing_nonce',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Missing required field: nonce']
    },
    {
        name: 'expired_receipt',
        description: 'Receipt with old timestamp should be rejected (>24h)',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'valid_signature_for_old_timestamp',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Receipt too old (>24 hours)']
    },
    {
        name: 'future_timestamp',
        description: 'Receipt with future timestamp should be rejected (>5min skew)',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: Date.now() + (10 * 60 * 1000), // 10 minutes in future
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'valid_signature_for_future_timestamp',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Receipt timestamp in future (>5 minutes)']
    },
    {
        name: 'invalid_version',
        description: 'Receipt with wrong version should be rejected',
        receipt: {
            version: 'TECP-1.0', // Wrong version
            code_ref: 'git:abc123',
            ts: 1692115200000,
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'valid_signature_wrong_version',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Invalid or missing version (must be TECP-0.1)']
    },
    {
        name: 'malformed_base64_nonce',
        description: 'Receipt with malformed base64 nonce should be rejected',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: Date.now() - 1000,
            nonce: 'invalid-base64!@#', // Invalid base64
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'dGVzdC1zaWduYXR1cmU=',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Invalid base64 encoding for field: nonce']
    },
    {
        name: 'malformed_base64_hash',
        description: 'Receipt with malformed base64 hash should be rejected',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: Date.now() - 1000,
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'not-valid-base64-hash', // Invalid base64
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'dGVzdC1zaWduYXR1cmU=',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Invalid base64 encoding for field: input_hash']
    },
    {
        name: 'empty_policy_ids',
        description: 'Receipt with empty policy_ids array should be valid',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: Date.now() - 1000,
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: [], // Empty array should be valid
            sig: 'INVALID_SIGNATURE_HERE_SHOULD_FAIL_VERIFICATION',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Signature verification failed']
    },
    {
        name: 'policy_ids_not_array',
        description: 'Receipt with policy_ids as string should be rejected',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: Date.now() - 1000,
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: 'no_retention', // Should be array
            sig: 'dGVzdC1zaWduYXR1cmU=',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['policy_ids must be an array']
    },
    {
        name: 'zero_timestamp',
        description: 'Receipt with zero timestamp should be rejected',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: 0, // Invalid timestamp
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'dGVzdC1zaWduYXR1cmU=',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Invalid timestamp (must be positive number)']
    },
    {
        name: 'negative_timestamp',
        description: 'Receipt with negative timestamp should be rejected',
        receipt: {
            version: 'TECP-0.1',
            code_ref: 'git:abc123',
            ts: -1000, // Invalid timestamp
            nonce: 'dGVzdC1ub25jZS0xMjM=',
            input_hash: 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=',
            output_hash: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
            policy_ids: ['no_retention'],
            sig: 'dGVzdC1zaWduYXR1cmU=',
            pubkey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=='
        },
        verification_result: false,
        expected_errors: ['Invalid timestamp (must be positive number)']
    }
];
/**
 * Generate test receipt for development/testing
 * NOT for production use - uses predictable keys
 */
export function generateTestReceipt() {
    return {
        privateKey: 'MC4CAQAwBQYDK2VwBCIEIF5mN5Z8xF6B7n9xI8+3JlLqtRjQ1mU8YYIzT7ZOjR7p',
        publicKey: 'MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA==',
        testData: {
            code_ref: 'git:test-commit-abc123',
            input_data: 'test input data',
            output_data: 'test output data',
            policy_ids: ['no_retention', 'test_env']
        }
    };
}
//# sourceMappingURL=test-vectors.js.map