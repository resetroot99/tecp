/*
 * TECP Reference UI - Enterprise Gateway Demo
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';
import { ReceiptViewer } from '../components/ReceiptViewer';
import { exportReceiptToPDF } from '../utils/pdfExport';

export function Gateway() {
  const [demoCode, setDemoCode] = useState('javascript');
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

      {/* Try It Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Try It Now</h2>
          <p className="text-gray-600">Test the gateway with a sample request and verify the cryptographic receipt</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sample Request */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Sample Gateway Request</h3>
              <p className="text-sm text-gray-600">Example API call with TECP policy enforcement</p>
            </div>
            <div className="p-6">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`curl -X POST https://gateway.tecp.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "x-tecp-api-key: demo-key" \\
  -H "x-tecp-policies: no_retention,hipaa_compliant,audit_trail" \\
  -H "x-tecp-user-id: doctor_123" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Analyze patient symptoms: fever, cough, fatigue"
      }
    ],
    "max_tokens": 500
  }'

# Response includes both OpenAI response AND TECP receipt:
{
  "id": "chatcmpl-123",
  "choices": [...],
  "usage": {...},
  "tecp_receipt": {
    "receipt_id": "rcpt_abc123def456",
    "input_hash": "sha256:a665a45920422f9d...",
    "output_hash": "sha256:b5d4045c3f466fa9...",
    "policy_ids": ["no_retention", "hipaa_compliant", "audit_trail"],
    "signature": "ed25519:304502210089abcdef...",
    "transparency_log_entry": "log_entry_xyz789"
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Receipt Viewer */}
          <div>
            <ReceiptViewer onReceiptVerified={handleReceiptVerified} />
            
            {/* Download Proof Button */}
            {currentReceipt && (
              <div className="mt-4">
                <button
                  onClick={handleDownloadProof}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Proof (PDF)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enterprise Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <a href="/gateway/healthcare" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare</h3>
          <p className="text-gray-600 text-sm mb-4">
            HIPAA-compliant AI processing with automatic PHI detection and cryptographic audit trails.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li>• HIPAA 164.312 compliance</li>
            <li>• Automatic PHI detection</li>
            <li>• Cryptographic receipts</li>
            <li>• Complete audit trails</li>
          </ul>
          <div className="text-blue-600 text-sm font-medium">
            Learn more about Healthcare Gateway →
          </div>
        </a>

        <a href="/gateway/finance" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-green-600 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Services</h3>
          <p className="text-gray-600 text-sm mb-4">
            SOX-compliant AI analysis with complete audit trails and data governance controls.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li>• SOX Section 404 compliance</li>
            <li>• Financial data protection</li>
            <li>• Regulatory reporting</li>
            <li>• Risk management controls</li>
          </ul>
          <div className="text-green-600 text-sm font-medium">
            Learn more about Finance Gateway →
          </div>
        </a>

        <a href="/gateway/legal" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-purple-600 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal</h3>
          <p className="text-gray-600 text-sm mb-4">
            Client-confidential AI processing with GDPR compliance and verifiable data handling.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li>• GDPR Article 17 compliance</li>
            <li>• Client confidentiality</li>
            <li>• Verifiable processing</li>
            <li>• Data sovereignty controls</li>
          </ul>
          <div className="text-purple-600 text-sm font-medium">
            Learn more about Legal Gateway →
          </div>
        </a>
      </div>

      {/* Deployment Options */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Enterprise Deployment</h2>
          <p className="text-sm text-gray-600">Production-ready deployment options with real configuration examples</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Docker Deployment */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Docker</h3>
                <p className="text-sm text-gray-600">Quick containerized deployment</p>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{`# Pull and run the gateway
docker run -d \\
  --name tecp-gateway \\
  -p 3001:3001 \\
  -e OPENAI_API_KEY=sk-... \\
  -e JWT_SECRET=your-secret-key \\
  -e POLICY_ENFORCEMENT_ENABLED=true \\
  -e TRANSPARENCY_LOG_URL=https://log.tecp.dev \\
  tecp/gateway:latest

# Check status
docker logs tecp-gateway`}</code>
                </pre>
              </div>
            </div>

            {/* Kubernetes Deployment */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Kubernetes</h3>
                <p className="text-sm text-gray-600">Scalable orchestration with Helm</p>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{`# Install with Helm
helm repo add tecp https://charts.tecp.dev
helm install tecp-gateway tecp/gateway \\
  --set openai.apiKey=sk-... \\
  --set gateway.replicas=3 \\
  --set ingress.enabled=true \\
  --set ingress.host=gateway.yourcompany.com

# Scale deployment
kubectl scale deployment tecp-gateway --replicas=5`}</code>
                </pre>
              </div>
            </div>

            {/* Fly.io Deployment */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Fly.io</h3>
                <p className="text-sm text-gray-600">Global edge deployment</p>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{`# Deploy to Fly.io
flyctl apps create tecp-gateway
flyctl secrets set OPENAI_API_KEY=sk-...
flyctl secrets set JWT_SECRET=your-secret-key
flyctl deploy

# Scale globally
flyctl scale count 3
flyctl regions add fra lax nrt`}</code>
                </pre>
              </div>
            </div>

            {/* On-Premise */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">On-Premise</h3>
                <p className="text-sm text-gray-600">Self-hosted with systemd</p>
              </div>
              <div className="p-4">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{`# Clone and build
git clone https://github.com/resetroot99/tecp.git
cd tecp/services/tecp-gateway
npm install && npm run build

# Create systemd service
sudo cp tecp-gateway.service /etc/systemd/system/
sudo systemctl enable tecp-gateway
sudo systemctl start tecp-gateway`}</code>
                </pre>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Deploy?</h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Get started with the open-source TECP Gateway or request an enterprise pilot program 
          with dedicated support and custom compliance configurations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/resetroot99/tecp"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Deploy Gateway (Open Source)
          </a>
          <a
            href="mailto:sudo@hxcode.xyz?subject=TECP Enterprise Pilot Request&body=Hi, I'm interested in piloting the TECP Enterprise Gateway for my organization."
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Request Enterprise Pilot
          </a>
        </div>
      </div>
    </div>
  );
}
