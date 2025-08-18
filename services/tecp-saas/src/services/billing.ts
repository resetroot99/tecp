/**
 * TECP SaaS Billing Service
 * 
 * Handles subscription management, usage billing, and plan limits
 * with Stripe integration for payment processing.
 */

import Stripe from 'stripe';
import { database } from '../utils/database.js';
import { logger } from '../utils/logger.js';

export interface PlanLimits {
  log_entries_per_month: number;
  ai_requests_per_month: number;
  api_keys_limit: number;
  retention_days: number;
  support_level: 'community' | 'email' | 'priority';
  sla_uptime?: number;
}

export interface BillingInfo {
  tenant_id: string;
  plan: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start: Date;
  current_period_end: Date;
  usage_this_period: {
    log_entries: number;
    ai_requests: number;
    tokens_processed: number;
  };
  limits: PlanLimits;
  next_billing_date?: Date;
  amount_due?: number;
  payment_method?: {
    type: string;
    last4?: string;
    brand?: string;
  };
}

export class BillingService {
  private stripe: Stripe;
  
  // Plan configurations
  private plans: Record<string, PlanLimits & { price_monthly: number; stripe_price_id?: string }> = {
    starter: {
      log_entries_per_month: 10000,
      ai_requests_per_month: 1000,
      api_keys_limit: 3,
      retention_days: 30,
      support_level: 'community',
      price_monthly: 0,
    },
    
    professional: {
      log_entries_per_month: 100000,
      ai_requests_per_month: 10000,
      api_keys_limit: 10,
      retention_days: 90,
      support_level: 'email',
      sla_uptime: 99.5,
      price_monthly: 49,
      stripe_price_id: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    },
    
    enterprise: {
      log_entries_per_month: 1000000,
      ai_requests_per_month: 100000,
      api_keys_limit: 50,
      retention_days: 365,
      support_level: 'priority',
      sla_uptime: 99.9,
      price_monthly: 299,
      stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    },
    
    custom: {
      log_entries_per_month: Infinity,
      ai_requests_per_month: Infinity,
      api_keys_limit: Infinity,
      retention_days: 2555, // 7 years
      support_level: 'priority',
      sla_uptime: 99.95,
      price_monthly: 0, // Custom pricing
    }
  };

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not configured - billing features disabled');
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
    }
  }

  /**
   * Get plan limits for a given plan
   */
  getPlanLimits(plan: string): PlanLimits {
    const planConfig = this.plans[plan] || this.plans.starter;
    const { price_monthly, stripe_price_id, ...limits } = planConfig;
    return limits;
  }

  /**
   * Get available plans for upgrade
   */
  getAvailablePlans() {
    return Object.entries(this.plans).map(([name, config]) => ({
      name,
      price_monthly: config.price_monthly,
      limits: this.getPlanLimits(name),
      features: this.getPlanFeatures(name)
    }));
  }

  /**
   * Get plan features for marketing
   */
  private getPlanFeatures(plan: string): string[] {
    const features: Record<string, string[]> = {
      starter: [
        '10K log entries/month',
        '1K AI requests/month',
        '3 API keys',
        '30-day retention',
        'Community support'
      ],
      professional: [
        '100K log entries/month',
        '10K AI requests/month',
        '10 API keys',
        '90-day retention',
        'Email support',
        '99.5% SLA uptime'
      ],
      enterprise: [
        '1M log entries/month',
        '100K AI requests/month',
        '50 API keys',
        '1-year retention',
        'Priority support',
        '99.9% SLA uptime',
        'Custom integrations'
      ],
      custom: [
        'Unlimited usage',
        'Custom retention',
        'Unlimited API keys',
        'Dedicated support',
        '99.95% SLA uptime',
        'On-premise deployment',
        'Custom compliance'
      ]
    };
    
    return features[plan] || features.starter;
  }

  /**
   * Get billing information for a tenant
   */
  async getBillingInfo(tenantId: string): Promise<BillingInfo> {
    try {
      // Get tenant subscription info
      const tenantQuery = `
        SELECT plan, stripe_customer_id, stripe_subscription_id, 
               current_period_start, current_period_end
        FROM tenants 
        WHERE id = $1
      `;
      const tenantResult = await database.query(tenantQuery, [tenantId]);
      
      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found');
      }
      
      const tenant = tenantResult.rows[0];
      
      // Get usage for current period
      const usageQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN event_type = 'log_entry' THEN quantity ELSE 0 END), 0) as log_entries,
          COALESCE(SUM(CASE WHEN event_type = 'ai_request' THEN quantity ELSE 0 END), 0) as ai_requests,
          COALESCE(SUM(CASE WHEN event_type = 'tokens_processed' THEN quantity ELSE 0 END), 0) as tokens_processed
        FROM usage_events 
        WHERE tenant_id = $1 
          AND created_at >= $2 
          AND created_at <= $3
      `;
      
      const usageResult = await database.query(usageQuery, [
        tenantId,
        tenant.current_period_start,
        tenant.current_period_end
      ]);
      
      const usage = usageResult.rows[0];
      
      // Get Stripe subscription details if available
      let paymentMethod;
      let nextBillingDate;
      let amountDue;
      
      if (this.stripe && tenant.stripe_subscription_id) {
        try {
          const subscription = await this.stripe.subscriptions.retrieve(
            tenant.stripe_subscription_id,
            { expand: ['default_payment_method'] }
          );
          
          nextBillingDate = new Date(subscription.current_period_end * 1000);
          amountDue = subscription.items.data[0]?.price.unit_amount || 0;
          
          const pm = subscription.default_payment_method as Stripe.PaymentMethod;
          if (pm && pm.card) {
            paymentMethod = {
              type: 'card',
              last4: pm.card.last4,
              brand: pm.card.brand
            };
          }
        } catch (error) {
          logger.error('Failed to fetch Stripe subscription', error);
        }
      }
      
      return {
        tenant_id: tenantId,
        plan: tenant.plan,
        stripe_customer_id: tenant.stripe_customer_id,
        stripe_subscription_id: tenant.stripe_subscription_id,
        current_period_start: tenant.current_period_start,
        current_period_end: tenant.current_period_end,
        usage_this_period: {
          log_entries: parseInt(usage.log_entries),
          ai_requests: parseInt(usage.ai_requests),
          tokens_processed: parseInt(usage.tokens_processed)
        },
        limits: this.getPlanLimits(tenant.plan),
        next_billing_date: nextBillingDate,
        amount_due: amountDue ? amountDue / 100 : undefined, // Convert cents to dollars
        payment_method: paymentMethod
      };
      
    } catch (error) {
      logger.error('Failed to get billing info', error);
      throw error;
    }
  }

  /**
   * Create Stripe customer and subscription for plan upgrade
   */
  async upgradePlan(tenantId: string, newPlan: string, paymentMethodId?: string): Promise<{
    success: boolean;
    subscription_id?: string;
    client_secret?: string;
    error?: string;
  }> {
    if (!this.stripe) {
      return { success: false, error: 'Billing not configured' };
    }
    
    try {
      const planConfig = this.plans[newPlan];
      if (!planConfig || !planConfig.stripe_price_id) {
        return { success: false, error: 'Invalid plan or pricing not configured' };
      }
      
      // Get tenant info
      const tenantQuery = `
        SELECT email, company, stripe_customer_id 
        FROM tenants 
        WHERE id = $1
      `;
      const tenantResult = await database.query(tenantQuery, [tenantId]);
      
      if (tenantResult.rows.length === 0) {
        return { success: false, error: 'Tenant not found' };
      }
      
      const tenant = tenantResult.rows[0];
      let customerId = tenant.stripe_customer_id;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: tenant.email,
          name: tenant.company,
          metadata: {
            tenant_id: tenantId
          }
        });
        
        customerId = customer.id;
        
        // Update tenant with customer ID
        await database.query(
          'UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, tenantId]
        );
      }
      
      // Attach payment method if provided
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        });
      }
      
      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: planConfig.stripe_price_id
        }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          tenant_id: tenantId,
          plan: newPlan
        }
      });
      
      // Update tenant plan and billing period
      const periodStart = new Date(subscription.current_period_start * 1000);
      const periodEnd = new Date(subscription.current_period_end * 1000);
      
      await database.query(`
        UPDATE tenants 
        SET plan = $1, 
            stripe_subscription_id = $2,
            current_period_start = $3,
            current_period_end = $4,
            updated_at = NOW()
        WHERE id = $5
      `, [newPlan, subscription.id, periodStart, periodEnd, tenantId]);
      
      // Log the upgrade
      await database.query(`
        INSERT INTO usage_events (tenant_id, event_type, quantity, metadata, created_at)
        VALUES ($1, 'plan_upgrade', 1, $2, NOW())
      `, [tenantId, JSON.stringify({ from_plan: tenant.plan, to_plan: newPlan })]);
      
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      
      return {
        success: true,
        subscription_id: subscription.id,
        client_secret: paymentIntent?.client_secret
      };
      
    } catch (error) {
      logger.error('Plan upgrade failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upgrade failed'
      };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;
          
        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }
    } catch (error) {
      logger.error('Webhook handling failed', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const tenantId = invoice.subscription_details?.metadata?.tenant_id;
    if (!tenantId) return;
    
    logger.info('Payment succeeded', { tenant_id: tenantId, amount: invoice.amount_paid });
    
    // Update billing period
    if (invoice.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
      
      await database.query(`
        UPDATE tenants 
        SET current_period_start = $1,
            current_period_end = $2
        WHERE id = $3
      `, [
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        tenantId
      ]);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const tenantId = invoice.subscription_details?.metadata?.tenant_id;
    if (!tenantId) return;
    
    logger.warn('Payment failed', { tenant_id: tenantId, amount: invoice.amount_due });
    
    // Could implement grace period, notifications, etc.
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata.tenant_id;
    if (!tenantId) return;
    
    logger.info('Subscription canceled', { tenant_id: tenantId });
    
    // Downgrade to starter plan
    await database.query(`
      UPDATE tenants 
      SET plan = 'starter',
          stripe_subscription_id = NULL
      WHERE id = $1
    `, [tenantId]);
  }

  /**
   * Calculate usage-based billing for custom plans
   */
  async calculateUsageBilling(tenantId: string, periodStart: Date, periodEnd: Date): Promise<{
    log_entries_cost: number;
    ai_requests_cost: number;
    tokens_cost: number;
    total_cost: number;
  }> {
    const usageQuery = `
      SELECT 
        event_type,
        SUM(quantity) as total_quantity
      FROM usage_events 
      WHERE tenant_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
      GROUP BY event_type
    `;
    
    const result = await database.query(usageQuery, [tenantId, periodStart, periodEnd]);
    
    // Usage-based pricing (example rates)
    const rates = {
      log_entry: 0.001,      // $0.001 per log entry
      ai_request: 0.01,      // $0.01 per AI request
      tokens_processed: 0.00001 // $0.00001 per token
    };
    
    let logEntriesCost = 0;
    let aiRequestsCost = 0;
    let tokensCost = 0;
    
    for (const row of result.rows) {
      const quantity = parseInt(row.total_quantity);
      
      switch (row.event_type) {
        case 'log_entry':
          logEntriesCost = quantity * rates.log_entry;
          break;
        case 'ai_request':
          aiRequestsCost = quantity * rates.ai_request;
          break;
        case 'tokens_processed':
          tokensCost = quantity * rates.tokens_processed;
          break;
      }
    }
    
    return {
      log_entries_cost: logEntriesCost,
      ai_requests_cost: aiRequestsCost,
      tokens_cost: tokensCost,
      total_cost: logEntriesCost + aiRequestsCost + tokensCost
    };
  }
}
