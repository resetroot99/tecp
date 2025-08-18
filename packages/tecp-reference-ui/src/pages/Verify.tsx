import React, { useState } from 'react';
import { VerificationResult } from '../components/VerificationResult';
import { type Receipt, type VerificationResult as VerificationResultType } from '../types/verification';

type InputMethod = 'paste' | 'file' | 'url';

export function Verify() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('paste');
  const [receiptText, setReceiptText] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [result, setResult] = useState<VerificationResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [requireLog, setRequireLog] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setReceiptText(content);
      };
      reader.readAsText(file);
    }
  };

  const fetchReceiptFromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch receipt: ${response.statusText}`);
    }
    return response.text();
  };

  const verifyReceipt = async () => {
    setLoading(true);
    setResult(null);

    try {
      let receiptData: string;
      
      if (inputMethod === 'url') {
        receiptData = await fetchReceiptFromUrl(receiptUrl);
      } else {
        receiptData = receiptText;
      }

      // Parse JSON
      let receipt: Receipt;
      try {
        receipt = JSON.parse(receiptData);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }

      // Verify with API
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt,
          options: {
            requireLog,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Verification API error: ${response.statusText}`);
      }

      const verificationResult: VerificationResultType = await response.json();
      setResult(verificationResult);

    } catch (error) {
      // Create error result
      setResult({
        valid: false,
        errors: [{
          code: 'E-SCHEMA-001',
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
        details: {
          signature: 'Invalid',
          timestamp: 'OK',
          schema: 'Parse error',
          transparencyLog: 'Not checked',
        },
        performance: {
          verificationTimeMs: 0,
          receiptSizeBytes: receiptText?.length || 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCliCommand = (): string => {
    const flags = requireLog ? ' --require-log' : '';
    if (inputMethod === 'url') {
      return `tecp verify --url "${receiptUrl}"${flags}`;
    } else {
      return `tecp verify receipt.json${flags}`;
    }
  };

  return (
        <div>
      <h1>TECP Receipt Verifier</h1>
      
      <div className="alert alert-info" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', padding: '1rem', marginBottom: '2rem' }}>
        <strong>Apache License 2.0</strong> - This verifier is licensed under the Apache License 2.0.
      </div>

      <section className="section">
        <p>
          Verify TECP receipts by pasting JSON, uploading files, or fetching from URLs. 
          Verification validates cryptographic signatures, timestamp bounds, schema compliance, 
          and optional transparency log inclusion.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Input Method</h2>
        <div className="form-field">
          <label className="form-label">
            <input
              type="radio"
              name="inputMethod"
              value="paste"
              checked={inputMethod === 'paste'}
              onChange={(e) => setInputMethod(e.target.value as InputMethod)}
            />
            Paste JSON
          </label>
        </div>
        <div className="form-field">
          <label className="form-label">
            <input
              type="radio"
              name="inputMethod"
              value="file"
              checked={inputMethod === 'file'}
              onChange={(e) => setInputMethod(e.target.value as InputMethod)}
            />
            Upload File
          </label>
        </div>
        <div className="form-field">
          <label className="form-label">
            <input
              type="radio"
              name="inputMethod"
              value="url"
              checked={inputMethod === 'url'}
              onChange={(e) => setInputMethod(e.target.value as InputMethod)}
            />
            Fetch from URL
          </label>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Receipt Input</h2>
        
        {inputMethod === 'paste' && (
          <div className="form-field">
            <label className="form-label" htmlFor="receipt-text">
              Receipt JSON
            </label>
            <textarea
              id="receipt-text"
              className="form-textarea"
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder="Paste TECP receipt JSON here..."
            />
          </div>
        )}

        {inputMethod === 'file' && (
          <div className="form-field">
            <label className="form-label" htmlFor="receipt-file">
              Receipt File (.json)
            </label>
            <div className="form-file">
              <input
                id="receipt-file"
                type="file"
                accept=".json,.cbor"
                onChange={handleFileUpload}
              />
              <p>Drop file here or click to browse</p>
            </div>
          </div>
        )}

        {inputMethod === 'url' && (
          <div className="form-field">
            <label className="form-label" htmlFor="receipt-url">
              Receipt URL
            </label>
            <input
              id="receipt-url"
              type="url"
              className="form-input"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://example.com/receipt.json"
            />
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Verification Options</h2>
        <div className="form-field">
          <label className="form-label">
            <input
              type="checkbox"
              checked={requireLog}
              onChange={(e) => setRequireLog(e.target.checked)}
            />
            Require transparency log inclusion
          </label>
        </div>
      </section>

      <section className="section">
        <button
          className="button button-primary"
          onClick={verifyReceipt}
          disabled={loading || (!receiptText && inputMethod !== 'url') || (!receiptUrl && inputMethod === 'url')}
        >
          {loading ? 'Verifying...' : 'Verify Receipt'}
        </button>
      </section>

      {result && (
        <section className="section">
          <h2 className="section-title">Verification Result</h2>
          <VerificationResult result={result} cliCommand={generateCliCommand()} />
        </section>
      )}
    </div>
  );
}
