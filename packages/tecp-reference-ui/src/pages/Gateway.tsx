/*
 * TECP Reference UI - Enterprise Gateway Demo
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';

export function Gateway() {
  const [demoCode, setDemoCode] = useState('javascript');

  const codeExamples = {
    javascript: `// Zero-code integration - just change the base URL!
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://gateway.tecp.dev/v1',  // TECP Gateway
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'x-tecp-api-key': 'your-tecp-key',
    'x-tecp-policies': 'no_retention,hipaa_compliant,audit_trail',
    'x-tecp-user-id': 'doctor_123',
    'x-tecp-session-id': 'patient_consultation_456'
  }
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'user',
    content: 'Analyze this patient chart for risk factors...'
  }]
});

// Same response format, but now with cryptographic receipts!
console.log(response.tecp_receipt);
// {
//   receipt_id: "rcpt_abc123",
//   input_hash: "sha256:...",
//   output_hash: "sha256:...",
//   policy_ids: ["no_retention", "hipaa_compliant", "audit_trail"],
//   signature: "ed25519:...",
//   transparency_log_entry: "log_xyz789"
// }`,

    python: `# Python example with TECP Gateway
import openai

# Configure OpenAI client to use TECP Gateway
openai.api_base = "https://gateway.tecp.dev/v1"
openai.api_key = "your-openai-key"

# TECP-specific headers
headers = {
    "x-tecp-api-key": "your-tecp-key",
    "x-tecp-policies": "no_retention,gdpr_compliant,audit_trail",
    "x-tecp-user-id": "analyst_456",
    "x-tecp-session-id": "financial_analysis_789"
}

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{
        "role": "user", 
        "content": "Analyze this financial data for compliance..."
    }],
    headers=headers
)

# Response includes cryptographic proof of compliance
print(f"Receipt ID: {response['tecp_receipt']['receipt_id']}")
print(f"Policies Applied: {response['tecp_policy_enforcement']['policies_applied']}")
print(f"Compliance Tags: {response['tecp_policy_enforcement']['compliance_tags']}")`,

    curl: `# Direct API call with TECP Gateway
curl -X POST https://gateway.tecp.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "x-tecp-api-key: your-tecp-key" \\
  -H "x-tecp-policies: no_retention,no_pii,sox_compliant" \\
  -H "x-tecp-user-id: legal_team_123" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Review this contract for compliance issues..."
      }
    ],
    "max_tokens": 1000
  }'

# Response includes TECP receipt proving:
# - No client data was retained
# - PII was detected and handled appropriately
# - SOX compliance policies were enforced
# - Complete audit trail is available`
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TECP Enterprise Gateway</h1>
            <p className="text-blue-700 font-medium text-lg">Transform any LLM API into a compliance-grade service</p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Drop-in replacement for OpenAI/Anthropic APIs with automatic policy enforcement, 
            PII detection, and cryptographic receipts. Zero code changes required.
          </p>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Transparent Proxy</h3>
          <p className="text-gray-600 text-sm mb-4">
            Drop-in replacement for OpenAI and Anthropic APIs. No code changes required - just update your base URL.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• OpenAI GPT-4, GPT-3.5 support</li>
            <li>• Anthropic Claude support</li>
            <li>• Format conversion handled automatically</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Policy Enforcement</h3>
          <p className="text-gray-600 text-sm mb-4">
            Automatic application of privacy policies with runtime validation and cryptographic receipts.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Real-time policy validation</li>
            <li>• Cryptographic receipt generation</li>
            <li>• Transparency log integration</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">PII Protection</h3>
          <p className="text-gray-600 text-sm mb-4">
            Automatic detection of sensitive data with optional redaction before processing.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Email, phone, SSN detection</li>
            <li>• Medical ID recognition</li>
            <li>• Configurable redaction rules</li>
          </ul>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Zero-Code Integration</h2>
          <p className="text-sm text-gray-600">Drop-in replacement for existing LLM APIs</p>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            {Object.keys(codeExamples).map((lang) => (
              <button
                key={lang}
                onClick={() => setDemoCode(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  demoCode === lang
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{codeExamples[demoCode as keyof typeof codeExamples]}</code>
          </pre>
        </div>
      </div>

      {/* Enterprise Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare</h3>
          <p className="text-gray-600 text-sm mb-4">
            HIPAA-compliant AI processing with automatic PII detection and cryptographic audit trails.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• HIPAA 164.312 compliance</li>
            <li>• Automatic PHI detection</li>
            <li>• Cryptographic receipts</li>
            <li>• Complete audit trails</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-green-600 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Services</h3>
          <p className="text-gray-600 text-sm mb-4">
            SOX-compliant AI analysis with complete audit trails and data governance controls.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• SOX Section 404 compliance</li>
            <li>• Financial data protection</li>
            <li>• Regulatory reporting</li>
            <li>• Risk management controls</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-purple-600 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal</h3>
          <p className="text-gray-600 text-sm mb-4">
            Client-confidential AI processing with GDPR compliance and verifiable data handling.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• GDPR Article 17 compliance</li>
            <li>• Client confidentiality</li>
            <li>• Verifiable processing</li>
            <li>• Data sovereignty controls</li>
          </ul>
        </div>
      </div>

      {/* Deployment Options */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enterprise Deployment</h2>
          <p className="text-sm text-gray-600">Multiple deployment options for your infrastructure</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Docker</h3>
              <p className="text-sm text-gray-600">Containerized deployment</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Kubernetes</h3>
              <p className="text-sm text-gray-600">Scalable orchestration</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">On-Premise</h3>
              <p className="text-sm text-gray-600">Full data control</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cloud VPC</h3>
              <p className="text-sm text-gray-600">Isolated cloud deployment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
