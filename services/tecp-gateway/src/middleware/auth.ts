/*
 * TECP Gateway - Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organization: string;
    permissions: string[];
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Skip auth for health checks
  if (req.path.startsWith('/health')) {
    return next();
  }

  const apiKey = req.headers[config.API_KEY_HEADER] as string;
  const authHeader = req.headers.authorization;

  try {
    if (apiKey) {
      // API Key authentication (simple for demo)
      if (apiKey === 'tecp-demo-key' || apiKey.startsWith('tecp-')) {
        req.user = {
          id: 'demo-user',
          organization: 'demo-org',
          permissions: ['gateway:use', 'receipts:generate']
        };
        return next();
      }
    }

    if (authHeader?.startsWith('Bearer ')) {
      // JWT authentication
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      
      req.user = {
        id: decoded.sub,
        organization: decoded.org,
        permissions: decoded.permissions || []
      };
      return next();
    }

    // No valid authentication found
    logger.warn('Unauthorized gateway access attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });

    res.status(401).json({
      error: 'Authentication required',
      message: 'Provide API key via x-tecp-api-key header or JWT via Authorization header',
      documentation: 'https://tecp.dev/docs/gateway-auth'
    });

  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(401).json({
      error: 'Invalid authentication',
      message: 'Invalid API key or JWT token'
    });
  }
};
