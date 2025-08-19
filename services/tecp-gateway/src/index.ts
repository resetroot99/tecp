/*
 * TECP Enterprise AI Guardrail Gateway
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { proxyRouter } from './routes/proxy';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true
}));

// Rate limiting
app.use(rateLimitMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id']
  });
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/admin', authMiddleware, adminRouter);
app.use('/v1', authMiddleware, proxyRouter); // OpenAI-compatible endpoint
app.use('/api/v1', authMiddleware, proxyRouter); // Alternative endpoint

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Gateway error:', error);
  res.status(500).json({
    error: 'Internal gateway error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    tecp_receipt: null
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not supported by TECP Gateway`,
    available_endpoints: ['/v1/chat/completions', '/v1/completions', '/admin/dashboard', '/health']
  });
});

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 TECP Enterprise Gateway running on port ${config.PORT}`);
  logger.info(`📊 Admin dashboard: http://localhost:${config.PORT}/admin/dashboard`);
  logger.info(`🔐 Policy enforcement: ${config.POLICY_ENFORCEMENT_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`📝 Receipt generation: ${config.RECEIPT_GENERATION_ENABLED ? 'ENABLED' : 'DISABLED'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Gateway server closed');
    process.exit(0);
  });
});

export { app };
