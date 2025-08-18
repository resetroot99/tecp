//! TECP Types and Data Structures

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// TECP Receipt - Core required fields only
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Receipt {
    /// TECP protocol version
    pub version: String,
    /// Reference to computation code
    pub code_ref: String,
    /// Timestamp in Unix milliseconds
    pub ts: i64,
    /// Base64-encoded nonce
    pub nonce: String,
    /// SHA-256 hash of input (base64)
    pub input_hash: String,
    /// SHA-256 hash of output (base64)
    pub output_hash: String,
    /// List of policy identifiers
    pub policy_ids: Vec<String>,
    /// Ed25519 signature (base64)
    pub sig: String,
    /// Ed25519 public key (base64)
    pub pubkey: String,
}

/// Key erasure schemes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum KeyErasureScheme {
    #[serde(rename = "counter+seal@tee")]
    CounterSealTee,
    #[serde(rename = "sw-sim")]
    SoftwareSimulation,
}

/// Key erasure proof extension
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct KeyErasureProof {
    /// Key erasure scheme
    pub scheme: KeyErasureScheme,
    /// Base64-encoded erasure evidence
    pub evidence: String,
}

/// Environment metadata extension
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Environment {
    /// Geographic region
    pub region: Option<String>,
    /// Service provider
    pub provider: Option<String>,
}

/// Transparency log inclusion proof
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LogInclusion {
    /// Leaf index in transparency log
    pub leaf_index: u64,
    /// Merkle inclusion proof
    pub merkle_proof: Vec<String>,
    /// Signed log root hash
    pub log_root: String,
}

/// Optional receipt extensions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct ReceiptExtensions {
    /// Key erasure proof
    pub key_erasure: Option<KeyErasureProof>,
    /// Environment metadata
    pub environment: Option<Environment>,
    /// Transparency log inclusion
    pub log_inclusion: Option<LogInclusion>,
}

/// Receipt with optional extensions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FullReceipt {
    /// Core receipt fields
    #[serde(flatten)]
    pub receipt: Receipt,
    /// Optional extensions
    #[serde(flatten)]
    pub extensions: ReceiptExtensions,
}

/// Verification error details
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VerificationError {
    /// Error code
    pub code: String,
    /// Human-readable error message
    pub message: String,
    /// Field that caused the error
    pub field: Option<String>,
}

/// Detailed verification results
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VerificationDetails {
    /// Signature verification status
    pub signature: String,
    /// Timestamp validation status
    pub timestamp: String,
    /// Schema validation status
    pub schema: String,
    /// Transparency log verification status
    pub transparency_log: String,
}

/// Receipt verification result
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VerificationResult {
    /// Overall verification result
    pub valid: bool,
    /// Verification errors
    pub errors: Vec<VerificationError>,
    /// Detailed verification results
    pub details: VerificationDetails,
    /// Performance metrics
    pub performance: HashMap<String, serde_json::Value>,
}

/// Parameters for receipt creation
#[derive(Debug, Clone)]
pub struct CreateReceiptParams<'a> {
    /// Reference to computation code
    pub code_ref: &'a str,
    /// Raw input data
    pub input_data: &'a [u8],
    /// Raw output data
    pub output_data: &'a [u8],
    /// List of policy identifiers
    pub policy_ids: Vec<String>,
    /// Optional extensions
    pub extensions: Option<ReceiptExtensions>,
    /// Custom timestamp (defaults to now)
    pub timestamp: Option<i64>,
    /// Custom nonce (defaults to random)
    pub nonce: Option<String>,
}

/// Error codes matching other implementations
pub const ERROR_CODES: &[(&str, &str)] = &[
    ("E-SIG-001", "Invalid signature format"),
    ("E-SIG-002", "Signature verification failed"),
    ("E-SIG-003", "Public key format invalid"),
    ("E-TS-001", "Timestamp format invalid"),
    ("E-TS-002", "Clock skew exceeded (>5 minutes)"),
    ("E-TS-003", "Receipt expired (>24 hours)"),
    ("E-AGE-001", "Receipt too old"),
    ("E-AGE-002", "Receipt timestamp in future"),
    ("E-SCHEMA-001", "Missing required field"),
    ("E-SCHEMA-002", "Invalid field type"),
    ("E-SCHEMA-003", "Invalid field format"),
    ("E-SCHEMA-004", "Unknown receipt version"),
    ("E-LOG-001", "Log inclusion proof missing"),
    ("E-LOG-002", "Log inclusion proof invalid"),
    ("E-LOG-003", "Root hash mismatch"),
    ("E-LOG-004", "Log service unavailable"),
    ("E-POLICY-001", "Unknown policy ID"),
    ("E-POLICY-002", "Policy validation failed"),
    ("E-POLICY-003", "Policy requirements not met"),
];

impl Default for VerificationDetails {
    fn default() -> Self {
        Self {
            signature: "Invalid".to_string(),
            timestamp: "OK".to_string(),
            schema: "OK".to_string(),
            transparency_log: "Not checked".to_string(),
        }
    }
}

impl Default for VerificationResult {
    fn default() -> Self {
        Self {
            valid: false,
            errors: Vec::new(),
            details: VerificationDetails::default(),
            performance: HashMap::new(),
        }
    }
}
