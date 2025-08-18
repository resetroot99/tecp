/**
 * TECP Receipt Implementation - CBOR + COSE Deterministic Signing
 *
 * Week 1: Core Protocol - Minimal viable receipt with 9 required fields
 * Conservative threat model: proves ephemeral design, NOT RAM wipe or side-channel immunity
 */
import { encode } from 'cbor-x';
import { sign, verify, getPublicKey, utils, etc } from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
// Set up SHA-512 for Ed25519 (required for @noble/ed25519)
etc.sha512Sync = (...m) => sha512(etc.concatBytes(...m));
export class ReceiptSigner {
    privateKey;
    publicKey;
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.publicKey = getPublicKey(privateKey);
    }
    /**
     * Create a TECP receipt with deterministic CBOR signing
     * Performance target: ≤10ms on laptop
     */
    async createReceipt(params) {
        const startTime = Date.now();
        // Core receipt (signed fields only) - exactly 9 fields
        const core = {
            version: 'TECP-0.1',
            code_ref: params.code_ref,
            ts: Date.now(),
            nonce: Buffer.from(utils.randomPrivateKey().slice(0, 16)).toString('base64'),
            input_hash: this.sha256b64(typeof params.input === 'string' ?
                Buffer.from(params.input, 'utf8') : params.input),
            output_hash: this.sha256b64(typeof params.output === 'string' ?
                Buffer.from(params.output, 'utf8') : params.output),
            policy_ids: [...params.policy_ids].sort(), // Deterministic ordering
            pubkey: Buffer.from(this.publicKey).toString('base64')
        };
        // Deterministic CBOR encoding for signing (critical for interoperability)
        const sigInput = this.canonicalCBOR(core);
        const signature = await sign(sigInput, this.privateKey);
        const receipt = {
            ...core,
            sig: Buffer.from(signature).toString('base64')
        };
        // Add extensions without affecting signature
        const fullReceipt = {
            ...receipt,
            ...params.extensions
        };
        const duration = Date.now() - startTime;
        if (duration > 10) {
            console.warn(`⚠️  Receipt creation took ${duration}ms (target: ≤10ms)`);
        }
        return fullReceipt;
    }
    /**
     * Deterministic CBOR encoding - critical for cross-implementation compatibility
     * Same input MUST produce identical bytes on all platforms
     */
    canonicalCBOR(obj) {
        return encode(this.canonicalize(obj));
    }
    canonicalize(value) {
        if (Array.isArray(value)) {
            return value.map((v) => this.canonicalize(v));
        }
        if (value && typeof value === 'object' && value.constructor === Object) {
            // Sort keys lexicographically for deterministic encoding
            const sortedKeys = Object.keys(value).sort();
            const result = {};
            for (const key of sortedKeys) {
                result[key] = this.canonicalize(value[key]);
            }
            return result;
        }
        if (typeof value === 'number') {
            // Ensure integers are minimal and floats are IEEE 754 canonical
            if (Number.isInteger(value)) {
                return value;
            }
            // For floats, ensure canonical representation
            return value;
        }
        return value;
    }
    sha256b64(data) {
        return Buffer.from(sha256(data)).toString('base64');
    }
    /**
     * Get public key for this signer
     */
    getPublicKey() {
        return Buffer.from(this.publicKey).toString('base64');
    }
}
export class ReceiptVerifier {
    /**
     * Verify a TECP receipt independently
     * Performance target: ≤5ms on laptop
     */
    async verify(receipt) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];
        try {
            // 1. Validate structure and required fields
            this.validateStructure(receipt, errors);
            // 2. Check timestamp freshness (replay protection)
            this.validateTimestamp(receipt, errors, warnings);
            // 3. Verify cryptographic signature
            if (errors.length === 0) {
                await this.validateSignature(receipt, errors);
            }
            // 4. Optional: verify log inclusion if present
            if ('log_inclusion' in receipt && receipt.log_inclusion) {
                await this.validateLogInclusion(receipt, errors, warnings);
            }
        }
        catch (error) {
            errors.push(`Verification error: ${error instanceof Error ? error.message : String(error)}`);
        }
        const duration = Date.now() - startTime;
        if (duration > 5) {
            warnings.push(`Verification took ${duration}ms (target: ≤5ms)`);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    }
    validateStructure(receipt, errors) {
        // Check version
        if (!receipt.version || receipt.version !== 'TECP-0.1') {
            errors.push('Invalid or missing version (must be TECP-0.1)');
        }
        // Check required fields (exactly 9)
        const requiredFields = ['version', 'code_ref', 'ts', 'nonce', 'input_hash', 'output_hash', 'policy_ids', 'sig', 'pubkey'];
        for (const field of requiredFields) {
            if (!(field in receipt) || receipt[field] === undefined || receipt[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        // Validate field types
        if (typeof receipt.ts !== 'number' || receipt.ts <= 0) {
            errors.push('Invalid timestamp (must be positive number)');
        }
        if (!Array.isArray(receipt.policy_ids)) {
            errors.push('policy_ids must be an array');
        }
        // Validate base64 fields strictly
        const isValidBase64 = (s) => {
            if (typeof s !== 'string')
                return false;
            if (s.length === 0 || s.length % 4 !== 0)
                return false;
            return /^[A-Za-z0-9+/]+={0,2}$/.test(s);
        };
        const base64Fields = [
            ['nonce', receipt.nonce],
            ['input_hash', receipt.input_hash],
            ['output_hash', receipt.output_hash],
            ['pubkey', receipt.pubkey],
        ];
        base64Fields.forEach(([name, val]) => {
            if (!isValidBase64(val)) {
                errors.push(`Invalid base64 encoding for field: ${name}`);
            }
        });
        // Signature: if not base64, treat as a signature failure to preserve interop expectations
        if (!isValidBase64(receipt.sig)) {
            errors.push('Signature verification failed');
        }
    }
    validateTimestamp(receipt, errors, warnings) {
        const now = Date.now();
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        const MAX_SKEW = 5 * 60 * 1000; // 5 minutes
        if (now - receipt.ts > MAX_AGE) {
            errors.push('Receipt too old (>24 hours)');
        }
        if (receipt.ts > now + MAX_SKEW) {
            errors.push('Receipt timestamp in future (>5 minutes)');
        }
        // Warning for receipts older than 1 hour
        if (now - receipt.ts > 60 * 60 * 1000) {
            warnings.push(`Receipt is ${Math.round((now - receipt.ts) / (60 * 60 * 1000))} hours old`);
        }
    }
    async validateSignature(receipt, errors) {
        try {
            // Extract core receipt (signed fields only) - remove extensions
            const { sig, key_erasure, environment, log_inclusion, ...core } = receipt;
            // Recreate the signed payload with deterministic CBOR
            const sigInput = this.canonicalCBOR(core);
            const signature = Buffer.from(receipt.sig, 'base64');
            const publicKey = Buffer.from(receipt.pubkey, 'base64');
            const signatureValid = await verify(signature, sigInput, publicKey);
            if (!signatureValid) {
                errors.push('Invalid cryptographic signature');
            }
        }
        catch (error) {
            errors.push(`Signature verification failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateLogInclusion(receipt, errors, warnings) {
        if (!receipt.log_inclusion)
            return;
        // Basic structure validation
        if (typeof receipt.log_inclusion.leaf_index !== 'number' ||
            !Array.isArray(receipt.log_inclusion.merkle_proof) ||
            typeof receipt.log_inclusion.log_root !== 'string') {
            errors.push('Invalid log inclusion proof structure');
            return;
        }
        // TODO: Implement actual Merkle proof verification
        // For now, just validate structure
        warnings.push('Log inclusion proof structure valid, but verification not yet implemented');
    }
    canonicalCBOR(obj) {
        return encode(this.canonicalize(obj));
    }
    canonicalize(value) {
        if (Array.isArray(value)) {
            return value.map((v) => this.canonicalize(v));
        }
        if (value && typeof value === 'object') {
            const sortedKeys = Object.keys(value).sort();
            const result = {};
            for (const key of sortedKeys) {
                result[key] = this.canonicalize(value[key]);
            }
            return result;
        }
        return value;
    }
}
/**
 * Utility functions for key generation and testing
 */
export class ReceiptUtils {
    /**
     * Generate a new Ed25519 key pair for testing
     */
    static async generateKeyPair() {
        const privateKey = utils.randomPrivateKey();
        const publicKey = await getPublicKey(privateKey);
        return { privateKey, publicKey };
    }
    /**
     * Calculate receipt size for performance monitoring
     */
    static calculateReceiptSize(receipt) {
        const json = JSON.stringify(receipt);
        const cbor = encode(receipt);
        return {
            json_bytes: Buffer.byteLength(json, 'utf8'),
            cbor_bytes: cbor.length,
            target_max: 8192 // 8KB target
        };
    }
    /**
     * Validate that receipt meets size constraints
     */
    static validateReceiptSize(receipt) {
        const cbor = encode(receipt);
        const size = cbor.length;
        const max = 8192; // 8KB
        return {
            valid: size <= max,
            size,
            max
        };
    }
}
//# sourceMappingURL=receipt.js.map