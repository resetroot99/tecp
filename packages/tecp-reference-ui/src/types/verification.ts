import { z } from 'zod';

// Error codes for consistent reporting
export const ERROR_CODES = {
  // Signature errors
  'E-SIG-001': 'Invalid signature format',
  'E-SIG-002': 'Signature verification failed',
  'E-SIG-003': 'Public key format invalid',
  
  // Timestamp errors
  'E-TS-001': 'Timestamp format invalid',
  'E-TS-002': 'Clock skew exceeded (>5 minutes)',
  'E-TS-003': 'Receipt expired (>24 hours)',
  
  // Age errors
  'E-AGE-001': 'Receipt too old',
  'E-AGE-002': 'Receipt timestamp in future',
  
  // Schema errors
  'E-SCHEMA-001': 'Missing required field',
  'E-SCHEMA-002': 'Invalid field type',
  'E-SCHEMA-003': 'Invalid field format',
  'E-SCHEMA-004': 'Unknown receipt version',
  
  // Transparency log errors
  'E-LOG-001': 'Log inclusion proof missing',
  'E-LOG-002': 'Log inclusion proof invalid',
  'E-LOG-003': 'Root hash mismatch',
  'E-LOG-004': 'Log service unavailable',
  
  // Policy errors
  'E-POLICY-001': 'Unknown policy ID',
  'E-POLICY-002': 'Policy validation failed',
  'E-POLICY-003': 'Policy requirements not met',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface VerificationError {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: string;
}

export interface VerificationResult {
  valid: boolean;
  errors: VerificationError[];
  details: {
    signature: 'Valid' | 'Invalid';
    timestamp: 'OK' | 'Skew' | 'Expired';
    schema: 'OK' | string; // Path to failing field
    transparencyLog: 'Included' | 'Not found' | 'Root mismatch' | 'Not checked';
  };
  performance: {
    verificationTimeMs: number;
    receiptSizeBytes: number;
  };
}

// Zod schema for receipt validation
export const ReceiptSchema = z.object({
  version: z.literal('TECP-0.1'),
  code_ref: z.string().min(1),
  ts: z.number().int().positive(),
  nonce: z.string().min(1),
  input_hash: z.string().min(1),
  output_hash: z.string().min(1),
  policy_ids: z.array(z.string()),
  sig: z.string().min(1),
  pubkey: z.string().min(1),
  // Optional extensions
  key_erasure: z.object({
    scheme: z.enum(['counter+seal@tee', 'sw-sim']),
    evidence: z.string(),
  }).optional(),
  environment: z.object({
    region: z.string().optional(),
    provider: z.string().optional(),
  }).optional(),
  log_inclusion: z.object({
    leaf_index: z.number().int().nonnegative(),
    merkle_proof: z.array(z.string()),
    log_root: z.string(),
  }).optional(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
