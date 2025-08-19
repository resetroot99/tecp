/*
 * TECP Gateway Configuration
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const configSchema = z.object({
  // Server
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  JWT_SECRET: z.string().min(32),
  API_KEY_HEADER: z.string().default('x-tecp-api-key'),
  CORS_ORIGINS: z.string().transform(s => s.split(',')).default('*'),
  
  // LLM Provider Configuration
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com'),
  ANTHROPIC_BASE_URL: z.string().default('https://api.anthropic.com'),
  
  // TECP Configuration
  POLICY_ENFORCEMENT_ENABLED: z.string().transform(s => s === 'true').default('true'),
  RECEIPT_GENERATION_ENABLED: z.string().transform(s => s === 'true').default('true'),
  DEFAULT_POLICIES: z.string().transform(s => s.split(',')).default('no_retention,audit_trail'),
  
  // Transparency Log
  TRANSPARENCY_LOG_URL: z.string().default('http://localhost:3002'),
  TRANSPARENCY_LOG_ENABLED: z.string().transform(s => s === 'true').default('true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  METRICS_ENABLED: z.string().transform(s => s === 'true').default('true'),
  
  // PII Detection & Redaction
  PII_DETECTION_ENABLED: z.string().transform(s => s === 'true').default('true'),
  PII_REDACTION_ENABLED: z.string().transform(s => s === 'true').default('false'),
});

export const config = configSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  API_KEY_HEADER: process.env.API_KEY_HEADER,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  POLICY_ENFORCEMENT_ENABLED: process.env.POLICY_ENFORCEMENT_ENABLED,
  RECEIPT_GENERATION_ENABLED: process.env.RECEIPT_GENERATION_ENABLED,
  DEFAULT_POLICIES: process.env.DEFAULT_POLICIES,
  TRANSPARENCY_LOG_URL: process.env.TRANSPARENCY_LOG_URL,
  TRANSPARENCY_LOG_ENABLED: process.env.TRANSPARENCY_LOG_ENABLED,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL: process.env.LOG_LEVEL,
  METRICS_ENABLED: process.env.METRICS_ENABLED,
  PII_DETECTION_ENABLED: process.env.PII_DETECTION_ENABLED,
  PII_REDACTION_ENABLED: process.env.PII_REDACTION_ENABLED,
});
