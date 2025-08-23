/**
 * RFC 6962-style Merkle Tree Implementation
 * Certificate Transparency compatible
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export function leafHash(data: Uint8Array): Uint8Array {
  // RFC 6962: MTH({d(0)}) = SHA-256(0x00 || d(0))
  const prefixed = new Uint8Array(1 + data.length);
  prefixed[0] = 0x00; // leaf prefix
  prefixed.set(data, 1);
  return sha256(prefixed);
}

export function nodeHash(left: Uint8Array, right: Uint8Array): Uint8Array {
  // RFC 6962: MTH(D[n]) = SHA-256(0x01 || MTH(D[0:k]) || MTH(D[k:n]))
  const prefixed = new Uint8Array(1 + left.length + right.length);
  prefixed[0] = 0x01; // node prefix
  prefixed.set(left, 1);
  prefixed.set(right, 1 + left.length);
  return sha256(prefixed);
}

export function merkleTreeHash(leaves: Uint8Array[]): Uint8Array {
  if (leaves.length === 0) {
    return sha256(new Uint8Array(0)); // empty tree
  }
  if (leaves.length === 1) {
    return leafHash(leaves[0]);
  }

  // Find largest power of 2 less than leaves.length
  const k = 1 << Math.floor(Math.log2(leaves.length));
  const left = merkleTreeHash(leaves.slice(0, k));
  const right = merkleTreeHash(leaves.slice(k));
  return nodeHash(left, right);
}

export interface InclusionProof {
  leafIndex: number;
  treeSize: number;
  auditPath: string[]; // hex-encoded hashes
}

export function generateInclusionProof(
  leaves: Uint8Array[],
  leafIndex: number
): InclusionProof {
  if (leafIndex >= leaves.length) {
    throw new Error('Leaf index out of bounds');
  }

  const auditPath: Uint8Array[] = [];
  const treeSize = leaves.length;
  
  function buildPath(start: number, end: number, targetIndex: number): Uint8Array {
    if (end - start === 1) {
      return leafHash(leaves[start]);
    }

    const k = 1 << Math.floor(Math.log2(end - start));
    const mid = start + k;

    if (targetIndex < mid) {
      // Target is in left subtree, add right subtree hash to path
      const rightHash = buildSubtreeHash(mid, end);
      auditPath.push(rightHash);
      return nodeHash(buildPath(start, mid, targetIndex), rightHash);
    } else {
      // Target is in right subtree, add left subtree hash to path
      const leftHash = buildSubtreeHash(start, mid);
      auditPath.push(leftHash);
      return nodeHash(leftHash, buildPath(mid, end, targetIndex));
    }
  }

  function buildSubtreeHash(start: number, end: number): Uint8Array {
    if (end - start === 1) {
      return leafHash(leaves[start]);
    }
    const k = 1 << Math.floor(Math.log2(end - start));
    const mid = start + k;
    return nodeHash(buildSubtreeHash(start, mid), buildSubtreeHash(mid, end));
  }

  buildPath(0, treeSize, leafIndex);

  return {
    leafIndex,
    treeSize,
    auditPath: auditPath.map(hash => bytesToHex(hash))
  };
}

export function verifyInclusionProof(
  leafData: Uint8Array,
  proof: InclusionProof,
  rootHash: Uint8Array
): boolean {
  try {
    let currentHash = leafHash(leafData);
    let index = proof.leafIndex;
    let treeSize = proof.treeSize;

    for (const siblingHex of proof.auditPath) {
      const sibling = new Uint8Array(Buffer.from(siblingHex, 'hex'));
      
      // Determine if sibling is left or right
      const k = 1 << Math.floor(Math.log2(treeSize));
      
      if (index < k) {
        // Current node is left child
        currentHash = nodeHash(currentHash, sibling);
        treeSize = k;
      } else {
        // Current node is right child
        currentHash = nodeHash(sibling, currentHash);
        index -= k;
        treeSize -= k;
      }
    }

    return bytesToHex(currentHash) === bytesToHex(rootHash);
  } catch (error) {
    return false;
  }
}
