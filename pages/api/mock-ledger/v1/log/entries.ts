import { NextApiRequest, NextApiResponse } from 'next';

const mockEntry = {
  seq: 1,
  leaf_hash: '0000000000000000000000000000000000000000000000000000000000000000',
  timestamp: 1755909000000,
  policy_ids: ['policy://test/mock@v1']
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { leaf } = req.body || {};
    if (!leaf || typeof leaf !== 'string' || !/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
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
  } else {
    res.json([mockEntry]);
  }
}
