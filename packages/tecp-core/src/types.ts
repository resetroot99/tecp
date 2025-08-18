/**
 * TECP Core Types - Minimal Receipt v0.1
 * 
 * Conservative threat model: proves ephemeral design and policy enforcement
 * Does NOT claim: RAM wipe proof, side-channel immunity, hardware attestation
 */

// TECP Profile types
export type TECPProfile = 'tecp-lite' | 'tecp-v0.1' | 'tecp-strict';

// Minimal Receipt v0.1 - ONLY required fields (9 total)
export interface Receipt {
  version: 'TECP-0.1';
  code_ref: string;        // git:commit or build:hash  
  ts: number;              // Unix milliseconds
  nonce: string;           // 16 bytes base64
  input_hash: string;      // SHA-256 base64
  output_hash: string;     // SHA-256 base64
  policy_ids: string[];    // Machine IDs, not prose
  sig: string;             // Ed25519 signature base64
  pubkey: string;          // Ed25519 public key base64
}

// Optional extensions (not in core signing)
export interface ReceiptExtensions {
  key_erasure?: {
    scheme: 'counter+seal@tee' | 'sw-sim';
    evidence: string; // base64
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
  // Profile-specific extensions
  ext?: Record<string, unknown>; // Compliance metadata, custom fields
  anchors?: {
    log?: {
      url: string;
      root_hash: string;
      timestamp: number;
    };
    signed_time?: {
      timestamp: number;
      signature: string;
      kid: string; // Key ID for rotation
    };
  };
}

export type FullReceipt = Receipt & ReceiptExtensions;

// Verification result with structured error codes
export interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  error_codes?: string[]; // E-SIG-INVALID, E-SIG-EXPIRED, E-LOG-MISSING, etc.
  profile?: TECPProfile;
}

// Receipt creation parameters
export interface CreateReceiptParams {
  code_ref: string;
  input: Buffer | string;
  output: Buffer | string;
  policy_ids: string[];
  extensions?: ReceiptExtensions;
  profile?: TECPProfile; // Default: tecp-v0.1
}

// Policy registry entry
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

// Test vector for interoperability
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
