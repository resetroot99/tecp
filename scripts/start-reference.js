#!/usr/bin/env node
/**
 * TECP Reference UI Startup Script
 * 
 * Starts the complete TECP reference implementation:
 * - Reference UI (port 3003)
 * - Transparency Log (port 3002) 
 * - Private-GPT Demo (port 3001)
 * - Static spec files (port 3000)
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('Starting TECP Reference Implementation');
console.log('═'.repeat(50));

// Set environment variables
process.env.TECP_LOG_URL = 'http://localhost:3002';
process.env.VERIFIER_URL = 'http://localhost:3003';
process.env.NODE_ENV = 'development';

// Check if keys exist
if (!existsSync('.keys/ed25519.priv')) {
  console.log('🔑 Generating Ed25519 keys...');
  try {
    require('child_process').execSync('npm run gen:keys', { stdio: 'inherit' });
    console.log('Keys generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate keys:', error.message);
    process.exit(1);
  }
}

// Generate build info
console.log('Generating build information...');
try {
  require('child_process').execSync('node scripts/buildinfo-generator.js', { stdio: 'inherit' });
  console.log('Build info generated');
} catch (error) {
  console.warn('Failed to generate build info:', error.message);
}

// Build all components
console.log('Building all components...');
try {
  require('child_process').execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

const services = [];

// Start static file server for spec files
console.log('Starting spec file server on port 3000...');
const specServer = spawn('npx', ['http-server', 'spec', '-p', '3000', '--cors'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

specServer.stdout.on('data', (data) => {
  console.log(`[Spec Server] ${data.toString().trim()}`);
});

specServer.stderr.on('data', (data) => {
  console.error(`[Spec Server] ${data.toString().trim()}`);
});

services.push({ name: 'Spec Server', process: specServer });

// Start Private-GPT Demo
console.log('Starting Private-GPT Demo on port 3001...');
const demoProcess = spawn('npx', ['tsx', 'demo/private-gpt/src/index.ts'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '3001' }
});

demoProcess.stdout.on('data', (data) => {
  console.log(`[Private-GPT Demo] ${data.toString().trim()}`);
});

demoProcess.stderr.on('data', (data) => {
  console.error(`[Private-GPT Demo] ${data.toString().trim()}`);
});

services.push({ name: 'Private-GPT Demo', process: demoProcess });

// Start Transparency Log
console.log('Starting Transparency Log on port 3002...');
const logProcess = spawn('npx', ['tsx', 'services/tecp-log/src/index.ts'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '3002' }
});

logProcess.stdout.on('data', (data) => {
  console.log(`[Transparency Log] ${data.toString().trim()}`);
});

logProcess.stderr.on('data', (data) => {
  console.error(`[Transparency Log] ${data.toString().trim()}`);
});

services.push({ name: 'Transparency Log', process: logProcess });

// Start Reference UI
console.log('Starting Reference UI on port 3003...');
const uiProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  cwd: 'packages/tecp-reference-ui',
  env: { ...process.env, PORT: '3003' }
});

uiProcess.stdout.on('data', (data) => {
  console.log(`[Reference UI] ${data.toString().trim()}`);
});

uiProcess.stderr.on('data', (data) => {
  console.error(`[Reference UI] ${data.toString().trim()}`);
});

services.push({ name: 'Reference UI', process: uiProcess });

// Wait a moment for services to start
setTimeout(() => {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('TECP Reference Implementation Ready!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Specification:       http://localhost:3000');
  console.log('Private-GPT Demo:    http://localhost:3001');
  console.log('Transparency Log:    http://localhost:3002');
  console.log('Reference UI:        http://localhost:3003');
  console.log('');
  console.log('📋 Quick Test:');
  console.log('curl -X POST http://localhost:3001/v1/chat/completions \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"messages":[{"role":"user","content":"Test TECP!"}]}\'');
  console.log('');
  console.log('🔍 Then verify the receipt at: http://localhost:3003/verify');
  console.log('Press Ctrl+C to stop all services');
}, 3000);

// Handle graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down TECP Reference Implementation...');
  
  services.forEach(({ name, process }) => {
    console.log(`   Stopping ${name}...`);
    process.kill('SIGTERM');
  });
  
  setTimeout(() => {
    console.log('All services stopped');
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle service exits
services.forEach(({ name, process }) => {
  process.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ ${name} exited with code ${code}`);
    }
  });
});
