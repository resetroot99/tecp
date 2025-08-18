/**
 * TECP SDK for JavaScript/TypeScript
 * 
 * Simple, developer-friendly interface for creating and verifying
 * TECP receipts in JavaScript/TypeScript applications.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

import { 
  ReceiptSigner, 
  ReceiptVerifier, 
  PolicyRuntime,
  type FullReceipt, 
  type VerificationResult,
  type TECPProfile,
  type CreateReceiptParams 
} from '../../tecp-core/dist/index.js';

export interface TECPClientOptions {
  privateKey?: Uint8Array;
  profile?: TECPProfile;
  logUrl?: string;
  verifierUrl?: string;
}

export interface CreateReceiptOptions {
  input: Buffer | string;
  output: Buffer | string;
  policies?: string[];
  codeRef?: string;
  profile?: TECPProfile;
  extensions?: Record<string, unknown>;
}

export interface VerifyReceiptOptions {
  requireLog?: boolean;
  profile?: TECPProfile;
  logUrl?: string;
}

/**
 * TECP Client - Main SDK interface
 * 
 * @example
 * ```typescript
 * import { TECPClient } from '@tecp/sdk';
 * 
 * const client = new TECPClient({
 *   privateKey: myPrivateKey,
 *   profile: 'tecp-v0.1'
 * });
 * 
 * // Create receipt
 * const receipt = await client.createReceipt({
 *   input: 'sensitive data',
 *   output: 'processed result',
 *   policies: ['no_retention', 'eu_region']
 * });
 * 
 * // Verify receipt
 * const result = await client.verifyReceipt(receipt);
 * console.log('Valid:', result.valid);
 * ```
 */
export class TECPClient {
  private signer?: ReceiptSigner;
  private verifier: ReceiptVerifier;
  private runtime: PolicyRuntime;
  private options: TECPClientOptions;

  constructor(options: TECPClientOptions = {}) {
    this.options = {
      profile: 'tecp-v0.1',
      ...options
    };

    if (options.privateKey) {
      this.signer = new ReceiptSigner(options.privateKey);
    }

    this.verifier = new ReceiptVerifier();
    this.runtime = new PolicyRuntime();
  }

  /**
   * Create a TECP receipt for ephemeral computation
   */
  async createReceipt(options: CreateReceiptOptions): Promise<FullReceipt> {
    if (!this.signer) {
      throw new Error('Private key required for receipt creation. Provide privateKey in constructor.');
    }

    const params: CreateReceiptParams = {
      code_ref: options.codeRef || `sdk:${Date.now()}`,
      input: options.input,
      output: options.output,
      policy_ids: options.policies || ['no_retention'],
      profile: options.profile || this.options.profile,
      extensions: {
        environment: {
          provider: 'tecp-sdk-js'
        },
        ext: options.extensions
      }
    };

    return this.signer.createReceipt(params);
  }

  /**
   * Verify a TECP receipt
   */
  async verifyReceipt(
    receipt: FullReceipt, 
    options: VerifyReceiptOptions = {}
  ): Promise<VerificationResult> {
    const result = await this.verifier.verify(receipt);
    
    // Add profile information
    result.profile = options.profile || this.options.profile;
    
    // TODO: Add transparency log verification if requested
    if (options.requireLog && receipt.log_inclusion) {
      // Would implement log verification here
      result.warnings = result.warnings || [];
      result.warnings.push('Transparency log verification not yet implemented in SDK');
    }

    return result;
  }

  /**
   * Enforce policies on input data
   */
  async enforcePolicies(
    policyIds: string[], 
    input: string,
    context: { maxDuration?: number; environment?: Record<string, unknown> } = {}
  ): Promise<{
    allowed: boolean;
    transformedInput: string;
    evidence: Record<string, unknown>;
    violations: string[];
  }> {
    return this.runtime.enforcePolicies(policyIds, input, {
      startTime: Date.now(),
      maxDuration: context.maxDuration || 60000,
      environment: context.environment
    });
  }

  /**
   * Generate a new Ed25519 key pair for signing
   */
  static async generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
    const { ReceiptUtils } = await import('../../tecp-core/dist/index.js');
    return ReceiptUtils.generateKeyPair();
  }

  /**
   * Calculate receipt size for monitoring
   */
  static calculateReceiptSize(receipt: FullReceipt): { json_bytes: number; cbor_bytes: number; target_max: number } {
    const { ReceiptUtils } = require('@tecp/core');
    return ReceiptUtils.calculateReceiptSize(receipt);
  }
}

/**
 * Convenience functions for quick operations
 */

/**
 * Create a receipt with minimal configuration
 */
export async function createReceipt(
  privateKey: Uint8Array,
  input: string | Buffer,
  output: string | Buffer,
  policies: string[] = ['no_retention']
): Promise<FullReceipt> {
  const client = new TECPClient({ privateKey });
  return client.createReceipt({ input, output, policies });
}

/**
 * Verify a receipt with minimal configuration
 */
export async function verifyReceipt(receipt: FullReceipt): Promise<VerificationResult> {
  const client = new TECPClient();
  return client.verifyReceipt(receipt);
}

/**
 * Generate a new key pair
 */
export const generateKeyPair = TECPClient.generateKeyPair;

// Re-export core types for convenience
export type {
  FullReceipt,
  VerificationResult,
  TECPProfile,
  CreateReceiptParams
} from '../../tecp-core/dist/index.js';

// Re-export constants
export { 
  TECP_VERSION,
  MAX_RECEIPT_AGE_MS,
  MAX_CLOCK_SKEW_MS,
  MAX_RECEIPT_SIZE_BYTES
} from '../../tecp-core/dist/index.js';
