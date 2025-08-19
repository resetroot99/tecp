/**
 * In-Memory Database for TECP Transparency Ledger
 * Simple implementation for demo purposes
 */

export interface LogEntry {
  seq: number;
  leaf_hash: string; // hex
  timestamp: number;
  policy_ids?: string[]; 
  kid?: string;
  created_at?: string;
}

export interface SignedTreeHead {
  id: number;
  size: number;
  root_hash: string; // hex
  timestamp: number;
  signature: string; // hex
  kid: string;
}

export class LedgerDatabase {
  private entries: LogEntry[] = [];
  private treeHeads: SignedTreeHead[] = [];
  private nextSeq = 1;
  private nextSthId = 1;

  constructor(dbPath?: string) {
    // In-memory implementation for simplicity
    console.log('Using in-memory database for ledger');
  }

  appendEntry(leafHash: string, meta?: {
    policy_ids?: string[];
    kid?: string;
    created_at?: string;
  }): LogEntry {
    const timestamp = Date.now();
    const entry: LogEntry = {
      seq: this.nextSeq++,
      leaf_hash: leafHash,
      timestamp,
      policy_ids: meta?.policy_ids,
      kid: meta?.kid,
      created_at: meta?.created_at
    };

    this.entries.push(entry);
    return entry;
  }

  getEntry(seq: number): LogEntry | null {
    return this.entries.find(e => e.seq === seq) || null;
  }

  getAllEntries(): LogEntry[] {
    return [...this.entries].sort((a, b) => a.seq - b.seq);
  }

  getRecentEntries(limit: number = 1000): LogEntry[] {
    return [...this.entries]
      .sort((a, b) => b.seq - a.seq)
      .slice(0, limit);
  }

  getEntriesByKid(kid: string): LogEntry[] {
    return this.entries
      .filter(e => e.kid === kid)
      .sort((a, b) => b.seq - a.seq);
  }

  saveTreeHead(sth: Omit<SignedTreeHead, 'id'>): SignedTreeHead {
    const treeHead: SignedTreeHead = {
      id: this.nextSthId++,
      ...sth
    };

    this.treeHeads.push(treeHead);
    return treeHead;
  }

  getLatestTreeHead(): SignedTreeHead | null {
    if (this.treeHeads.length === 0) return null;
    return this.treeHeads[this.treeHeads.length - 1];
  }

  getAllTreeHeads(): SignedTreeHead[] {
    return [...this.treeHeads].sort((a, b) => b.timestamp - a.timestamp);
  }

  getTreeSize(): number {
    return this.entries.length;
  }

  close() {
    // No-op for in-memory
  }
}