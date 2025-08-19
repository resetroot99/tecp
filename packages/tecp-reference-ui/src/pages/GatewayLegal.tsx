/*
 * TECP Reference UI - Gateway Legal Page
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';
import { ReceiptViewer } from '../components/ReceiptViewer';
import { exportReceiptToPDF } from '../utils/pdfExport';

export function GatewayLegal() {
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
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TECP Gateway for Legal Services</h1>
            <p className="text-purple-700 font-medium text-lg">GDPR-compliant AI processing with client confidentiality protection</p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Ensure your legal AI applications maintain client confidentiality and meet GDPR, CCPA, and 
            professional responsibility requirements with cryptographic proof of compliant data handling.
          </p>
        </div>
      </div>

      {/* Legal Compliance Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">GDPR Article 17 Compliance</h3>
          <p className="text-gray-600 text-sm mb-4">
            Right to erasure implementation with cryptographic proof of data deletion and non-retention.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Automatic data erasure after processing</li>
            <li>• Cryptographic proof of deletion</li>
            <li>• Data subject rights enforcement</li>
            <li>• Cross-border transfer controls</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Confidentiality</h3>
          <p className="text-gray-600 text-sm mb-4">
            Attorney-client privilege protection with advanced confidentiality controls and audit trails.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Attorney-client privilege detection</li>
            <li>• Confidential information protection</li>
            <li>• Professional responsibility compliance</li>
            <li>• Ethical wall enforcement</li>
          </ul>
        </div>
      </div>

      {/* Legal Use Cases */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Legal Use Cases</h2>
          <p className="text-sm text-gray-600">AI applications with built-in confidentiality and compliance</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Contract Analysis</h4>
              <p className="text-sm text-gray-600 mb-3">
                AI-powered contract review with client confidentiality protection and GDPR compliance.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> gdpr_compliant, client_confidential, no_retention, eu_region
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Legal Research</h4>
              <p className="text-sm text-gray-600 mb-3">
                Confidential legal research with privilege protection and data sovereignty controls.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> attorney_client_privilege, no_cross_border, audit_trail
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Document Review</h4>
              <p className="text-sm text-gray-600 mb-3">
                Large-scale document review with privilege detection and confidentiality controls.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> privilege_detection, confidential_handling, work_product_protection
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Integration Example */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Legal Services Integration</h2>
          <p className="text-gray-600">GDPR-compliant legal AI with client confidentiality protection</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Legal Request Example */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Contract Analysis Request</h3>
              <p className="text-sm text-gray-600">Example with GDPR policies and confidentiality protection</p>
            </div>
            <div className="p-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`curl -X POST https://gateway.tecp.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "x-tecp-api-key: legal-demo-key" \\
  -H "x-tecp-policies: gdpr_compliant,client_confidential,no_retention,eu_region" \\
  -H "x-tecp-user-id: attorney_smith_esq" \\
  -H "x-tecp-session-id: contract_review_abc123" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are a legal AI assistant. Analyze contracts for key terms and potential issues while maintaining strict confidentiality."
      },
      {
        "role": "user",
        "content": "Review this confidential employment agreement for Client XYZ Corp. Identify key terms, potential issues, and compliance concerns with EU employment law."
      }
    ],
    "max_tokens": 800
  }'

# Response includes GDPR compliance verification:
{
  "choices": [...],
  "tecp_receipt": {
    "policy_ids": ["gdpr_compliant", "client_confidential", "no_retention", "eu_region"],
    "compliance_tags": ["GDPR-Art17", "GDPR-Art44", "GDPR-Art6"],
    "confidential_data_detected": true,
    "data_sovereignty": "EU",
    "privilege_protected": true
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Receipt Viewer */}
          <div>
            <ReceiptViewer onReceiptVerified={handleReceiptVerified} />
            
            {/* Download GDPR Compliance Proof */}
            {currentReceipt && (
              <div className="mt-4">
                <button
                  onClick={handleDownloadProof}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download GDPR Compliance Proof
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Mapping */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Legal Compliance Mapping</h2>
          <p className="text-sm text-gray-600">How TECP policies map to legal and privacy regulations</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-purple-600">gdpr_compliant</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">GDPR Article</h4>
                <span className="text-sm text-gray-700">Article 17 - Right to Erasure</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Automatic data deletion with cryptographic proof</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-purple-600">client_confidential</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Professional Rule</h4>
                <span className="text-sm text-gray-700">Model Rule 1.6 - Confidentiality</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Attorney-client privilege protection</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-purple-600">eu_region</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">GDPR Article</h4>
                <span className="text-sm text-gray-700">Article 44 - General Principle for Transfers</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Data sovereignty and cross-border controls</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-purple-600">work_product_protection</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Professional Rule</h4>
                <span className="text-sm text-gray-700">Work Product Doctrine</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Legal work product confidentiality</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready for Confidential Legal AI?</h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Deploy the TECP Gateway in your legal practice and ensure all AI processing maintains 
          client confidentiality and meets GDPR, CCPA, and professional responsibility requirements.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/resetroot99/tecp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Deploy Legal Gateway
          </a>
          <a
            href="mailto:sudo@hxcode.xyz?subject=TECP Legal Services Pilot Request&body=Hi, I'm interested in piloting the TECP Gateway for GDPR-compliant and confidential AI in our legal practice."
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Request Legal Pilot
          </a>
        </div>
      </div>
    </div>
  );
}
