/**
 * TECP Transparency Log
 * 
 * 3-endpoint service providing:
 * - POST /entries - Add new receipt to transparency log
 * - GET /proof/:leaf - Get Merkle proof for specific leaf
 * - GET /root - Get current signed root hash
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

import express from 'express';
import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import { sha512 } from '@noble/hashes/sha512';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configure Ed25519 with SHA-512 before importing
import { ed25519 } from '@noble/curves/ed25519';
const { sign, verify } = ed25519;

interface LogEntry {
  leaf_index: number;
  code_ref: string;
  receipt_hash: string;
  timestamp: number;
  leaf_hash: string;
}

interface MerkleProof {
  leaf_index: number;
  audit_path: string[];
  tree_size: number;
  root_hash: string;
}

interface SignedRoot {
  root_hash: string;
  tree_size: number;
  timestamp: number;
  signature: string;
  kid?: string; // Key ID for rotation support
}

interface LogKey {
  kid: string; // Key identifier (e.g., "log-202412")
  public_key: string; // Base64 encoded public key
  status: 'active' | 'next' | 'revoked';
  created_at: number;
  expires_at?: number;
  revoked_at?: number;
}

export class TransparencyLog {
  private db: sqlite3.Database;
  private logPrivateKey: Uint8Array;
  private logPublicKey: Uint8Array;
  private currentKid: string;

  constructor(dbPath: string, logPrivateKey: Uint8Array, logPublicKey: Uint8Array) {
    this.db = new sqlite3.Database(dbPath);
    this.logPrivateKey = logPrivateKey;
    this.logPublicKey = logPublicKey;
    this.currentKid = process.env.LOG_KEY_ID || `log-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    this.initDB();
    this.configureDB();
  }

  private initDB(): void {
    this.db.serialize(() => {
      // Entries table for individual receipts
      this.db.run(`
        CREATE TABLE IF NOT EXISTS entries (
          leaf_index INTEGER PRIMARY KEY AUTOINCREMENT,
          code_ref TEXT NOT NULL,
          receipt_hash TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          leaf_hash TEXT NOT NULL
        )
      `);

      // Roots table for signed tree heads
      this.db.run(`
        CREATE TABLE IF NOT EXISTS roots (
          tree_size INTEGER PRIMARY KEY,
          root_hash TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          signature TEXT NOT NULL,
          kid TEXT
        )
      `);

      // Keys table for key rotation
      this.db.run(`
        CREATE TABLE IF NOT EXISTS keys (
          kid TEXT PRIMARY KEY,
          public_key TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'next', 'revoked')),
          created_at INTEGER NOT NULL,
          expires_at INTEGER,
          revoked_at INTEGER
        )
      `);

      // Index for efficient queries
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON entries(timestamp)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_receipt_hash ON entries(receipt_hash)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_keys_status ON keys(status)`);
      
      // Initialize current key if not exists
      this.db.run(`
        INSERT OR IGNORE INTO keys (kid, public_key, status, created_at)
        VALUES (?, ?, 'active', ?)
      `, [this.currentKid, Buffer.from(this.logPublicKey).toString('base64'), Date.now()]);
    });
  }

  private configureDB(): void {
    // Enable WAL mode for better concurrency and crash recovery
    this.db.run('PRAGMA journal_mode=WAL');
    this.db.run('PRAGMA synchronous=NORMAL');
    this.db.run('PRAGMA foreign_keys=ON');
    this.db.run('PRAGMA temp_store=MEMORY');
    this.db.run('PRAGMA mmap_size=268435456'); // 256MB
  }

  async addEntry(codeRef: string, receiptHash: string): Promise<{leaf_index: number; root: string; proof: MerkleProof}> {
    const timestamp = Date.now();
    
    // Create leaf data and hash
    const leafData = JSON.stringify({
      code_ref: codeRef,
      receipt_hash: receiptHash,
      timestamp
    });
    const leafHash = createHash('sha256').update(leafData).digest('hex');

    return new Promise((resolve, reject) => {
      const self = this;
      
      // Use transaction for atomicity
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        this.db.run(
          'INSERT INTO entries (code_ref, receipt_hash, timestamp, leaf_hash) VALUES (?, ?, ?, ?)',
          [codeRef, receiptHash, timestamp, leafHash],
          async function(err: Error | null) {
            if (err) {
              self.db.run('ROLLBACK');
              reject(err);
              return;
            }

            const leafIndex = this.lastID as number;
            
            try {
              // Rebuild Merkle tree and get new root
              const {root, proof} = await self.rebuildTree(leafIndex);
              
              self.db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  reject(commitErr);
                } else {
                  resolve({
                    leaf_index: leafIndex,
                    root,
                    proof
                  });
                }
              });
            } catch (error) {
              self.db.run('ROLLBACK');
              reject(error);
            }
          }
        );
      });
    });
  }

  async getProof(leafIndex: number): Promise<MerkleProof | null> {
    return new Promise((resolve, reject) => {
      // Get the specific leaf
      this.db.get(
        'SELECT * FROM entries WHERE leaf_index = ?',
        [leafIndex],
        async (err, row: LogEntry) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          try {
            // Get all leaves to rebuild the tree and generate proof
            const leaves = await this.getAllLeaves();
            const proof = this.generateMerkleProof(leaves, leafIndex);
            resolve(proof);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async getCurrentRoot(): Promise<SignedRoot> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM roots ORDER BY tree_size DESC LIMIT 1',
        async (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            // Empty log - return genesis root
            const emptyRoot = createHash('sha256').update('').digest('hex');
            const timestamp = Date.now();
            const signature = await this.signRoot(emptyRoot, 0, timestamp);
            
            resolve({
              root_hash: emptyRoot,
              tree_size: 0,
              timestamp,
              signature,
              kid: this.currentKid
            });
            return;
          }

          resolve({
            root_hash: row.root_hash,
            tree_size: row.tree_size,
            timestamp: row.timestamp,
            signature: row.signature,
            kid: row.kid || this.currentKid
          });
        }
      );
    });
  }

  private async rebuildTree(newLeafIndex: number): Promise<{root: string; proof: MerkleProof}> {
    const leaves = await this.getAllLeaves();
    const leafHashes = leaves.map(l => l.leaf_hash);
    const root = this.calculateMerkleRoot(leafHashes);
    const timestamp = Date.now();
    const signature = await this.signRoot(root, leaves.length, timestamp);
    
    // Store new root
    await new Promise<void>((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO roots (tree_size, root_hash, timestamp, signature, kid) VALUES (?, ?, ?, ?, ?)',
        [leaves.length, root, timestamp, signature, this.currentKid],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Generate proof for the new leaf
    const proof = this.generateMerkleProof(leaves, newLeafIndex);

    return { root, proof };
  }

  private async getAllLeaves(): Promise<LogEntry[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM entries ORDER BY leaf_index',
        (err, rows: LogEntry[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  private calculateMerkleRoot(leafHashes: string[]): string {
    if (leafHashes.length === 0) {
      return createHash('sha256').update('').digest('hex');
    }
    
    if (leafHashes.length === 1) {
      return leafHashes[0];
    }

    let currentLevel = leafHashes.slice();
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate if odd number
        
        // Use byte concatenation instead of hex string concatenation
        const leftBytes = Buffer.from(left, 'hex');
        const rightBytes = Buffer.from(right, 'hex');
        const combined = createHash('sha256')
          .update(Buffer.concat([leftBytes, rightBytes]))
          .digest('hex');
        nextLevel.push(combined);
      }
      
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * List recent entries for UI/debugging
   */
  async listEntries(limit: number): Promise<LogEntry[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM entries ORDER BY leaf_index DESC LIMIT ?',
        [limit],
        (err, rows: LogEntry[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get all keys for key rotation endpoint
   */
  async getKeys(): Promise<LogKey[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM keys ORDER BY created_at DESC',
        (err, rows: LogKey[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Add a new key (for rotation)
   */
  async addKey(kid: string, publicKey: string, status: 'active' | 'next' = 'next'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO keys (kid, public_key, status, created_at) VALUES (?, ?, ?, ?)',
        [kid, publicKey, status, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Revoke a key
   */
  async revokeKey(kid: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE keys SET status = ?, revoked_at = ? WHERE kid = ?',
        ['revoked', Date.now(), kid],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  private generateMerkleProof(leaves: LogEntry[], targetIndex: number): MerkleProof {
    const leafHashes = leaves.map(l => l.leaf_hash);
    const auditPath: string[] = [];
    
    if (leafHashes.length <= 1) {
      return {
        leaf_index: targetIndex,
        audit_path: [],
        tree_size: leafHashes.length,
        root_hash: this.calculateMerkleRoot(leafHashes)
      };
    }

    let currentLevel = leafHashes.slice();
    let currentIndex = targetIndex - 1; // Convert to 0-based

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        
        // If our target is in this pair, add sibling to audit path
        if (i === currentIndex || i + 1 === currentIndex) {
          if (i === currentIndex) {
            // Our node is left, sibling is right
            auditPath.push(right);
          } else {
            // Our node is right, sibling is left
            auditPath.push(left);
          }
        }
        
        const leftBytes = Buffer.from(left, 'hex');
        const rightBytes = Buffer.from(right, 'hex');
        const combined = createHash('sha256')
          .update(Buffer.concat([leftBytes, rightBytes]))
          .digest('hex');
        nextLevel.push(combined);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
      currentLevel = nextLevel;
    }

    return {
      leaf_index: targetIndex,
      audit_path: auditPath,
      tree_size: leafHashes.length,
      root_hash: currentLevel[0]
    };
  }

  private async signRoot(rootHash: string, treeSize: number, timestamp: number): Promise<string> {
    const data = JSON.stringify({
      root_hash: rootHash,
      tree_size: treeSize,
      timestamp,
      kid: this.currentKid
    });
    
    const signature = await sign(Buffer.from(data), this.logPrivateKey);
    return Buffer.from(signature).toString('base64');
  }

  async verifyRootSignature(signedRoot: SignedRoot): Promise<boolean> {
    const data = JSON.stringify({
      root_hash: signedRoot.root_hash,
      tree_size: signedRoot.tree_size,
      timestamp: signedRoot.timestamp
    });

    try {
      const signature = Buffer.from(signedRoot.signature, 'base64');
      return await verify(signature, Buffer.from(data), this.logPublicKey);
    } catch {
      return false;
    }
  }

  close(): void {
    this.db.close();
  }
}

// Express server setup
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retry_after: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS - restrict to known origins in production
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:3003', 'http://localhost:3004'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json({ limit: '1mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(10000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Load log keys - REQUIRED in production
if (!process.env.LOG_PRIVATE_KEY || !process.env.LOG_PUBLIC_KEY) {
  console.error('❌ FATAL: LOG_PRIVATE_KEY and LOG_PUBLIC_KEY environment variables are required');
  console.error('   Generate keys with: npm run gen:keys');
  console.error('   Set LOG_PRIVATE_KEY and LOG_PUBLIC_KEY as base64-encoded keys');
  process.exit(1);
}

const LOG_PRIVATE_KEY = Buffer.from(process.env.LOG_PRIVATE_KEY, 'base64');
const LOG_PUBLIC_KEY = Buffer.from(process.env.LOG_PUBLIC_KEY, 'base64');

const DB_PATH = process.env.DB_PATH || './tecp.db';
const log = new TransparencyLog(DB_PATH, LOG_PRIVATE_KEY, LOG_PUBLIC_KEY);

// API Routes

/**
 * POST /entries - Add new receipt to transparency log
 * Body: { code_ref: string, receipt_hash: string }
 */
app.post('/entries', async (req, res) => {
  try {
    const { code_ref, receipt_hash } = req.body;
    
    if (!code_ref || !receipt_hash) {
      return res.status(400).json({
        error: 'Missing required fields: code_ref, receipt_hash'
      });
    }

    // Validate receipt_hash format (should be hex)
    if (!/^[a-f0-9]{64}$/i.test(receipt_hash)) {
      return res.status(400).json({
        error: 'Invalid receipt_hash format (expected 64-char hex)'
      });
    }

    const result = await log.addEntry(code_ref, receipt_hash);
    
    res.json({
      success: true,
      leaf_index: result.leaf_index,
      root_hash: result.root,
      merkle_proof: result.proof,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({
      error: 'Failed to add entry to transparency log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /proof/:leaf - Get Merkle proof for specific leaf
 */
app.get('/proof/:leaf', async (req, res) => {
  try {
    const leafIndex = parseInt(req.params.leaf);
    
    if (isNaN(leafIndex) || leafIndex < 1) {
      return res.status(400).json({
        error: 'Invalid leaf index (must be positive integer)'
      });
    }

    const proof = await log.getProof(leafIndex);
    
    if (!proof) {
      return res.status(404).json({
        error: 'Leaf not found in transparency log'
      });
    }
    
    res.json({
      success: true,
      proof
    });
    
  } catch (error) {
    console.error('Error getting proof:', error);
    res.status(500).json({
      error: 'Failed to generate Merkle proof',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /root - Get current signed root hash
 */
app.get('/root', async (req, res) => {
  try {
    const root = await log.getCurrentRoot();
    
    res.json({
      success: true,
      root
    });
    
  } catch (error) {
    console.error('Error getting root:', error);
    res.status(500).json({
      error: 'Failed to get current root',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /entries - List recent entries (optional, for UI convenience)
 * Query: ?limit=number
 */
app.get('/entries', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(String(req.query.limit || '50')), 100));
    const rows = await log.listEntries(limit);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list entries' });
  }
});

/**
 * GET /keys - Get all keys for verification and rotation
 */
app.get('/keys', async (req, res) => {
  try {
    const keys = await log.getKeys();
    
    // Separate keys by status for easier consumption
    const result = {
      active: keys.filter(k => k.status === 'active'),
      next: keys.filter(k => k.status === 'next'),
      revoked: keys.filter(k => k.status === 'revoked')
    };
    
    res.json({
      success: true,
      keys: result,
      total: keys.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve keys',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /signed-time - Get current signed timestamp for receipt anchoring
 */
app.get('/signed-time', async (req, res) => {
  try {
    const timestamp = Date.now();
    const root = await log.getCurrentRoot();
    
    // Sign the timestamp along with current root for integrity
    const data = JSON.stringify({
      timestamp,
      root_hash: root.root_hash,
      kid: root.kid
    });
    
    const signature = await sign(Buffer.from(data), LOG_PRIVATE_KEY);
    
    res.json({
      success: true,
      signed_time: {
        timestamp,
        root_hash: root.root_hash,
        signature: Buffer.from(signature).toString('base64'),
        kid: root.kid
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate signed time',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const root = await log.getCurrentRoot();
    
    res.json({
      status: 'healthy',
      service: 'tecp-transparency-log',
      version: 'TECP-0.1',
      tree_size: root.tree_size,
      uptime_seconds: Math.floor(process.uptime())
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET / - Service info (HTML landing page)
 */
app.get('/', async (req, res) => {
  try {
    const root = await log.getCurrentRoot();
    const entries = await log.listEntries(10);
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TECP Transparency Log</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 2rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 2rem;
        }
        
        .section {
            margin-bottom: 2rem;
        }
        
        .section h2 {
            color: #2d3748;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: #f7fafc;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #718096;
            font-size: 0.9rem;
        }
        
        .endpoints {
            display: grid;
            gap: 1rem;
        }
        
        .endpoint {
            background: #f7fafc;
            padding: 1rem;
            border-radius: 6px;
            border-left: 3px solid #48bb78;
        }
        
        .endpoint-method {
            display: inline-block;
            background: #48bb78;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 0.5rem;
        }
        
        .endpoint-method.post { background: #ed8936; }
        .endpoint-method.get { background: #48bb78; }
        
        .endpoint-path {
            font-family: 'SF Mono', Monaco, monospace;
            font-weight: bold;
            color: #2d3748;
        }
        
        .endpoint-desc {
            color: #718096;
            margin-top: 0.5rem;
        }
        
        .hash {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 0.9rem;
            background: #edf2f7;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            word-break: break-all;
        }
        
        .entries-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .entries-table th,
        .entries-table td {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .entries-table th {
            background: #f7fafc;
            font-weight: 600;
            color: #2d3748;
        }
        
        .status-healthy {
            color: #48bb78;
            font-weight: bold;
        }
        
        .footer {
            background: #f7fafc;
            padding: 1rem 2rem;
            text-align: center;
            color: #718096;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            body { padding: 1rem; }
            .header h1 { font-size: 2rem; }
            .stats { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌳 TECP Transparency Log</h1>
            <p>Cryptographic transparency log for ephemeral computation receipts</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value">${root.tree_size}</div>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${entries.length}</div>
                        <div class="stat-label">Recent Entries</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">TECP-0.1</div>
                        <div class="stat-label">Protocol Version</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value status-healthy">Healthy</div>
                        <div class="stat-label">Service Status</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Current Signed Root</h2>
                <p><strong>Root Hash:</strong> <span class="hash">${root.root_hash}</span></p>
                <p><strong>Timestamp:</strong> ${new Date(root.timestamp).toISOString()}</p>
                <p><strong>Signature:</strong> <span class="hash">${root.signature.substring(0, 32)}...</span></p>
            </div>
            
            <div class="section">
                <h2>API Endpoints</h2>
                <div class="endpoints">
                    <div class="endpoint">
                        <span class="endpoint-method post">POST</span>
                        <span class="endpoint-path">/entries</span>
                        <div class="endpoint-desc">Add receipt to transparency log</div>
                    </div>
                    <div class="endpoint">
                        <span class="endpoint-method get">GET</span>
                        <span class="endpoint-path">/entries?limit=N</span>
                        <div class="endpoint-desc">List recent entries</div>
                    </div>
                    <div class="endpoint">
                        <span class="endpoint-method get">GET</span>
                        <span class="endpoint-path">/proof/:leaf</span>
                        <div class="endpoint-desc">Get Merkle inclusion proof for leaf</div>
                    </div>
                    <div class="endpoint">
                        <span class="endpoint-method get">GET</span>
                        <span class="endpoint-path">/root</span>
                        <div class="endpoint-desc">Get current signed root hash</div>
                    </div>
                    <div class="endpoint">
                        <span class="endpoint-method get">GET</span>
                        <span class="endpoint-path">/health</span>
                        <div class="endpoint-desc">Service health check</div>
                    </div>
                </div>
            </div>
            
            ${entries.length > 0 ? `
            <div class="section">
                <h2>Recent Entries</h2>
                <table class="entries-table">
                    <thead>
                        <tr>
                            <th>Leaf Index</th>
                            <th>Code Ref</th>
                            <th>Receipt Hash</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries.map(entry => `
                        <tr>
                            <td>${entry.leaf_index}</td>
                            <td><span class="hash">${entry.code_ref.substring(0, 16)}...</span></td>
                            <td><span class="hash">${entry.receipt_hash.substring(0, 16)}...</span></td>
                            <td>${new Date(entry.timestamp).toISOString()}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>TECP Transparency Log v0.1 • <a href="/health">Health Check</a> • <a href="https://tecp.dev">Documentation</a></p>
        </div>
    </div>
</body>
</html>`);
  } catch (error) {
    res.status(500).send(`
    <html>
      <body style="font-family: sans-serif; padding: 2rem; text-align: center;">
        <h1>TECP Transparency Log</h1>
        <p>Service temporarily unavailable</p>
        <p style="color: #666;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      </body>
    </html>
    `);
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down TECP Transparency Log...');
  log.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down TECP Transparency Log...');
  log.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`TECP Transparency Log v0.1`);
  console.log(`Running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Endpoints: POST /entries, GET /proof/:leaf, GET /root`);
  console.log(`Health check: GET /health`);
  console.log(`Ready to provide cryptographic transparency for ephemeral computation`);
});

export default app;
