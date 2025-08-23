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
import '../styles/gateway.css';

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
    <div className="gateway-page">
      {/* Hero Section */}
      <div className="gateway-hero">
        <div className="gateway-hero-content">
          <div className="gateway-badge">
            <div className="gateway-badge-dot"></div>
            Enterprise-Grade AI Compliance
          </div>
          <h1 className="gateway-title">
            TECP Enterprise
            <span className="gateway-title-highlight"> Gateway</span>
          </h1>
          <p className="gateway-description">
            Transform any LLM API into a compliance-grade service with automatic policy enforcement, 
            PII detection, and cryptographic receipts. <strong>Zero code changes required.</strong>
          </p>
          <div className="gateway-buttons">
            <a href="#try-it" className="gateway-button gateway-button-primary">
              <span>
                Try Interactive Demo
                <svg className="svg-icon-sm gateway-arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </a>
            <a href="https://github.com/resetroot99/tecp/tree/main/services/tecp-gateway#readme" target="_blank" rel="noopener noreferrer" className="gateway-button gateway-button-secondary">
              <span>
                <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View Documentation
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="container">

      {/* Key Features */}
      <div id="try-it" className="gateway-features">
        <div className="gateway-features-header">
          <h2 className="gateway-features-title">Enterprise-Grade Features</h2>
          <p className="gateway-features-description">
            Built for production environments with enterprise security, compliance, and scalability requirements
          </p>
        </div>
        
        <div className="gateway-features-grid">
          <div className="gateway-feature-card">
            <div className="gateway-feature-content">
              <div className="gateway-feature-icon gateway-feature-icon--blue">
                <svg className="svg-icon text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="gateway-feature-title">Transparent Proxy</h3>
              <p className="gateway-feature-description">
                Drop-in replacement for OpenAI and Anthropic APIs. No code changes required - just update your base URL.
              </p>
              <ul className="gateway-feature-list">
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--blue"></div>
                  OpenAI GPT-4, GPT-3.5 support
                </li>
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--blue"></div>
                  Anthropic Claude support
                </li>
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--blue"></div>
                  Format conversion handled automatically
                </li>
              </ul>
            </div>
          </div>

          <div className="gateway-feature-card">
            <div className="gateway-feature-content">
              <div className="gateway-feature-icon gateway-feature-icon--green">
                <svg className="svg-icon text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="gateway-feature-title">Policy Enforcement</h3>
              <p className="gateway-feature-description">
                Automatic application of privacy policies with runtime validation and cryptographic receipts.
              </p>
              <ul className="gateway-feature-list">
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--green"></div>
                  Real-time policy validation
                </li>
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--green"></div>
                  Cryptographic receipt generation
                </li>
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--green"></div>
                  Transparency log integration
                </li>
              </ul>
            </div>
          </div>

          <div className="gateway-feature-card">
            <div className="gateway-feature-content">
              <div className="gateway-feature-icon gateway-feature-icon--purple">
                <svg className="svg-icon text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="gateway-feature-title">PII Protection</h3>
              <p className="gateway-feature-description">
                Automatic detection of sensitive data with optional redaction before processing.
              </p>
              <ul className="gateway-feature-list">
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--purple"></div>
                  Email, phone, SSN detection
                </li>
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--purple"></div>
                  Medical ID recognition
                </li>
                <li className="gateway-feature-list-item">
                  <div className="gateway-feature-list-dot gateway-feature-list-dot--purple"></div>
                  Configurable redaction rules
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="gateway-code">
        <div className="gateway-code-header">
          <h2 className="gateway-code-title">Zero-Code Integration</h2>
          <p className="gateway-code-description">Drop-in replacement for existing LLM APIs</p>
        </div>
        <div className="gateway-code-tabs">
          {Object.keys(codeExamples).map((lang) => (
            <button
              key={lang}
              onClick={() => setDemoCode(lang)}
              className={`gateway-code-tab ${
                demoCode === lang
                  ? 'gateway-code-tab--active'
                  : 'gateway-code-tab--inactive'
              }`}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
        <div className="gateway-code-content">
          <pre className="gateway-code-block">
            <code>{codeExamples[demoCode as keyof typeof codeExamples]}</code>
          </pre>
        </div>
      </div>

      {/* Try It Section */}
      <div className="section">
        <div className="section-header">
          <div className="badge">
            <div className="badge-dot"></div>
            Interactive Demo
          </div>
          <h2 className="section-title">Try It Now</h2>
          <p className="section-description">
            Test the gateway with a sample request and verify the cryptographic receipt in real-time
          </p>
        </div>
        
        <div className="two-column">
          {/* Sample Request */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-dots">
                <div className="card-header-dot card-header-dot--red"></div>
                <div className="card-header-dot card-header-dot--yellow"></div>
                <div className="card-header-dot card-header-dot--green"></div>
              </div>
              <div className="card-header-title">gateway-demo.sh</div>
            </div>
            <div className="card-content">
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon">
                    <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                    </svg>
                  </div>
                  <h3 className="card-section-title">Sample Gateway Request</h3>
                </div>
                <p className="card-section-description">Healthcare AI with HIPAA compliance and cryptographic receipts</p>
                <pre className="code-block">
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
          </div>

          {/* Receipt Viewer */}
          <div className="card">
            <ReceiptViewer onReceiptVerified={handleReceiptVerified} />
            
            {/* Download Proof Button */}
            {currentReceipt && (
              <div className="card-footer">
                <button
                  onClick={handleDownloadProof}
                  className="button-primary"
                >
                  <span className="button-content">
                    <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Compliance Proof
                    <div className="badge-dot"></div>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enterprise Use Cases */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Industry Solutions</h2>
          <p className="section-description">
            Specialized compliance solutions for healthcare, finance, and legal industries
          </p>
        </div>
        
        <div className="three-column">
          <a href="/gateway/healthcare" className="card card--link">
            <div className="card-section">
              <div className="card-section-header">
                <div className="card-section-icon card-section-icon--blue">
                  <svg className="svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="card-section-title">Healthcare</h3>
              </div>
              <p className="card-section-description">
                HIPAA-compliant AI processing with automatic PHI detection and cryptographic audit trails.
              </p>
              <ul className="feature-list">
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--blue"></div>
                  HIPAA 164.312 compliance
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--blue"></div>
                  Automatic PHI detection
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--blue"></div>
                  Cryptographic receipts
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--blue"></div>
                  Complete audit trails
                </li>
              </ul>
              <div className="card-link">
                Learn more about Healthcare Gateway
                <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </a>

          <a href="/gateway/finance" className="card card--link">
            <div className="card-section">
              <div className="card-section-header">
                <div className="card-section-icon card-section-icon--green">
                  <svg className="svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="card-section-title">Financial Services</h3>
              </div>
              <p className="card-section-description">
                SOX-compliant AI analysis with complete audit trails and data governance controls.
              </p>
              <ul className="feature-list">
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--green"></div>
                  SOX Section 404 compliance
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--green"></div>
                  Financial data protection
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--green"></div>
                  Regulatory reporting
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--green"></div>
                  Risk management controls
                </li>
              </ul>
              <div className="card-link">
                Learn more about Finance Gateway
                <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </a>

          <a href="/gateway/legal" className="card card--link">
            <div className="card-section">
              <div className="card-section-header">
                <div className="card-section-icon card-section-icon--purple">
                  <svg className="svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h3 className="card-section-title">Legal</h3>
              </div>
              <p className="card-section-description">
                Client-confidential AI processing with GDPR compliance and verifiable data handling.
              </p>
              <ul className="feature-list">
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--purple"></div>
                  GDPR Article 17 compliance
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--purple"></div>
                  Client confidentiality
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--purple"></div>
                  Verifiable processing
                </li>
                <li className="feature-list-item">
                  <div className="feature-list-dot feature-list-dot--purple"></div>
                  Data sovereignty controls
                </li>
              </ul>
              <div className="card-link">
                Learn more about Legal Gateway
                <svg className="svg-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Deployment Options */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Enterprise Deployment</h2>
          <p className="section-description">Production-ready deployment options with real configuration examples</p>
        </div>
        <div className="two-column">
          {/* Docker Deployment */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">Docker</h3>
              <p className="card-header-description">Quick containerized deployment</p>
            </div>
            <div className="card-content">
              <pre className="code-block">
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
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">Kubernetes</h3>
              <p className="card-header-description">Scalable orchestration with Helm</p>
            </div>
            <div className="card-content">
              <pre className="code-block">
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
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">Fly.io</h3>
              <p className="card-header-description">Global edge deployment</p>
            </div>
            <div className="card-content">
              <pre className="code-block">
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
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title">On-Premise</h3>
              <p className="card-header-description">Self-hosted with systemd</p>
            </div>
            <div className="card-content">
              <pre className="code-block">
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

      {/* Call to Action */}
      <div className="section">
        <div className="card card--highlight">
          <div className="card-content text-center">
            <h2 className="card-title">Ready to Deploy?</h2>
            <p className="card-description">
              Get started with the open-source TECP Gateway or request an enterprise pilot program 
              with dedicated support and custom compliance configurations.
            </p>
            <div className="button-group">
              <a
                href="https://github.com/resetroot99/tecp"
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary"
              >
                Deploy Gateway (Open Source)
              </a>
              <a
                href="mailto:sudo@hxcode.xyz?subject=TECP Enterprise Pilot Request&body=Hi, I'm interested in piloting the TECP Enterprise Gateway for my organization."
                className="button-primary"
              >
                Request Enterprise Pilot
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
