/*
 * TECP Reference UI - SDK Documentation
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */



export function SDK() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TECP SDK</h1>
          <p className="text-blue-700 font-medium text-lg">AI Proof Plug-In: One-line cryptographic receipts for any AI app</p>
        </div>
      </div>

      {/* Quick Start */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Installation</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
              <code>npm install @tecp/sdk</code>
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">One-Line Usage</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`import { wrap, genKeyPair } from '@tecp/sdk';

const { privateKey, publicKey } = await genKeyPair();

async function callLLM(prompt) {
  // your existing OpenAI/Anthropic/etc code
  return { text: 'result' };
}

const callLLMWithProof = wrap(callLLM, {
  signer: { privateKey },
  policyIds: ['no_retention', 'no_pii'],
  verifyLocal: true,
  verifyLocalKeys: [publicKey]
});

const { result, tecp_receipt, tecp_verification } = 
  await callLLMWithProof('Hello');`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Adapters */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Adapters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* OpenAI */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">OpenAI</h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`import { withOpenAI, genKeyPair } from '@tecp/sdk';
import OpenAI from 'openai';

const { privateKey } = await genKeyPair();
const openai = withOpenAI(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  {
    signer: { privateKey },
    policyIds: ['no_retention', 'no_pii']
  }
);

const resp = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'hello' }]
});
// resp.tecp_receipt is included`}</code>
            </pre>
          </div>

          {/* Anthropic */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Anthropic</h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`import { withAnthropic, genKeyPair } from '@tecp/sdk';
import Anthropic from '@anthropic-ai/sdk';

const { privateKey } = await genKeyPair();
const anthropic = withAnthropic(
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  {
    signer: { privateKey },
    policyIds: ['no_retention', 'no_pii']
  }
);

const resp = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: 'hello' }]
});
// resp.tecp_receipt is included`}</code>
            </pre>
          </div>

          {/* Generic Fetch */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Generic Fetch</h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`import { withFetch, genKeyPair } from '@tecp/sdk';

const { privateKey, publicKey } = await genKeyPair();
const fetchWithProof = withFetch(fetch, {
  signer: { privateKey },
  policyIds: ['no_retention'],
  verifyLocal: true,
  verifyLocalKeys: [publicKey],
  processor: { vendor: 'http', model: 'generic' }
});

const { result, tecp_receipt } = 
  await fetchWithProof('https://api.example.com/data');
const body = result.text; // original response`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Policy Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Policies: Enforced vs Declared</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">no_pii</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Enforced
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">Basic regex scrub for emails, phones, SSN</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">ttl_60s</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Enforced
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">SDK memory purge timer for in-process caches</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">no_retention</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Declared
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">SDK won't persist; caller must not log inputs/outputs</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">region_us|eu</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Declared
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">Attest where upstream is routed</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">no_training</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Declared
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">Provider setting; SDK records the intent</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Notes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Security & Best Practices</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Critical Security</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Never include raw input/output in receipts (hashes only)</li>
                <li>• Do not sign in the browser. Use server or edge runtime</li>
                <li>• PII redaction is best-effort. Provide custom scrubbers</li>
                <li>• Key rotation: KID embedded in receipts</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🔧 Development Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Clock: tolerate ±5 minutes skew</li>
                <li>• Verifier accepts multiple keys for rotation</li>
                <li>• Use HSM/KMS via Signer interface</li>
                <li>• Test with verifyLocal: true</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trust Badge (Browser Only)</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Add a "Powered by TECP" badge to show users your app issues verifiable receipts.
              <strong className="text-red-600"> Never sign in the browser - verification only!</strong>
            </p>
            
            {/* Badge Preview */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <svg width="120" height="20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor:'#2563eb', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#1d4ed8', stopOpacity:1}} />
                  </linearGradient>
                </defs>
                
                <rect width="120" height="20" rx="3" ry="3" fill="url(#gradient)"/>
                <rect x="0" y="0" width="24" height="20" rx="3" ry="3" fill="#1e40af"/>
                
                <g transform="translate(12, 10)">
                  <rect x="-3" y="-4" width="6" height="8" rx="0.5" fill="white" stroke="none"/>
                  <line x1="-2" y1="-2.5" x2="2" y2="-2.5" stroke="#1e40af" strokeWidth="0.5"/>
                  <line x1="-2" y1="-1" x2="2" y2="-1" stroke="#1e40af" strokeWidth="0.5"/>
                  <line x1="-2" y1="0.5" x2="1" y2="0.5" stroke="#1e40af" strokeWidth="0.5"/>
                  <circle cx="1.5" cy="2.5" r="1" fill="#1e40af"/>
                  <path d="M1,2.5 L1.3,2.8 L2,2.1" stroke="white" strokeWidth="0.4" fill="none" strokeLinecap="round"/>
                </g>
                
                <text x="28" y="14" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="500" fill="white">
                  Powered by TECP
                </text>
              </svg>
            </div>
            
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
              <code>{`import { injectTrustBadge } from '@tecp/sdk';

injectTrustBadge({
  href: 'https://tecp.dev',
  title: 'This app issues verifiable AI receipts',
  position: 'bottom-right'
});`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/verify" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-900 mb-2">Verify Receipts</h3>
            <p className="text-sm text-gray-600">Test receipt verification with your own receipts</p>
          </a>
          <a href="/examples" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-900 mb-2">Code Examples</h3>
            <p className="text-sm text-gray-600">Interactive examples and test vectors</p>
          </a>
          <a href="/gateway" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
            <h3 className="font-semibold text-gray-900 mb-2">Enterprise Gateway</h3>
            <p className="text-sm text-gray-600">Zero-code proxy for existing AI APIs</p>
          </a>
        </div>
      </div>
    </div>
  );
}
