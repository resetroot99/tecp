#!/usr/bin/env node
/**
 * TECP Fuzz Testing Suite
 * 
 * Generates malformed receipts and tests verifier robustness.
 * Ensures consistent error handling across implementations.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🔀 TECP Fuzz Testing Suite');
console.log('═'.repeat(40));

// Base valid receipt for mutation
const BASE_RECEIPT = {
  version: "TECP-0.1",
  code_ref: "git:abc123def456",
  ts: Date.now(),
  nonce: "dGVzdC1ub25jZS0xMjM=",
  input_hash: "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=",
  output_hash: "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f",
  policy_ids: ["no_retention"],
  sig: "MEUCIQDKmxK8Zy8+1Vz9Xh2YjF3pL4mN5qR7sT8uV9wX0yZ1aQIgB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4a5b6c=",
  pubkey: "MCowBQYDK2VwAyEAm9J4k8XlBw5+/qdTEJg0j5DQFJ7vYV8m5X7qR3E2dA=="
};

let testCount = 0;
let crashCount = 0;
let errorCount = 0;

function runVerifier(receipt) {
  const tempFile = 'temp-fuzz-receipt.json';
  
  try {
    fs.writeFileSync(tempFile, JSON.stringify(receipt, null, 2));
    
    const result = execSync(
      `node packages/tecp-verifier/dist/cli.js verify "${tempFile}" --json`,
      { encoding: 'utf8', stdio: 'pipe', timeout: 5000 }
    );
    
    return { success: true, result: JSON.parse(result) };
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      return { success: false, error: 'TIMEOUT', crashed: true };
    }
    
    try {
      const result = JSON.parse(error.stdout || '{}');
      return { success: false, result, error: 'EXPECTED_FAILURE' };
    } catch {
      return { success: false, error: 'PARSE_ERROR', crashed: true };
    }
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function generateRandomString(length) {
  return crypto.randomBytes(length).toString('base64');
}

function generateRandomNumber() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function mutateField(receipt, field, mutationType) {
  const mutated = JSON.parse(JSON.stringify(receipt));
  
  switch (mutationType) {
    case 'delete':
      delete mutated[field];
      break;
    case 'null':
      mutated[field] = null;
      break;
    case 'wrong_type_string':
      mutated[field] = generateRandomString(20);
      break;
    case 'wrong_type_number':
      mutated[field] = generateRandomNumber();
      break;
    case 'wrong_type_array':
      mutated[field] = [generateRandomString(10)];
      break;
    case 'wrong_type_object':
      mutated[field] = { random: generateRandomString(10) };
      break;
    case 'empty_string':
      mutated[field] = '';
      break;
    case 'very_long_string':
      mutated[field] = generateRandomString(10000);
      break;
    case 'invalid_base64':
      mutated[field] = 'invalid-base64-string!!!';
      break;
    case 'malformed_json':
      mutated[field] = '{"malformed": json}';
      break;
    default:
      mutated[field] = generateRandomString(20);
  }
  
  return mutated;
}

function testFieldMutations() {
  console.log('\n🧬 Testing field mutations...');
  
  const fields = Object.keys(BASE_RECEIPT);
  const mutations = [
    'delete', 'null', 'wrong_type_string', 'wrong_type_number',
    'wrong_type_array', 'wrong_type_object', 'empty_string',
    'very_long_string', 'invalid_base64'
  ];
  
  for (const field of fields) {
    for (const mutation of mutations) {
      testCount++;
      const mutated = mutateField(BASE_RECEIPT, field, mutation);
      const result = runVerifier(mutated);
      
      if (result.crashed) {
        console.error(`❌ CRASH: ${field} + ${mutation}`);
        crashCount++;
      } else if (result.success) {
        console.warn(`⚠️  UNEXPECTED SUCCESS: ${field} + ${mutation}`);
      } else {
        // Expected failure
        errorCount++;
      }
      
      if (testCount % 50 === 0) {
        process.stdout.write('.');
      }
    }
  }
}

function testStructuralMutations() {
  console.log('\n🏗️  Testing structural mutations...');
  
  const structuralTests = [
    // Empty object
    {},
    // Array instead of object
    [],
    // String instead of object
    "not an object",
    // Number instead of object
    42,
    // Null
    null,
    // Deeply nested object
    { a: { b: { c: { d: { e: "deep" } } } } },
    // Object with circular reference (will be stringified)
    (() => {
      const obj = { ...BASE_RECEIPT };
      obj.circular = obj;
      return obj;
    })(),
    // Very large object
    (() => {
      const obj = { ...BASE_RECEIPT };
      for (let i = 0; i < 1000; i++) {
        obj[`field_${i}`] = generateRandomString(100);
      }
      return obj;
    })(),
  ];
  
  for (const testCase of structuralTests) {
    testCount++;
    const result = runVerifier(testCase);
    
    if (result.crashed) {
      console.error(`❌ CRASH: Structural test`);
      crashCount++;
    } else {
      errorCount++;
    }
  }
}

function testEncodingIssues() {
  console.log('\n🔤 Testing encoding issues...');
  
  const encodingTests = [
    // Invalid UTF-8 sequences
    { ...BASE_RECEIPT, code_ref: '\uFFFD\uFFFE' },
    // Control characters
    { ...BASE_RECEIPT, code_ref: '\x00\x01\x02\x03' },
    // Unicode edge cases
    { ...BASE_RECEIPT, code_ref: '🚀💻🔒' },
    // Very long strings
    { ...BASE_RECEIPT, code_ref: 'x'.repeat(100000) },
    // Binary data
    { ...BASE_RECEIPT, nonce: Buffer.from([0, 1, 2, 3]).toString('binary') },
  ];
  
  for (const testCase of encodingTests) {
    testCount++;
    const result = runVerifier(testCase);
    
    if (result.crashed) {
      console.error(`❌ CRASH: Encoding test`);
      crashCount++;
    } else {
      errorCount++;
    }
  }
}

function testTimestampEdgeCases() {
  console.log('\n⏰ Testing timestamp edge cases...');
  
  const timestampTests = [
    // Far future
    { ...BASE_RECEIPT, ts: Date.now() + 365 * 24 * 60 * 60 * 1000 },
    // Far past
    { ...BASE_RECEIPT, ts: 0 },
    // Negative timestamp
    { ...BASE_RECEIPT, ts: -1 },
    // Very large timestamp
    { ...BASE_RECEIPT, ts: Number.MAX_SAFE_INTEGER },
    // Float timestamp
    { ...BASE_RECEIPT, ts: Date.now() + 0.5 },
    // String timestamp
    { ...BASE_RECEIPT, ts: Date.now().toString() },
  ];
  
  for (const testCase of timestampTests) {
    testCount++;
    const result = runVerifier(testCase);
    
    if (result.crashed) {
      console.error(`❌ CRASH: Timestamp test`);
      crashCount++;
    } else {
      errorCount++;
    }
  }
}

function generateReport() {
  console.log('\n📊 Fuzz Testing Report');
  console.log('═'.repeat(40));
  console.log(`Total Tests: ${testCount}`);
  console.log(`Crashes: ${crashCount} (${Math.round(crashCount/testCount*100)}%)`);
  console.log(`Expected Errors: ${errorCount} (${Math.round(errorCount/testCount*100)}%)`);
  console.log(`Unexpected Successes: ${testCount - crashCount - errorCount}`);
  
  if (crashCount === 0) {
    console.log('\n🎉 No crashes detected! Verifier is robust.');
    return true;
  } else {
    console.log('\n❌ Crashes detected! Verifier needs hardening.');
    return false;
  }
}

async function main() {
  // Ensure verifier is built
  try {
    execSync('npm run build:verifier', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Failed to build verifier');
    process.exit(1);
  }
  
  console.log('🎯 Starting fuzz testing...');
  
  // Run test suites
  testFieldMutations();
  testStructuralMutations();
  testEncodingIssues();
  testTimestampEdgeCases();
  
  // Generate report
  const success = generateReport();
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Fuzz testing failed:', error);
  process.exit(1);
});
