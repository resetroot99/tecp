/*
 * TECP Reference UI - Enterprise Gateway Demo
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import { useState, useEffect } from 'react';

interface GatewayMetrics {
  uptime: number;
  requests_processed: number;
  receipts_generated: number;
  policies_enforced: number;
  pii_detections: number;
  avg_response_time: number;
}

interface LiveRequest {
  id: string;
  timestamp: string;
  model: string;
  policies: string[];
  status: 'processing' | 'completed' | 'failed';
  response_time?: number;
  receipt_id?: string;
  pii_detected?: boolean;
}

export function Gateway() {
  const [metrics, setMetrics] = useState<GatewayMetrics>({
    uptime: 0,
    requests_processed: 1247,
    receipts_generated: 1247,
    policies_enforced: 3741,
    pii_detections: 23,
    avg_response_time: 1.2
  });

  const [liveRequests] = useState<LiveRequest[]>([
    {
      id: 'req_abc123',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      model: 'gpt-4',
      policies: ['no_retention', 'hipaa_compliant', 'audit_trail'],
      status: 'completed',
      response_time: 1.8,
      receipt_id: 'rcpt_xyz789',
      pii_detected: false
    },
    {
      id: 'req_def456',
      timestamp: new Date(Date.now() - 5000).toISOString(),
      model: 'claude-3-opus',
      policies: ['no_pii', 'eu_region', 'gdpr_compliant'],
      status: 'completed',
      response_time: 2.1,
      receipt_id: 'rcpt_abc456',
      pii_detected: true
    },
    {
      id: 'req_ghi789',
      timestamp: new Date().toISOString(),
      model: 'gpt-3.5-turbo',
      policies: ['no_retention', 'audit_trail'],
      status: 'processing'
    }
  ]);

  const [demoCode, setDemoCode] = useState('javascript');

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        requests_processed: prev.requests_processed + Math.floor(Math.random() * 3),
        receipts_generated: prev.receipts_generated + Math.floor(Math.random() * 3),
        avg_response_time: 1.0 + Math.random() * 1.5
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🚀</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TECP Enterprise Gateway</h1>
              <p className="text-blue-700 font-medium">Transform any LLM API into a compliance-grade service</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Drop-in replacement for OpenAI/Anthropic APIs with automatic policy enforcement, 
            PII detection, and cryptographic receipts. Zero code changes required.
          </p>
        </div>
      </div>

      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Requests Processed</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.requests_processed.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">📊</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">↗ +{Math.floor(Math.random() * 10 + 5)}% from last hour</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receipts Generated</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.receipts_generated.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">🔐</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">100% receipt coverage</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avg_response_time.toFixed(1)}s</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⚡</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">↘ -12% latency improvement</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">PII Detections</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.pii_detections}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">🛡️</span>
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2">Automatically handled</p>
        </div>
      </div>

      {/* Live Request Stream */}
      <div className="bg-white border border-gray-200 rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Live Request Stream</h2>
          <p className="text-sm text-gray-600">Real-time view of requests flowing through the gateway</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {liveRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    request.status === 'completed' ? 'bg-green-500' :
                    request.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{request.model}</p>
                    <p className="text-sm text-gray-600">{new Date(request.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {request.policies.join(', ')}
                    </p>
                    {request.response_time && (
                      <p className="text-xs text-gray-600">{request.response_time}s</p>
                    )}
                  </div>
                  {request.pii_detected && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      PII Detected
                    </span>
                  )}
                  {request.receipt_id && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Receipt: {request.receipt_id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
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

      {/* Enterprise Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-blue-600 text-xl">🏥</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare</h3>
          <p className="text-gray-600 text-sm mb-4">
            HIPAA-compliant AI processing with automatic PII detection and cryptographic audit trails.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">HIPAA 164.312 compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Automatic PHI detection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Cryptographic receipts</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-green-600 text-xl">🏦</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Services</h3>
          <p className="text-gray-600 text-sm mb-4">
            SOX-compliant AI analysis with complete audit trails and data governance controls.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">SOX Section 404 compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Financial data protection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Regulatory reporting</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-purple-600 text-xl">⚖️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal</h3>
          <p className="text-gray-600 text-sm mb-4">
            Client-confidential AI processing with GDPR compliance and verifiable data handling.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">GDPR Article 17 compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Client confidentiality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Verifiable processing</span>
            </div>
          </div>
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
                <span className="text-blue-600 text-xl">🐳</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Docker</h3>
              <p className="text-sm text-gray-600">Containerized deployment</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">☸️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Kubernetes</h3>
              <p className="text-sm text-gray-600">Scalable orchestration</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 text-xl">🏢</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">On-Premise</h3>
              <p className="text-sm text-gray-600">Full data control</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 text-xl">☁️</span>
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
