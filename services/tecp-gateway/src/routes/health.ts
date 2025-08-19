/*
 * TECP Gateway - Health Check Routes
 */

import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    service: 'tecp-gateway',
    features: {
      policy_enforcement: config.POLICY_ENFORCEMENT_ENABLED,
      receipt_generation: config.RECEIPT_GENERATION_ENABLED,
      pii_detection: config.PII_DETECTION_ENABLED,
      transparency_log: config.TRANSPARENCY_LOG_ENABLED
    }
  });
});

router.get('/ready', (req, res) => {
  // Add readiness checks here (database connections, external services, etc.)
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
