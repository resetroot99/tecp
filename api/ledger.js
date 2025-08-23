const mockSth = {
  size: 1,
  root: '0000000000000000000000000000000000000000000000000000000000000000',
  sig: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  kid: 'test-key-1'
};

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const path = req.url.replace('/ledger/', '');

  switch (path) {
    case 'v1/log/sth':
      res.json(mockSth);
      break;

    case 'v1/log/entries':
      if (req.method === 'POST') {
        const { leaf } = req.body || {};
        if (!leaf || typeof leaf !== 'string' || !/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
          res.status(400).json({ error: 'leaf must be 32-byte hex string' });
          return;
        }
        res.json({
          leaf_index: 1,
          proof: ['0000000000000000000000000000000000000000000000000000000000000000'],
          sth: mockSth,
          algo: 'sha256',
          domain: { leaf: '00', node: '01' }
        });
      } else {
        res.json([{
          seq: 1,
          leaf_hash: '0000000000000000000000000000000000000000000000000000000000000000',
          timestamp: Date.now(),
          policy_ids: ['policy://test/mock@v1']
        }]);
      }
      break;

    case 'v1/log/proof':
      const leaf = String(req.query.leaf || '');
      if (!/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
        res.status(400).json({ error: 'leaf must be 32-byte hex string' });
        return;
      }
      res.json({
        leaf_index: 1,
        proof: ['0000000000000000000000000000000000000000000000000000000000000000'],
        sth: mockSth,
        algo: 'sha256',
        domain: { leaf: '00', node: '01' }
      });
      break;

    default:
      res.status(404).json({ error: 'Endpoint not found' });
  }
};