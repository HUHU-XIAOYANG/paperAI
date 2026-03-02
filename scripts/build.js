#!/usr/bin/env node

/**
 * Cross-platform build script for Agent Swarm Writing System
 * 
 * Usage:
 *   node scripts/build.js [platform]
 * 
 * Platforms: windows, macos, linux, all, current
 */

import { execSync } from 'child_process';
import { platform } from 'os';

const args = process.argv.slice(2);
const targetPlatform = args[0] || 'current';

const platformMap = {
  win32: 'windows',
  darwin: 'macos',
  linux: 'linux'
};

const currentPlatform = platformMap[platform()] || 'unknown';

const buildCommands = {
  windows: 'npm run tauri:build:windows',
  macos: 'npm run tauri:build:macos',
  linux: 'npm run tauri:build:linux',
  current: 'npm run tauri:build',
  all: 'npm run tauri:build:all'
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('Checking prerequisites...', 'info');
  
  try {
    // Check Node.js
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✓ Node.js ${nodeVersion}`, 'success');
    
    // Check npm
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✓ npm ${npmVersion}`, 'success');
    
    // Check Rust
    const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
    log(`✓ ${rustVersion}`, 'success');
    
    // Check Cargo
    const cargoVersion = execSync('cargo --version', { encoding: 'utf8' }).trim();
    log(`✓ ${cargoVersion}`, 'success');
    
    return true;
  } catch (error) {
    log('✗ Missing prerequisites. Please check BUILD.md for installation instructions.', 'error');
    return false;
  }
}

function build(target) {
  const command = buildCommands[target];
  
  if (!command) {
    log(`Unknown platform: ${target}`, 'error');
    log('Available platforms: windows, macos, linux, current, all', 'info');
    process.exit(1);
  }
  
  log(`\nBuilding for: ${target === 'current' ? currentPlatform : target}`, 'info');
  log(`Command: ${command}\n`, 'info');
  
  try {
    execSync(command, { stdio: 'inherit' });
    log(`\n✓ Build completed successfully!`, 'success');
    log(`Check src-tauri/target/release/bundle/ for output files`, 'info');
  } catch (error) {
    log(`\n✗ Build failed!`, 'error');
    log(`See error messages above for details`, 'error');
    process.exit(1);
  }
}

function main() {
  log('=== Agent Swarm Writing System - Build Script ===\n', 'info');
  log(`Current platform: ${currentPlatform}`, 'info');
  log(`Target platform: ${targetPlatform}\n`, 'info');
  
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  log(''); // Empty line for readability
  
  // Install dependencies if needed
  try {
    log('Checking dependencies...', 'info');
    execSync('npm ci --prefer-offline --no-audit', { stdio: 'inherit' });
  } catch (error) {
    log('Installing dependencies...', 'warning');
    execSync('npm install', { stdio: 'inherit' });
  }
  
  // Run the build
  build(targetPlatform);
}

main();
