"""
TECP Receipt Implementation

Core receipt signing and verification functionality.
"""

import time
import hashlib
import secrets
import base64
from typing import Optional, Dict, Any

import cbor2
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, PublicFormat, NoEncryption

from .types import (
    Receipt, FullReceipt, ReceiptExtensions, CreateReceiptParams,
    VerificationResult, VerificationError, VerificationDetails,
    TECP_VERSION, MAX_RECEIPT_AGE_MS, MAX_CLOCK_SKEW_MS, ERROR_CODES
)
from .exceptions import TECPError, SignatureError, VerificationError as VerificationException


class ReceiptSigner:
    """TECP Receipt Signer
    
    Creates cryptographically signed receipts for ephemeral computation.
    """
    
    def __init__(self, private_key: bytes, public_key: bytes):
        """Initialize signer with Ed25519 key pair
        
        Args:
            private_key: Ed25519 private key bytes
            public_key: Ed25519 public key bytes
        """
        try:
            self._private_key = Ed25519PrivateKey.from_private_bytes(private_key)
            self._public_key = Ed25519PublicKey.from_public_bytes(public_key)
            self._public_key_b64 = base64.b64encode(public_key).decode('ascii')
        except Exception as e:
            raise SignatureError(f"Invalid key format: {e}")
    
    def create_receipt(
        self,
        code_ref: str,
        input_data: bytes,
        output_data: bytes,
        policy_ids: list[str],
        extensions: Optional[ReceiptExtensions] = None,
        timestamp: Optional[int] = None,
        nonce: Optional[str] = None
    ) -> FullReceipt:
        """Create a signed TECP receipt
        
        Args:
            code_ref: Reference to computation code
            input_data: Raw input data
            output_data: Raw output data  
            policy_ids: List of policy identifiers
            extensions: Optional receipt extensions
            timestamp: Custom timestamp (defaults to now)
            nonce: Custom nonce (defaults to random)
            
        Returns:
            Signed TECP receipt
            
        Raises:
            SignatureError: If signing fails
        """
        # Generate timestamp and nonce if not provided
        if timestamp is None:
            timestamp = int(time.time() * 1000)
        
        if nonce is None:
            nonce_bytes = secrets.token_bytes(16)
            nonce = base64.b64encode(nonce_bytes).decode('ascii')
        
        # Hash input and output
        input_hash = self._sha256_b64(input_data)
        output_hash = self._sha256_b64(output_data)
        
        # Create core receipt (fields included in signature)
        core_receipt = {
            "version": TECP_VERSION,
            "code_ref": code_ref,
            "ts": timestamp,
            "nonce": nonce,
            "input_hash": input_hash,
            "output_hash": output_hash,
            "policy_ids": policy_ids,
            "pubkey": self._public_key_b64
        }
        
        # Sign the core receipt
        try:
            cbor_bytes = self._canonical_cbor(core_receipt)
            signature = self._private_key.sign(cbor_bytes)
            sig_b64 = base64.b64encode(signature).decode('ascii')
        except Exception as e:
            raise SignatureError(f"Signing failed: {e}")
        
        # Create full receipt with signature
        receipt_data = {
            **core_receipt,
            "sig": sig_b64
        }
        
        # Add extensions if provided
        if extensions:
            if extensions.key_erasure:
                receipt_data["key_erasure"] = extensions.key_erasure.dict()
            if extensions.environment:
                receipt_data["environment"] = extensions.environment.dict()
            if extensions.log_inclusion:
                receipt_data["log_inclusion"] = extensions.log_inclusion.dict()
        
        return FullReceipt(**receipt_data)
    
    def _sha256_b64(self, data: bytes) -> str:
        """Compute SHA-256 hash and encode as base64"""
        digest = hashlib.sha256(data).digest()
        return base64.b64encode(digest).decode('ascii')
    
    def _canonical_cbor(self, obj: Dict[str, Any]) -> bytes:
        """Encode object as canonical CBOR for signing"""
        # Sort keys for deterministic encoding
        sorted_obj = self._sort_dict_recursively(obj)
        return cbor2.dumps(sorted_obj, canonical=True)
    
    def _sort_dict_recursively(self, obj: Any) -> Any:
        """Recursively sort dictionary keys"""
        if isinstance(obj, dict):
            return {k: self._sort_dict_recursively(v) for k, v in sorted(obj.items())}
        elif isinstance(obj, list):
            return [self._sort_dict_recursively(item) for item in obj]
        else:
            return obj


