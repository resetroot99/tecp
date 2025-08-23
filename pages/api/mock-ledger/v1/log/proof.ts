import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const leaf = String(req.query.leaf || '');
  if (!/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
    res.status(400).json({ error: 'leaf must be 32-byte hex string' });
    return;
  }

  res.json({
    leaf_index: 1,
    proof: ['0000000000000000000000000000000000000000000000000000000000000000'],
    sth: {
      size: 1,
      root: '0000000000000000000000000000000000000000000000000000000000000000',
      sig: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      kid: 'test-key-1'
    },
    algo: 'sha256',
    domain: { leaf: '00', node: '01' }
  });
}
