const express = require('express');
const cors = require('cors');
const { TransparencyLedger } = require('../services/tecp-ledger/src/ledger');

const app = express();
const dbPath = process.env.DB_PATH || './ledger.db';
const ledger = new TransparencyLedger(dbPath);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/v1/log/sth', async (req, res) => {
  try {
    const sth = await ledger.getLatestTreeHead();
    if (!sth) {
      res.status(404).json({ error: 'no STH' });
      return;
    }
    res.json({ size: sth.size, root: sth.root_hash, sig: sth.signature, kid: sth.kid });
  } catch (error) {
    console.error('STH error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/v1/log/entries', async (req, res) => {
  try {
    const { leaf } = req.body || {};
    if (!leaf || typeof leaf !== 'string' || !/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
      res.status(400).json({ error: 'leaf must be 32-byte hex string' });
      return;
    }
    const hex = leaf.startsWith('0x') ? leaf.slice(2) : leaf;
    const result = await ledger.append({ leaf_hash: hex });
    const proof = await ledger.getInclusionProof(result.seq);
    const sth = await ledger.getLatestTreeHead();
    if (!proof || !sth) {
      res.status(500).json({ error: 'Failed to produce proof/STH' });
      return;
    }
    res.json({
      leaf_index: proof.leaf_index,
      proof: proof.audit_path,
      sth: { size: sth.size, root: sth.root_hash, sig: sth.signature, kid: sth.kid },
      algo: 'sha256',
      domain: { leaf: '00', node: '01' }
    });
  } catch (error) {
    console.error('Append error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/v1/log/entries', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 10000);
    const entries = ledger.getRecentEntries(limit);
    res.json(entries);
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/v1/log/proof', async (req, res) => {
  try {
    const leaf = String(req.query.leaf || '');
    if (!/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
      res.status(400).json({ error: 'leaf must be 32-byte hex string' });
      return;
    }
    const hex = leaf.startsWith('0x') ? leaf.slice(2) : leaf;
    let seq = null;
    for (let i = 1; ; i++) {
      const entry = ledger.getEntry(i);
      if (!entry) break;
      if (entry.leaf_hash.toLowerCase() === hex.toLowerCase()) { seq = i; break; }
    }
    if (!seq) {
      res.status(404).json({ error: 'leaf not found' });
      return;
    }
    const proof = await ledger.getInclusionProof(seq);
    const sth = await ledger.getLatestTreeHead();
    if (!proof || !sth) {
      res.status(500).json({ error: 'proof/STH unavailable' });
      return;
    }
    res.json({
      leaf_index: proof.leaf_index,
      proof: proof.audit_path,
      sth: { size: sth.size, root: sth.root_hash, sig: sth.signature, kid: sth.kid },
      algo: 'sha256',
      domain: { leaf: '00', node: '01' }
    });
  } catch (error) {
    console.error('Get proof error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
