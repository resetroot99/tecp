#!/usr/bin/env node
/**
 * TECP Link Verification Test
 * Tests all data sources and API endpoints that the UI depends on
 */

const https = require('https');
const http = require('http');

const tests = [
  // Spec Server Tests
  { name: 'Protocol Specification', url: 'http://localhost:3000/PROTOCOL.md', expect: '# TECP Protocol' },
  { name: 'Threat Model', url: 'http://localhost:3000/THREAT_MODEL.md', expect: '# TECP Threat Model' },
  { name: 'Policy Registry', url: 'http://localhost:3000/policy-registry.json', expect: '"policies"' },
  { name: 'Test Vector - Valid', url: 'http://localhost:3000/test-vectors/valid/basic-receipt.json', expect: '"basic-valid-receipt"' },
  { name: 'Test Vector - Invalid Sig', url: 'http://localhost:3000/test-vectors/invalid-sig/tampered-signature.json', expect: '"tampered-signature"' },
  { name: 'Test Vector - Expired', url: 'http://localhost:3000/test-vectors/expired/old-timestamp.json', expect: '"expired-receipt"' },
  
  // Transparency Log Tests
  { name: 'Transparency Log Root', url: 'http://localhost:3002/root', expect: '"success":true' },
  { name: 'Transparency Log Health', url: 'http://localhost:3002/health', expect: '"status":"healthy"' },
  
  // Private-GPT Demo Tests
  { name: 'Private-GPT Health', url: 'http://localhost:3001/health', expect: '"status":"healthy"' },
  { name: 'Private-GPT Info', url: 'http://localhost:3001/', expect: '"service":"🔥 Private-GPT' },
  
  // Reference UI Tests
  { name: 'Reference UI Main', url: 'http://localhost:3003/', expect: '<title>TECP Reference</title>' },
  { name: 'Reference UI Routes', url: 'http://localhost:3003/verify', expect: '<title>TECP Reference</title>' },
];

async function testUrl(test) {
  return new Promise((resolve) => {
    const client = test.url.startsWith('https:') ? https : http;
    
    client.get(test.url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === 200 && data.includes(test.expect);
        resolve({
          name: test.name,
          url: test.url,
          status: res.statusCode,
          success,
          error: success ? null : `Expected "${test.expect}" in response`
        });
      });
    }).on('error', (err) => {
      resolve({
        name: test.name,
        url: test.url,
        status: 0,
        success: false,
        error: err.message
      });
    });
  });
}

async function runTests() {
  console.log('🔍 TECP Link Verification Test');
  console.log('═'.repeat(50));
  
  const results = await Promise.all(tests.map(testUrl));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const status = result.status || 'ERR';
    console.log(`${icon} ${result.name} (${status})`);
    
    if (!result.success) {
      console.log(`   ${result.error || 'Unknown error'}`);
      failed++;
    } else {
      passed++;
    }
  });
  
  console.log('═'.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All links and data sources are working!');
  } else {
    console.log('⚠️  Some links need attention');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
