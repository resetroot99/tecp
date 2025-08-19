import type { TecpReceipt } from '../types';
import { wrap } from '../wrap';

type AnthropicClient = {
  messages: { create: (opts: any) => Promise<any> };
};

export function withAnthropic(client: AnthropicClient, wrapOpts: any) {
  const wrappedCreate = wrap(
    async (opts: any) => client.messages.create(opts),
    wrapOpts
  );

  return {
    ...client,
    messages: {
      ...client.messages,
      async create(opts: any) {
        const { result, tecp_receipt, tecp_verification, enforcement } =
          await wrappedCreate(opts);
        // Return the original Anthropic response but attach receipt fields
        return Object.assign(result, {
          tecp_receipt: tecp_receipt as TecpReceipt,
          tecp_verification,
          tecp_enforcement: enforcement
        });
      }
    }
  };
}
