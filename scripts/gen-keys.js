#!/usr/bin/env node
/**
 * TECP Key Generation Script
 * 
 * Generates Ed25519 key pairs for development and testing
 * NEVER use these keys in production - generate secure keys separately
 */

const fs = require('fs');
const path = require('path');

// Import Ed25519 from @noble/ed25519 for proper key generation
async function generateEd25519KeyPair() {
  try {
    // Dynamic import for ESM modules
    const ed25519 = await import('@noble/ed25519');
    const { sha512 } = await import('@noble/hashes/sha512');
    
    // Set up SHA-512 for Ed25519 (required)
    ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));
    
    // Generate 32 bytes of cryptographically secure random data
    const privateKey = ed25519.utils.randomPrivateKey();
    
    // Derive the correct Ed25519 public key
    const publicKey = await ed25519.getPublicKey(privateKey);
    
    return {
      privateKey: Buffer.from(privateKey).toString('base64'),
      publicKey: Buffer.from(publicKey).toString('base64')
    };
  } catch (error) {
    console.error('❌ Failed to generate Ed25519 key pair:', error.message);
    console.error('   Make sure dependencies are installed: npm install @noble/ed25519 @noble/hashes');
    process.exit(1);
  }
}

async function main() {
  const keysDir = path.join(__dirname, '..', '.keys');
  
  // Create .keys directory if it doesn't exist
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log('📁 Created .keys directory');
  }
  
  // Generate key pair
  console.log('🔑 Generating Ed25519 key pair...');
  const keyPair = await generateEd25519KeyPair();
  
  // Write private key
  const privPath = path.join(keysDir, 'ed25519.priv');
  fs.writeFileSync(privPath, keyPair.privateKey, { mode: 0o600 });
  console.log(`🔒 Private key written to: ${privPath}`);
  
  // Write public key  
  const pubPath = path.join(keysDir, 'ed25519.pub');
  fs.writeFileSync(pubPath, keyPair.publicKey, { mode: 0o644 });
  console.log(`🔓 Public key written to: ${pubPath}`);
  
  // Write key info
  const infoPath = path.join(keysDir, 'key-info.json');
  const keyInfo = {
    algorithm: 'Ed25519',
    generated_at: new Date().toISOString(),
    purpose: 'development-testing-only',
    warning: 'NEVER use these keys in production',
    private_key_file: 'ed25519.priv',
    public_key_file: 'ed25519.pub',
    public_key: keyPair.publicKey
  };
  fs.writeFileSync(infoPath, JSON.stringify(keyInfo, null, 2));
  console.log(`📋 Key info written to: ${infoPath}`);
  
  console.log('');
  console.log('✅ Key generation complete!');
  console.log('');
  console.log('⚠️  WARNING: These keys are for DEVELOPMENT/TESTING ONLY');
  console.log('   Never use generated keys in production environments');
  console.log('   Generate production keys using secure hardware or HSMs');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Run: npm run test:interop');
  console.log('   2. Start demo: npm run dev:demo');
  console.log('   3. Test verifier: npm run dev:verifier');
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Key generation failed:', error);
    process.exit(1);
  });
}
