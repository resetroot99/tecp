/**
 * JSON-C14N canonicalization for TECP
 * - Objects: sort keys ascending (UTF-8)
 * - Numbers: integers only; floats forbidden
 * - Strings: UTF-8 JSON encoding
 * - Output: compact JSON (no spaces, no trailing newline)
 */

function assertIntegerNumbers(value: unknown): void {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Error('Non-integer number encountered in canonicalization');
    }
  }
}

function canonicalizeInternal(value: unknown): unknown {
  assertIntegerNumbers(value);

  if (value === null || value === undefined) return value as null;

  if (Array.isArray(value)) {
    return value.map((v) => canonicalizeInternal(v));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'case' }));
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      out[k] = canonicalizeInternal(obj[k]);
    }
    return out;
  }

  // Primitives: string, boolean, number handled as-is (after integer check above)
  return value;
}

export function canonicalJSONString(obj: unknown): string {
  const canon = canonicalizeInternal(obj);
  // Default JSON.stringify emits compact JSON without spaces and without trailing newline
  return JSON.stringify(canon);
}

export function canonicalBytes(obj: unknown): Uint8Array {
  const json = canonicalJSONString(obj);
  return new TextEncoder().encode(json);
}

// Base64url helpers (no padding)
export function toBase64Url(bytes: Uint8Array): string {
  const b64 = Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(s: string): Uint8Array {
  // Restore padding
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return new Uint8Array(Buffer.from(b64, 'base64'));
}


