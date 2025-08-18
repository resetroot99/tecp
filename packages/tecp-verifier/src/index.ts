/**
 * TECP Verifier Package
 * 
 * Provides both CLI and web interfaces for TECP receipt verification
 * with optional transparency log validation.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

export { default as TECPVerifierCLI } from './cli.js';
export { default as TECPWebVerifier } from './web.js';

// Re-export core types for convenience
export type {
  FullReceipt,
  VerificationResult,
  Receipt,
  ReceiptExtensions
} from '../../tecp-core/dist/index.js';
