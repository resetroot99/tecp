/*
 * TECP Reference UI - Transparency Ledger
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState, useEffect } from 'react';

interface LogEntry {
  seq: number;
  leaf_hash: string;
  timestamp: number;
  policy_ids?: string[];
  kid?: string;
  created_at?: string;
}

interface TreeHead {
  size: number;
  root_hash: string;
  timestamp: number;
  signature: string;
  kid: string;
  public_key: string;
}

const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || '/api/ledger';

export function Ledger() {
  const [treeHead, setTreeHead] = useState<TreeHead | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSeq, setSearchSeq] = useState('');
  const [searchResult, setSearchResult] = useState<LogEntry | null>(null);

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
    try {
      setLoading(true);
      
      // Load latest tree head
      const sthResponse = await fetch(`${LEDGER_URL}/v1/log/sth`);
      if (sthResponse.ok) {
        const sth = await sthResponse.json();
        setTreeHead(sth);
      }

      // Load recent entries
      const entriesResponse = await fetch(`${LEDGER_URL}/v1/log/entries?limit=100`);
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        setEntries(entriesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const searchEntry = async () => {
    if (!searchSeq) return;
    
    try {
      const response = await fetch(`${LEDGER_URL}/v1/log/entry/${searchSeq}`);
      if (response.ok) {
        const entry = await response.json();
        setSearchResult(entry);
      } else {
        setSearchResult(null);
        setError(`Entry ${searchSeq} not found`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }}></div>
          <p style={{ color: '#666' }}>Loading transparency ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section">
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>TECP Transparency Ledger</h1>
          <p style={{ color: '#1e40af', fontWeight: '500', fontSize: '1.125rem', margin: '0 0 1rem 0' }}>Public, append-only log with Merkle tree proofs</p>
          <div className="alert" style={{ background: '#dbeafe', border: '1px solid #3b82f6', color: '#1e40af' }}>
            <p style={{ margin: 0 }}>
              <strong>Privacy-preserving:</strong> Only receipt hashes and metadata are stored. 
              No input/output data is ever logged.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="button"
            style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tree Head Status */}
      {treeHead && (
        <div className="section">
          <h2 className="section-title">Latest Signed Tree Head</h2>
          <div className="card">
            <div className="two-column">
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Tree State</h3>
                <div>
                  <p><strong>Size:</strong> <span className="code-inline">{treeHead.size.toLocaleString()} entries</span></p>
                  <p><strong>Root Hash:</strong> <span className="code-inline">{formatHash(treeHead.root_hash)}</span></p>
                  <p><strong>Timestamp:</strong> {formatTimestamp(treeHead.timestamp)}</p>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Signature</h3>
                <div>
                  <p><strong>Key ID:</strong> <span className="code-inline">{formatHash(treeHead.kid)}</span></p>
                  <p><strong>Public Key:</strong> <span className="code-inline">{formatHash(treeHead.public_key)}</span></p>
                  <p><strong>Signature:</strong> <span className="code-inline">{formatHash(treeHead.signature)}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="section">
        <h2 className="section-title">Search Entry</h2>
        <div className="card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" htmlFor="search-seq">Sequence Number</label>
              <input
                id="search-seq"
                type="number"
                placeholder="Enter sequence number..."
                value={searchSeq}
                onChange={(e) => setSearchSeq(e.target.value)}
                className="form-input"
              />
            </div>
            <button
              onClick={searchEntry}
              className="button-primary"
            >
              Search
            </button>
          </div>
          
          {searchResult && (
            <div className="card" style={{ marginTop: '1rem', background: '#f8fafc' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Entry #{searchResult.seq}</h3>
              <div>
                <p><strong>Hash:</strong> <span className="code-inline">{searchResult.leaf_hash}</span></p>
                <p><strong>Timestamp:</strong> {formatTimestamp(searchResult.timestamp)}</p>
                {searchResult.policy_ids && (
                  <p><strong>Policies:</strong> {searchResult.policy_ids.join(', ')}</p>
                )}
                {searchResult.kid && (
                  <p><strong>Key ID:</strong> <span className="code-inline">{formatHash(searchResult.kid)}</span></p>
                )}
                {searchResult.created_at && (
                  <p><strong>Created:</strong> {searchResult.created_at}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="section">
        <h2 className="section-title">Recent Entries</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Hash</th>
                  <th>Timestamp</th>
                  <th>Policies</th>
                  <th>Key ID</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.seq}>
                    <td className="table-mono">
                      {entry.seq}
                    </td>
                    <td className="table-mono">
                      {formatHash(entry.leaf_hash)}
                    </td>
                    <td>
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td>
                      {entry.policy_ids ? (
                        <div>
                          {entry.policy_ids.map((policy, i) => (
                            <span key={i} className="code-inline" style={{ marginRight: '0.25rem', fontSize: '0.75rem' }}>
                              {policy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td className="table-mono">
                      {entry.kid ? formatHash(entry.kid) : <span style={{ color: '#999' }}>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No entries found
            </div>
          )}
        </div>
      </div>

      {/* Download Links */}
      <div className="section">
        <h2 className="section-title">Export Data</h2>
        <div className="card">
          <div className="two-column">
            <a
              href={`${LEDGER_URL}/v1/log/feed.ndjson`}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Feed (NDJSON)
            </a>
            <button
              onClick={() => window.open(`${LEDGER_URL}/v1/log/sth`, '_blank')}
              className="button"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Latest STH (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="card" style={{ background: '#f8fafc' }}>
        <h2 className="section-title">API Endpoints</h2>
        <div className="code-block">
          <div><strong>GET</strong> {LEDGER_URL}/v1/log/info - Ledger info</div>
          <div><strong>POST</strong> {LEDGER_URL}/v1/log/entries - Append entry</div>
          <div><strong>GET</strong> {LEDGER_URL}/v1/log/entry/:seq - Get entry</div>
          <div><strong>GET</strong> {LEDGER_URL}/v1/log/sth - Latest STH</div>
          <div><strong>GET</strong> {LEDGER_URL}/v1/log/proof?leaf=HEX - Inclusion proof</div>
          <div><strong>GET</strong> {LEDGER_URL}/v1/log/feed.ndjson - Public feed</div>
        </div>
      </div>
    </div>
  );
}
