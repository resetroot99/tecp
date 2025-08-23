/**
 * TECP Transparency Ledger Core Logic
 */

import { LedgerDatabase, LogEntry, SignedTreeHead } from './database';
import { TreeHeadSigner } from './signer';
import { merkleTreeHash, generateInclusionProof, InclusionProof } from './merkle';
import { bytesToHex } from '@noble/hashes/utils';

export interface AppendRequest {
  leaf_hash: string; // hex
  meta?: {
    policy_ids?: string[];
    kid?: string;
    created_at?: string;
  };
}

export interface AppendResponse {
  seq: number;
  timestamp: number;
}

export interface TreeHeadResponse {
  size: number;
  root_hash: string;
  timestamp: number;
  signature: string;
  kid: string;
  public_key: string;
}

export interface InclusionProofResponse {
  leaf_index: number;
  tree_size: number;
  audit_path: string[];
  tree_head: TreeHeadResponse;
}

export class TransparencyLedger {
  private db: LedgerDatabase;
  private signer: TreeHeadSigner;
  private sthInterval: NodeJS.Timeout | null = null;

  constructor(dbPath?: string, privateKey?: Uint8Array) {
    this.db = new LedgerDatabase(dbPath);
    this.signer = new TreeHeadSigner(privateKey);
    
    // Start periodic STH generation
    this.startSTHGeneration();
  }

  async append(request: AppendRequest): Promise<AppendResponse> {
    // Validate hex format
    if (!/^[0-9a-f]{64}$/i.test(request.leaf_hash)) {
      throw new Error('Invalid leaf_hash format (must be 64-char hex)');
    }

    const entry = this.db.appendEntry(request.leaf_hash, request.meta);
    
    // Trigger STH generation if we don't have one or it's getting old
    const latest = this.db.getLatestTreeHead();
    const now = Date.now();
    if (!latest || (now - latest.timestamp) > 60000) { // 1 minute
      await this.generateSTH();
    }

    return {
      seq: entry.seq,
      timestamp: entry.timestamp
    };
  }

  getEntry(seq: number): LogEntry | null {
    return this.db.getEntry(seq);
  }

  getRecentEntries(limit: number = 1000): LogEntry[] {
    return this.db.getRecentEntries(limit);
  }

  async getLatestTreeHead(): Promise<TreeHeadResponse | null> {
    const sth = this.db.getLatestTreeHead();
    if (!sth) return null;

    return {
      size: sth.size,
      root_hash: sth.root_hash,
      timestamp: sth.timestamp,
      signature: sth.signature,
      kid: sth.kid,
      public_key: this.signer.getPublicKeyHex()
    };
  }

  async getInclusionProof(seq: number): Promise<InclusionProofResponse | null> {
    const entry = this.db.getEntry(seq);
    if (!entry) return null;

    const allEntries = this.db.getAllEntries();
    const leafIndex = seq - 1; // Convert to 0-based index
    
    if (leafIndex >= allEntries.length) return null;

    // Get all leaf hashes up to the current tree size
    const leafHashes = allEntries.map(e => 
      new Uint8Array(Buffer.from(e.leaf_hash, 'hex'))
    );

    const proof = generateInclusionProof(leafHashes, leafIndex);
    const latestSTH = await this.getLatestTreeHead();
    
    if (!latestSTH) {
      throw new Error('No tree head available');
    }

    return {
      leaf_index: leafIndex,
      tree_size: proof.treeSize,
      audit_path: proof.auditPath,
      tree_head: latestSTH
    };
  }

  async generateSTH(): Promise<TreeHeadResponse> {
    const entries = this.db.getAllEntries();
    const size = entries.length;
    
    if (size === 0) {
      throw new Error('Cannot generate STH for empty tree');
    }

    const leafHashes = entries.map(e => 
      new Uint8Array(Buffer.from(e.leaf_hash, 'hex'))
    );
    
    const rootHash = merkleTreeHash(leafHashes);
    const timestamp = Date.now();
    
    const treeHeadData = {
      size,
      root_hash: bytesToHex(rootHash),
      timestamp
    };

    const { signature, kid } = await this.signer.signTreeHead(treeHeadData);
    
    // Save to database
    this.db.saveTreeHead({
      size,
      root_hash: treeHeadData.root_hash,
      timestamp,
      signature,
      kid
    });

    return {
      ...treeHeadData,
      signature,
      kid,
      public_key: this.signer.getPublicKeyHex()
    };
  }

  getPublicKey(): string {
    return this.signer.getPublicKeyHex();
  }

  getKid(): string {
    return this.signer.kid;
  }

  // Generate feed for public mirroring
  getFeed(): string {
    const entries = this.db.getRecentEntries(10000); // Last 10k entries
    return entries
      .reverse() // Chronological order
      .map(entry => JSON.stringify({
        seq: entry.seq,
        leaf_hash: entry.leaf_hash,
        timestamp: entry.timestamp,
        policy_ids: entry.policy_ids, // Already an array in our in-memory implementation
        kid: entry.kid,
        created_at: entry.created_at
      }))
      .join('\n');
  }

  private startSTHGeneration() {
    // Generate STH every 60 seconds if there are new entries
    this.sthInterval = setInterval(async () => {
      try {
        const size = this.db.getTreeSize();
        const latest = this.db.getLatestTreeHead();
        
        if (size > 0 && (!latest || latest.size < size)) {
          await this.generateSTH();
        }
      } catch (error) {
        console.error('STH generation error:', error);
      }
    }, 60000);
  }

  close() {
    if (this.sthInterval) {
      clearInterval(this.sthInterval);
    }
    this.db.close();
  }
}
