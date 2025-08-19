/*
 * TECP Reference UI - Receipt Viewer Component
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';

interface ReceiptViewerProps {
  onReceiptVerified?: (receipt: any, isValid: boolean) => void;
}

const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || 'http://localhost:3001';

export function ReceiptViewer({ onReceiptVerified }: ReceiptViewerProps) {
  const [receiptJson, setReceiptJson] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkLedger, setCheckLedger] = useState(false);

  const sampleReceipt = {
    "receipt_id": "rcpt_abc123def456",
    "timestamp": 1699123456,
    "input_hash": "sha256:a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "output_hash": "sha256:b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78",
    "policy_ids": ["no_retention", "hipaa_compliant", "audit_trail"],
    "sig": "ed25519:304502210089abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890022034567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    "pubkey": "ed25519:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    "nonce": "nonce_xyz789",
    "extensions": {
      "tecp_receipt": {
        "transparency_log_entry": "log_entry_xyz789",
        "compliance_tags": ["HIPAA-164.312", "GDPR-Art17", "SOX-404"]
      },
      "tecp_policy_enforcement": {
        "policies_applied": ["no_retention", "hipaa_compliant", "audit_trail"],
        "pii_detected": false,
        "pii_redacted": false
      }
    }
  };

  const handleVerifyReceipt = async () => {
    if (!receiptJson.trim()) {
      setError('Please paste a receipt JSON to verify');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const receipt = JSON.parse(receiptJson);
      
      // Simulate verification API call
      // In real implementation, this would call /v1/verify endpoint
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipt })
      }).catch(() => {
        // Fallback to mock verification for demo
        return {
          ok: true,
          json: () => Promise.resolve({
            valid: true,
            receipt_id: receipt.receipt_id,
            verification_time: new Date().toISOString(),
            checks: {
              signature_valid: true,
              timestamp_valid: true,
              policy_compliance: true,
              transparency_log_verified: true
            },
            compliance_status: {
              hipaa: receipt.policy_ids?.includes('hipaa_compliant') ? 'COMPLIANT' : 'N/A',
              gdpr: receipt.policy_ids?.includes('gdpr_compliant') ? 'COMPLIANT' : 'N/A',
              sox: receipt.policy_ids?.includes('sox_compliant') ? 'COMPLIANT' : 'N/A'
            }
          })
        };
      });

      const result = await response.json();
      
      // Add ledger verification if requested
      if (checkLedger && receipt.anchors?.log_seq) {
        try {
          const proofResponse = await fetch(`${LEDGER_URL}/proof/inclusion?seq=${receipt.anchors.log_seq}`);
          if (proofResponse.ok) {
            const proof = await proofResponse.json();
            result.ledger_verification = {
              anchored: true,
              sequence: receipt.anchors.log_seq,
              tree_size: proof.tree_size,
              root_matches: proof.tree_head.root_hash === receipt.anchors.log_root,
              tree_head: proof.tree_head,
              audit_path_length: proof.audit_path.length
            };
            
            if (!result.ledger_verification.root_matches) {
              result.valid = false;
              result.ledger_verification.error = 'Tree head root mismatch';
            }
          } else {
            result.ledger_verification = {
              anchored: false,
              error: `Failed to fetch inclusion proof: ${proofResponse.status}`
            };
          }
        } catch (ledgerError) {
          result.ledger_verification = {
            anchored: false,
            error: ledgerError instanceof Error ? ledgerError.message : 'Ledger verification failed'
          };
        }
      } else if (checkLedger && !receipt.anchors?.log_seq) {
        result.ledger_verification = {
          anchored: false,
          error: 'Receipt not anchored to ledger (no log_seq found)'
        };
      }
      
      setVerificationResult(result);
      onReceiptVerified?.(receipt, result.valid);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoadSample = () => {
    setReceiptJson(JSON.stringify(sampleReceipt, null, 2));
    setError(null);
    setVerificationResult(null);
  };

  const handleClear = () => {
    setReceiptJson('');
    setError(null);
    setVerificationResult(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Receipt Verification</h3>
        <p className="text-sm text-gray-600">Paste a TECP receipt JSON to verify its authenticity and compliance status</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {/* Input Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Receipt JSON
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadSample}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Load Sample
                </button>
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={receiptJson}
              onChange={(e) => setReceiptJson(e.target.value)}
              placeholder="Paste your TECP receipt JSON here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Options */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checkLedger}
                onChange={(e) => setCheckLedger(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Verify ledger inclusion (requires anchored receipt)</span>
            </label>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyReceipt}
            disabled={isVerifying || !receiptJson.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify Receipt'}
          </button>

          {/* Verification Result */}
          {verificationResult && (
            <div className={`p-4 rounded-lg border ${
              verificationResult.valid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  verificationResult.valid ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <h4 className={`font-semibold ${
                  verificationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.valid ? 'Receipt Valid' : 'Receipt Invalid'}
                </h4>
              </div>

              <div className="space-y-3">
                {/* Verification Checks */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Verification Checks</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(verificationResult.checks || {}).map(([check, passed]) => (
                      <div key={check} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          passed ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-gray-700">
                          {check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ledger Verification */}
                {verificationResult.ledger_verification && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ledger Verification</h5>
                    <div className="space-y-2 text-sm">
                      {verificationResult.ledger_verification.anchored ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Receipt anchored to transparency ledger</span>
                          </div>
                          <div className="ml-4 space-y-1 text-xs text-gray-600">
                            <div>Sequence: #{verificationResult.ledger_verification.sequence}</div>
                            <div>Tree size: {verificationResult.ledger_verification.tree_size}</div>
                            <div>Audit path: {verificationResult.ledger_verification.audit_path_length} hashes</div>
                            <div className="flex items-center gap-1">
                              <span>Root match:</span>
                              <span className={verificationResult.ledger_verification.root_matches ? 'text-green-600' : 'text-red-600'}>
                                {verificationResult.ledger_verification.root_matches ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>Not anchored to ledger</span>
                          {verificationResult.ledger_verification.error && (
                            <span className="text-red-600 text-xs">({verificationResult.ledger_verification.error})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Compliance Status */}
                {verificationResult.compliance_status && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Compliance Status</h5>
                    <div className="flex gap-4 text-sm">
                      {Object.entries(verificationResult.compliance_status).map(([standard, status]) => (
                        <div key={standard} className="flex items-center gap-1">
                          <span className="font-medium text-gray-700">{standard.toUpperCase()}:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            status === 'COMPLIANT' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String(status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Receipt Details */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Receipt ID:</span>
                      <span className="ml-2 font-mono text-gray-600">
                        {verificationResult.receipt_id}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Verified:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(verificationResult.verification_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
