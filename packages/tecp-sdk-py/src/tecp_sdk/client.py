"""
TECP Client Implementation

Main client class for creating and verifying TECP receipts in Python.
"""

import json
import time
import hashlib
import secrets
from typing import Optional, Dict, List, Any, Union
from dataclasses import asdict

import cbor2
import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, PublicFormat, NoEncryption

from .types import Receipt, VerificationResult, TECPProfile, PolicyResult
from .exceptions import TECPError, SignatureError, TimestampError, PolicyError
from .policies import PolicyRuntime


class TECPClient:
    """
    TECP Client for creating and verifying ephemeral computation receipts.
    
    Args:
        private_key: Ed25519 private key for signing receipts (optional)
        profile: TECP profile to use ('tecp-lite', 'tecp-v0.1', 'tecp-strict')
        log_url: Transparency log URL for verification
        verifier_url: External verifier service URL
    
    Example:
        >>> client = TECPClient(private_key=private_key, profile='tecp-v0.1')
        >>> receipt = await client.create_receipt(
        ...     input_data="sensitive data",
        ...     output_data="result",
        ...     policies=["no_retention"]
        ... )
    """
    
    def __init__(
        self,
        private_key: Optional[Ed25519PrivateKey] = None,
        profile: TECPProfile = "tecp-v0.1",
        log_url: Optional[str] = None,
        verifier_url: Optional[str] = None,
    ):
        self.private_key = private_key
        self.profile = profile
        self.log_url = log_url
        self.verifier_url = verifier_url
        self.policy_runtime = PolicyRuntime()
        
        # Constants
        self.TECP_VERSION = "TECP-0.1"
        self.MAX_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000  # 24 hours
        self.MAX_CLOCK_SKEW_MS = 5 * 60 * 1000  # 5 minutes
        
        # Profile-specific settings
        if profile == "tecp-lite":
            self.MAX_RECEIPT_AGE_MS = 7 * 24 * 60 * 60 * 1000  # 7 days
            self.MAX_CLOCK_SKEW_MS = 15 * 60 * 1000  # 15 minutes
        elif profile == "tecp-strict":
            self.MAX_RECEIPT_AGE_MS = 60 * 60 * 1000  # 1 hour
            self.MAX_CLOCK_SKEW_MS = 60 * 1000  # 1 minute

    async def create_receipt(
        self,
        input_data: Union[str, bytes],
        output_data: Union[str, bytes],
        policies: Optional[List[str]] = None,
        code_ref: Optional[str] = None,
        extensions: Optional[Dict[str, Any]] = None,
    ) -> Receipt:
        """
        Create a TECP receipt for ephemeral computation.
        
        Args:
            input_data: Input data that was processed
            output_data: Output data that was produced
            policies: List of policy IDs to enforce
            code_ref: Code reference (git commit, build hash, etc.)
            extensions: Additional metadata to include
            
        Returns:
            Signed TECP receipt
            
        Raises:
            TECPError: If private key is not provided or signing fails
        """
        if not self.private_key:
            raise TECPError("Private key required for receipt creation")
        
        # Convert data to bytes if needed
        if isinstance(input_data, str):
            input_data = input_data.encode('utf-8')
        if isinstance(output_data, str):
            output_data = output_data.encode('utf-8')
        
        # Generate receipt fields
        timestamp = int(time.time() * 1000)
        nonce = secrets.token_bytes(16)
        input_hash = hashlib.sha256(input_data).digest()
        output_hash = hashlib.sha256(output_data).digest()
        
        # Create core receipt
        receipt_data = {
            "version": self.TECP_VERSION,
            "code_ref": code_ref or f"python-sdk:{timestamp}",
            "ts": timestamp,
            "nonce": self._b64encode(nonce),
            "input_hash": self._b64encode(input_hash),
            "output_hash": self._b64encode(output_hash),
            "policy_ids": policies or ["no_retention"],
        }
        
        # Add public key
        public_key_bytes = self.private_key.public_key().public_bytes(
            encoding=Encoding.Raw,
            format=PublicFormat.Raw
        )
        receipt_data["pubkey"] = self._b64encode(public_key_bytes)
        
        # Sign the receipt
        canonical_cbor = self._canonical_cbor(receipt_data)
        signature = self.private_key.sign(canonical_cbor)
        receipt_data["sig"] = self._b64encode(signature)
        
        # Add extensions
        if extensions:
            receipt_data.update(extensions)
        
        # Add environment metadata
        receipt_data["environment"] = {
            "provider": "tecp-sdk-python",
            "version": "0.1.0"
        }
        
        return Receipt(**receipt_data)

    async def verify_receipt(
        self,
        receipt: Receipt,
        require_log: bool = False,
        profile: Optional[TECPProfile] = None,
    ) -> VerificationResult:
        """
        Verify a TECP receipt's cryptographic integrity.
        
        Args:
            receipt: Receipt to verify
            require_log: Whether to require transparency log verification
            profile: TECP profile to use for verification
            
        Returns:
            Verification result with validity and any errors
        """
        errors = []
        warnings = []
        
        try:
            # Validate basic structure
            if receipt.version != self.TECP_VERSION:
                errors.append(f"Invalid version: {receipt.version}")
            
            # Validate timestamp
            now = int(time.time() * 1000)
            age = now - receipt.ts
            skew = receipt.ts - now
            
            max_age = self.MAX_RECEIPT_AGE_MS
            max_skew = self.MAX_CLOCK_SKEW_MS
            
            if age > max_age:
                errors.append(f"Receipt too old: {age}ms > {max_age}ms")
            elif skew > max_skew:
                errors.append(f"Receipt timestamp in future: {skew}ms > {max_skew}ms")
            
            # Verify signature
            try:
                public_key_bytes = self._b64decode(receipt.pubkey)
                public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
                
                # Reconstruct signing data
                signing_data = {
                    "version": receipt.version,
                    "code_ref": receipt.code_ref,
                    "ts": receipt.ts,
                    "nonce": receipt.nonce,
                    "input_hash": receipt.input_hash,
                    "output_hash": receipt.output_hash,
                    "policy_ids": receipt.policy_ids,
                    "pubkey": receipt.pubkey,
                }
                
                canonical_cbor = self._canonical_cbor(signing_data)
                signature = self._b64decode(receipt.sig)
                
                public_key.verify(signature, canonical_cbor)
                
            except Exception as e:
                errors.append(f"Signature verification failed: {str(e)}")
            
            # Validate policies (profile-dependent)
            current_profile = profile or self.profile
            if current_profile == "tecp-strict" and not receipt.policy_ids:
                errors.append("TECP-STRICT requires at least one policy")
            
            # TODO: Transparency log verification
            if require_log:
                warnings.append("Transparency log verification not yet implemented")
            
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")
        
        return VerificationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            profile=profile or self.profile,
        )

    async def enforce_policies(
        self,
        policy_ids: List[str],
        input_data: str,
        max_duration: Optional[int] = None,
        environment: Optional[Dict[str, Any]] = None,
    ) -> PolicyResult:
        """
        Enforce policies on input data.
        
        Args:
            policy_ids: List of policy IDs to enforce
            input_data: Input data to check
            max_duration: Maximum processing duration in milliseconds
            environment: Environment context
            
        Returns:
            Policy enforcement result
        """
        return await self.policy_runtime.enforce_policies(
            policy_ids=policy_ids,
            input_data=input_data,
            max_duration=max_duration or 60000,
            environment=environment or {},
        )

    def _canonical_cbor(self, data: Dict[str, Any]) -> bytes:
        """Create canonical CBOR encoding with sorted keys."""
        # Sort keys recursively
        def sort_dict(obj):
            if isinstance(obj, dict):
                return {k: sort_dict(v) for k, v in sorted(obj.items())}
            elif isinstance(obj, list):
                return [sort_dict(item) for item in obj]
            return obj
        
        sorted_data = sort_dict(data)
        return cbor2.dumps(sorted_data, canonical=True)

    def _b64encode(self, data: bytes) -> str:
        """Base64 encode bytes to string."""
        import base64
        return base64.b64encode(data).decode('ascii')

    def _b64decode(self, data: str) -> bytes:
        """Base64 decode string to bytes."""
        import base64
        return base64.b64decode(data.encode('ascii'))


# Convenience functions
async def create_receipt(
    private_key: Ed25519PrivateKey,
    input_data: Union[str, bytes],
    output_data: Union[str, bytes],
    policies: Optional[List[str]] = None,
) -> Receipt:
    """Create a receipt with minimal configuration."""
    client = TECPClient(private_key=private_key)
    return await client.create_receipt(
        input_data=input_data,
        output_data=output_data,
        policies=policies or ["no_retention"],
    )


async def verify_receipt(receipt: Receipt) -> VerificationResult:
    """Verify a receipt with minimal configuration."""
    client = TECPClient()
    return await client.verify_receipt(receipt)
