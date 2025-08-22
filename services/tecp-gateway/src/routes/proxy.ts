/*
 * TECP Gateway - LLM Proxy Routes
 * Transparent proxy with policy enforcement and receipt generation
 */

import { Router } from 'express';
import axios from 'axios';
import { ReceiptSigner, PolicyRuntime, canonicalBytes, leafForLog } from '@tecp/core';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PIIDetector } from '../utils/piiDetector';
import { TransparencyLogClient } from '../utils/transparencyLog';

const router = Router();
// Initialize signer with optional private key for deterministic KID
const gatewayPrivateKey = process.env.TECP_PRIVATE_KEY ? Buffer.from(process.env.TECP_PRIVATE_KEY, 'base64') : undefined as any;
const receiptSigner = new ReceiptSigner(gatewayPrivateKey);
const policyRuntime = new PolicyRuntime();
const piiDetector = new PIIDetector();
const transparencyLog = new TransparencyLogClient(config.TRANSPARENCY_LOG_URL);

interface ProxyRequest {
  model: string;
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  // TECP-specific headers
  'x-tecp-policies'?: string;
  'x-tecp-user-id'?: string;
  'x-tecp-session-id'?: string;
}

interface TECPEnhancedResponse {
  // Original LLM response
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: { role: string; content: string };
    text?: string;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  
  // TECP enhancements
  tecp_receipt: {
    receipt_id: string;
    input_hash: string;
    output_hash: string;
    policy_ids: string[];
    timestamp: number;
    signature: string;
    transparency_log_entry?: string;
  };
  tecp_policy_enforcement: {
    policies_applied: string[];
    pii_detected: boolean;
    pii_redacted: boolean;
    compliance_tags: string[];
  };
}

