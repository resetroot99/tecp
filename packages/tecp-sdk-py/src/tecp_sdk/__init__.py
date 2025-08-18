"""
TECP SDK for Python

The official Python SDK for the Trusted Ephemeral Computation Protocol (TECP).
Create and verify cryptographic receipts for ephemeral computation.

Example:
    >>> from tecp_sdk import TECPClient, generate_keypair
    >>> 
    >>> # Generate keys
    >>> private_key, public_key = generate_keypair()
    >>> 
    >>> # Create client
    >>> client = TECPClient(private_key=private_key)
    >>> 
    >>> # Create receipt
    >>> receipt = await client.create_receipt(
    ...     input_data="sensitive data",
    ...     output_data="processed result",
    ...     policies=["no_retention", "eu_region"]
    ... )
    >>> 
    >>> # Verify receipt
    >>> result = await client.verify_receipt(receipt)
    >>> print(f"Valid: {result.valid}")
"""

from .client import TECPClient
from .types import (
    Receipt,
    VerificationResult,
    TECPProfile,
    PolicyResult,
)
from .utils import generate_keypair, calculate_receipt_size
from .exceptions import (
    TECPError,
    SignatureError,
    TimestampError,
    PolicyError,
    LogError,
)

__version__ = "0.1.0"
__author__ = "Ali Jakvani"
__license__ = "Apache-2.0"

__all__ = [
    # Main client
    "TECPClient",
    
    # Types
    "Receipt",
    "VerificationResult", 
    "TECPProfile",
    "PolicyResult",
    
    # Utilities
    "generate_keypair",
    "calculate_receipt_size",
    
    # Exceptions
    "TECPError",
    "SignatureError",
    "TimestampError", 
    "PolicyError",
    "LogError",
    
    # Metadata
    "__version__",
    "__author__",
    "__license__",
]
