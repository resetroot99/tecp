/**
 * TECP SaaS Authentication Service
 * 
 * Handles tenant registration, authentication, and API key management
 * with JWT tokens and bcrypt password hashing.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { database } from '../utils/database.js';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';

export interface Tenant {
  id: string;
  email: string;
  company?: string;
  plan: string;
  created_at: Date;
  updated_at: Date;
}

export interface APIKey {
  id: string;
  tenant_id: string;
  name: string;
  key_hash: string;
  permissions: string[];
  last_used?: Date;
  created_at: Date;
}

export interface AuthenticatedRequest extends Request {
  tenant: Tenant;
  apiKey?: APIKey;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'tecp-dev-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'tecp-dev-secret-change-in-production') {
      logger.warn('Using default JWT secret in production - this is insecure!');
    }
  }

  /**
   * Register a new tenant
   */
  async register(params: {
    email: string;
    password: string;
    company?: string;
    plan?: string;
  }): Promise<Tenant> {
    const { email, password, company, plan = 'starter' } = params;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Check if email already exists
    const existingTenant = await database.query(
      'SELECT id FROM tenants WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingTenant.rows.length > 0) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create tenant
    const tenantId = uuidv4();
    const now = new Date();
    
    // Set initial billing period
    const periodStart = now;
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const result = await database.query(`
      INSERT INTO tenants (
        id, email, password_hash, company, plan, 
        current_period_start, current_period_end, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING id, email, company, plan, created_at, updated_at
    `, [
      tenantId,
      email.toLowerCase(),
      passwordHash,
      company,
      plan,
      periodStart,
      periodEnd,
      now
    ]);
    
    const tenant = result.rows[0];
    
    logger.info('Tenant registered', {
      tenant_id: tenant.id,
      email: tenant.email,
      plan: tenant.plan
    });
    
    return tenant;
  }

  /**
   * Authenticate tenant with email and password
   */
  async login(email: string, password: string): Promise<{
    token: string;
    tenant: Omit<Tenant, 'password_hash'>;
  }> {
    // Get tenant with password hash
    const result = await database.query(`
      SELECT id, email, password_hash, company, plan, created_at, updated_at
      FROM tenants 
      WHERE email = $1
    `, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const tenant = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, tenant.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        tenant_id: tenant.id,
        email: tenant.email,
        plan: tenant.plan
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
    
    // Update last login
    await database.query(
      'UPDATE tenants SET last_login = NOW() WHERE id = $1',
      [tenant.id]
    );
    
    logger.info('Tenant logged in', {
      tenant_id: tenant.id,
      email: tenant.email
    });
    
    // Return tenant without password hash
    const { password_hash, ...tenantWithoutPassword } = tenant;
    
    return {
      token,
      tenant: tenantWithoutPassword
    };
  }

  /**
   * Create API key for tenant
   */
  async createAPIKey(
    tenantId: string, 
    name: string, 
    permissions: string[] = ['log:read', 'log:write']
  ): Promise<{
    id: string;
    key: string;
    name: string;
    permissions: string[];
    created_at: Date;
  }> {
    // Check API key limit for tenant's plan
    const tenantResult = await database.query(
      'SELECT plan FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const plan = tenantResult.rows[0].plan;
    
    // Get current API key count
    const keyCountResult = await database.query(
      'SELECT COUNT(*) as count FROM api_keys WHERE tenant_id = $1 AND revoked_at IS NULL',
      [tenantId]
    );
    
    const currentKeyCount = parseInt(keyCountResult.rows[0].count);
    
    // Check plan limits (simplified - would use BillingService in real implementation)
    const planLimits: Record<string, number> = {
      starter: 3,
      professional: 10,
      enterprise: 50,
      custom: Infinity
    };
    
    const limit = planLimits[plan] || planLimits.starter;
    if (currentKeyCount >= limit) {
      throw new Error(`API key limit exceeded for ${plan} plan (${limit} keys)`);
    }
    
    // Generate API key
    const keyId = uuidv4();
    const apiKey = `tecp_${Buffer.from(uuidv4()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
    
    // Hash the key for storage
    const keyHash = await bcrypt.hash(apiKey, 10);
    
    // Store API key
    const result = await database.query(`
      INSERT INTO api_keys (id, tenant_id, name, key_hash, permissions, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, permissions, created_at
    `, [keyId, tenantId, name, keyHash, JSON.stringify(permissions)]);
    
    const savedKey = result.rows[0];
    
    logger.info('API key created', {
      tenant_id: tenantId,
      key_id: keyId,
      name,
      permissions
    });
    
    return {
      id: savedKey.id,
      key: apiKey, // Only returned once during creation
      name: savedKey.name,
      permissions: JSON.parse(savedKey.permissions),
      created_at: savedKey.created_at
    };
  }

  /**
   * List API keys for tenant (without actual key values)
   */
  async listAPIKeys(tenantId: string): Promise<Array<{
    id: string;
    name: string;
    permissions: string[];
    last_used?: Date;
    created_at: Date;
  }>> {
    const result = await database.query(`
      SELECT id, name, permissions, last_used, created_at
      FROM api_keys 
      WHERE tenant_id = $1 AND revoked_at IS NULL
      ORDER BY created_at DESC
    `, [tenantId]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      permissions: JSON.parse(row.permissions),
      last_used: row.last_used,
      created_at: row.created_at
    }));
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(tenantId: string, keyId: string): Promise<void> {
    const result = await database.query(`
      UPDATE api_keys 
      SET revoked_at = NOW()
      WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
    `, [keyId, tenantId]);
    
    if (result.rowCount === 0) {
      throw new Error('API key not found or already revoked');
    }
    
    // Remove from Redis cache
    await redis.del(`api_key:${keyId}`);
    
    logger.info('API key revoked', {
      tenant_id: tenantId,
      key_id: keyId
    });
  }

  /**
   * Middleware to authenticate JWT token
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization token required' });
        return;
      }
      
      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Get current tenant info
      const result = await database.query(`
        SELECT id, email, company, plan, created_at, updated_at
        FROM tenants 
        WHERE id = $1
      `, [decoded.tenant_id]);
      
      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      (req as AuthenticatedRequest).tenant = result.rows[0];
      next();
      
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        logger.error('Authentication error', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    }
  };

  /**
   * Middleware to authenticate API key
   */
  authenticateAPIKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        res.status(401).json({ error: 'API key required' });
        return;
      }
      
      // Check Redis cache first
      const cacheKey = `api_key:${apiKey.substring(0, 16)}`;
      const cached = await redis.get(cacheKey);
      
      let keyData;
      if (cached) {
        keyData = JSON.parse(cached);
      } else {
        // Query database for API key
        const result = await database.query(`
          SELECT ak.id, ak.tenant_id, ak.name, ak.key_hash, ak.permissions,
                 t.email, t.company, t.plan, t.created_at, t.updated_at
          FROM api_keys ak
          JOIN tenants t ON ak.tenant_id = t.id
          WHERE ak.revoked_at IS NULL
        `);
        
        // Find matching key by comparing hashes
        let matchedKey = null;
        for (const row of result.rows) {
          const isMatch = await bcrypt.compare(apiKey, row.key_hash);
          if (isMatch) {
            matchedKey = row;
            break;
          }
        }
        
        if (!matchedKey) {
          res.status(401).json({ error: 'Invalid API key' });
          return;
        }
        
        keyData = matchedKey;
        
        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(keyData));
      }
      
      // Update last used timestamp (async, don't wait)
      database.query(
        'UPDATE api_keys SET last_used = NOW() WHERE id = $1',
        [keyData.id]
      ).catch(error => logger.error('Failed to update API key last_used', error));
      
      // Set tenant and API key info on request
      (req as AuthenticatedRequest).tenant = {
        id: keyData.tenant_id,
        email: keyData.email,
        company: keyData.company,
        plan: keyData.plan,
        created_at: keyData.created_at,
        updated_at: keyData.updated_at
      };
      
      (req as AuthenticatedRequest).apiKey = {
        id: keyData.id,
        tenant_id: keyData.tenant_id,
        name: keyData.name,
        key_hash: keyData.key_hash,
        permissions: JSON.parse(keyData.permissions),
        created_at: keyData.created_at
      };
      
      next();
      
    } catch (error) {
      logger.error('API key authentication error', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  /**
   * Check if API key has required permission
   */
  requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const apiKey = (req as AuthenticatedRequest).apiKey;
      
      if (!apiKey || !apiKey.permissions.includes(permission)) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          available: apiKey?.permissions || []
        });
        return;
      }
      
      next();
    };
  };
}
