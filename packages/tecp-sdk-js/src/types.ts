export type TecpReceipt = {
  version: 'tecp-0.1';
  profile?: 'tecp-lite' | 'tecp-v0.1' | 'tecp-strict';
  policy_epoch?: number;
  policy_ids: string[];
  created_at: string; // ISO 8601 UTC
  ttl_seconds?: number;

  input_hash: string; // hex sha256 of Canon(input)
  output_hash: string; // hex sha256 of Canon(output)

  processor?: { vendor?: 'openai' | 'anthropic' | 'local'; model?: string; region?: string };
  code_ref?: string;
  ext?: Record<string, unknown>;

  anchors?: { log_root?: string | null; log_seq?: number | null };

  sig: { alg: 'Ed25519'; kid: string; sig: string }; // base64url
};

export type EnforcementResult = {
  enforced: string[];
  declared: string[];
  redactions?: { field: string; before: string; after: string }[];
  warnings?: string[];
};


