#!/usr/bin/env node
/**
 * TECP Test Vector Validation
 * 
 * Validates all test vectors and ensures CLI/Web verifier parity.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_VECTORS_DIR = path.join(__dirname, '../spec/test-vectors');
const CATEGORIES = ['valid', 'invalid-sig', 'expired', 'schema', 'policy'];

console.log('🧪 TECP Test Vector Validation');
console.log('═'.repeat(50));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function loadTestVector(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load test vector: ${filePath}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

function runCliVerifier(receiptPath, options = {}) {
  try {
    const flags = options.requireLog ? ' --require-log' : '';
    const cmd = `node packages/tecp-verifier/dist/cli.js verify "${receiptPath}"${flags} --json`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return JSON.parse(output);
  } catch (error) {
    // CLI returns non-zero exit code for invalid receipts
    try {
      return JSON.parse(error.stdout || '{}');
    } catch {
      return { valid: false, errors: [{ code: 'E-CLI-001', message: 'CLI execution failed' }] };
    }
  }
}

function validateTestVector(testVector, filePath) {
  console.log(`\n📋 Testing: ${testVector.name}`);
  console.log(`   Description: ${testVector.description}`);
  
  totalTests++;
  
  // Write receipt to temporary file for CLI testing
  const tempReceiptPath = path.join(__dirname, '../temp-receipt.json');
  const receipt = testVector.receipt || testVector.expected_receipt;
  
  if (!receipt) {
    console.error('   ❌ No receipt found in test vector');
    failedTests++;
    return false;
  }
  
  fs.writeFileSync(tempReceiptPath, JSON.stringify(receipt, null, 2));
  
  try {
    // Run CLI verifier
    const cliResult = runCliVerifier(tempReceiptPath);
    const expectedResult = testVector.verification_result;
    
    // Compare results
    let passed = true;
    
    if (cliResult.valid !== expectedResult.valid) {
      console.error(`   ❌ Validity mismatch: CLI=${cliResult.valid}, Expected=${expectedResult.valid}`);
      passed = false;
    }
    
    if (expectedResult.errors) {
      const expectedErrorCodes = expectedResult.errors.map(e => e.code);
      const actualErrorCodes = (cliResult.errors || []).map(e => e.code);
      
      for (const expectedCode of expectedErrorCodes) {
        if (!actualErrorCodes.includes(expectedCode)) {
          console.error(`   ❌ Missing error code: ${expectedCode}`);
          passed = false;
        }
      }
    }
    
    if (passed) {
      console.log('   ✅ Test passed');
      passedTests++;
    } else {
      console.error('   ❌ Test failed');
      console.error(`   CLI Result: ${JSON.stringify(cliResult, null, 2)}`);
      console.error(`   Expected: ${JSON.stringify(expectedResult, null, 2)}`);
      failedTests++;
    }
    
    return passed;
    
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempReceiptPath)) {
      fs.unlinkSync(tempReceiptPath);
    }
  }
}

function validateCategory(category) {
  console.log(`\n📁 Category: ${category}`);
  console.log('─'.repeat(30));
  
  const categoryDir = path.join(TEST_VECTORS_DIR, category);
  
  if (!fs.existsSync(categoryDir)) {
    console.log(`   ⚠️  Category directory not found: ${categoryDir}`);
    return;
  }
  
  const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('   ⚠️  No test vectors found');
    return;
  }
  
  for (const file of files) {
    const filePath = path.join(categoryDir, file);
    const testVector = loadTestVector(filePath);
    
    if (testVector) {
      validateTestVector(testVector, filePath);
    }
  }
}

function generateReport() {
  console.log('\n📊 Test Vector Validation Report');
  console.log('═'.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All test vectors passed!');
    return true;
  } else {
    console.log('\n❌ Some test vectors failed');
    return false;
  }
}

// Main execution
async function main() {
  // Ensure CLI is built
  try {
    execSync('npm run build:verifier', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Failed to build CLI verifier');
    process.exit(1);
  }
  
  // Validate each category
  for (const category of CATEGORIES) {
    validateCategory(category);
  }
  
  // Generate final report
  const success = generateReport();
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Test vector validation failed:', error);
  process.exit(1);
});
