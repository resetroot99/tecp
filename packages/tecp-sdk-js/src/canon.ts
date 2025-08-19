import { sha256 } from '@noble/hashes/sha256';

function isJsonLike(value: unknown): boolean {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }
  return typeof value === 'object' && value !== null;
}

export function canonicalizeJson(value: unknown): string {
  const sort = (v: any): any => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      const out: Record<string, any> = {};
      for (const key of Object.keys(v).sort()) out[key] = sort(v[key]);
      return out;
    }
    return v;
  };

  const normalized = typeof value === 'string' ? JSON.parse(value) : value;
  return JSON.stringify(sort(normalized));
}

export function toBytes(value: unknown): Uint8Array {
  if (isJsonLike(value)) {
    const canon = canonicalizeJson(value);
    return new TextEncoder().encode(canon);
  }
  if (typeof value === 'string') return new TextEncoder().encode(value);
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value as any)) return new Uint8Array((value as any).buffer);
  return new TextEncoder().encode(String(value));
}

export function sha256Hex(value: unknown): string {
  const bytes = toBytes(value);
  const digest = sha256(bytes);
  return Buffer.from(digest).toString('hex');
}


