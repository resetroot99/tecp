/*
 * TECP Gateway - Rate Limiting Middleware
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => {
    // Rate limit by API key or IP
    const apiKey = req.headers[config.API_KEY_HEADER] as string;
    return apiKey || req.ip;
  },
  points: config.RATE_LIMIT_MAX_REQUESTS,
  duration: Math.floor(config.RATE_LIMIT_WINDOW_MS / 1000), // seconds
});

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes: any) {
    const remainingPoints = rejRes?.remainingPoints || 0;
    const msBeforeNext = rejRes?.msBeforeNext || 0;
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      remainingPoints,
      msBeforeNext,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${Math.ceil(msBeforeNext / 1000)} seconds.`,
      retry_after: Math.ceil(msBeforeNext / 1000),
      limit: config.RATE_LIMIT_MAX_REQUESTS,
      window: config.RATE_LIMIT_WINDOW_MS
    });
  }
};
