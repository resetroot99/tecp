"""
TECP Types and Data Structures
"""

from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field
from enum import Enum


class KeyErasureScheme(str, Enum):
    """Key erasure schemes"""
    COUNTER_SEAL_TEE = "counter+seal@tee"
    SOFTWARE_SIMULATION = "sw-sim"


class Receipt(BaseModel):
    """TECP Receipt - Core required fields only"""
    version: str = Field(default="TECP-0.1", description="TECP protocol version")
    code_ref: str = Field(description="Reference to computation code")
    ts: int = Field(description="Timestamp in Unix milliseconds")
    nonce: str = Field(description="Base64-encoded nonce")
    input_hash: str = Field(description="SHA-256 hash of input (base64)")
    output_hash: str = Field(description="SHA-256 hash of output (base64)")
    policy_ids: List[str] = Field(description="List of policy identifiers")
    sig: str = Field(description="Ed25519 signature (base64)")
    pubkey: str = Field(description="Ed25519 public key (base64)")

    class Config:
        """Pydantic configuration"""
        extra = "allow"  # Allow extension fields
        json_encoders = {
            # Ensure consistent JSON serialization
        }


class KeyErasureProof(BaseModel):
    """Key erasure proof extension"""
    scheme: KeyErasureScheme = Field(description="Key erasure scheme")
    evidence: str = Field(description="Base64-encoded erasure evidence")


class Environment(BaseModel):
    """Environment metadata extension"""
    region: Optional[str] = Field(None, description="Geographic region")
    provider: Optional[str] = Field(None, description="Service provider")


class LogInclusion(BaseModel):
    """Transparency log inclusion proof"""
    leaf_index: int = Field(description="Leaf index in transparency log")
    merkle_proof: List[str] = Field(description="Merkle inclusion proof")
    log_root: str = Field(description="Signed log root hash")


class ReceiptExtensions(BaseModel):
    """Optional receipt extensions"""
    key_erasure: Optional[KeyErasureProof] = None
    environment: Optional[Environment] = None
    log_inclusion: Optional[LogInclusion] = None


class FullReceipt(Receipt):
    """Receipt with optional extensions"""
    key_erasure: Optional[KeyErasureProof] = None
    environment: Optional[Environment] = None
    log_inclusion: Optional[LogInclusion] = None


class VerificationError(BaseModel):
    """Verification error details"""
    code: str = Field(description="Error code")
    message: str = Field(description="Human-readable error message")
    field: Optional[str] = Field(None, description="Field that caused the error")


class VerificationDetails(BaseModel):
    """Detailed verification results"""
    signature: str = Field(description="Signature verification status")
    timestamp: str = Field(description="Timestamp validation status")
    schema: str = Field(description="Schema validation status")
    transparency_log: str = Field(description="Transparency log verification status")


class VerificationResult(BaseModel):
    """Receipt verification result"""
    valid: bool = Field(description="Overall verification result")
    errors: List[VerificationError] = Field(default_factory=list, description="Verification errors")
    details: VerificationDetails = Field(description="Detailed verification results")
    performance: Dict[str, Union[int, float]] = Field(
        default_factory=dict, 
        description="Performance metrics"
    )


class CreateReceiptParams(BaseModel):
    """Parameters for receipt creation"""
    code_ref: str = Field(description="Reference to computation code")
    input_data: bytes = Field(description="Raw input data")
    output_data: bytes = Field(description="Raw output data")
    policy_ids: List[str] = Field(description="List of policy identifiers")
    extensions: Optional[ReceiptExtensions] = Field(None, description="Optional extensions")
    timestamp: Optional[int] = Field(None, description="Custom timestamp (defaults to now)")
    nonce: Optional[str] = Field(None, description="Custom nonce (defaults to random)")


# Constants
TECP_VERSION = "TECP-0.1"
MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000  # 24 hours
MAX_CLOCK_SKEW_MS = 5 * 60 * 1000  # 5 minutes
MAX_RECEIPT_SIZE_BYTES = 8192  # 8KB
PERFORMANCE_TARGET_CREATE_MS = 10
PERFORMANCE_TARGET_VERIFY_MS = 5

# Error codes matching TypeScript implementation
ERROR_CODES = {
    "E-SIG-001": "Invalid signature format",
    "E-SIG-002": "Signature verification failed",
    "E-SIG-003": "Public key format invalid",
    "E-TS-001": "Timestamp format invalid",
    "E-TS-002": "Clock skew exceeded (>5 minutes)",
    "E-TS-003": "Receipt expired (>24 hours)",
    "E-AGE-001": "Receipt too old",
    "E-AGE-002": "Receipt timestamp in future",
    "E-SCHEMA-001": "Missing required field",
    "E-SCHEMA-002": "Invalid field type",
    "E-SCHEMA-003": "Invalid field format",
    "E-SCHEMA-004": "Unknown receipt version",
    "E-LOG-001": "Log inclusion proof missing",
    "E-LOG-002": "Log inclusion proof invalid",
    "E-LOG-003": "Root hash mismatch",
    "E-LOG-004": "Log service unavailable",
    "E-POLICY-001": "Unknown policy ID",
    "E-POLICY-002": "Policy validation failed",
    "E-POLICY-003": "Policy requirements not met",
}
