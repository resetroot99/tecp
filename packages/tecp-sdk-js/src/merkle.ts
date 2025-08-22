import { sha256 } from '@noble/hashes/sha256';

export function leafHash(data: Uint8Array): Uint8Array {
  const prefixed = new Uint8Array(1 + data.length);
  prefixed[0] = 0x00;
  prefixed.set(data, 1);
  return sha256(prefixed);
}

export function nodeHash(left: Uint8Array, right: Uint8Array): Uint8Array {
  const prefixed = new Uint8Array(1 + left.length + right.length);
  prefixed[0] = 0x01;
  prefixed.set(left, 1);
  prefixed.set(right, 1 + left.length);
  return sha256(prefixed);
}

export function verifyAuditPath(
  leaf: Uint8Array,
  auditPath: string[], // hex-encoded sibling hashes bottom-up
  leafIndex: number,
  expectedRootHex: string,
  treeSize?: number
): boolean {
  let hash = leafHash(leaf);

  for (let i = 0; i < auditPath.length; i++) {
    const sibling = hexToBytes(auditPath[i]);
    const isLeft = (leafIndex >> i) & 1;
    if (isLeft) {
      hash = nodeHash(sibling, hash);
    } else {
      hash = nodeHash(hash, sibling);
    }
  }

  const rootHex = bytesToHex(hash);
  return equalsHex(rootHex, expectedRootHex);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function equalsHex(a: string, b: string): boolean {
  const na = a.startsWith('0x') ? a.slice(2) : a;
  const nb = b.startsWith('0x') ? b.slice(2) : b;
  return na.toLowerCase() === nb.toLowerCase();
}


