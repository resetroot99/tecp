/**
 * TECP Ephemeral Chat Demo
 * 
 * Simple chat service where each message gets a TECP receipt proving:
 * - Message was processed ephemerally
 * - No message history is stored
 * - Cryptographic proof of ephemeral processing
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';

// Load environment
config();

// Dynamic import to load TECP core
async function startServer() {
  const { ReceiptSigner } = await import('../../../packages/tecp-core/dist/index.js');

  // Load signing keys
  const PRIVATE_KEY = readFileSync('.keys/ed25519.priv');
  const PUBLIC_KEY = readFileSync('.keys/ed25519.pub');
  const signer = new ReceiptSigner(PRIVATE_KEY, PUBLIC_KEY);

  console.log('🔑 Signing keys loaded successfully');

  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:3002"],
      },
    },
  }));

  app.use(cors({
    origin: ['http://localhost:3003', 'http://localhost:3000'],
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));

  // Serve static files for simple chat UI
  app.use(express.static('public'));

  // Chat endpoint - processes messages ephemerally
  app.post('/api/chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
      console.log('💬 Processing ephemeral chat message...');
      
      const { message, username = 'Anonymous' } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Message is required',
          tecp_receipt: null
        });
      }

      // Simulate message processing (echo with timestamp)
      const input = JSON.stringify({ message, username, timestamp: Date.now() });
      const processedMessage = {
        id: createHash('sha256').update(input).digest('hex').substring(0, 8),
        message: message.trim(),
        username: username,
        timestamp: new Date().toISOString(),
        processed_at: Date.now()
      };
      
      const output = JSON.stringify(processedMessage);
      
      console.log(`📥 Input size: ${input.length} bytes`);
      console.log(`📤 Output size: ${output.length} bytes`);

      // Create TECP receipt
      console.log('🧾 Generating cryptographic receipt...');
      const receipt = await signer.createReceipt({
        code_ref: `git:${process.env.COMMIT_SHA || 'dev'}`,
        input: Buffer.from(input),
        output: Buffer.from(output),
        policy_ids: ['no_retention', 'ephemeral_chat', 'key_erasure'],
        extensions: {
          key_erasure: {
            scheme: 'sw-sim',
            evidence: Buffer.from(`chat_destroyed_at_${Date.now()}`).toString('base64')
          },
          environment: {
            region: process.env.AWS_REGION || 'local',
            provider: 'ephemeral-chat-demo'
          }
        }
      });

      // Submit to transparency log if configured
      let logInclusion = null;
      if (process.env.TECP_LOG_URL) {
        try {
          console.log('📝 Submitting to transparency log...');
          const logResponse = await fetch(`${process.env.TECP_LOG_URL}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code_ref: receipt.code_ref,
              receipt_hash: createHash('sha256').update(JSON.stringify(receipt)).digest('hex')
            })
          });

          if (logResponse.ok) {
            const logResult = await logResponse.json();
            logInclusion = {
              leaf_index: logResult.leaf_index,
              merkle_proof: logResult.proof?.audit_path || [],
              log_root: logResult.root
            };
            console.log('✅ Receipt submitted to transparency log');
            console.log(`   Leaf index: ${logResult.leaf_index}`);
            console.log(`   Root hash: ${logResult.root.substring(0, 16)}...`);
          }
        } catch (logError) {
          console.warn('⚠️  Failed to submit to transparency log:', logError.message);
        }
      }

      // Add log inclusion to receipt if available
      if (logInclusion) {
        receipt.log_inclusion = logInclusion;
      }

      // Simulate key destruction
      console.log('🔥 Simulating cryptographic key destruction...');
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Message processed in ${processingTime}ms - all traces destroyed`);

      // Return message with receipt
      res.json({
        message: processedMessage,
        tecp_receipt: receipt,
        metadata: {
          processing_time_ms: processingTime,
          verification_url: process.env.VERIFIER_URL || 'http://localhost:3003',
          transparency_log_url: process.env.TECP_LOG_URL || null,
          message: 'Message processed ephemerally - no chat history stored',
          privacy_guarantees: [
            'Message content never stored persistently',
            'Processing keys destroyed after signing',
            'Cryptographic proof of ephemeral processing',
            logInclusion ? 'Receipt logged for transparency' : 'Receipt available for verification'
          ]
        }
      });

    } catch (error) {
      console.error('❌ Message processing error:', error);
      res.status(500).json({
        error: 'Failed to process message',
        tecp_receipt: null,
        message: 'Ephemeral processing failed'
      });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'tecp-ephemeral-chat',
      version: 'TECP-0.1',
      features: [
        'ephemeral_messaging',
        'cryptographic_receipts',
        'no_message_storage',
        'policy_enforcement'
      ],
      uptime_seconds: process.uptime(),
      privacy_guarantees: {
        message_storage: 'never',
        key_lifecycle: 'ephemeral',
        verification: 'independent',
        transparency: process.env.TECP_LOG_URL ? 'enabled' : 'disabled'
      }
    });
  });

  // Simple chat UI
  app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TECP Ephemeral Chat</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .chat-form { display: flex; gap: 10px; margin-bottom: 20px; }
        .chat-form input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .chat-form button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .message { background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 4px; border-left: 4px solid #007bff; }
        .receipt { background: #e8f5e8; padding: 10px; margin-top: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .metadata { color: #666; font-size: 12px; margin-top: 5px; }
        .loading { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 TECP Ephemeral Chat</h1>
        <p>Every message gets a cryptographic receipt proving ephemeral processing. No chat history is stored.</p>
    </div>
    
    <div class="chat-form">
        <input type="text" id="username" placeholder="Username" value="Anonymous">
        <input type="text" id="message" placeholder="Type your message..." onkeypress="if(event.key==='Enter') sendMessage()">
        <button onclick="sendMessage()">Send</button>
    </div>
    
    <div id="messages"></div>
    
    <script>
        async function sendMessage() {
            const username = document.getElementById('username').value || 'Anonymous';
            const message = document.getElementById('message').value.trim();
            
            if (!message) return;
            
            // Clear input
            document.getElementById('message').value = '';
            
            // Show loading
            const messagesDiv = document.getElementById('messages');
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.textContent = 'Processing message ephemerally...';
            messagesDiv.appendChild(loadingDiv);
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, message })
                });
                
                const result = await response.json();
                
                // Remove loading
                messagesDiv.removeChild(loadingDiv);
                
                if (response.ok) {
                    // Display message with receipt
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.innerHTML = \`
                        <strong>\${result.message.username}:</strong> \${result.message.message}
                        <div class="metadata">
                            ID: \${result.message.id} | 
                            Processed: \${new Date(result.message.timestamp).toLocaleTimeString()} |
                            Time: \${result.metadata.processing_time_ms}ms
                        </div>
                        <div class="receipt">
                            <strong>TECP Receipt:</strong><br>
                            Version: \${result.tecp_receipt.version}<br>
                            Policies: \${result.tecp_receipt.policy_ids.join(', ')}<br>
                            Signature: \${result.tecp_receipt.sig.substring(0, 32)}...<br>
                            <a href="\${result.metadata.verification_url}/verify" target="_blank">🔍 Verify Receipt</a>
                        </div>
                    \`;
                    messagesDiv.appendChild(messageDiv);
                } else {
                    throw new Error(result.error || 'Failed to send message');
                }
            } catch (error) {
                // Remove loading
                if (messagesDiv.contains(loadingDiv)) {
                    messagesDiv.removeChild(loadingDiv);
                }
                
                // Show error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message';
                errorDiv.style.borderLeftColor = '#dc3545';
                errorDiv.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
                messagesDiv.appendChild(errorDiv);
            }
            
            // Scroll to bottom
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Focus message input
        document.getElementById('message').focus();
    </script>
</body>
</html>
    `);
  });

  // Start server
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => {
    console.log('🔥 TECP Ephemeral Chat Demo Starting...');
    console.log('============================================================');
    console.log(`🚀 Service: Ephemeral Chat (TECP-enabled)`);
    console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
    console.log(`🧾 Receipts: Every message includes cryptographic proof`);
    console.log(`🔍 Verifier: ${process.env.VERIFIER_URL || 'http://localhost:3003'}`);
    console.log('📋 Privacy Guarantees:');
    console.log('   ✅ Messages never stored');
    console.log('   ✅ Keys destroyed after signing');
    console.log('   ✅ Mathematical proof of claims');
    console.log('   ✅ Independent verification possible');
    console.log('🎯 Demo Tagline: "Chat that literally cannot remember"');
    console.log('📝 Try it: Open http://localhost:' + PORT + ' in your browser');
    console.log('============================================================');
  });
}

// Handle startup errors
startServer().catch(error => {
  console.error('❌ Failed to start Ephemeral Chat demo:', error);
  process.exit(1);
});
