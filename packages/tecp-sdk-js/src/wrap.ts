import { TecpReceipt, EnforcementResult } from './types';
import { createReceipt, verifyReceipt, Signer } from './receipt';
import { canonicalizeJson, sha256Hex } from './canon';

type RedactConfig = { emails?: boolean; phones?: boolean; ssn?: boolean };

function basicRedact(input: any, cfg?: RedactConfig) {
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  let redactions: { field: string; before: string; after: string }[] = [];
  let out = text;
  if (cfg?.emails) {
    const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    out = out.replace(re, (m) => {
      redactions.push({ field: 'email', before: m, after: '[EMAIL_REDACTED]' });
      return '[EMAIL_REDACTED]';
    });
  }
  if (cfg?.phones) {
    const re = /\+?\d[\d\s().-]{7,}\d/g;
    out = out.replace(re, (m) => {
      redactions.push({ field: 'phone', before: m, after: '[PHONE_REDACTED]' });
      return '[PHONE_REDACTED]';
    });
  }
  if (cfg?.ssn) {
    const re = /\b\d{3}-\d{2}-\d{4}\b/g;
    out = out.replace(re, (m) => {
      redactions.push({ field: 'ssn', before: m, after: '[SSN_REDACTED]' });
      return '[SSN_REDACTED]';
    });
  }
  return { output: out, redactions };
}

async function anchorReceiptToLedger(receipt: TecpReceipt, ledgerUrl: string): Promise<TecpReceipt> {
  // Calculate leaf hash: sha256(Canon(receipt))
  const leafHash = sha256Hex(canonicalizeJson(receipt));
  
  // POST to ledger
  const appendResponse = await fetch(`${ledgerUrl}/append`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leaf_hash: leafHash,
      meta: {
        policy_ids: receipt.policy_ids,
        created_at: receipt.created_at,
        kid: receipt.sig.kid
      }
    })
  });

  if (!appendResponse.ok) {
    throw new Error(`Ledger append failed: ${appendResponse.status} ${appendResponse.statusText}`);
  }

  const { seq } = await appendResponse.json();

  // Get inclusion proof
  const proofResponse = await fetch(`${ledgerUrl}/proof/inclusion?seq=${seq}`);
  if (!proofResponse.ok) {
    throw new Error(`Inclusion proof failed: ${proofResponse.status} ${proofResponse.statusText}`);
  }

  const proof = await proofResponse.json();

  // Return receipt with anchors attached
  return {
    ...receipt,
    anchors: {
      log_seq: seq,
      log_root: proof.tree_head.root_hash
    }
  };
}

export type WrapOptions = {
  signer: Signer | { privateKey: Uint8Array; kid?: string };
  policyIds?: string[];
  verifyLocal?: boolean;
  verifyLocalKeys?: Uint8Array[]; // NEW: public keys to validate receipts
  codeRef?: string;
  processor?: TecpReceipt['processor'];
  redact?: RedactConfig & { custom?: (s: string) => string };
  // Transparency log anchoring (optional)
  ledgerUrl?: string; // e.g. 'https://ledger.tecp.dev' or 'http://localhost:3001'
  anchorToLedger?: boolean; // default false for SDK-only mode
};

export function wrap<TArgs extends unknown[], TOutput>(
  operation: (...args: TArgs) => Promise<TOutput> | TOutput,
  opts: WrapOptions
): (...args: TArgs) => Promise<{ result: TOutput; tecp_receipt: TecpReceipt; tecp_verification?: { valid: boolean; errors?: string[] }; enforcement: EnforcementResult }>{
  return async (...args: TArgs) => {
    const enforced: string[] = [];
    const declared: string[] = [];
    const warnings: string[] = [];

    let inputForPolicy = args.length === 1 ? args[0] : args;
    let redactions: EnforcementResult['redactions'] = [];

    // Basic pre-call enforcement
    const policies = opts.policyIds || ['no_retention'];
    for (const p of policies) {
      if (p === 'no_pii' && opts.redact) {
        const r = basicRedact(inputForPolicy, opts.redact);
        inputForPolicy = r.output;
        redactions = [...(redactions || []), ...r.redactions];
        enforced.push('no_pii');
      } else if (p.startsWith('ttl_') || p === 'no_retention' || p.startsWith('region_') || p === 'no_training') {
        declared.push(p);
      }
    }

    const result = await operation(...(Array.isArray(inputForPolicy) ? (inputForPolicy as TArgs) : ([inputForPolicy] as unknown as TArgs)));

    let tecp_receipt = await createReceipt({
      signer: opts.signer,
      input: inputForPolicy,
      output: result,
      policyIds: policies,
      codeRef: opts.codeRef,
      processor: opts.processor
    });

    // Optional: Anchor to transparency ledger
    if (opts.anchorToLedger && opts.ledgerUrl) {
      try {
        tecp_receipt = await anchorReceiptToLedger(tecp_receipt, opts.ledgerUrl);
      } catch (error) {
        // Anchoring failure shouldn't break the receipt
        warnings.push(`Ledger anchoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    let tecp_verification: { valid: boolean; errors?: string[] } | undefined;
    if (opts.verifyLocal) {
      try {
        if (!opts.verifyLocalKeys?.length) {
          throw new Error('verifyLocalKeys required when verifyLocal=true');
        }
        const ok = await verifyReceipt(tecp_receipt, opts.verifyLocalKeys);
        tecp_verification = ok ? { valid: true } : { valid: false, errors: ['signature failed'] };
      } catch (e: any) {
        tecp_verification = { valid: false, errors: [String(e?.message ?? e)] };
      }
    }

    const enforcement: EnforcementResult = { enforced, declared, redactions, warnings };
    return { result, tecp_receipt, tecp_verification, enforcement };
  };
}


