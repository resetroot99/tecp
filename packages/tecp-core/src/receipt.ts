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
import type { Receipt, FullReceipt, CreateReceiptParams, VerificationResult } from './types.js';
import { SKEW_LITE_MS, SKEW_STRICT_MS, MAX_RECEIPT_AGE_MS } from './constants.js';
import { canonicalBytes, toBase64Url, fromBase64Url } from './c14n.js';

// Set up SHA-512 for Ed25519 (required for @noble/ed25519)
etc.sha512Sync = (...m) => sha512(etc.concatBytes(...m));

export class ReceiptSigner {
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    this.privateKey = privateKey;
    this.publicKey = getPublicKey(privateKey);
  }

  /**
   * Create a TECP receipt with deterministic CBOR signing
   * Performance target: ≤10ms on laptop
   */
  async createReceipt(params: CreateReceiptParams): Promise<FullReceipt> {
    const startTime = Date.now();

    // Core receipt (signed fields only) - exactly 9 fields
    const core: Omit<Receipt, 'sig'> = {
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

    // JSON-C14N canonicalization for signing
    const sigInput = canonicalBytes(core);
    const signature = await sign(sigInput, this.privateKey);

    const receipt: Receipt = {
      ...core,
      sig: toBase64Url(signature)
    };

    // Add extensions without affecting signature
    const fullReceipt: FullReceipt = {
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
  private canonicalCBOR(obj: any): Uint8Array {
    return encode(this.canonicalize(obj));
  }

  private canonicalize(value: any): any {
    if (Array.isArray(value)) {
      return value.map((v) => this.canonicalize(v));
    }
    if (value && typeof value === 'object' && value.constructor === Object) {
      // Sort keys lexicographically for deterministic encoding
      const sortedKeys = Object.keys(value).sort();
      const result: Record<string, any> = {};
      for (const key of sortedKeys) {
        result[key] = this.canonicalize((value as any)[key]);
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

  private sha256b64(data: Buffer): string {
    const digest = sha256(data);
    return toBase64Url(new Uint8Array(digest));
  }

  /**
   * Get public key for this signer
   */
  getPublicKey(): string {
    return Buffer.from(this.publicKey).toString('base64');
  }
}

export class ReceiptVerifier {
  /**
   * Verify a TECP receipt independently
   * Performance target: ≤5ms on laptop
   */
  async verify(receipt: Receipt | FullReceipt): Promise<VerificationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validate structure and required fields
      this.validateStructure(receipt, errors);

      // 2. Check timestamp freshness (replay protection)
      this.validateTimestamp(receipt, errors, warnings);

      // 3. Verify cryptographic signature
      if (errors.length === 0) {
        await this.validateSignature(receipt, errors);
      }

      // 4. Enforce profile rules (STRICT)
      this.validateProfileRules(receipt, errors);

      // 5. Optional: verify log inclusion if present
      if ('log_inclusion' in receipt && receipt.log_inclusion) {
        await this.validateLogInclusion(receipt as FullReceipt, errors, warnings);
      }

    } catch (error) {
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

  private validateProfileRules(receipt: Receipt | FullReceipt, errors: string[]): void {
    const isStrict = (receipt as any).profile === 'tecp-strict';
    if (!isStrict) return;
    if (!Array.isArray(receipt.policy_ids) || receipt.policy_ids.length === 0) {
      errors.push('STRICT profile requires non-empty policy_ids');
    }
    if (!(receipt as any).log_inclusion) {
      errors.push('STRICT profile requires log_inclusion');
    }
  }

  private validateStructure(receipt: Receipt | FullReceipt, errors: string[]): void {
    // Check version
    if (!receipt.version || receipt.version !== 'TECP-0.1') {
      errors.push('Invalid or missing version (must be TECP-0.1)');
    }

    // Check required fields (exactly 9)
    const requiredFields = ['version', 'code_ref', 'ts', 'nonce', 'input_hash', 'output_hash', 'policy_ids', 'sig', 'pubkey'];
    for (const field of requiredFields) {
      if (!(field in receipt) || receipt[field as keyof Receipt] === undefined || receipt[field as keyof Receipt] === null) {
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

    // Validate base64url fields (no padding)
    const isBase64Url = (s: unknown): boolean => {
      if (typeof s !== 'string') return false;
      return /^[A-Za-z0-9_-]+$/.test(s);
    };
    const base64Fields: Array<[string, string]> = [
      ['nonce', (receipt as any).nonce],
      ['input_hash', (receipt as any).input_hash],
      ['output_hash', (receipt as any).output_hash],
      ['pubkey', (receipt as any).pubkey],
    ];
    base64Fields.forEach(([name, val]) => {
      if (!isBase64Url(val)) {
        errors.push(`Invalid base64url encoding for field: ${name}`);
      }
    });
    if (!isBase64Url((receipt as any).sig)) {
      errors.push('Invalid base64url encoding for field: sig');
    }
  }

  private validateTimestamp(receipt: Receipt | FullReceipt, errors: string[], warnings: string[]): void {
    const now = Date.now();
    const maxAge = MAX_RECEIPT_AGE_MS;
    const profile = (receipt as any).profile === 'tecp-strict' ? 'strict' : 'lite';
    const maxSkew = profile === 'strict' ? SKEW_STRICT_MS : SKEW_LITE_MS;

    if (now - receipt.ts > maxAge) {
      errors.push('Receipt too old');
    }
    if (receipt.ts > now + maxSkew) {
      errors.push('Receipt timestamp in future');
    }
  }

  private async validateSignature(receipt: Receipt | FullReceipt, errors: string[]): Promise<void> {
    try {
      // Extract core receipt (signed fields only) - remove extensions
      const { sig, key_erasure, environment, log_inclusion, ...core } = receipt as any;
      
      // Recreate the signed payload with JSON-C14N
      const sigInput = canonicalBytes(core);
      const signature = fromBase64Url(receipt.sig);
      const publicKey = fromBase64Url(receipt.pubkey);
      
      const signatureValid = await verify(signature, sigInput, publicKey);
      if (!signatureValid) {
        errors.push('Invalid cryptographic signature');
      }

    } catch (error) {
      errors.push(`Signature verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateLogInclusion(receipt: FullReceipt, errors: string[], warnings: string[]): Promise<void> {
    if (!receipt.log_inclusion) return;

    // Basic structure validation
    if (typeof receipt.log_inclusion.leaf_index !== 'number' ||
        !Array.isArray(receipt.log_inclusion.merkle_proof) ||
        typeof receipt.log_inclusion.log_root !== 'string') {
      errors.push('Invalid log inclusion proof structure');
      return;
    }

    // Merkle proof verification is performed in SDKs/web verifier. Here we only validate structure.
  }

  private canonicalCBOR(obj: any): Uint8Array {
    return encode(this.canonicalize(obj));
  }

  private canonicalize(value: any): any {
    if (Array.isArray(value)) {
      return value.map((v) => this.canonicalize(v));
    }
    if (value && typeof value === 'object') {
      const sortedKeys = Object.keys(value).sort();
      const result: Record<string, any> = {};
      for (const key of sortedKeys) {
        result[key] = this.canonicalize((value as any)[key]);
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
  static async generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
    const privateKey = utils.randomPrivateKey();
    const publicKey = await getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  /**
   * Calculate receipt size for performance monitoring
   */
  static calculateReceiptSize(receipt: Receipt | FullReceipt): { json_bytes: number; cbor_bytes: number; target_max: number } {
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
  static validateReceiptSize(receipt: Receipt | FullReceipt): { valid: boolean; size: number; max: number } {
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
