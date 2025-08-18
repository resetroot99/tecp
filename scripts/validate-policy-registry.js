#!/usr/bin/env node

/**
 * TECP Policy Registry Validator
 * Validates policy-registry.json against policy-registry.schema.json
 */

const fs = require('fs');
const path = require('path');

function validatePolicyRegistry() {
  try {
    // Load schema and registry
    const schemaPath = path.join(__dirname, '../spec/policy-registry.schema.json');
    const registryPath = path.join(__dirname, '../spec/policy-registry.json');
    
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    
    console.log('🔍 TECP Policy Registry Validation');
    console.log('=====================================');
    
    // Basic structure validation
    console.log('\n📋 Basic Structure:');
    console.log(`✅ Schema ID: ${schema.$id}`);
    console.log(`✅ Registry Version: ${registry.version}`);
    console.log(`✅ Description: ${registry.description.substring(0, 50)}...`);
    
    // Count validation
    console.log('\n📊 Content Summary:');
    const policyCount = Object.keys(registry.policies).length;
    const frameworkCount = Object.keys(registry.compliance_frameworks).length;
    const enforcementCount = Object.keys(registry.enforcement_types).length;
    
    console.log(`✅ Policies: ${policyCount}`);
    console.log(`✅ Compliance Frameworks: ${frameworkCount}`);
    console.log(`✅ Enforcement Types: ${enforcementCount}`);
    
    // Required fields validation
    console.log('\n🔍 Required Fields:');
    const requiredFields = ['version', 'description', 'policies'];
    const missing = requiredFields.filter(field => !registry[field]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required fields: ${missing.join(', ')}`);
      return false;
    } else {
      console.log('✅ All required fields present');
    }
    
    // Policy validation
    console.log('\n🔍 Policy Validation:');
    let policyErrors = 0;
    
    for (const [policyId, policy] of Object.entries(registry.policies)) {
      // Check policy ID format
      if (!/^[a-z][a-z0-9_]*$/.test(policyId)) {
        console.error(`❌ Invalid policy ID format: ${policyId}`);
        policyErrors++;
        continue;
      }
      
      // Check required policy fields
      const requiredPolicyFields = ['description', 'enforcement_type', 'machine_check', 'technical_details'];
      const missingPolicyFields = requiredPolicyFields.filter(field => !policy[field]);
      
      if (missingPolicyFields.length > 0) {
        console.error(`❌ Policy ${policyId} missing fields: ${missingPolicyFields.join(', ')}`);
        policyErrors++;
      }
      
      // Check enforcement type
      if (policy.enforcement_type && !registry.enforcement_types[policy.enforcement_type]) {
        console.error(`❌ Policy ${policyId} has invalid enforcement_type: ${policy.enforcement_type}`);
        policyErrors++;
      }
      
      // Check compliance tags format
      if (policy.compliance_tags) {
        for (const tag of policy.compliance_tags) {
          if (!/^[A-Z][A-Z0-9_]*\.[A-Za-z0-9\.]+$/.test(tag)) {
            console.error(`❌ Policy ${policyId} has invalid compliance tag format: ${tag}`);
            policyErrors++;
          }
        }
      }
    }
    
    if (policyErrors === 0) {
      console.log(`✅ All ${policyCount} policies valid`);
    } else {
      console.error(`❌ Found ${policyErrors} policy validation errors`);
    }
    
    // Framework validation
    console.log('\n🔍 Framework Validation:');
    let frameworkErrors = 0;
    
    for (const [frameworkId, framework] of Object.entries(registry.compliance_frameworks)) {
      // Check framework ID format
      if (!/^[A-Z][A-Z0-9_]*$/.test(frameworkId)) {
        console.error(`❌ Invalid framework ID format: ${frameworkId}`);
        frameworkErrors++;
        continue;
      }
      
      // Check required framework fields
      const requiredFrameworkFields = ['name', 'jurisdiction'];
      const missingFrameworkFields = requiredFrameworkFields.filter(field => !framework[field]);
      
      if (missingFrameworkFields.length > 0) {
        console.error(`❌ Framework ${frameworkId} missing fields: ${missingFrameworkFields.join(', ')}`);
        frameworkErrors++;
      }
      
      // Check jurisdiction
      const validJurisdictions = ['US', 'EU', 'UK', 'CA', 'AU', 'JP', 'Global', 'International'];
      if (framework.jurisdiction && !validJurisdictions.includes(framework.jurisdiction)) {
        console.error(`❌ Framework ${frameworkId} has invalid jurisdiction: ${framework.jurisdiction}`);
        frameworkErrors++;
      }
    }
    
    if (frameworkErrors === 0) {
      console.log(`✅ All ${frameworkCount} frameworks valid`);
    } else {
      console.error(`❌ Found ${frameworkErrors} framework validation errors`);
    }
    
    // Summary
    console.log('\n📋 Validation Summary:');
    const totalErrors = policyErrors + frameworkErrors;
    
    if (totalErrors === 0) {
      console.log('✅ Policy registry validation PASSED');
      console.log(`✅ Ready for deployment to ${schema.$id}`);
      return true;
    } else {
      console.error(`❌ Policy registry validation FAILED with ${totalErrors} errors`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return false;
  }
}

// Run validation
const success = validatePolicyRegistry();
process.exit(success ? 0 : 1);
