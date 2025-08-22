import { sha256 } from '@noble/hashes/sha256';
import type { Receipt } from './types.js';
import { canonicalBytes } from './c14n.js';

export function leafForLog(receipt: Receipt): Uint8Array {
  const canon = canonicalBytes(receipt);
  return sha256(canon);
}


