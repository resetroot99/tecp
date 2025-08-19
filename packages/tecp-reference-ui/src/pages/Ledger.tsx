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

const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || 'http://localhost:3001';

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
      const sthResponse = await fetch(`${LEDGER_URL}/treehead/latest`);
      if (sthResponse.ok) {
        const sth = await sthResponse.json();
        setTreeHead(sth);
      }

      // Load recent entries
      const entriesResponse = await fetch(`${LEDGER_URL}/entries?limit=100`);
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
      const response = await fetch(`${LEDGER_URL}/entry/${searchSeq}`);
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transparency ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TECP Transparency Ledger</h1>
          <p className="text-blue-700 font-medium text-lg">Public, append-only log with Merkle tree proofs</p>
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Privacy-preserving:</strong> Only receipt hashes and metadata are stored. 
              No input/output data is ever logged.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tree Head Status */}
      {treeHead && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Signed Tree Head</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tree State</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-mono">{treeHead.size.toLocaleString()} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Root Hash:</span>
                    <span className="font-mono text-sm">{formatHash(treeHead.root_hash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="text-sm">{formatTimestamp(treeHead.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signature</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Key ID:</span>
                    <span className="font-mono text-sm">{formatHash(treeHead.kid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Public Key:</span>
                    <span className="font-mono text-sm">{formatHash(treeHead.public_key)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Signature:</span>
                    <span className="font-mono text-sm">{formatHash(treeHead.signature)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Entry</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Enter sequence number..."
              value={searchSeq}
              onChange={(e) => setSearchSeq(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchEntry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
          
          {searchResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Entry #{searchResult.seq}</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Hash:</strong> <span className="font-mono">{searchResult.leaf_hash}</span></div>
                <div><strong>Timestamp:</strong> {formatTimestamp(searchResult.timestamp)}</div>
                {searchResult.policy_ids && (
                  <div><strong>Policies:</strong> {searchResult.policy_ids.join(', ')}</div>
                )}
                {searchResult.kid && (
                  <div><strong>Key ID:</strong> <span className="font-mono">{formatHash(searchResult.kid)}</span></div>
                )}
                {searchResult.created_at && (
                  <div><strong>Created:</strong> {searchResult.created_at}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Entries</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seq</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policies</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.seq} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {entry.seq}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {formatHash(entry.leaf_hash)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.policy_ids ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.policy_ids.map((policy, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {policy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {entry.kid ? formatHash(entry.kid) : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {entries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No entries found
            </div>
          )}
        </div>
      </div>

      {/* Download Links */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Data</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href={`${LEDGER_URL}/feed.ndjson`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Feed (NDJSON)
            </a>
            <button
              onClick={() => window.open(`${LEDGER_URL}/treehead/latest`, '_blank')}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Latest STH (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">API Endpoints</h2>
        <div className="space-y-2 text-sm font-mono">
          <div><span className="text-green-600">GET</span> <span className="text-blue-600">{LEDGER_URL}/</span> - Ledger info</div>
          <div><span className="text-yellow-600">POST</span> <span className="text-blue-600">{LEDGER_URL}/append</span> - Append entry</div>
          <div><span className="text-green-600">GET</span> <span className="text-blue-600">{LEDGER_URL}/entry/:seq</span> - Get entry</div>
          <div><span className="text-green-600">GET</span> <span className="text-blue-600">{LEDGER_URL}/treehead/latest</span> - Latest STH</div>
          <div><span className="text-green-600">GET</span> <span className="text-blue-600">{LEDGER_URL}/proof/inclusion?seq=N</span> - Inclusion proof</div>
          <div><span className="text-green-600">GET</span> <span className="text-blue-600">{LEDGER_URL}/feed.ndjson</span> - Public feed</div>
        </div>
      </div>
    </div>
  );
}
