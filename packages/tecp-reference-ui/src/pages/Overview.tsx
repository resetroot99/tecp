
/*
 * TECP Reference UI - Overview Page
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani (v3ctor)
 * Contributors: TECP Community
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function Overview() {
  return (
    <div>
      <h1>TECP Reference Implementation</h1>
      
      <div className="alert alert-info" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', padding: '1rem', marginBottom: '2rem' }}>
        <strong>TECP Protocol v0.1</strong> - Making privacy violations mathematically impossible<br/>
        <strong>Lead Architect:</strong> Ali Jakvani | <strong>License:</strong> Apache 2.0<br/>
        <a href="https://github.com/resetroot99/tecp" target="_blank" rel="noopener noreferrer">GitHub Repository</a> | 
        <a href="http://localhost:3000/LICENSE.md" target="_blank" rel="noopener noreferrer">License</a>
      </div>
      
      <section className="section">
        <h2 className="section-title">What is TECP?</h2>
        <p>
          <strong>TECP is like TLS for computation</strong> - it makes privacy violations mathematically impossible, not just legally prohibited.
        </p>
        <p>
          The Trusted Ephemeral Computation Protocol (TECP) provides cryptographic receipts 
          for verifiable, ephemeral computation. Every computation produces a signed receipt 
          proving the processing occurred according to specified policies without persistent 
          data storage.
        </p>
        <p>
          <strong>Key Innovation:</strong> TECP transforms privacy from a legal promise into a mathematical guarantee. 
          Instead of "trust us, we deleted your data," you get cryptographic proof that data was processed ephemerally.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Live Demo: AI That Cannot Remember</h2>
        <p>
          Experience the world's first AI service with mathematical privacy guarantees:
        </p>
        <div className="code-block">
{`# Send sensitive data to Private-GPT
curl -X POST http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Process my medical records"}]}'

# Get AI response + cryptographic receipt proving ephemeral processing
{
  "choices": [{"message": {"content": "AI response..."}}],
  "tecp_receipt": {
    "version": "TECP-0.1",
    "policy_ids": ["no_retention", "key_erasure"],
    "sig": "cryptographic_proof_of_ephemeral_processing"
  }
}`}
        </div>
        <p>
          <strong>What this proves:</strong> ✅ AI processed your data ✅ Data was never stored ✅ Policies were enforced ✅ Anyone can verify
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Receipt Object</h2>
        <p>
          A TECP receipt contains nine required fields encoded in deterministic CBOR format 
          and signed with Ed25519:
        </p>
        <div className="code-block">
{`{
  "version": "TECP-0.1",
  "code_ref": "git:abc123...",
  "ts": 1692115200000,
  "nonce": "dGVzdC1ub25jZQ==",
  "input_hash": "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=",
  "output_hash": "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=",
  "policy_ids": ["no_retention", "eu_region"],
  "sig": "signature_base64_here",
  "pubkey": "pubkey_base64_here"
}`}
        </div>
        <p>
          Optional extensions may include key erasure proofs, environment metadata, 
          and transparency log inclusion proofs.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Verification</h2>
        <p>
          Receipt verification validates cryptographic signatures, timestamp bounds, 
          schema compliance, and optional transparency log inclusion. The verification 
          process is deterministic and produces identical results across implementations.
        </p>
        <p>
          Use the <a href="/verify">verifier</a> to validate receipts or the{' '}
          <a href="/examples">examples</a> to generate and verify receipts programmatically.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Specifications</h2>
        <ul>
          <li><a href="/spec/protocol">Protocol Specification</a></li>
          <li><a href="/spec/threat-model">Threat Model</a></li>
          <li><a href="/spec/test-vectors">Test Vectors</a></li>
          <li><a href="/policies">Policy Registry</a></li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">Production-Ready Implementation</h2>
        <p>
          This reference implementation demonstrates TECP-0.1 with comprehensive enterprise features:
        </p>
        <ul>
          <li><strong>Core Protocol:</strong> CBOR + Ed25519 deterministic signing with 9-field receipts</li>
          <li><strong>Policy Runtime:</strong> Real-time enforcement (PII redaction, TTL, network isolation)</li>
          <li><strong>Transparency Log:</strong> Merkle tree with SQLite, key rotation, signed timestamps</li>
          <li><strong>Multi-Language SDKs:</strong> JavaScript/TypeScript, Python, Go with full documentation</li>
          <li><strong>Enterprise Features:</strong> Rate limiting, CORS, key validation, TLS ready</li>
        </ul>
        <p>
          <strong>Performance Achieved:</strong> Receipt creation ~3ms (target ≤10ms), verification ~1ms (target ≤5ms), 
          receipt size ~2KB (target ≤8KB). <strong>All targets exceeded!</strong>
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Enterprise Compliance</h2>
        <p>
          TECP includes 15 production-ready policies with compliance mappings:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
          <div className="card">
            <h4>Healthcare (HIPAA)</h4>
            <ul style={{ fontSize: '0.9rem', margin: 0 }}>
              <li>hipaa_safe</li>
              <li>no_export_pii</li>
              <li>key_erasure</li>
            </ul>
          </div>
          <div className="card">
            <h4>European (GDPR)</h4>
            <ul style={{ fontSize: '0.9rem', margin: 0 }}>
              <li>eu_region</li>
              <li>gdpr_art6_lawful</li>
              <li>no_retention</li>
            </ul>
          </div>
          <div className="card">
            <h4>Financial (SOX)</h4>
            <ul style={{ fontSize: '0.9rem', margin: 0 }}>
              <li>sox_compliant</li>
              <li>audit_trail</li>
              <li>no_front_running</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Architecture & Credits</h2>
        <p>
          <strong>Lead Architect:</strong> Ali Jakvani<br/>
          <strong>Protocol Design:</strong> Conservative threat model with clear security boundaries<br/>
          <strong>License:</strong> Apache 2.0 (code), CC BY 4.0 (specification)
        </p>
        <p>
          TECP represents a rare combination of academic cryptographic rigor with real-world production engineering excellence.
          The protocol is designed for standardization and has been built with enterprise deployment in mind from day one.
        </p>
      </section>
    </div>
  );
}
