/**
 * Mock Backend for Vercel Deployment
 * Provides sample data when real backend services aren't available
 */

export const mockTransparencyLogData = {
  root: {
    root_hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    tree_size: 42,
    timestamp: Date.now() - 3600000, // 1 hour ago
    signature: "mock_signature_for_demo_purposes_only",
    kid: "log-2024-01"
  },
  entries: [
    {
      leaf_index: 1,
      code_ref: "git:abc123",
      receipt_hash: "def456789012345678901234567890abcdef123456789012345678901234",
      timestamp: Date.now() - 7200000, // 2 hours ago
      leaf_hash: "789012345678901234567890abcdef123456789012345678901234567890"
    },
    {
      leaf_index: 2,
      code_ref: "git:xyz789",
      receipt_hash: "123456789012345678901234567890abcdef123456789012345678901234",
      timestamp: Date.now() - 3600000, // 1 hour ago
      leaf_hash: "456789012345678901234567890abcdef123456789012345678901234567"
    }
  ]
};

export const mockVerificationResult = {
  valid: true,
  errors: [],
  details: {
    signature: 'Valid (Demo Mode)',
    timestamp: 'OK',
    schema: 'OK',
    transparencyLog: 'Demo Data'
  },
  performance: {
    verificationTimeMs: 15,
    receiptSizeBytes: 1024
  }
};

export const mockPrivateGPTResponse = {
  response: {
    choices: [{
      message: {
        role: 'assistant',
        content: 'This is a demo response. In production, this would be a real AI response with full privacy guarantees via TECP receipts.'
      }
    }]
  },
  tecp_receipt: {
    version: 'TECP-0.1',
    code_ref: 'git:demo-mode',
    ts: Date.now(),
    nonce: 'ZGVtby1ub25jZS0xMjM0NTY=',
    input_hash: 'dGVzdC1pbnB1dC1oYXNoLWZvci1kZW1v',
    output_hash: 'dGVzdC1vdXRwdXQtaGFzaC1mb3ItZGVtbw==',
    policy_ids: ['no_retention', 'key_erasure'],
    sig: 'demo_signature_for_frontend_display_only',
    pubkey: 'ZGVtby1wdWJsaWMta2V5LWZvci1kaXNwbGF5'
  },
  tecp_metadata: {
    privacy_guarantees: [
      'Demo Mode: No real data processed',
      'Production: Mathematical privacy guarantees'
    ]
  }
};

export const isMockMode = () => {
  return typeof window !== 'undefined' && 
         (window.location.hostname.includes('vercel.app') || 
          window.location.hostname.includes('netlify.app') ||
          !window.location.hostname.includes('localhost'));
};
