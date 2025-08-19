/**
 * Tree Head Signer for TECP Transparency Ledger
 */

import { sign, getPublicKey, utils } from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export interface TreeHeadData {
  size: number;
  root_hash: string;
  timestamp: number;
}

export class TreeHeadSigner {
  private privateKey: Uint8Array;
  public readonly publicKey: Uint8Array;
  public readonly kid: string;

  constructor(privateKey?: Uint8Array) {
    this.privateKey = privateKey || utils.randomPrivateKey();
    this.publicKey = getPublicKey(this.privateKey);
    this.kid = this.generateKid();
  }

  private generateKid(): string {
    // KID = base64url(sha256(publicKey))
    const hash = sha256(this.publicKey);
    return Buffer.from(hash)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private canonicalize(data: TreeHeadData): string {
    // Deterministic JSON serialization
    return JSON.stringify({
      size: data.size,
      root_hash: data.root_hash,
      timestamp: data.timestamp
    }, Object.keys(data).sort());
  }

  async signTreeHead(data: TreeHeadData): Promise<{
    signature: string;
    kid: string;
  }> {
    const canonical = this.canonicalize(data);
    const message = new TextEncoder().encode(canonical);
    const signature = await sign(message, this.privateKey);
    
    return {
      signature: bytesToHex(signature),
      kid: this.kid
    };
  }

  static async verifyTreeHead(
    data: TreeHeadData,
    signature: string,
    publicKey: Uint8Array
  ): Promise<boolean> {
    try {
      const canonical = JSON.stringify({
        size: data.size,
        root_hash: data.root_hash,
        timestamp: data.timestamp
      }, Object.keys(data).sort());
      
      const message = new TextEncoder().encode(canonical);
      const sigBytes = new Uint8Array(Buffer.from(signature, 'hex'));
      
      const { verify } = await import('@noble/ed25519');
      return await verify(sigBytes, message, publicKey);
    } catch (error) {
      return false;
    }
  }

  getPublicKeyHex(): string {
    return bytesToHex(this.publicKey);
  }

  getPrivateKeyHex(): string {
    return bytesToHex(this.privateKey);
  }
}
