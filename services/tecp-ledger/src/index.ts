/**
 * TECP Transparency Ledger HTTP Server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { TransparencyLedger } from './ledger.js';
import { config } from 'dotenv';

config();

const app = express();
const port = process.env.PORT || 3001;
const dbPath = process.env.DB_PATH || './ledger.db';

// Initialize ledger
const ledger = new TransparencyLedger(dbPath);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    public_key: ledger.getPublicKey(),
    kid: ledger.getKid()
  });
});

// Ledger info
app.get('/', (req, res) => {
  res.json({
    name: 'TECP Transparency Ledger',
    version: '0.1.0',
    description: 'Append-only log with Merkle tree proofs for TECP receipts',
    public_key: ledger.getPublicKey(),
    kid: ledger.getKid(),
    endpoints: {
      append: 'POST /append',
      entry: 'GET /entry/:seq',
      treehead: 'GET /treehead/latest',
      inclusion_proof: 'GET /proof/inclusion?seq=N',
      feed: 'GET /feed.ndjson'
    }
  });
});

// Append entry
app.post('/append', async (req, res) => {
  try {
    const { leaf_hash, meta } = req.body;
    
    if (!leaf_hash || typeof leaf_hash !== 'string') {
      return res.status(400).json({ 
        error: 'leaf_hash required (64-char hex string)' 
      });
    }

    const result = await ledger.append({ leaf_hash, meta });
    res.json(result);
  } catch (error) {
    console.error('Append error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Append failed' 
    });
  }
});

// Get entry by sequence number
app.get('/entry/:seq', (req, res) => {
  try {
    const seq = parseInt(req.params.seq);
    if (isNaN(seq) || seq < 1) {
      return res.status(400).json({ error: 'Invalid sequence number' });
    }

    const entry = ledger.getEntry(seq);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Parse policy_ids if present
    const response = {
      ...entry,
      policy_ids: entry.policy_ids // Already an array in our in-memory implementation
    };

    res.json(response);
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ error: 'Failed to get entry' });
  }
});

// Get recent entries
app.get('/entries', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 1000, 10000);
    const entries = ledger.getRecentEntries(limit);
    
    const response = entries.map(entry => ({
      ...entry,
      policy_ids: entry.policy_ids // Already an array in our in-memory implementation
    }));

    res.json(response);
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ error: 'Failed to get entries' });
  }
});

// Get latest tree head
app.get('/treehead/latest', async (req, res) => {
  try {
    const sth = await ledger.getLatestTreeHead();
    if (!sth) {
      return res.status(404).json({ error: 'No tree head available' });
    }
    res.json(sth);
  } catch (error) {
    console.error('Get tree head error:', error);
    res.status(500).json({ error: 'Failed to get tree head' });
  }
});

// Get inclusion proof
app.get('/proof/inclusion', async (req, res) => {
  try {
    const seq = parseInt(req.query.seq as string);
    if (isNaN(seq) || seq < 1) {
      return res.status(400).json({ error: 'Invalid sequence number' });
    }

    const proof = await ledger.getInclusionProof(seq);
    if (!proof) {
      return res.status(404).json({ error: 'Entry not found or proof unavailable' });
    }

    res.json(proof);
  } catch (error) {
    console.error('Get inclusion proof error:', error);
    res.status(500).json({ error: 'Failed to generate inclusion proof' });
  }
});

// Public feed for mirroring
app.get('/feed.ndjson', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', 'attachment; filename="tecp-ledger-feed.ndjson"');
    
    const feed = ledger.getFeed();
    res.send(feed);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down ledger...');
  ledger.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down ledger...');
  ledger.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`TECP Transparency Ledger running on port ${port}`);
  console.log(`Public key: ${ledger.getPublicKey()}`);
  console.log(`Key ID: ${ledger.getKid()}`);
});

export { TransparencyLedger };
