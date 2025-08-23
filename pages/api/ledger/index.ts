import { NextApiRequest, NextApiResponse } from 'next';
import { TransparencyLedger } from '../../../services/tecp-ledger/src/ledger';
import { config } from 'dotenv';

config();

const dbPath = process.env.DB_PATH || './ledger.db';
const ledger = new TransparencyLedger(dbPath);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (pathStr) {
      case 'v1/log/sth':
        const sth = await ledger.getLatestTreeHead();
        if (!sth) {
          res.status(404).json({ error: 'no STH' });
          return;
        }
        res.json({ size: sth.size, root: sth.root_hash, sig: sth.signature, kid: sth.kid });
        break;

      case 'v1/log/entries':
        if (req.method === 'POST') {
          const { leaf } = req.body || {};
          if (!leaf || typeof leaf !== 'string' || !/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
            res.status(400).json({ error: 'leaf must be 32-byte hex string' });
            return;
          }
          const hex = leaf.startsWith('0x') ? leaf.slice(2) : leaf;
          const result = await ledger.append({ leaf_hash: hex });
          const proof = await ledger.getInclusionProof(result.seq);
          const newSth = await ledger.getLatestTreeHead();
          if (!proof || !newSth) {
            res.status(500).json({ error: 'Failed to produce proof/STH' });
            return;
          }
          res.json({
            leaf_index: proof.leaf_index,
            proof: proof.audit_path,
            sth: { size: newSth.size, root: newSth.root_hash, sig: newSth.signature, kid: newSth.kid },
            algo: 'sha256',
            domain: { leaf: '00', node: '01' }
          });
        } else {
          const limit = Math.min(parseInt(String(req.query.limit)) || 1000, 10000);
          const entries = ledger.getRecentEntries(limit);
          res.json(entries);
        }
        break;

      case 'v1/log/proof':
        const leaf = String(req.query.leaf || '');
        if (!/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
          res.status(400).json({ error: 'leaf must be 32-byte hex string' });
          return;
        }
        const hex = leaf.startsWith('0x') ? leaf.slice(2) : leaf;
        let seq: number | null = null;
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
        const sthForProof = await ledger.getLatestTreeHead();
        if (!proof || !sthForProof) {
          res.status(500).json({ error: 'proof/STH unavailable' });
          return;
        }
        res.json({
          leaf_index: proof.leaf_index,
          proof: proof.audit_path,
          sth: { size: sthForProof.size, root: sthForProof.root_hash, sig: sthForProof.signature, kid: sthForProof.kid },
          algo: 'sha256',
          domain: { leaf: '00', node: '01' }
        });
        break;

      default:
        res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
