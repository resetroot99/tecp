import { withAnthropic, genKeyPair } from '../src';
import { expect, it } from 'vitest';

it('wraps anthropic messages.create', async () => {
  const { privateKey, publicKey } = await genKeyPair();
  const client = {
    messages: { create: async (opts: any) => ({ content: [{ text: 'ok' }] }) }
  };
  const wrapped = withAnthropic(client as any, {
    signer: { privateKey },
    policyIds: ['no_retention'],
    verifyLocal: true,
    verifyLocalKeys: [publicKey]
  });
  const res = await wrapped.messages.create({ model: 'claude', messages: [] });
  expect(res.tecp_receipt).toBeTruthy();
  expect(res.tecp_verification?.valid).toBe(true);
  expect(res.content).toEqual([{ text: 'ok' }]);
});