// OpenAI Chat Completions endpoint
router.post('/chat/completions', async (req, res) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
  
  try {
    const proxyReq: ProxyRequest = req.body;
    const policies = (req.headers['x-tecp-policies'] as string)?.split(',') || config.DEFAULT_POLICIES;
    const userId = req.headers['x-tecp-user-id'] as string;
    const sessionId = req.headers['x-tecp-session-id'] as string;

    logger.info(`Processing chat completion request`, {
      requestId,
      model: proxyReq.model,
      policies,
      userId,
      sessionId
    });

    // Extract input content for processing
    const inputContent = proxyReq.messages?.map(m => m.content).join(' ') || '';
    
    // Policy enforcement - Pre-processing
    if (config.POLICY_ENFORCEMENT_ENABLED) {
      const policyResult = await policyRuntime.enforceAll(policies, inputContent);
      if (!policyResult.allowed) {
        return res.status(403).json({
          error: 'Policy violation',
          message: `Request blocked by policy: ${policyResult.violations.join(', ')}`,
          tecp_receipt: null
        });
      }
    }

    // PII Detection
    let piiDetected = false;
    let processedInput = inputContent;
    if (config.PII_DETECTION_ENABLED) {
      piiDetected = piiDetector.detectPII(inputContent);
      if (piiDetected && config.PII_REDACTION_ENABLED) {
        processedInput = piiDetector.redactPII(inputContent);
        // Update messages with redacted content
        proxyReq.messages = proxyReq.messages?.map(msg => ({
          ...msg,
          content: msg.content === inputContent ? processedInput : msg.content
        }));
      }
    }

    // Forward to LLM provider
    const providerResponse = await forwardToProvider(proxyReq, requestId);
    
    // Extract output content
    const outputContent = providerResponse.choices?.[0]?.message?.content || 
                         providerResponse.choices?.[0]?.text || '';

    // Generate TECP receipt
    let tecpReceipt = null;
    if (config.RECEIPT_GENERATION_ENABLED) {
      const receipt = await receiptSigner.createReceipt({
        code_ref: process.env.TECP_CODE_REF || 'unknown',
        input: processedInput,
        output: outputContent,
        policy_ids: policies,
        profile: config.TECP_PROFILE === 'STRICT' ? 'tecp-strict' : 'tecp-lite',
        extensions: { ext: { key: { kid: process.env.TECP_KID } } }
      });

      // Optional anchoring in STRICT
      if (config.TECP_PROFILE === 'STRICT' && config.TRANSPARENCY_LOG_ENABLED) {
        try {
          const leaf = Buffer.from(leafForLog(receipt)).toString('hex');
          const anchor = await axios.post(`${config.TRANSPARENCY_LOG_URL}/v1/log/entries`, { leaf });
          (receipt as any).log_inclusion = {
            leaf_index: anchor.data.leaf_index,
            merkle_proof: anchor.data.proof,
            log_root: anchor.data.sth.root
          };
        } catch (error) {
          logger.warn('Anchoring failed', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      tecpReceipt = receipt;
    }

    // Construct enhanced response
    const enhancedResponse: TECPEnhancedResponse = {
      ...providerResponse,
      tecp_receipt: tecpReceipt,
      tecp_policy_enforcement: {
        policies_applied: policies,
        pii_detected: piiDetected,
        pii_redacted: piiDetected && config.PII_REDACTION_ENABLED,
        compliance_tags: getComplianceTags(policies)
      }
    };

    logger.info(`Request completed successfully`, {
      requestId,
      processingTimeMs: Date.now() - startTime,
      tokensUsed: providerResponse.usage?.total_tokens || 0,
      receiptGenerated: !!tecpReceipt
    });

    res.json(enhancedResponse);

  } catch (error) {
    logger.error('Proxy request failed', { error, requestId });
    res.status(500).json({
      error: 'Gateway processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      tecp_receipt: null
    });
  }
});

// OpenAI Completions endpoint (legacy)
router.post('/completions', async (req, res) => {
  // Similar implementation for completions endpoint
  res.status(501).json({
    error: 'Not implemented',
    message: 'Completions endpoint coming soon. Use /chat/completions for now.'
  });
});

// Helper functions
async function forwardToProvider(request: ProxyRequest, requestId: string) {
  const provider = getProviderFromModel(request.model);
  
  if (provider === 'openai') {
    const response = await axios.post(`${config.OPENAI_BASE_URL}/v1/chat/completions`, request, {
      headers: {
        'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      timeout: 60000
    });
    return response.data;
  } else if (provider === 'anthropic') {
    // Convert OpenAI format to Anthropic format
    const anthropicRequest = convertToAnthropicFormat(request);
    const response = await axios.post(`${config.ANTHROPIC_BASE_URL}/v1/messages`, anthropicRequest, {
      headers: {
        'x-api-key': config.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'X-Request-ID': requestId
      },
      timeout: 60000
    });
    return convertFromAnthropicFormat(response.data);
  }
  
  throw new Error(`Unsupported model: ${request.model}`);
}

function getProviderFromModel(model: string): 'openai' | 'anthropic' {
  if (model.startsWith('gpt-') || model.startsWith('text-') || model.startsWith('davinci')) {
    return 'openai';
  } else if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  return 'openai'; // default
}

function convertToAnthropicFormat(request: ProxyRequest) {
  // Convert OpenAI chat format to Anthropic messages format
  return {
    model: request.model,
    max_tokens: request.max_tokens || 1000,
    messages: request.messages || [],
    temperature: request.temperature
  };
}

function convertFromAnthropicFormat(response: any) {
  // Convert Anthropic response to OpenAI format
  return {
    id: response.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: response.content?.[0]?.text || ''
      },
      finish_reason: response.stop_reason === 'end_turn' ? 'stop' : response.stop_reason
    }],
    usage: {
      prompt_tokens: response.usage?.input_tokens || 0,
      completion_tokens: response.usage?.output_tokens || 0,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
    }
  };
}

function getComplianceTags(policies: string[]): string[] {
  const tags: string[] = [];
  
  if (policies.includes('no_retention')) tags.push('GDPR-Art17');
  if (policies.includes('eu_region')) tags.push('GDPR-Art44');
  if (policies.includes('no_pii')) tags.push('GDPR-Art6', 'HIPAA-164.514');
  if (policies.includes('audit_trail')) tags.push('SOX-404', 'GDPR-Art30');
  if (policies.includes('encryption_required')) tags.push('HIPAA-164.312');
  
  return tags;
}

export { router as proxyRouter };