class ReceiptVerifier:
    """TECP Receipt Verifier
    
    Verifies cryptographic receipts independently of the signer.
    """
    
    def verify(self, receipt: Dict[str, Any]) -> VerificationResult:
        """Verify a TECP receipt
        
        Args:
            receipt: Receipt data to verify
            
        Returns:
            Verification result with details and errors
        """
        start_time = time.time()
        errors = []
        
        # Initialize verification details
        details = VerificationDetails(
            signature="Invalid",
            timestamp="OK", 
            schema="OK",
            transparency_log="Not checked"
        )
        
        try:
            # Validate schema
            receipt_obj = Receipt(**receipt)
            details.schema = "OK"
        except Exception as e:
            errors.append(VerificationError(
                code="E-SCHEMA-001",
                message=f"Schema validation failed: {e}",
                field="schema"
            ))
            details.schema = f"Schema error: {e}"
        
        # Validate timestamp
        try:
            now = int(time.time() * 1000)
            ts = receipt.get("ts", 0)
            
            if ts > now + MAX_CLOCK_SKEW_MS:
                errors.append(VerificationError(
                    code="E-TS-002",
                    message="Clock skew exceeded",
                    field="ts"
                ))
                details.timestamp = "Skew"
            elif now - ts > MAX_RECEIPT_AGE_MS:
                errors.append(VerificationError(
                    code="E-TS-003", 
                    message="Receipt expired",
                    field="ts"
                ))
                details.timestamp = "Expired"
            else:
                details.timestamp = "OK"
                
        except Exception as e:
            errors.append(VerificationError(
                code="E-TS-001",
                message=f"Timestamp validation failed: {e}",
                field="ts"
            ))
            details.timestamp = "Invalid"
        
        # Verify signature
        try:
            if self._verify_signature(receipt):
                details.signature = "Valid"
            else:
                errors.append(VerificationError(
                    code="E-SIG-002",
                    message="Signature verification failed",
                    field="sig"
                ))
                details.signature = "Invalid"
        except Exception as e:
            errors.append(VerificationError(
                code="E-SIG-001",
                message=f"Signature format error: {e}",
                field="sig"
            ))
            details.signature = "Invalid"
        
        # Check transparency log inclusion if present
        if "log_inclusion" in receipt:
            # TODO: Implement transparency log verification
            details.transparency_log = "Not implemented"
        
        # Calculate performance metrics
        verification_time = int((time.time() - start_time) * 1000)
        receipt_size = len(str(receipt).encode('utf-8'))
        
        return VerificationResult(
            valid=len(errors) == 0,
            errors=errors,
            details=details,
            performance={
                "verification_time_ms": verification_time,
                "receipt_size_bytes": receipt_size
            }
        )
    
    def _verify_signature(self, receipt: Dict[str, Any]) -> bool:
        """Verify Ed25519 signature on receipt"""
        try:
            # Extract core fields for verification
            core_fields = {
                "version": receipt["version"],
                "code_ref": receipt["code_ref"],
                "ts": receipt["ts"],
                "nonce": receipt["nonce"],
                "input_hash": receipt["input_hash"],
                "output_hash": receipt["output_hash"],
                "policy_ids": receipt["policy_ids"],
                "pubkey": receipt["pubkey"]
            }
            
            # Encode as canonical CBOR
            cbor_bytes = self._canonical_cbor(core_fields)
            
            # Decode signature and public key
            signature = base64.b64decode(receipt["sig"])
            public_key_bytes = base64.b64decode(receipt["pubkey"])
            
            # Verify signature
            public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
            public_key.verify(signature, cbor_bytes)
            
            return True
            
        except Exception:
            return False
    
    def _canonical_cbor(self, obj: Dict[str, Any]) -> bytes:
        """Encode object as canonical CBOR"""
        sorted_obj = self._sort_dict_recursively(obj)
        return cbor2.dumps(sorted_obj, canonical=True)
    
    def _sort_dict_recursively(self, obj: Any) -> Any:
        """Recursively sort dictionary keys"""
        if isinstance(obj, dict):
            return {k: self._sort_dict_recursively(v) for k, v in sorted(obj.items())}
        elif isinstance(obj, list):
            return [self._sort_dict_recursively(item) for item in obj]
        else:
            return obj
