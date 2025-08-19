import { TecpReceipt } from './types';
import { sha256Hex, canonicalizeJson } from './canon';
import * as ed25519 from '@noble/ed25519';

export interface Signer {
  kid: string;
  sign(data: Uint8Array): Promise<Uint8Array>;
}

export async function generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array; kid: string }>{
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  const kid = kidFromPublicKey(publicKey);
  return { privateKey, publicKey, kid };
}

export function kidFromPublicKey(publicKey: Uint8Array): string {
  const digestHex = sha256Hex(publicKey);
  return toBase64Url(Buffer.from(digestHex, 'hex'));
}

export function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function createReceipt(params: {
  signer: Signer | { privateKey: Uint8Array; kid?: string };
  input: unknown;
  output: unknown;
  policyIds: string[];
  codeRef?: string;
  processor?: TecpReceipt['processor'];
  profile?: TecpReceipt['profile'];
  ttl_seconds?: number;
  ext?: Record<string, unknown>;
}): Promise<TecpReceipt> {
  const created_at = new Date().toISOString();

  const input_hash = sha256Hex(params.input);
  const output_hash = sha256Hex(params.output);

  const base: Omit<TecpReceipt, 'sig'> = {
    version: 'tecp-0.1',
    profile: params.profile || 'tecp-v0.1',
    policy_epoch: 1,
    policy_ids: params.policyIds,
    created_at,
    ttl_seconds: params.ttl_seconds,
    input_hash,
    output_hash,
    processor: params.processor,
    code_ref: params.codeRef,
    ext: params.ext,
    anchors: { log_root: null, log_seq: null }
  };

  const canon = canonicalizeJson(base);
  const data = new TextEncoder().encode(canon);

  let kid: string;
  let sigBytes: Uint8Array;

  if ('sign' in params.signer) {
    kid = params.signer.kid;
    sigBytes = await params.signer.sign(data);
  } else {
    const priv = params.signer.privateKey;
    const pub = ed25519.getPublicKey(priv);
    kid = params.signer.kid || kidFromPublicKey(pub);
    sigBytes = await ed25519.sign(data, priv);
  }

  const sig = toBase64Url(sigBytes);

  return {
    ...base,
    sig: { alg: 'Ed25519', kid, sig }
  };
}

export async function verifyReceipt(
  receipt: TecpReceipt,
  opts: { publicKeys: Uint8Array[]; requireLog?: boolean; ledgerUrl?: string } | Uint8Array[]
): Promise<boolean> {
  // Handle legacy signature: verifyReceipt(receipt, publicKeys[])
  const options = Array.isArray(opts) ? { publicKeys: opts } : opts;

  try {
    const { sig, ...unsigned } = receipt;
    const canon = canonicalizeJson(unsigned);
    const data = new TextEncoder().encode(canon);

    const kid = sig.kid;
    const targetKey = options.publicKeys.find((pk) => kidFromPublicKey(pk) === kid);
    if (!targetKey) return false;

    const raw = Buffer.from(sig.sig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    let sigOk = false;
    try {
      sigOk = ed25519.verify(raw, data, targetKey);
    } catch {
      sigOk = false;
    }
    
    if (!sigOk) return false;

    // Verify ledger inclusion if required
    if (options.requireLog && receipt.anchors?.log_seq && options.ledgerUrl) {
      try {
        const verified = await verifyLedgerInclusion(receipt, options.ledgerUrl);
        if (!verified) return false;
      } catch (error) {
        return false;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

async function verifyLedgerInclusion(receipt: TecpReceipt, ledgerUrl: string): Promise<boolean> {
  const seq = receipt.anchors?.log_seq;
  if (typeof seq !== 'number') return false;

  // Get inclusion proof from ledger
  const proofResponse = await fetch(`${ledgerUrl}/proof/inclusion?seq=${seq}`);
  if (!proofResponse.ok) return false;

  const proof = await proofResponse.json();
  
  // Verify the receipt hash matches what's in the ledger
  const receiptHash = sha256Hex(canonicalizeJson(receipt));
  const leafHash = sha256Hex(new Uint8Array(Buffer.from(receiptHash, 'hex')));
  
  // TODO: Implement full Merkle proof verification
  // For now, just check that the tree head root matches
  return proof.tree_head.root_hash === receipt.anchors?.log_root;
}


