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
  ReceiptUtils,
  type FullReceipt,
  type VerificationResult,
  type TECPProfile,
  type CreateReceiptParams,
  TECP_VERSION,
  MAX_RECEIPT_AGE_MS,
  MAX_CLOCK_SKEW_MS,
  MAX_RECEIPT_SIZE_BYTES
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
        environment: { provider: 'tecp-sdk-js' },
        ext: options.extensions
      }
    };

    return this.signer.createReceipt(params);
  }

  async verifyReceipt(
    receipt: FullReceipt,
    options: VerifyReceiptOptions = {}
  ): Promise<VerificationResult> {
    const result = await this.verifier.verify(receipt);
    result.profile = options.profile || this.options.profile;
    if (options.requireLog && receipt.log_inclusion) {
      result.warnings = result.warnings || [];
      result.warnings.push('Transparency log verification not yet implemented in SDK');
    }
    return result;
  }

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

  static async generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
    return ReceiptUtils.generateKeyPair();
  }

  static calculateReceiptSize(receipt: FullReceipt): { json_bytes: number; cbor_bytes: number; target_max: number } {
    return ReceiptUtils.calculateReceiptSize(receipt);
  }
}

// Convenience
export async function createReceipt(
  privateKey: Uint8Array,
  input: string | Buffer,
  output: string | Buffer,
  policies: string[] = ['no_retention']
): Promise<FullReceipt> {
  const client = new TECPClient({ privateKey });
  return client.createReceipt({ input, output, policies });
}

export async function verifyReceipt(receipt: FullReceipt): Promise<VerificationResult> {
  const client = new TECPClient();
  return client.verifyReceipt(receipt);
}

export const generateKeyPair = TECPClient.generateKeyPair;

// Types & consts
export type { FullReceipt, VerificationResult, TECPProfile, CreateReceiptParams } from '../../tecp-core/dist/index.js';
export { TECP_VERSION, MAX_RECEIPT_AGE_MS, MAX_CLOCK_SKEW_MS, MAX_RECEIPT_SIZE_BYTES };

// Public surface: wrappers, low-level helpers, types
export { wrap } from './wrap.js';
export { generateKeyPair as genKeyPair, createReceipt as createTecpReceipt, verifyReceipt as verifyTecpReceipt } from './receipt.js';
export type { TecpReceipt, EnforcementResult } from './types.js';
export type { WrapOptions } from './wrap.js';

// Adapters
export { withOpenAI } from './adapters/openai.js';
export { withAnthropic } from './adapters/anthropic.js';
export { withFetch } from './adapters/fetch.js';

// Trust Badge
export interface BadgeOptions {
  href?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  zIndex?: number;
  title?: string;
}

export function injectTrustBadge(options: BadgeOptions = {}): void | string {
  const href = options.href || 'https://tecp.dev';
  const title = options.title || 'Powered by TECP';
  const pos = options.position || 'bottom-right';
  const z = options.zIndex ?? 9999;

  const baseStyle = `position:fixed;border-radius:3px;box-shadow:0 4px 16px rgba(0,0,0,0.15);text-decoration:none;z-index:${z};opacity:0.9;transition:opacity 0.2s ease;`;
  
  // Custom TECP badge SVG
  const svg = `<svg width="120" height="20" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="120" height="20" rx="3" ry="3" fill="url(#gradient)"/>
    
    <!-- Icon section -->
    <rect x="0" y="0" width="24" height="20" rx="3" ry="3" fill="#1e40af"/>
    
    <!-- Receipt/document icon -->
    <g transform="translate(12, 10)">
      <rect x="-3" y="-4" width="6" height="8" rx="0.5" fill="white" stroke="none"/>
      <line x1="-2" y1="-2.5" x2="2" y2="-2.5" stroke="#1e40af" stroke-width="0.5"/>
      <line x1="-2" y1="-1" x2="2" y2="-1" stroke="#1e40af" stroke-width="0.5"/>
      <line x1="-2" y1="0.5" x2="1" y2="0.5" stroke="#1e40af" stroke-width="0.5"/>
      <circle cx="1.5" cy="2.5" r="1" fill="#1e40af"/>
      <path d="M1,2.5 L1.3,2.8 L2,2.1" stroke="white" stroke-width="0.4" fill="none" stroke-linecap="round"/>
    </g>
    
    <!-- Text -->
    <text x="28" y="14" font-family="Arial, sans-serif" font-size="11" font-weight="500" fill="white">
      Powered by TECP
    </text>
  </svg>`;

  let coords = 'right:12px;bottom:12px;';
  if (pos === 'bottom-left') coords = 'left:12px;bottom:12px;';
  if (pos === 'top-right') coords = 'right:12px;top:12px;';
  if (pos === 'top-left') coords = 'left:12px;top:12px;';

  const html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="${baseStyle}${coords}" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">${svg}</a>`;

  // Browser injection
  if (typeof document !== 'undefined' && document && document.body) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const node = wrapper.firstElementChild as HTMLElement | null;
    if (node) document.body.appendChild(node);
    return;
  }

  return html;
}
