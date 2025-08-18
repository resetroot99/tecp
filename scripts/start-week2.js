#!/usr/bin/env node
/**
 * TECP Week 2 Startup Script
 * 
 * Starts all three services with proper environment configuration:
 * - Private-GPT Demo (port 3001)
 * - Transparency Log (port 3002)
 * - Web Verifier (port 3003)
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🚀 Starting TECP Week 2 Complete Ecosystem');
console.log('═'.repeat(50));

// Set environment variables for Week 2 integration
process.env.TECP_LOG_URL = 'http://localhost:3002';
process.env.VERIFIER_URL = 'http://localhost:3004';
process.env.NODE_ENV = 'development';

// Check if keys exist
const keysPath = path.join(__dirname, '..', 'keys.txt');
if (!existsSync(keysPath)) {
  console.log('🔑 Generating Ed25519 keys...');
  const keyGen = spawn('node', ['scripts/gen-keys.js'], { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  keyGen.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Keys generated successfully');
      startServices();
    } else {
      console.error('❌ Failed to generate keys');
      process.exit(1);
    }
  });
} else {
  console.log('✅ Keys already exist');
  startServices();
}

function startServices() {
  console.log('\n🌟 Starting TECP services...\n');
  
  // Service configurations
  const services = [
    {
      name: 'Private-GPT Demo',
      command: 'tsx',
      args: ['demo/private-gpt/src/index.ts'],
      port: 3001,
      emoji: '🤖'
    },
    {
      name: 'Transparency Log',
      command: 'tsx',
      args: ['services/tecp-log/src/index.ts'],
      port: 3002,
      emoji: '🌳'
    },
    {
      name: 'Web Verifier',
      command: 'tsx',
      args: ['packages/tecp-verifier/src/web.ts'],
      port: 3003,
      emoji: '🔍'
    }
  ];
  
  const processes = [];
  
  services.forEach((service, index) => {
    setTimeout(() => {
      console.log(`${service.emoji} Starting ${service.name} on port ${service.port}...`);
      
      const proc = spawn('npx', [service.command, ...service.args], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..'),
        env: {
          ...process.env,
          PORT: service.port.toString()
        }
      });
      
      proc.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[${service.name}] ${output}`);
        }
      });
      
      proc.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[${service.name}] ${output}`);
        }
      });
      
      proc.on('close', (code) => {
        console.log(`❌ ${service.name} exited with code ${code}`);
      });
      
      processes.push(proc);
    }, index * 2000); // Stagger startup by 2 seconds
  });
  
  // Wait for all services to start
  setTimeout(() => {
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 TECP Week 2 Ecosystem Ready!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('🤖 Private-GPT Demo:    http://localhost:3001');
    console.log('🌳 Transparency Log:    http://localhost:3002');
    console.log('🔍 Web Verifier:        http://localhost:3003');
    console.log('');
    console.log('📋 Quick Test:');
    console.log('curl -X POST http://localhost:3001/v1/chat/completions \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"messages":[{"role":"user","content":"Test Week 2!"}]}\'');
    console.log('');
    console.log('🔍 Then verify the receipt at: http://localhost:3003');
    console.log('');
    console.log('Press Ctrl+C to stop all services');
  }, 8000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down TECP ecosystem...');
    processes.forEach((proc, index) => {
      console.log(`Stopping ${services[index].name}...`);
      proc.kill('SIGTERM');
    });
    
    setTimeout(() => {
      console.log('✅ All services stopped');
      process.exit(0);
    }, 2000);
  });
}
