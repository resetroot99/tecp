/**
 * TECP Core Types - Minimal Receipt v0.1
 *
 * Conservative threat model: proves ephemeral design and policy enforcement
 * Does NOT claim: RAM wipe proof, side-channel immunity, hardware attestation
 */
export type TECPProfile = 'tecp-lite' | 'tecp-v0.1' | 'tecp-strict';
export interface Receipt {
    version: 'TECP-0.1';
    code_ref: string;
    ts: number;
    nonce: string;
    input_hash: string;
    output_hash: string;
    policy_ids: string[];
    sig: string;
    pubkey: string;
}
export interface ReceiptExtensions {
    key_erasure?: {
        scheme: 'counter+seal@tee' | 'sw-sim';
        evidence: string;
    };
    environment?: {
        region?: string;
        provider?: string;
    };
    log_inclusion?: {
        leaf_index: number;
        merkle_proof: string[];
        log_root: string;
    };
    ext?: Record<string, unknown>;
    anchors?: {
        log?: {
            url: string;
            root_hash: string;
            timestamp: number;
        };
        signed_time?: {
            timestamp: number;
            signature: string;
            kid: string;
        };
    };
}
export type FullReceipt = Receipt & ReceiptExtensions;
export interface VerificationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
    error_codes?: string[];
    profile?: TECPProfile;
}
export interface CreateReceiptParams {
    code_ref: string;
    input: Buffer | string;
    output: Buffer | string;
    policy_ids: string[];
    extensions?: ReceiptExtensions;
    profile?: TECPProfile;
}
export interface PolicyDefinition {
    description: string;
    enforcement_type: 'design' | 'infrastructure' | 'code_audit' | 'runtime' | 'cryptographic';
    machine_check: string;
    compliance_tags: string[];
}
export interface PolicyRegistry {
    version: string;
    policies: Record<string, PolicyDefinition>;
}
export interface TestVector {
    name: string;
    description: string;
    input?: {
        private_key: string;
        public_key: string;
        code_ref: string;
        input_data: string;
        output_data: string;
        policy_ids: string[];
        timestamp?: number;
        nonce?: string;
    };
    receipt?: Receipt | FullReceipt;
    cbor_bytes?: string;
    verification_result: boolean;
    expected_errors?: string[];
}
//# sourceMappingURL=types.d.ts.map