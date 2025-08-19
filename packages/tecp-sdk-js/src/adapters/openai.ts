import { wrap } from '../wrap';
import type { TecpReceipt } from '../types';
import type { Signer } from '../receipt';

type OpenAIClient = any; // keep loose, adapter is duck-typed

export function withOpenAI(client: OpenAIClient, opts: {
  signer: Signer | { privateKey: Uint8Array; kid?: string };
  policyIds?: string[];
}) {
  const proxy: any = { ...client };
  proxy.chat = proxy.chat || {};
  proxy.chat.completions = proxy.chat.completions || {};

  const originalCreate = client.chat?.completions?.create?.bind(client.chat.completions);
  if (typeof originalCreate === 'function') {
    const wrapped = wrap(originalCreate as any, {
      signer: opts.signer,
      policyIds: opts.policyIds || ['no_retention', 'no_pii'],
      processor: { vendor: 'openai' }
    });

    proxy.chat.completions.create = async (params: any) => {
      const { result, tecp_receipt } = await wrapped(params);
      // Reuse original result shape if possible
      return { ...(result as any), tecp_receipt: tecp_receipt as TecpReceipt };
    };
  }

  return proxy;
}


