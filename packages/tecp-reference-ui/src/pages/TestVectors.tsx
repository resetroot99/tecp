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

import { useState, useEffect } from 'react';

interface TestVector {
  name: string;
  description: string;
  receipt: any;
  expected_result: 'valid' | 'invalid';
  error_code?: string;
}

export function TestVectors() {
  const [vectors, setVectors] = useState<TestVector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Load test vectors from the spec server
    Promise.all([
      fetch('http://localhost:3000/test-vectors/valid/basic-receipt.json').then(r => r.json()),
      fetch('http://localhost:3000/test-vectors/invalid-sig/tampered-signature.json').then(r => r.json()),
      fetch('http://localhost:3000/test-vectors/expired/old-timestamp.json').then(r => r.json())
    ]).then(([valid, invalidSig, expired]) => {
      setVectors([
        {
          name: 'Valid Basic Receipt',
          description: 'A properly formed TECP receipt with valid signature',
          receipt: valid,
          expected_result: 'valid'
        },
        {
          name: 'Invalid Signature',
          description: 'Receipt with tampered signature',
          receipt: invalidSig,
          expected_result: 'invalid',
          error_code: 'E-SIG-001'
        },
        {
          name: 'Expired Receipt',
          description: 'Receipt with timestamp outside acceptable window',
          receipt: expired,
          expected_result: 'invalid',
          error_code: 'E-AGE-003'
        }
      ]);
      setLoading(false);
    }).catch(err => {
      setError(`Failed to load test vectors: ${err.message}`);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Test Vectors</h1>
        <p>Loading test vectors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Test Vectors</h1>
        <div className="alert alert-error">
          {error}
        </div>
        <section className="section">
          <h2>Known Answer Tests (KATs)</h2>
          <p>
            Test vectors provide known inputs and expected outputs for TECP receipt verification.
            These ensure interoperability between different TECP implementations.
          </p>
          <p>
            Test vectors should be available at:
          </p>
          <ul>
            <li><a href="http://localhost:3000/test-vectors/" target="_blank" rel="noopener noreferrer">Test Vectors Directory</a></li>
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div>
      <h1>TECP Test Vectors</h1>
      
      <section className="section">
        <h2>Known Answer Tests (KATs)</h2>
        <p>
          These test vectors provide standardized inputs and expected outputs for TECP receipt 
          verification. Use them to validate your TECP implementation against the reference.
        </p>
      </section>

      {vectors.map((vector, index) => (
        <section key={index} className="section">
          <h3>{vector.name}</h3>
          <p>{vector.description}</p>
          
          <div className="card">
            <h4>Expected Result</h4>
            <p>
              <strong>Status:</strong> {vector.expected_result.toUpperCase()}
              {vector.error_code && (
                <span> (Error Code: <code>{vector.error_code}</code>)</span>
              )}
            </p>
          </div>

          <div className="card">
            <h4>Receipt JSON</h4>
            <pre className="code-block" style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(vector.receipt, null, 2)}
            </pre>
          </div>
        </section>
      ))}

      <section className="section">
        <h2>Using Test Vectors</h2>
        <p>To verify your TECP implementation:</p>
        <ol>
          <li>Download the test vector JSON files</li>
          <li>Run them through your verifier</li>
          <li>Compare results with expected outcomes</li>
          <li>Ensure error codes match for invalid receipts</li>
        </ol>
        
        <div className="code-block">
{`# Example verification
npx tsx packages/tecp-verifier/src/cli.ts test-vector.json

# Expected output for valid receipt:
✅ Overall Status: VALID

# Expected output for invalid receipt:
❌ Overall Status: INVALID
Error Code: E-SIG-001`}
        </div>
      </section>

      <section className="section">
        <h2>License</h2>
        <p>
          Test vectors are provided under the Apache License 2.0. 
          See <a href="http://localhost:3000/LICENSE.md" target="_blank" rel="noopener noreferrer">LICENSE.md</a> for details.
        </p>
      </section>
    </div>
  );
}
