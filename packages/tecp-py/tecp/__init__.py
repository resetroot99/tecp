"""
TECP Python SDK

Trusted Ephemeral Computation Protocol implementation for Python.
Provides cryptographic receipts for verifiable, ephemeral computation.

Example:
    >>> from tecp import ReceiptSigner, ReceiptVerifier
    >>> signer = ReceiptSigner(private_key, public_key)
    >>> receipt = signer.create_receipt(
    ...     code_ref="git:abc123",
    ...     input_data=b"hello world",
    ...     output_data=b"Hello, World!",
    ...     policy_ids=["no_retention"]
    ... )
    >>> verifier = ReceiptVerifier()
    >>> result = verifier.verify(receipt)
    >>> print(result.valid)
    True
"""

from .receipt import ReceiptSigner, ReceiptVerifier
from .types import Receipt, ReceiptExtensions, VerificationResult
from .exceptions import TECPError, SignatureError, VerificationError

__version__ = "0.1.0"
__all__ = [
    "ReceiptSigner",
    "ReceiptVerifier", 
    "Receipt",
    "ReceiptExtensions",
    "VerificationResult",
    "TECPError",
    "SignatureError",
    "VerificationError",
]
