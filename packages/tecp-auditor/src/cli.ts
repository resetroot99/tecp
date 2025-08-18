#!/usr/bin/env node
/**
 * TECP Auditor CLI
 * 
 * Compliance validation tool for TECP receipts.
 * Validates receipts against specific regulatory frameworks.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { table } from 'table';
import { ReceiptVerifier } from '../../tecp-core/dist/index.js';
import type { FullReceipt } from '../../tecp-core/dist/index.js';

interface PolicyRegistry {
  policies: Record<string, PolicyDefinition>;
  regulatory_frameworks: Record<string, RegulatoryFramework>;
}

interface PolicyDefinition {
  description: string;
  enforcement_type: string;
  machine_check: string;
  compliance_tags: string[];
  technical_details: string;
  regulatory_framework?: string;
}

interface RegulatoryFramework {
  name: string;
  jurisdiction: string;
  url: string;
  key_articles?: Record<string, string>;
  key_requirements?: Record<string, string>;
  key_controls?: Record<string, string>;
  key_provisions?: Record<string, string>;
}

interface ComplianceCheck {
  policy_id: string;
  compliant: boolean;
  framework: string;
  requirement: string;
  evidence: string;
  issues: string[];
}

interface AuditResult {
  receipt_valid: boolean;
  compliance_checks: ComplianceCheck[];
  overall_compliant: boolean;
  frameworks_covered: string[];
  recommendations: string[];
}

class TECPAuditor {
  private policyRegistry: PolicyRegistry;
  private verifier: ReceiptVerifier;

  constructor() {
    this.verifier = new ReceiptVerifier();
    this.loadPolicyRegistry();
  }

  private loadPolicyRegistry() {
    try {
      const registryData = readFileSync('spec/policy-registry.json', 'utf8');
      this.policyRegistry = JSON.parse(registryData);
    } catch (error) {
      console.error(chalk.red('❌ Failed to load policy registry:'), error.message);
      process.exit(1);
    }
  }

  async auditReceipt(receiptPath: string, targetFramework?: string): Promise<AuditResult> {
    // Load and verify receipt
    const receiptData = JSON.parse(readFileSync(receiptPath, 'utf8'));
    const verificationResult = await this.verifier.verify(receiptData);

    if (!verificationResult.valid) {
      return {
        receipt_valid: false,
        compliance_checks: [],
        overall_compliant: false,
        frameworks_covered: [],
        recommendations: ['Receipt verification failed - fix cryptographic issues first']
      };
    }

    // Perform compliance checks
    const complianceChecks: ComplianceCheck[] = [];
    const frameworksCovered = new Set<string>();

    for (const policyId of receiptData.policy_ids || []) {
      const policy = this.policyRegistry.policies[policyId];
      
      if (!policy) {
        complianceChecks.push({
          policy_id: policyId,
          compliant: false,
          framework: 'Unknown',
          requirement: 'Policy definition not found',
          evidence: 'Policy ID not in registry',
          issues: ['Unknown policy ID - cannot validate compliance']
        });
        continue;
      }

      // Skip if filtering by framework and this policy doesn't match
      if (targetFramework && policy.regulatory_framework !== targetFramework) {
        continue;
      }

      const check = this.validatePolicyCompliance(policyId, policy, receiptData);
      complianceChecks.push(check);
      
      if (policy.regulatory_framework) {
        frameworksCovered.add(policy.regulatory_framework);
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(complianceChecks, receiptData);

    return {
      receipt_valid: true,
      compliance_checks: complianceChecks,
      overall_compliant: complianceChecks.every(c => c.compliant),
      frameworks_covered: Array.from(frameworksCovered),
      recommendations
    };
  }

  private validatePolicyCompliance(
    policyId: string, 
    policy: PolicyDefinition, 
    receipt: FullReceipt
  ): ComplianceCheck {
    const issues: string[] = [];
    let compliant = true;
    let evidence = '';

    // Validate based on enforcement type
    switch (policy.enforcement_type) {
      case 'design':
        evidence = 'Policy enforced through system design';
        // Check for design-related evidence in receipt
        if (!receipt.code_ref) {
          issues.push('No code reference provided for design verification');
          compliant = false;
        }
        break;

      case 'cryptographic':
        evidence = 'Cryptographic enforcement verified';
        // Check for cryptographic evidence
        if (policyId === 'key_erasure' && !receipt.key_erasure) {
          issues.push('Key erasure policy claimed but no erasure proof provided');
          compliant = false;
        }
        break;

      case 'infrastructure':
        evidence = 'Infrastructure constraints verified';
        // Check for infrastructure evidence
        if (policyId === 'eu_region' && !receipt.environment?.region?.includes('eu')) {
          issues.push('EU region policy claimed but no EU region evidence');
          compliant = false;
        }
        break;

      case 'runtime':
        evidence = 'Runtime monitoring enforced';
        // Check for runtime evidence
        if (!receipt.ts || Date.now() - receipt.ts > 24 * 60 * 60 * 1000) {
          issues.push('Runtime policy requires recent execution timestamp');
          compliant = false;
        }
        break;

      case 'code_audit':
        evidence = 'Code audit verification required';
        // Check for audit evidence
        if (!receipt.code_ref || !receipt.code_ref.includes('git:')) {
          issues.push('Code audit policy requires verifiable code reference');
          compliant = false;
        }
        break;

      default:
        issues.push(`Unknown enforcement type: ${policy.enforcement_type}`);
        compliant = false;
    }

    // Framework-specific validations
    const framework = policy.regulatory_framework || 'Generic';
    let requirement = policy.description;

    if (framework === 'GDPR') {
      requirement = this.getGDPRRequirement(policyId, policy);
    } else if (framework === 'HIPAA') {
      requirement = this.getHIPAARequirement(policyId, policy);
    } else if (framework === 'PCI DSS') {
      requirement = this.getPCIRequirement(policyId, policy);
    }

    return {
      policy_id: policyId,
      compliant,
      framework,
      requirement,
      evidence,
      issues
    };
  }

  private getGDPRRequirement(policyId: string, policy: PolicyDefinition): string {
    const gdprMappings: Record<string, string> = {
      'no_retention': 'Article 17 - Right to erasure (right to be forgotten)',
      'eu_region': 'Article 44 - General principle for transfers',
      'gdpr_art6_lawful': 'Article 6 - Lawfulness of processing',
      'no_export_pii': 'Article 4 - Definitions (personal data protection)'
    };
    return gdprMappings[policyId] || policy.description;
  }

  private getHIPAARequirement(policyId: string, policy: PolicyDefinition): string {
    const hipaaMappings: Record<string, string> = {
      'hipaa_safe': '164.530 - Administrative safeguards',
      'no_export_pii': '164.514 - De-identification of protected health information',
      'key_erasure': '164.312 - Technical safeguards'
    };
    return hipaaMappings[policyId] || policy.description;
  }

  private getPCIRequirement(policyId: string, policy: PolicyDefinition): string {
    const pciMappings: Record<string, string> = {
      'pci_dss_compliant': 'Requirement 3 - Protect stored cardholder data',
      'key_erasure': 'Requirement 3.4 - Cryptographic key management'
    };
    return pciMappings[policyId] || policy.description;
  }

  private generateRecommendations(checks: ComplianceCheck[], receipt: FullReceipt): string[] {
    const recommendations: string[] = [];
    const failedChecks = checks.filter(c => !c.compliant);

    if (failedChecks.length === 0) {
      recommendations.push('✅ All compliance checks passed');
      return recommendations;
    }

    // General recommendations
    if (failedChecks.some(c => c.issues.includes('No code reference provided'))) {
      recommendations.push('Add verifiable code reference (git commit hash or build hash)');
    }

    if (failedChecks.some(c => c.issues.includes('no erasure proof provided'))) {
      recommendations.push('Include key erasure proof in receipt extensions');
    }

    if (failedChecks.some(c => c.issues.includes('no EU region evidence'))) {
      recommendations.push('Add environment metadata with region information');
    }

    // Framework-specific recommendations
    const frameworks = new Set(checks.map(c => c.framework));
    
    if (frameworks.has('GDPR')) {
      recommendations.push('Consider adding transparency log inclusion for GDPR compliance');
    }

    if (frameworks.has('HIPAA')) {
      recommendations.push('Ensure minimum necessary principle is enforced in processing');
    }

    if (frameworks.has('PCI DSS')) {
      recommendations.push('Validate secure cardholder data environment attestation');
    }

    return recommendations;
  }

  displayAuditResult(result: AuditResult, format: 'table' | 'json' = 'table') {
    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Display header
    console.log(chalk.bold('\n🔍 TECP Compliance Audit Report'));
    console.log('═'.repeat(50));

    // Overall status
    const statusColor = result.overall_compliant ? chalk.green : chalk.red;
    const statusIcon = result.overall_compliant ? '✅' : '❌';
    console.log(`${statusIcon} Overall Compliance: ${statusColor(result.overall_compliant ? 'COMPLIANT' : 'NON-COMPLIANT')}`);
    console.log(`📋 Receipt Valid: ${result.receipt_valid ? '✅' : '❌'}`);
    console.log(`🏛️  Frameworks: ${result.frameworks_covered.join(', ') || 'None'}`);

    // Compliance checks table
    if (result.compliance_checks.length > 0) {
      console.log('\n📊 Compliance Checks:');
      
      const tableData = [
        ['Policy ID', 'Framework', 'Status', 'Requirement', 'Issues']
      ];

      for (const check of result.compliance_checks) {
        const status = check.compliant ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
        const issues = check.issues.length > 0 ? check.issues.join('; ') : 'None';
        
        tableData.push([
          check.policy_id,
          check.framework,
          status,
          check.requirement.substring(0, 40) + (check.requirement.length > 40 ? '...' : ''),
          issues.substring(0, 30) + (issues.length > 30 ? '...' : '')
        ]);
      }

      console.log(table(tableData, {
        border: {
          topBody: '─',
          topJoin: '┬',
          topLeft: '┌',
          topRight: '┐',
          bottomBody: '─',
          bottomJoin: '┴',
          bottomLeft: '└',
          bottomRight: '┘',
          bodyLeft: '│',
          bodyRight: '│',
          bodyJoin: '│',
          joinBody: '─',
          joinLeft: '├',
          joinRight: '┤',
          joinJoin: '┼'
        }
      }));
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      for (const rec of result.recommendations) {
        console.log(`   • ${rec}`);
      }
    }

    console.log('');
  }
}

// CLI setup
const program = new Command();

program
  .name('tecp-audit')
  .description('TECP Compliance Auditor - Validate receipts against regulatory frameworks')
  .version('0.1.0');

program
  .command('receipt')
  .description('Audit a TECP receipt for compliance')
  .argument('<receipt-file>', 'Path to TECP receipt JSON file')
  .option('-f, --framework <framework>', 'Filter by regulatory framework (GDPR, HIPAA, PCI DSS, etc.)')
  .option('-j, --json', 'Output results in JSON format')
  .option('-v, --verbose', 'Verbose output with detailed explanations')
  .action(async (receiptFile, options) => {
    const spinner = ora('Auditing TECP receipt...').start();
    
    try {
      const auditor = new TECPAuditor();
      const result = await auditor.auditReceipt(receiptFile, options.framework);
      
      spinner.stop();
      auditor.displayAuditResult(result, options.json ? 'json' : 'table');
      
      // Exit with error code if not compliant
      process.exit(result.overall_compliant ? 0 : 1);
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('❌ Audit failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('policies')
  .description('List available compliance policies')
  .option('-f, --framework <framework>', 'Filter by regulatory framework')
  .action((options) => {
    try {
      const registryData = readFileSync('spec/policy-registry.json', 'utf8');
      const registry = JSON.parse(registryData);
      
      console.log(chalk.bold('\n📋 Available Compliance Policies'));
      console.log('═'.repeat(50));
      
      const tableData = [['Policy ID', 'Framework', 'Enforcement', 'Description']];
      
      for (const [policyId, policy] of Object.entries(registry.policies)) {
        const policyDef = policy as PolicyDefinition;
        
        if (options.framework && policyDef.regulatory_framework !== options.framework) {
          continue;
        }
        
        tableData.push([
          policyId,
          policyDef.regulatory_framework || 'Generic',
          policyDef.enforcement_type,
          policyDef.description.substring(0, 50) + (policyDef.description.length > 50 ? '...' : '')
        ]);
      }
      
      console.log(table(tableData));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to load policies:'), error.message);
      process.exit(1);
    }
  });

program
  .command('frameworks')
  .description('List supported regulatory frameworks')
  .action(() => {
    try {
      const registryData = readFileSync('spec/policy-registry.json', 'utf8');
      const registry = JSON.parse(registryData);
      
      console.log(chalk.bold('\n🏛️  Supported Regulatory Frameworks'));
      console.log('═'.repeat(50));
      
      const tableData = [['Framework', 'Jurisdiction', 'Description']];
      
      for (const [frameworkId, framework] of Object.entries(registry.regulatory_frameworks || {})) {
        const frameworkDef = framework as RegulatoryFramework;
        
        tableData.push([
          frameworkDef.name,
          frameworkDef.jurisdiction,
          frameworkId
        ]);
      }
      
      console.log(table(tableData));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to load frameworks:'), error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

export default program;
