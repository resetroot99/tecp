
/*
 * Copyright 2024 TECP Working Group
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
        <strong>Apache License 2.0</strong> - This reference implementation is licensed under the Apache License 2.0. 
        See <a href="http://localhost:3000/LICENSE.md" target="_blank" rel="noopener noreferrer">LICENSE.md</a> for details.
      </div>
      
      <section className="section">
        <h2 className="section-title">Purpose</h2>
        <p>
          The Trusted Ephemeral Computation Protocol (TECP) provides cryptographic receipts 
          for verifiable, ephemeral computation. Each computation produces a signed receipt 
          proving the processing occurred according to specified policies without persistent 
          data storage.
        </p>
        <p>
          TECP enables mathematical verification of privacy claims rather than relying on 
          legal agreements or trust-based assurances. Receipts can be independently verified 
          by any party without access to the original computation environment.
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
        <h2 className="section-title">Implementation</h2>
        <p>
          This reference implementation demonstrates TECP-0.1 with software-based key 
          erasure simulation. Future profiles will support hardware attestation (TECP-B) 
          and zero-knowledge proofs (TECP-G).
        </p>
        <p>
          Performance targets: Receipt creation &lt;10ms, verification &lt;5ms, 
          maximum size 8KB.
        </p>
      </section>
    </div>
  );
}
