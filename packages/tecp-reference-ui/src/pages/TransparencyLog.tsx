import { useState, useEffect } from 'react';

interface LogEntry {
  leaf_index: number;
  code_ref: string;
  receipt_hash: string;
  timestamp: number;
  leaf_hash: string;
}

interface LogRoot {
  root_hash: string;
  tree_size: number;
  signature: string;
  timestamp: number;
}

interface MerkleProof {
  leaf_index: number;
  audit_path: string[];
  tree_size: number;
}

export function TransparencyLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [currentRoot, setCurrentRoot] = useState<LogRoot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null);
  const [proof, setProof] = useState<MerkleProof | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const baseUrl = (import.meta as any).env?.VITE_TECP_LOG_URL || (typeof window !== 'undefined' ? (window as any).TECP_LOG_URL : '') || 'http://localhost:3002';
  const isProduction = typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app'));

  useEffect(() => {
    loadLogData();
  }, []);

  const loadLogData = async () => {
    try {
      if (isProduction) {
        // Use mock data for production deployment
        const { mockTransparencyLogData } = await import('../utils/mockBackend');
        setCurrentRoot(mockTransparencyLogData.root as LogRoot);
        setEntries(mockTransparencyLogData.entries as LogEntry[]);
        return;
      }

      // Load current root
      const rootResponse = await fetch(`${baseUrl}/root`);
      if (rootResponse.ok) {
        const rootData = await rootResponse.json();
        // API shape: { success: true, root: { root_hash, tree_size, timestamp, signature } }
        if (rootData && rootData.root) {
          setCurrentRoot(rootData.root as LogRoot);
        }
      }

      // Load recent entries (we'll implement pagination later)
      try {
        const entriesResponse = await fetch(`${baseUrl}/entries?limit=50`);
        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json();
          setEntries(entriesData as LogEntry[]);
        } else if (entriesResponse.status === 404) {
          // Endpoint not implemented; show empty list gracefully
          setEntries([]);
        }
      } catch {
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to load transparency log data:', error);
      // Fallback to mock data on error
      if (isProduction) {
        const { mockTransparencyLogData } = await import('../utils/mockBackend');
        setCurrentRoot(mockTransparencyLogData.root as LogRoot);
        setEntries(mockTransparencyLogData.entries as LogEntry[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProof = async (leafIndex: number) => {
    setProofLoading(true);
    setProof(null);
    
    try {
      const response = await fetch(`${baseUrl}/proof/${leafIndex}`);
      if (response.ok) {
        const proofData = await response.json();
        // API shape: { success: true, proof: { ... } }
        if (proofData && proofData.proof) {
          setProof(proofData.proof as MerkleProof);
          setSelectedLeaf(leafIndex);
        }
      }
    } catch (error) {
      console.error('Failed to fetch proof:', error);
    } finally {
      setProofLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp || Number.isNaN(timestamp)) return '—';
    const d = new Date(timestamp);
    return Number.isNaN(d.getTime()) ? '—' : d.toISOString();
  };

  const formatHash = (hash: string, length: number = 16): string => {
    return hash.length > length ? `${hash.substring(0, length)}...` : hash;
  };

  if (loading) {
    return <div>Loading transparency log...</div>;
  }

  return (
    <div>
      <h1>TECP Transparency Log</h1>
      
      <div className="alert alert-info" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', padding: '1rem', marginBottom: '2rem' }}>
        <strong>Apache License 2.0</strong> - This transparency log is licensed under the Apache License 2.0.
      </div>
      
      {isProduction && (
        <div className="alert alert-warning" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '1rem', marginBottom: '2rem' }}>
          <strong>Demo Mode:</strong> This deployment shows sample data. 
          For live transparency log data, run the full stack locally or deploy all services.
          <br />
          <code>npm run dev:all</code> to run locally with real backend services.
        </div>
      )}
      
      <section className="section">
        <p>
          Public transparency log containing cryptographic proofs of all TECP receipts. 
          Each entry includes a Merkle inclusion proof that can be independently verified 
          against the signed root hash.
        </p>
      </section>

      {currentRoot && (
        <section className="section">
          <h2 className="section-title">Current Signed Root</h2>
          <table className="table">
            <tbody>
              <tr>
                <td>Root Hash</td>
                <td className="hash">{currentRoot.root_hash}</td>
              </tr>
              <tr>
                <td>Tree Size</td>
                <td className="table-mono">{currentRoot.tree_size}</td>
              </tr>
              <tr>
                <td>Timestamp</td>
                <td className="table-mono">{formatTimestamp(currentRoot.timestamp)}</td>
              </tr>
              <tr>
                <td>Signature</td>
                <td className="hash">{formatHash(currentRoot.signature, 32)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Recent Entries</h2>
        <p>
          <strong>{entries.length}</strong> recent entries shown. 
          Click on a leaf index to view the Merkle inclusion proof.
        </p>
        
        <table className="table">
          <thead>
            <tr>
              <th>Leaf Index</th>
              <th>Code Ref</th>
              <th>Receipt Hash</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.leaf_index}>
                <td className="table-mono">{entry.leaf_index}</td>
                <td className="code-inline">{formatHash(entry.code_ref, 12)}</td>
                <td className="hash-short">{formatHash(entry.receipt_hash, 16)}</td>
                <td className="table-mono">{formatTimestamp(entry.timestamp)}</td>
                <td>
                  <button
                    className="button"
                    onClick={() => fetchProof(entry.leaf_index)}
                    disabled={proofLoading}
                  >
                    {proofLoading && selectedLeaf === entry.leaf_index ? 'Loading...' : 'Get Proof'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {proof && selectedLeaf !== null && (
        <section className="section">
          <h2 className="section-title">Merkle Inclusion Proof</h2>
          <p>
            Proof for leaf index <span className="code-inline">{selectedLeaf}</span>:
          </p>
          
          <table className="table">
            <tbody>
              <tr>
                <td>Leaf Index</td>
                <td className="table-mono">{proof.leaf_index}</td>
              </tr>
              <tr>
                <td>Tree Size</td>
                <td className="table-mono">{proof.tree_size}</td>
              </tr>
              <tr>
                <td>Audit Path Length</td>
                <td className="table-mono">{proof.audit_path.length}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="section-title">Audit Path</h3>
          <div className="code-block">
            {JSON.stringify(proof.audit_path, null, 2)}
          </div>

          <div className="alert alert-success">
            <strong>Verification:</strong> This proof can be verified against the current root hash 
            using standard Merkle tree verification algorithms.
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Log Endpoints</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="code-inline">GET /root</td>
              <td>GET</td>
              <td>Get current signed root hash</td>
            </tr>
            <tr>
              <td className="code-inline">POST /entries</td>
              <td>POST</td>
              <td>Add new receipt to log</td>
            </tr>
            <tr>
              <td className="code-inline">GET /proof/:leaf</td>
              <td>GET</td>
              <td>Get Merkle inclusion proof for leaf</td>
            </tr>
            <tr>
              <td className="code-inline">GET /health</td>
              <td>GET</td>
              <td>Health check endpoint</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2 className="section-title">Verification Process</h2>
        <ol>
          <li>Obtain the receipt hash and leaf index from a TECP receipt</li>
          <li>Fetch the Merkle inclusion proof using <span className="code-inline">GET /proof/:leaf</span></li>
          <li>Fetch the current signed root using <span className="code-inline">GET /root</span></li>
          <li>Verify the Merkle proof against the root hash</li>
          <li>Verify the root signature using the log's public key</li>
        </ol>
        <p>
          The TECP verifier performs this process automatically when the 
          <span className="code-inline">--require-log</span> flag is used.
        </p>
      </section>
    </div>
  );
}
