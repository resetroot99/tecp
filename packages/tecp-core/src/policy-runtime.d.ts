/**
 * TECP Policy Runtime Enforcement
 *
 * Runtime hooks for policy enforcement during computation.
 * These are proof-of-concept implementations for demonstration.
 *
 * @version TECP-0.1
 * @license Apache-2.0
 */
export interface PolicyEnforcer {
    policyId: string;
    enforce(input: string, context: PolicyContext): Promise<PolicyResult>;
}
export interface PolicyContext {
    startTime: number;
    maxDuration?: number;
    environment?: {
        region?: string;
        provider?: string;
    };
}
export interface PolicyResult {
    allowed: boolean;
    transformedInput?: string;
    evidence?: Record<string, unknown>;
    violations?: string[];
}
/**
 * PII Redaction Policy Enforcer
 * Redacts common PII patterns from input
 */
export declare class NoPIIEnforcer implements PolicyEnforcer {
    policyId: string;
    private piiPatterns;
    enforce(input: string, context: PolicyContext): Promise<PolicyResult>;
}
/**
 * TTL (Time-To-Live) Policy Enforcer
 * Aborts processing if runtime exceeds policy duration
 */
export declare class TTLEnforcer implements PolicyEnforcer {
    policyId: string;
    enforce(input: string, context: PolicyContext): Promise<PolicyResult>;
}
/**
 * Network Isolation Policy Enforcer
 * Stub implementation - in production would disable outbound HTTP
 */
export declare class NoNetworkEnforcer implements PolicyEnforcer {
    policyId: string;
    enforce(input: string, context: PolicyContext): Promise<PolicyResult>;
}
/**
 * Policy Runtime Manager
 * Coordinates multiple policy enforcers
 */
export declare class PolicyRuntime {
    private enforcers;
    constructor();
    registerEnforcer(enforcer: PolicyEnforcer): void;
    enforcePolicy(policyId: string, input: string, context: PolicyContext): Promise<PolicyResult>;
    enforcePolicies(policyIds: string[], input: string, context: PolicyContext): Promise<{
        allowed: boolean;
        transformedInput: string;
        evidence: Record<string, unknown>;
        violations: string[];
    }>;
}
//# sourceMappingURL=policy-runtime.d.ts.map