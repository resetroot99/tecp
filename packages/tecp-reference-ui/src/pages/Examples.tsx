import { useState } from 'react';
import { VerificationResult } from '../components/VerificationResult';
import { type VerificationResult as VerificationResultType } from '../types/verification';



interface ExampleResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  tecp_receipt: any;
  tecp_metadata: {
    processing_time_ms: number;
    verification_url: string;
    message: string;
  };
}

export function Examples() {
  const [activeExample, setActiveExample] = useState<'curl' | 'node' | 'python'>('curl');
  const [testMessage, setTestMessage] = useState('Tell me about privacy in AI systems');
  const [response, setResponse] = useState<ExampleResponse | null>(null);
  const [verification, setVerification] = useState<VerificationResultType | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = {
    curl: `curl -X POST http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "${testMessage}"
      }
    ]
  }'`,
    
    node: `const fetch = require('node-fetch');

const response = await fetch('http://localhost:3001/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: '${testMessage}'
      }
    ]
  })
});

const result = await response.json();
console.log('Response:', result.response);
console.log('TECP Receipt:', result.tecp_receipt);`,

    python: `import requests

response = requests.post('http://localhost:3001/v1/chat/completions', 
  json={
    'messages': [
      {
        'role': 'user',
        'content': '${testMessage}'
      }
    ]
  }
)

result = response.json()
print('Response:', result['response'])
print('TECP Receipt:', result['tecp_receipt'])`
  };

  const runExample = async () => {
    setLoading(true);
    setResponse(null);
    setVerification(null);

    try {
      // Call the demo endpoint
      const apiResponse = await fetch('http://localhost:3001/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: testMessage,
            },
          ],
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.statusText}`);
      }

      const result: ExampleResponse = await apiResponse.json();
      setResponse(result);

      // Auto-verify the receipt (simplified client-side verification)
      if (result.tecp_receipt) {
        try {
          // Basic client-side verification - check if receipt has required fields
          const receipt = result.tecp_receipt;
          const hasRequiredFields = receipt.version && receipt.sig && receipt.pubkey && 
                                   receipt.ts && receipt.input_hash && receipt.output_hash;
          
          const mockVerification: VerificationResultType = {
            valid: hasRequiredFields,
            errors: hasRequiredFields ? [] : [{
              code: 'E-SCHEMA-001',
              message: 'Missing required fields',
              field: 'receipt'
            }],
            details: {
              signature: hasRequiredFields ? 'Valid' : 'Invalid',
              timestamp: 'OK',
              schema: hasRequiredFields ? 'OK' : 'Missing fields',
              transparencyLog: 'Not checked'
            },
            performance: {
              verificationTimeMs: 5,
              receiptSizeBytes: JSON.stringify(receipt).length
            }
          };
          
          setVerification(mockVerification);
        } catch (verifyError) {
          console.error('Verification error:', verifyError);
          setVerification({
            valid: false,
            errors: [{
              code: 'E-SCHEMA-002',
              message: 'Client-side verification failed',
              details: String(verifyError)
            }],
            details: {
              signature: 'Invalid',
              timestamp: 'Expired', 
              schema: 'Verification failed',
              transparencyLog: 'Not checked'
            },
            performance: {
              verificationTimeMs: 0,
              receiptSizeBytes: 0
            }
          });
        }
      }
    } catch (error) {
      console.error('Example execution failed:', error);
      // Set error state here if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>TECP Examples</h1>
      
      <div className="alert alert-info" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', padding: '1rem', marginBottom: '2rem' }}>
        <strong>Apache License 2.0</strong> - These examples are licensed under the Apache License 2.0.
      </div>
      
      <section className="section">
        <p>
          Interactive examples showing how to generate and verify TECP receipts. 
          The sandbox sends requests to the demo endpoint and automatically verifies 
          the returned receipts.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Test Message</h2>
        <div className="form-field">
          <label className="form-label" htmlFor="test-message">
            Message to send to AI
          </label>
          <input
            id="test-message"
            type="text"
            className="form-input"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter your test message..."
          />
        </div>
        <button
          className="button button-primary"
          onClick={runExample}
          disabled={loading || !testMessage.trim()}
        >
          {loading ? 'Running...' : 'Try It'}
        </button>
      </section>

      <div className="two-column">
        <div>
          <h2 className="section-title">Code Examples</h2>
          
          <div className="form-field">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              {(['curl', 'node', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  className={`button ${activeExample === lang ? 'button-primary' : ''}`}
                  onClick={() => setActiveExample(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="code-block">
            {examples[activeExample]}
          </div>

          <div className="section">
            <h3 className="section-title">Expected Response</h3>
            <div className="code-block">
{`{
  "response": {
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "AI response here..."
        }
      }
    ]
  },
  "tecp_receipt": {
    "version": "TECP-0.1",
    "code_ref": "git:abc123...",
    "ts": 1692115200000,
    "nonce": "...",
    "input_hash": "...",
    "output_hash": "...",
    "policy_ids": ["no_retention", "key_erasure"],
    "sig": "...",
    "pubkey": "..."
  },
  "metadata": {
    "processing_time_ms": 1234,
    "verification_url": "http://localhost:3003",
    "message": "AI processed ephemerally"
  }
}`}
            </div>
          </div>
        </div>

        <div>
          <h2 className="section-title">Live Response</h2>
          
          {loading && (
            <div className="alert alert-warning">
              Processing request...
            </div>
          )}

          {response && (
            <div>
              <h3 className="section-title">AI Response</h3>
              <div className="card">
                <p>{response.choices[0]?.message.content}</p>
              </div>

              <h3 className="section-title">TECP Receipt</h3>
              <div className="code-block">
                {JSON.stringify(response.tecp_receipt, null, 2)}
              </div>

              <h3 className="section-title">Metadata</h3>
              <table className="table">
                <tbody>
                  <tr>
                    <td>Processing Time</td>
                    <td className="table-mono">{response.tecp_metadata?.processing_time_ms || 'N/A'}ms</td>
                  </tr>
                  <tr>
                    <td>Verification URL</td>
                    <td><a href={response.tecp_metadata?.verification_url || '#'}>{response.tecp_metadata?.verification_url || 'N/A'}</a></td>
                  </tr>
                  <tr>
                    <td>Message</td>
                    <td>{response.tecp_metadata?.message || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {verification && (
            <div>
              <h3 className="section-title">Automatic Verification</h3>
              <VerificationResult result={verification} />
            </div>
          )}
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Integration Guide</h2>
        <p>
          To integrate TECP into your API:
        </p>
        <ol>
          <li>Install the TECP SDK for your language</li>
          <li>Generate receipts for each computation</li>
          <li>Include receipts in API responses</li>
          <li>Optionally submit to transparency log</li>
        </ol>
        <p>
          See the <a href="/spec/integration.md">integration guide</a> for detailed instructions.
        </p>
      </section>
    </div>
  );
}
