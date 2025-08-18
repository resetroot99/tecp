/**
 * TECP Receipt Implementation - CBOR + COSE Deterministic Signing
 *
 * Week 1: Core Protocol - Minimal viable receipt with 9 required fields
 * Conservative threat model: proves ephemeral design, NOT RAM wipe or side-channel immunity
 */
import type { Receipt, FullReceipt, CreateReceiptParams, VerificationResult } from './types.js';
export declare class ReceiptSigner {
    private privateKey;
    private publicKey;
    constructor(privateKey: Uint8Array);
    /**
     * Create a TECP receipt with deterministic CBOR signing
     * Performance target: ≤10ms on laptop
     */
    createReceipt(params: CreateReceiptParams): Promise<FullReceipt>;
    /**
     * Deterministic CBOR encoding - critical for cross-implementation compatibility
     * Same input MUST produce identical bytes on all platforms
     */
    private canonicalCBOR;
    private canonicalize;
    private sha256b64;
    /**
     * Get public key for this signer
     */
    getPublicKey(): string;
}
export declare class ReceiptVerifier {
    /**
     * Verify a TECP receipt independently
     * Performance target: ≤5ms on laptop
     */
    verify(receipt: Receipt | FullReceipt): Promise<VerificationResult>;
    private validateStructure;
    private validateTimestamp;
    private validateSignature;
    private validateLogInclusion;
    private canonicalCBOR;
    private canonicalize;
}
/**
 * Utility functions for key generation and testing
 */
export declare class ReceiptUtils {
    /**
     * Generate a new Ed25519 key pair for testing
     */
    static generateKeyPair(): Promise<{
        privateKey: Uint8Array;
        publicKey: Uint8Array;
    }>;
    /**
     * Calculate receipt size for performance monitoring
     */
    static calculateReceiptSize(receipt: Receipt | FullReceipt): {
        json_bytes: number;
        cbor_bytes: number;
        target_max: number;
    };
    /**
     * Validate that receipt meets size constraints
     */
    static validateReceiptSize(receipt: Receipt | FullReceipt): {
        valid: boolean;
        size: number;
        max: number;
    };
}
//# sourceMappingURL=receipt.d.ts.map