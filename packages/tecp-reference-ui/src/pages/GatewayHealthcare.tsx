/*
 * TECP Reference UI - Gateway Healthcare Page
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';
import { ReceiptViewer } from '../components/ReceiptViewer';
import { exportReceiptToPDF } from '../utils/pdfExport';

export function GatewayHealthcare() {
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TECP Gateway for Healthcare</h1>
            <p className="text-blue-700 font-medium text-lg">HIPAA-compliant AI processing with cryptographic audit trails</p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Transform your healthcare AI applications into HIPAA-compliant services with automatic PHI detection, 
            policy enforcement, and cryptographic receipts proving compliant data handling.
          </p>
        </div>
      </div>

      {/* HIPAA Compliance Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">HIPAA 164.312 Compliance</h3>
          <p className="text-gray-600 text-sm mb-4">
            Automatic enforcement of HIPAA security standards with cryptographic proof of compliance.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Access control and user authentication</li>
            <li>• Automatic audit logs and controls</li>
            <li>• Data integrity and transmission security</li>
            <li>• Person or entity authentication</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">PHI Protection</h3>
          <p className="text-gray-600 text-sm mb-4">
            Advanced detection and handling of Protected Health Information with configurable policies.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Medical record number detection</li>
            <li>• Patient identifier recognition</li>
            <li>• Optional PHI redaction before processing</li>
            <li>• Cryptographic proof of data handling</li>
          </ul>
        </div>
      </div>

      {/* Healthcare Use Cases */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Healthcare Use Cases</h2>
          <p className="text-sm text-gray-600">Real-world applications with HIPAA compliance built-in</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Clinical Documentation</h4>
              <p className="text-sm text-gray-600 mb-3">
                AI-assisted clinical note generation with automatic PHI protection and audit trails.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> hipaa_compliant, no_retention, audit_trail, phi_detection
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Medical Coding</h4>
              <p className="text-sm text-gray-600 mb-3">
                Automated ICD-10 and CPT coding with compliance verification and receipt generation.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> hipaa_compliant, no_export_phi, encryption_required
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Patient Communication</h4>
              <p className="text-sm text-gray-600 mb-3">
                AI-powered patient communication tools with built-in privacy safeguards.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Policies:</strong> hipaa_compliant, patient_consent_verified, audit_trail
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Healthcare-Specific Integration */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Healthcare Integration Example</h2>
          <p className="text-gray-600">HIPAA-compliant clinical AI with automatic PHI protection</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Healthcare Request Example */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Clinical AI Request</h3>
              <p className="text-sm text-gray-600">Example with HIPAA policies and PHI detection</p>
            </div>
            <div className="p-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`curl -X POST https://gateway.tecp.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "x-tecp-api-key: healthcare-demo-key" \\
  -H "x-tecp-policies: hipaa_compliant,no_retention,phi_detection,audit_trail" \\
  -H "x-tecp-user-id: dr_smith_12345" \\
  -H "x-tecp-session-id: patient_consult_67890" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are a clinical AI assistant. Analyze symptoms and suggest differential diagnoses."
      },
      {
        "role": "user",
        "content": "Patient John Doe (MRN: 123456) presents with: fever 101.5°F, persistent cough, fatigue, loss of taste. Duration: 5 days."
      }
    ],
    "max_tokens": 500
  }'

# Response includes HIPAA compliance verification:
{
  "choices": [...],
  "tecp_receipt": {
    "policy_ids": ["hipaa_compliant", "no_retention", "phi_detection", "audit_trail"],
    "compliance_tags": ["HIPAA-164.312", "HIPAA-164.514"],
    "phi_detected": true,
    "phi_redacted": false,
    "audit_trail_id": "audit_healthcare_67890"
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Receipt Viewer */}
          <div>
            <ReceiptViewer onReceiptVerified={handleReceiptVerified} />
            
            {/* Download HIPAA Compliance Proof */}
            {currentReceipt && (
              <div className="mt-4">
                <button
                  onClick={handleDownloadProof}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download HIPAA Compliance Proof
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Mapping */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">HIPAA Compliance Mapping</h2>
          <p className="text-sm text-gray-600">How TECP policies map to specific HIPAA requirements</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-blue-600">hipaa_compliant</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">HIPAA Section</h4>
                <span className="text-sm text-gray-700">164.312(a)(1) - Access Control</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">User authentication and authorization</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-blue-600">phi_detection</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">HIPAA Section</h4>
                <span className="text-sm text-gray-700">164.514 - De-identification</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Automatic PHI detection and handling</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">TECP Policy</h4>
                <code className="text-sm text-blue-600">audit_trail</code>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">HIPAA Section</h4>
                <span className="text-sm text-gray-700">164.312(b) - Audit Controls</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Implementation</h4>
                <span className="text-sm text-gray-700">Comprehensive audit logging with receipts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready for HIPAA-Compliant AI?</h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Deploy the TECP Gateway in your healthcare environment and ensure all AI processing 
          meets HIPAA requirements with cryptographic proof of compliance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/resetroot99/tecp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Deploy Healthcare Gateway
          </a>
          <a
            href="mailto:sudo@hxcode.xyz?subject=TECP Healthcare Pilot Request&body=Hi, I'm interested in piloting the TECP Gateway for HIPAA-compliant AI in our healthcare organization."
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Request Healthcare Pilot
          </a>
        </div>
      </div>
    </div>
  );
}
