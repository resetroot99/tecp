const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const mockSth = {
  size: 1,
  root: '0000000000000000000000000000000000000000000000000000000000000000',
  sig: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  kid: 'test-key-1'
};

app.get('/v1/log/sth', (req, res) => {
  res.json(mockSth);
});

app.post('/v1/log/entries', (req, res) => {
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
});

app.get('/v1/log/entries', (req, res) => {
  res.json([{
    seq: 1,
    leaf_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: Date.now(),
    policy_ids: ['policy://test/mock@v1']
  }]);
});

app.get('/v1/log/proof', (req, res) => {
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
});

module.exports = app;