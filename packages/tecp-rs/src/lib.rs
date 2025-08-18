//! # TECP Rust SDK
//!
//! Trusted Ephemeral Computation Protocol implementation for Rust.
//! Provides cryptographic receipts for verifiable, ephemeral computation.
//!
//! ## Example
//!
//! ```rust
//! use tecp::{ReceiptSigner, ReceiptVerifier};
//! use ed25519_dalek::{SigningKey, VerifyingKey};
//! use rand::rngs::OsRng;
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! // Generate keys
//! let signing_key = SigningKey::generate(&mut OsRng);
//! let verifying_key = signing_key.verifying_key();
//!
//! // Create signer
//! let signer = ReceiptSigner::new(signing_key, verifying_key);
//!
//! // Create receipt
//! let receipt = signer.create_receipt(
//!     "git:abc123",
//!     b"hello world",
//!     b"Hello, World!",
//!     vec!["no_retention".to_string()],
//!     None,
//! )?;
//!
//! // Verify receipt
//! let verifier = ReceiptVerifier::new();
//! let result = verifier.verify(&receipt)?;
//! assert!(result.valid);
//! # Ok(())
//! # }
//! ```

pub mod receipt;
pub mod types;
pub mod error;
pub mod verifier;

pub use receipt::ReceiptSigner;
pub use verifier::ReceiptVerifier;
pub use types::{Receipt, FullReceipt, ReceiptExtensions, VerificationResult};
pub use error::{TECPError, Result};

/// TECP protocol version
pub const TECP_VERSION: &str = "TECP-0.1";

/// Maximum receipt age in milliseconds (24 hours)
pub const MAX_RECEIPT_AGE_MS: i64 = 24 * 60 * 60 * 1000;

/// Maximum clock skew in milliseconds (5 minutes)
pub const MAX_CLOCK_SKEW_MS: i64 = 5 * 60 * 1000;

/// Maximum receipt size in bytes (8KB)
pub const MAX_RECEIPT_SIZE_BYTES: usize = 8192;

/// Performance target for receipt creation (10ms)
pub const PERFORMANCE_TARGET_CREATE_MS: u64 = 10;

/// Performance target for receipt verification (5ms)
pub const PERFORMANCE_TARGET_VERIFY_MS: u64 = 5;
