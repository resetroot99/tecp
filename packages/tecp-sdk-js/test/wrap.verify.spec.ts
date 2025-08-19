import { describe, it, expect } from 'vitest';
import { wrap, genKeyPair } from '../src';
import { verifyReceipt } from '../src/receipt';

describe('wrap verifyLocal', () => {
  it('verifies signature when verifyLocalKeys provided', async () => {
    const { privateKey, publicKey } = await genKeyPair();
    const op = async (x: string) => `hi ${x}`;
    const opWrapped = wrap(op, {
      signer: { privateKey },
      policyIds: ['no_retention'],
      verifyLocal: true,
      verifyLocalKeys: [publicKey],
    });
    const { result, tecp_receipt, tecp_verification } = await opWrapped('there');

    expect(result).toBe('hi there');
    expect(tecp_verification?.valid).toBe(true);
    const ok = await verifyReceipt(tecp_receipt, { publicKeys: [publicKey] });
    expect(ok).toBe(true);
  });

  it('fails verification with wrong key', async () => {
    const { privateKey } = await genKeyPair();
    const { publicKey: wrongKey } = await genKeyPair();
    const op = async (x: string) => `hi ${x}`;
    const opWrapped = wrap(op, {
      signer: { privateKey },
      policyIds: ['no_retention'],
      verifyLocal: true,
      verifyLocalKeys: [wrongKey],
    });
    const { tecp_verification } = await opWrapped('there');

    expect(tecp_verification?.valid).toBe(false);
    expect(tecp_verification?.errors).toContain('signature failed');
  });

  it('throws error when verifyLocal=true but no keys provided', async () => {
    const { privateKey } = await genKeyPair();
    const op = async (x: string) => `hi ${x}`;
    const opWrapped = wrap(op, {
      signer: { privateKey },
      policyIds: ['no_retention'],
      verifyLocal: true,
      // verifyLocalKeys missing
    });
    const { tecp_verification } = await opWrapped('there');

    expect(tecp_verification?.valid).toBe(false);
    expect(tecp_verification?.errors?.[0]).toContain('verifyLocalKeys required');
  });
});
