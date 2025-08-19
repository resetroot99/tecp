/*
 * TECP Reference UI - Gateway Finance Page
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';
import { ReceiptViewer } from '../components/ReceiptViewer';
import { exportReceiptToPDF } from '../utils/pdfExport';

export function GatewayFinance() {
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [currentVerification, setCurrentVerification] = useState<any>(null);

  const handleReceiptVerified = (receipt: any, verification: any) => {
    setCurrentReceipt(receipt);
    setCurrentVerification(verification);
  };

  const handleDownloadProof = () => {
    if (currentReceipt) {
      exportReceiptToPDF(currentReceipt, currentVerification);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TECP Gateway for Financial Services</h1>
            <p className="text-green-700 font-medium text-lg">SOX and PCI-compliant AI processing with regulatory audit trails</p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Ensure your financial AI applications meet SOX, PCI DSS, and regulatory requirements with 
            automatic compliance enforcement and cryptographic proof of data governance.
          </p>
        </div>
      </div>

      {/* Financial Compliance Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">SOX Section 404 Compliance</h3>
          <p className="text-gray-600 text-sm mb-4">
            Automated controls and audit trails for financial reporting and data processing compliance.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Internal control documentation</li>
            <li>• Automated audit trail generation</li>
            <li>• Data integrity verification</li>
            <li>• Management assessment support</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">PCI DSS Protection</h3>
          <p className="text-gray-600 text-sm mb-4">
            Advanced detection and protection of payment card data with cryptographic verification.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Credit card number detection</li>
            <li>• Payment data encryption</li>
            <li>• Access control and monitoring</li>
            <li>• Compliance reporting automation</li>
          </ul>
        </div>
      </div>

      {/* Financial Use Cases */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Financial Use Cases</h2>
          <p className="text-sm text-gray-600">AI applications with built-in regulatory compliance</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Risk Analysis</h4>
              <p className="text-sm text-gray-600 mb-3">
                AI-powered risk assessment with SOX-compliant audit trails and data governance.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> sox_compliant, no_retention, audit_trail, encryption_required
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Fraud Detection</h4>
              <p className="text-sm text-gray-600 mb-3">
                Real-time fraud analysis with PCI DSS compliance and payment data protection.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> pci_compliant, payment_data_protection, real_time_monitoring
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Regulatory Reporting</h4>
              <p className="text-sm text-gray-600 mb-3">
                Automated compliance reporting with cryptographic proof of data accuracy.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> sox_compliant, data_integrity, regulatory_reporting
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Integration Example */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Financial Services Integration</h2>
          <p className="text-gray-600">SOX-compliant financial analysis with automatic data protection</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Request Example */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Risk Analysis Request</h3>
              <p className="text-sm text-gray-600">Example with SOX policies and financial data protection</p>
            </div>
            <div className="p-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`curl -X POST https://gateway.tecp.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "x-tecp-api-key: finance-demo-key" \\
  -H "x-tecp-policies: sox_compliant,no_retention,financial_data_protection,audit_trail" \\
  -H "x-tecp-user-id: analyst_jane_doe" \\
  -H "x-tecp-session-id: risk_analysis_2024_q1" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are a financial risk analyst. Analyze portfolio data and provide risk assessments."
      },
      {
        "role": "user",
        "content": "Analyze risk profile for portfolio: Tech stocks 45%, Bonds 30%, Real Estate 15%, Cash 10%. Market volatility: High. Economic indicators: Mixed."
      }
    ],
    "max_tokens": 500
  }'

# Response includes SOX compliance verification:
{
  "choices": [...],
  "tecp_receipt": {
    "policy_ids": ["sox_compliant", "no_retention", "financial_data_protection", "audit_trail"],
    "compliance_tags": ["SOX-404", "SOX-302", "FINRA-4511"],
    "financial_data_detected": true,
    "audit_trail_id": "audit_finance_2024_q1_001"
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Receipt Viewer */}
          <div>
            <ReceiptViewer onReceiptVerified={handleReceiptVerified} />
            
            {/* Download SOX Compliance Proof */}
            {currentReceipt && (
              <div className="mt-4">
                <button
                  onClick={handleDownloadProof}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download SOX Compliance Proof
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Mapping */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Financial Compliance Mapping</h2>
          <p className="text-sm text-gray-600">How TECP policies map to financial regulatory requirements</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-green-600">sox_compliant</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">SOX Section</h4>
                <span className="text-sm text-gray-700">Section 404 - Internal Controls</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Automated control documentation and testing</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-green-600">pci_compliant</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">PCI DSS Requirement</h4>
                <span className="text-sm text-gray-700">Requirement 3 - Protect Stored Data</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Payment data encryption and tokenization</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-green-600">financial_data_protection</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Regulation</h4>
                <span className="text-sm text-gray-700">FINRA Rule 4511 - Books and Records</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Comprehensive audit trails and data retention</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-green-600">regulatory_reporting</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Regulation</h4>
                <span className="text-sm text-gray-700">SEC Rule 17a-4 - Record Preservation</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Immutable audit records with cryptographic proof</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready for Compliant Financial AI?</h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Deploy the TECP Gateway in your financial services environment and ensure all AI processing 
          meets SOX, PCI DSS, and regulatory requirements with cryptographic proof of compliance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/resetroot99/tecp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Deploy Financial Gateway
          </a>
          <a
            href="mailto:sudo@hxcode.xyz?subject=TECP Financial Services Pilot Request&body=Hi, I'm interested in piloting the TECP Gateway for SOX and PCI-compliant AI in our financial services organization."
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Request Financial Pilot
          </a>
        </div>
      </div>
    </div>
  );
}
