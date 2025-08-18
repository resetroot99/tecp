#!/usr/bin/env node
/**
 * TECP Build Info Generator
 * 
 * Generates reproducible build information for code_ref verification.
 * Creates cryptographically verifiable build metadata.
 * 
 * @version TECP-0.1
 * @license Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const OUTPUT_FILE = 'BUILDINFO.json';

console.log('TECP Build Info Generator');
console.log('═'.repeat(40));

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const tag = execSync('git describe --tags --exact-match 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    const dirty = execSync('git diff --quiet || echo "dirty"', { encoding: 'utf8' }).trim();
    
    return {
      commit,
      branch,
      tag: tag || null,
      dirty: dirty === 'dirty',
      remote: execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim()
    };
  } catch (error) {
    console.warn('Git information not available');
    return {
      commit: 'unknown',
      branch: 'unknown',
      tag: null,
      dirty: false,
      remote: 'unknown'
    };
  }
}

function getNodeInfo() {
  return {
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

function getPackageInfo() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {}
  };
}

function hashDirectory(dirPath, extensions = ['.ts', '.js', '.json']) {
  const hash = crypto.createHash('sha256');
  
  function processDirectory(currentPath) {
    const items = fs.readdirSync(currentPath).sort();
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (item === 'node_modules' || item === 'dist' || item === '.git') {
          continue;
        }
        processDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          const content = fs.readFileSync(fullPath);
          hash.update(fullPath);
          hash.update(content);
        }
      }
    }
  }
  
  processDirectory(dirPath);
  return hash.digest('hex');
}

function getDependencyHashes() {
  const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(packageLock.packages || packageLock.dependencies, null, 0));
  return {
    package_lock_hash: hash.digest('hex'),
    npm_version: execSync('npm --version', { encoding: 'utf8' }).trim()
  };
}

function getToolchainInfo() {
  try {
    const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
    return {
      typescript: tscVersion,
      node: process.version,
      npm: execSync('npm --version', { encoding: 'utf8' }).trim()
    };
  } catch (error) {
    return {
      typescript: 'unknown',
      node: process.version,
      npm: 'unknown'
    };
  }
}

function generateBuildInfo() {
  const buildInfo = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    git: getGitInfo(),
    node: getNodeInfo(),
    package: getPackageInfo(),
    toolchain: getToolchainInfo(),
    dependencies: getDependencyHashes(),
    source_hash: hashDirectory('.', ['.ts', '.js', '.json']),
    build_command: 'npm run build',
    reproducible: true
  };
  
  // Generate code_ref
  const codeRefData = {
    commit: buildInfo.git.commit,
    source_hash: buildInfo.source_hash,
    toolchain: buildInfo.toolchain
  };
  
  const codeRefHash = crypto.createHash('sha256')
    .update(JSON.stringify(codeRefData, null, 0))
    .digest('hex');
  
  buildInfo.code_ref = `build:${codeRefHash}`;
  
  return buildInfo;
}

function signBuildInfo(buildInfo) {
  // Load project signing key if available
  const keyPath = '.keys/project.priv';
  if (fs.existsSync(keyPath)) {
    try {
      const privateKey = fs.readFileSync(keyPath);
      const data = JSON.stringify(buildInfo, null, 0);
      const signature = crypto.sign('sha256', Buffer.from(data), privateKey);
      
      buildInfo.signature = {
        algorithm: 'RS256',
        signature: signature.toString('base64'),
        public_key_path: '.keys/project.pub'
      };
      
      console.log('Build info signed with project key');
    } catch (error) {
      console.warn('Failed to sign build info:', error.message);
    }
  } else {
    console.warn('No project signing key found');
  }
  
  return buildInfo;
}

function main() {
  console.log('Generating build information...');
  
  const buildInfo = generateBuildInfo();
  const signedBuildInfo = signBuildInfo(buildInfo);
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(signedBuildInfo, null, 2));
  
  console.log(`Build info generated: ${OUTPUT_FILE}`);
  console.log(`Code ref: ${buildInfo.code_ref}`);
  console.log(`Source hash: ${buildInfo.source_hash.substring(0, 16)}...`);
  console.log(`Git commit: ${buildInfo.git.commit.substring(0, 8)}`);
  
  if (buildInfo.git.dirty) {
    console.warn('Working directory is dirty - build may not be reproducible');
  }
  
  // Also update package.json with code_ref
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.tecp = packageJson.tecp || {};
  packageJson.tecp.code_ref = buildInfo.code_ref;
  packageJson.tecp.build_hash = buildInfo.source_hash;
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  console.log('Updated package.json with code_ref');
}

if (require.main === module) {
  main();
}

module.exports = { generateBuildInfo, signBuildInfo };
