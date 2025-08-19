import { wrap } from '../wrap';

type FetchFn = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export function withFetch(fetchImpl: FetchFn, wrapOpts: any) {
  return wrap(
    async (input: RequestInfo, init?: RequestInit) => {
      const res = await fetchImpl(input, init);
      // clone response to preserve body
      const text = await res.clone().text();
      // Return a normalized result the wrapper can hash; also return original
      return { __raw: res, text };
    },
    wrapOpts
  );
}
