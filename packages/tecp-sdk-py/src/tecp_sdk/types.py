"""
TECP Types for Python SDK

Type definitions for TECP receipts and related data structures.
"""

from typing import List, Optional, Dict, Any, Literal, Union
from dataclasses import dataclass
from enum import Enum


# TECP Profile types
TECPProfile = Literal["tecp-lite", "tecp-v0.1", "tecp-strict"]


@dataclass
class Receipt:
    """
    TECP Receipt data structure.
    
    Core fields (always present):
        version: TECP protocol version
        code_ref: Reference to code that processed the data
        ts: Timestamp in milliseconds since Unix epoch
        nonce: Random nonce for replay protection
        input_hash: SHA-256 hash of input data (base64)
        output_hash: SHA-256 hash of output data (base64)
        policy_ids: List of policy identifiers
        sig: Ed25519 signature over core fields (base64)
        pubkey: Ed25519 public key (base64)
    
    Optional extensions:
        log_inclusion: Transparency log inclusion proof
        key_erasure: Key erasure evidence
        environment: Environment metadata
        anchors: Time and other anchors
        ext: Custom extensions
    """
    
    # Core fields (required)
    version: str
    code_ref: str
    ts: int
    nonce: str
    input_hash: str
    output_hash: str
    policy_ids: List[str]
    sig: str
    pubkey: str
    
    # Optional extensions
    log_inclusion: Optional[Dict[str, Any]] = None
    key_erasure: Optional[Dict[str, Any]] = None
    environment: Optional[Dict[str, Any]] = None
    anchors: Optional[Dict[str, Any]] = None
    ext: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert receipt to dictionary."""
        result = {
            "version": self.version,
            "code_ref": self.code_ref,
            "ts": self.ts,
            "nonce": self.nonce,
            "input_hash": self.input_hash,
            "output_hash": self.output_hash,
            "policy_ids": self.policy_ids,
            "sig": self.sig,
            "pubkey": self.pubkey,
        }
        
        # Add optional fields if present
        if self.log_inclusion:
            result["log_inclusion"] = self.log_inclusion
        if self.key_erasure:
            result["key_erasure"] = self.key_erasure
        if self.environment:
            result["environment"] = self.environment
        if self.anchors:
            result["anchors"] = self.anchors
        if self.ext:
            result["ext"] = self.ext
            
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Receipt":
        """Create receipt from dictionary."""
        return cls(
            version=data["version"],
            code_ref=data["code_ref"],
            ts=data["ts"],
            nonce=data["nonce"],
            input_hash=data["input_hash"],
            output_hash=data["output_hash"],
            policy_ids=data["policy_ids"],
            sig=data["sig"],
            pubkey=data["pubkey"],
            log_inclusion=data.get("log_inclusion"),
            key_erasure=data.get("key_erasure"),
            environment=data.get("environment"),
            anchors=data.get("anchors"),
            ext=data.get("ext"),
        )


@dataclass
class VerificationResult:
    """
    Result of receipt verification.
    
    Attributes:
        valid: Whether the receipt is cryptographically valid
        errors: List of validation errors (if any)
        warnings: List of warnings (non-fatal issues)
        profile: TECP profile used for verification
        error_codes: Structured error codes for programmatic handling
    """
    
    valid: bool
    errors: List[str]
    warnings: Optional[List[str]] = None
    profile: Optional[TECPProfile] = None
    error_codes: Optional[List[str]] = None


@dataclass
class PolicyResult:
    """
    Result of policy enforcement.
    
    Attributes:
        allowed: Whether the input passes all policy checks
        transformed_input: Input after policy transformations (if any)
        evidence: Evidence of policy enforcement
        violations: List of policy violations (if any)
    """
    
    allowed: bool
    transformed_input: str
    evidence: Dict[str, Any]
    violations: List[str]


class ErrorCode(Enum):
    """Structured error codes for TECP operations."""
    
    # Signature errors
    SIG_INVALID_FORMAT = "E-SIG-001"
    SIG_VERIFICATION_FAILED = "E-SIG-002"
    SIG_PUBKEY_INVALID = "E-SIG-003"
    
    # Timestamp errors
    TS_INVALID_FORMAT = "E-TS-001"
    TS_CLOCK_SKEW = "E-TS-002"
    TS_EXPIRED = "E-TS-003"
    
    # Age errors
    AGE_TOO_OLD = "E-AGE-001"
    AGE_FUTURE = "E-AGE-002"
    
    # Schema errors
    SCHEMA_MISSING_FIELD = "E-SCHEMA-001"
    SCHEMA_INVALID_TYPE = "E-SCHEMA-002"
    SCHEMA_INVALID_FORMAT = "E-SCHEMA-003"
    SCHEMA_UNKNOWN_VERSION = "E-SCHEMA-004"
    
    # Log errors
    LOG_MISSING_PROOF = "E-LOG-001"
    LOG_INVALID_PROOF = "E-LOG-002"
    LOG_ROOT_MISMATCH = "E-LOG-003"
    LOG_UNAVAILABLE = "E-LOG-004"
    
    # Policy errors
    POLICY_UNKNOWN_ID = "E-POLICY-001"
    POLICY_VALIDATION_FAILED = "E-POLICY-002"
    POLICY_REQUIREMENTS_NOT_MET = "E-POLICY-003"


@dataclass
class LogInclusionProof:
    """Transparency log inclusion proof."""
    
    leaf_index: int
    merkle_proof: List[str]
    log_root: str


@dataclass
class KeyErasureEvidence:
    """Evidence of cryptographic key erasure."""
    
    scheme: str  # 'counter+seal@tee', 'hw-hsm', 'sw-secure', etc.
    evidence: str  # Base64 encoded attestation


@dataclass
class SignedTimeAnchor:
    """Signed timestamp anchor from trusted time source."""
    
    timestamp: int
    signature: str
    kid: str  # Key ID for rotation


@dataclass
class PolicyDefinition:
    """Definition of a TECP policy."""
    
    id: str
    name: str
    description: str
    compliance_frameworks: List[str]
    enforcement_level: Literal["advisory", "required", "strict"]
    parameters: Optional[Dict[str, Any]] = None


# Type aliases for convenience
ReceiptDict = Dict[str, Any]
KeyPair = tuple[bytes, bytes]  # (private_key, public_key)
Timestamp = int  # Unix timestamp in milliseconds
