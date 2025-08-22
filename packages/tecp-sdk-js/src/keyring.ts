import * as ed25519 from '@noble/ed25519';

export type Jwk = { kty: 'OKP'; crv: 'Ed25519'; x: string; kid?: string };
export type Jwks = { keys: Jwk[] };

export class Keyring {
  private kidToKey: Map<string, Uint8Array> = new Map();

  add(kid: string, publicKey: Uint8Array): void {
    this.kidToKey.set(kid, publicKey);
  }

  get(kid: string): Uint8Array | undefined {
    return this.kidToKey.get(kid);
  }

  static async fromJWKS(url: string): Promise<Keyring> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
    const jwks = (await res.json()) as Jwks;
    const kr = new Keyring();
    for (const jwk of jwks.keys) {
      if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || !jwk.x) continue;
      const kid = jwk.kid || kidFromJwk(jwk);
      kr.add(kid, base64UrlToBytes(jwk.x));
    }
    return kr;
  }
}

export function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export function kidFromJwk(jwk: Jwk): string {
  // Derive kid from raw key bytes
  return toBase64Url(base64UrlToBytes(jwk.x));
}

export function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}


