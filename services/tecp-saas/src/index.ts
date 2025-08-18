/**
 * TECP SaaS Platform
 * 
 * Multi-tenant hosted transparency log and Private-GPT services
 * with usage billing, API key management, and enterprise features.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createServer } from 'http';

import { AuthService } from './services/auth.js';
import { BillingService } from './services/billing.js';
import { TenantService } from './services/tenant.js';
import { UsageTracker } from './services/usage.js';
import { HostedLogService } from './services/hosted-log.js';
import { PrivateGPTService } from './services/private-gpt.js';
import { logger } from './utils/logger.js';
import { database } from './utils/database.js';
import { redis } from './utils/redis.js';

// Load environment
config();

const app = express();
const port = process.env.PORT || 8080;

// Initialize services
const authService = new AuthService();
const billingService = new BillingService();
const tenantService = new TenantService();
const usageTracker = new UsageTracker();
const hostedLogService = new HostedLogService();
const privateGPTService = new PrivateGPTService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - tiered by plan
const createRateLimit = (windowMs: number, max: number) => 
  rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      retry_after: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info('Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await database.query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      status: 'healthy',
      service: 'tecp-saas-platform',
      version: 'TECP-0.1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service dependencies unavailable'
    });
  }
});

// API Documentation
app.get('/', (req, res) => {
  res.json({
    service: 'TECP SaaS Platform',
    version: 'TECP-0.1',
    description: 'Multi-tenant hosted transparency log and Private-GPT services',
    endpoints: {
      'POST /auth/register': 'Register new tenant account',
      'POST /auth/login': 'Authenticate tenant',
      'GET /auth/profile': 'Get tenant profile',
      'POST /api-keys': 'Create API key',
      'GET /api-keys': 'List API keys',
      'DELETE /api-keys/:id': 'Revoke API key',
      'GET /usage': 'Get usage statistics',
      'GET /billing': 'Get billing information',
      'POST /billing/upgrade': 'Upgrade subscription plan',
      'POST /v1/transparency-log/entries': 'Add entry to hosted log',
      'GET /v1/transparency-log/proof/:leaf': 'Get Merkle proof',
      'GET /v1/transparency-log/root': 'Get signed root',
      'POST /v1/private-gpt/chat/completions': 'Private-GPT with TECP receipts'
    },
    documentation: 'https://tecp.dev/saas-api',
    support: 'support@tecp.dev'
  });
});

// Authentication routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, company, plan = 'starter' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const tenant = await authService.register({
      email,
      password,
      company,
      plan
    });
    
    // Track registration
    await usageTracker.trackEvent(tenant.id, 'tenant_registered', {
      plan,
      company
    });
    
    res.status(201).json({
      success: true,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        company: tenant.company,
        plan: tenant.plan,
        created_at: tenant.created_at
      }
    });
    
  } catch (error) {
    logger.error('Registration failed', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      token: result.token,
      tenant: result.tenant
    });
    
  } catch (error) {
    logger.error('Login failed', error);
    res.status(401).json({
      error: 'Invalid credentials'
    });
  }
});

// API Key management
app.post('/api-keys', authService.authenticate, async (req, res) => {
  try {
    const { name, permissions = ['log:read', 'log:write'] } = req.body;
    const tenantId = (req as any).tenant.id;
    
    const apiKey = await authService.createAPIKey(tenantId, name, permissions);
    
    await usageTracker.trackEvent(tenantId, 'api_key_created', {
      name,
      permissions
    });
    
    res.status(201).json({
      success: true,
      api_key: apiKey
    });
    
  } catch (error) {
    logger.error('API key creation failed', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'API key creation failed'
    });
  }
});

// Usage and billing routes
app.get('/usage', authService.authenticate, async (req, res) => {
  try {
    const tenantId = (req as any).tenant.id;
    const { period = '30d' } = req.query;
    
    const usage = await usageTracker.getUsage(tenantId, period as string);
    
    res.json({
      success: true,
      usage
    });
    
  } catch (error) {
    logger.error('Usage retrieval failed', error);
    res.status(500).json({
      error: 'Failed to retrieve usage data'
    });
  }
});

app.get('/billing', authService.authenticate, async (req, res) => {
  try {
    const tenantId = (req as any).tenant.id;
    
    const billing = await billingService.getBillingInfo(tenantId);
    
    res.json({
      success: true,
      billing
    });
    
  } catch (error) {
    logger.error('Billing retrieval failed', error);
    res.status(500).json({
      error: 'Failed to retrieve billing information'
    });
  }
});

// Hosted Transparency Log API
app.use('/v1/transparency-log', 
  authService.authenticateAPIKey,
  createRateLimit(60 * 1000, 1000), // 1000 requests per minute
  async (req, res, next) => {
    const tenantId = (req as any).tenant.id;
    const plan = (req as any).tenant.plan;
    
    // Check usage limits
    const usage = await usageTracker.getCurrentUsage(tenantId);
    const limits = billingService.getPlanLimits(plan);
    
    if (usage.log_entries >= limits.log_entries_per_month) {
      return res.status(429).json({
        error: 'Monthly log entry limit exceeded',
        limit: limits.log_entries_per_month,
        usage: usage.log_entries,
        upgrade_url: `https://tecp.dev/billing?tenant=${tenantId}`
      });
    }
    
    next();
  }
);

app.post('/v1/transparency-log/entries', async (req, res) => {
  try {
    const tenantId = (req as any).tenant.id;
    const { code_ref, receipt_hash } = req.body;
    
    if (!code_ref || !receipt_hash) {
      return res.status(400).json({
        error: 'code_ref and receipt_hash required'
      });
    }
    
    const result = await hostedLogService.addEntry(tenantId, code_ref, receipt_hash);
    
    // Track usage
    await usageTracker.trackUsage(tenantId, 'log_entry', 1);
    
    res.status(201).json({
      success: true,
      leaf_index: result.leaf_index,
      root: result.root,
      proof: result.proof
    });
    
  } catch (error) {
    logger.error('Log entry creation failed', error);
    res.status(500).json({
      error: 'Failed to add log entry'
    });
  }
});

// Hosted Private-GPT API
app.use('/v1/private-gpt',
  authService.authenticateAPIKey,
  createRateLimit(60 * 1000, 100), // 100 requests per minute
  async (req, res, next) => {
    const tenantId = (req as any).tenant.id;
    const plan = (req as any).tenant.plan;
    
    // Check usage limits
    const usage = await usageTracker.getCurrentUsage(tenantId);
    const limits = billingService.getPlanLimits(plan);
    
    if (usage.ai_requests >= limits.ai_requests_per_month) {
      return res.status(429).json({
        error: 'Monthly AI request limit exceeded',
        limit: limits.ai_requests_per_month,
        usage: usage.ai_requests,
        upgrade_url: `https://tecp.dev/billing?tenant=${tenantId}`
      });
    }
    
    next();
  }
);

app.post('/v1/private-gpt/chat/completions', async (req, res) => {
  try {
    const tenantId = (req as any).tenant.id;
    const { messages, model = 'deepseek-chat', policies = ['no_retention'] } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'messages array required'
      });
    }
    
    const result = await privateGPTService.processChat(tenantId, {
      messages,
      model,
      policies
    });
    
    // Track usage
    await usageTracker.trackUsage(tenantId, 'ai_request', 1);
    await usageTracker.trackUsage(tenantId, 'tokens_processed', result.usage.total_tokens);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Private-GPT request failed', error);
    res.status(500).json({
      error: 'AI processing failed',
      tecp_receipt: null
    });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    request_id: req.headers['x-request-id']
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'POST /v1/transparency-log/entries',
      'POST /v1/private-gpt/chat/completions'
    ]
  });
});

// Graceful shutdown
const server = createServer(app);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    database.end();
    redis.quit();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    database.end();
    redis.quit();
    process.exit(0);
  });
});

server.listen(port, () => {
  logger.info(`TECP SaaS Platform listening on port ${port}`);
  logger.info('Environment:', process.env.NODE_ENV || 'development');
});

export default app;
