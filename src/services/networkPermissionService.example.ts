/**
 * 网络权限服务使用示例
 * Network Permission Service Usage Examples
 */

import {
  NetworkPermissionService,
  createNetworkPermissionService,
} from './networkPermissionService';
import type { InternetAccessConfig } from '../types/config';

// ============================================================================
// Example 1: Basic Usage - Allow All Domains
// ============================================================================

console.log('=== Example 1: Allow All Domains ===\n');

const config1: InternetAccessConfig = {
  enabled: true,
  allowedDomains: undefined, // undefined means allow all domains
};

const service1 = createNetworkPermissionService(config1);

// Check if network access is enabled
const permission1 = service1.checkPermission();
console.log('Network access enabled:', permission1.allowed);

// Validate various domains
const urls1 = [
  'https://example.com',
  'https://google.com',
  'https://github.com',
];

urls1.forEach(url => {
  const result = service1.validateDomain(url);
  console.log(`${url}: ${result.allowed ? '✓ Allowed' : '✗ Denied'}`);
});

// ============================================================================
// Example 2: Restricted Domain Access
// ============================================================================

console.log('\n=== Example 2: Restricted Domain Access ===\n');

const config2: InternetAccessConfig = {
  enabled: true,
  allowedDomains: ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov'],
};

const service2 = new NetworkPermissionService(config2);

const urls2 = [
  'https://scholar.google.com/search?q=ai',
  'https://arxiv.org/abs/2301.00001',
  'https://pubmed.ncbi.nlm.nih.gov/12345',
  'https://wikipedia.org', // Not in allowed list
  'https://twitter.com', // Not in allowed list
];

urls2.forEach(url => {
  const result = service2.validateDomain(url);
  console.log(`${url}:`);
  console.log(`  Allowed: ${result.allowed}`);
  console.log(`  Domain: ${result.domain}`);
  if (result.reason) {
    console.log(`  Reason: ${result.reason}`);
  }
  console.log();
});

// ============================================================================
// Example 3: Wildcard Domain Patterns
// ============================================================================

console.log('=== Example 3: Wildcard Domain Patterns ===\n');

const config3: InternetAccessConfig = {
  enabled: true,
  allowedDomains: [
    '*.google.com', // Allow all Google subdomains
    '*.github.com', // Allow all GitHub subdomains
    'example.com', // Allow example.com and its subdomains
  ],
};

const service3 = new NetworkPermissionService(config3);

const urls3 = [
  'https://scholar.google.com',
  'https://maps.google.com',
  'https://api.github.com',
  'https://gist.github.com',
  'https://example.com',
  'https://sub.example.com',
  'https://deep.sub.example.com',
  'https://notgoogle.com', // Should be denied
];

urls3.forEach(url => {
  const result = service3.validateDomain(url);
  console.log(`${url}: ${result.allowed ? '✓' : '✗'}`);
});

// ============================================================================
// Example 4: Disabled Network Access
// ============================================================================

console.log('\n=== Example 4: Disabled Network Access ===\n');

const config4: InternetAccessConfig = {
  enabled: false,
  allowedDomains: ['example.com'], // Even with allowed domains, access is denied
};

const service4 = new NetworkPermissionService(config4);

const permission4 = service4.checkPermission();
console.log('Permission check:', permission4);

const result4 = service4.validateDomain('https://example.com');
console.log('Domain validation:', result4);

// ============================================================================
// Example 5: Dynamic Domain Management
// ============================================================================

console.log('\n=== Example 5: Dynamic Domain Management ===\n');

const config5: InternetAccessConfig = {
  enabled: true,
  allowedDomains: ['example.com'],
};

const service5 = new NetworkPermissionService(config5);

console.log('Initial allowed domains:', service5.getAllowedDomains());

// Add new domains
service5.addAllowedDomain('test.org');
service5.addAllowedDomain('another.com');
console.log('After adding domains:', service5.getAllowedDomains());

// Try to add duplicate
service5.addAllowedDomain('example.com');
console.log('After adding duplicate:', service5.getAllowedDomains());

// Remove a domain
service5.removeAllowedDomain('test.org');
console.log('After removing test.org:', service5.getAllowedDomains());

// Clear all domains
service5.clearAllowedDomains();
console.log('After clearing all:', service5.getAllowedDomains());

// ============================================================================
// Example 6: Batch Domain Validation
// ============================================================================

console.log('\n=== Example 6: Batch Domain Validation ===\n');

const config6: InternetAccessConfig = {
  enabled: true,
  allowedDomains: ['example.com', 'test.org'],
};

const service6 = new NetworkPermissionService(config6);

const urlsToValidate = [
  'https://example.com/page1',
  'https://test.org/page2',
  'https://blocked.com/page3',
  'https://sub.example.com/page4',
];

const results = service6.validateDomains(urlsToValidate);

results.forEach((result, index) => {
  console.log(`URL ${index + 1}: ${urlsToValidate[index]}`);
  console.log(`  Status: ${result.allowed ? '✓ Allowed' : '✗ Denied'}`);
  console.log(`  Domain: ${result.domain}`);
  if (result.reason) {
    console.log(`  Reason: ${result.reason}`);
  }
  console.log();
});

// ============================================================================
// Example 7: Configuration Updates
// ============================================================================

console.log('=== Example 7: Configuration Updates ===\n');

const config7: InternetAccessConfig = {
  enabled: true,
  allowedDomains: ['example.com'],
};

const service7 = new NetworkPermissionService(config7);

console.log('Initial config:', service7.getConfig());

// Test with initial config
let result7 = service7.validateDomain('https://test.org');
console.log('test.org with initial config:', result7.allowed);

// Update configuration
service7.updateConfig({
  enabled: true,
  allowedDomains: ['test.org', 'another.com'],
});

console.log('Updated config:', service7.getConfig());

// Test with updated config
result7 = service7.validateDomain('https://test.org');
console.log('test.org with updated config:', result7.allowed);

// ============================================================================
// Example 8: Integration with Search Service
// ============================================================================

console.log('\n=== Example 8: Integration with Search Service ===\n');

/**
 * Example of how to integrate with search service
 */
async function performSecureSearch(
  query: string,
  searchUrl: string,
  permissionService: NetworkPermissionService
): Promise<void> {
  // Check network permission
  const permission = permissionService.checkPermission();
  if (!permission.allowed) {
    console.error('Search failed:', permission.reason);
    return;
  }

  // Validate domain
  const domainValidation = permissionService.validateDomain(searchUrl);
  if (!domainValidation.allowed) {
    console.error('Search failed:', domainValidation.reason);
    return;
  }

  // Proceed with search
  console.log(`✓ Permission granted for ${domainValidation.domain}`);
  console.log(`Performing search: "${query}" on ${searchUrl}`);
  // ... actual search implementation
}

const searchConfig: InternetAccessConfig = {
  enabled: true,
  allowedDomains: ['api.tavily.com', 'serpapi.com'],
};

const searchPermissionService = new NetworkPermissionService(searchConfig);

// Allowed search
await performSecureSearch(
  'artificial intelligence',
  'https://api.tavily.com/search',
  searchPermissionService
);

// Blocked search
await performSecureSearch(
  'random query',
  'https://unauthorized-api.com/search',
  searchPermissionService
);

// ============================================================================
// Example 9: Error Handling
// ============================================================================

console.log('\n=== Example 9: Error Handling ===\n');

const config9: InternetAccessConfig = {
  enabled: true,
  allowedDomains: ['example.com'],
};

const service9 = new NetworkPermissionService(config9);

// Test various invalid inputs
const invalidUrls = [
  'not a url',
  '',
  'ftp://example.com', // Valid URL but FTP protocol
  'javascript:alert(1)', // Dangerous URL
  '   ', // Whitespace only
];

invalidUrls.forEach(url => {
  const result = service9.validateDomain(url);
  console.log(`Input: "${url}"`);
  console.log(`  Allowed: ${result.allowed}`);
  console.log(`  Reason: ${result.reason || 'N/A'}`);
  console.log();
});

// ============================================================================
// Example 10: Academic Research Use Case
// ============================================================================

console.log('=== Example 10: Academic Research Use Case ===\n');

/**
 * Configuration for academic research AI
 * Only allow access to trusted academic sources
 */
const academicConfig: InternetAccessConfig = {
  enabled: true,
  allowedDomains: [
    // Academic search engines
    'scholar.google.com',
    '*.google.com', // For Google Scholar subdomains
    
    // Preprint servers
    'arxiv.org',
    'biorxiv.org',
    'medrxiv.org',
    
    // Academic databases
    'pubmed.ncbi.nlm.nih.gov',
    'ieee.org',
    '*.ieee.org',
    'acm.org',
    '*.acm.org',
    
    // University repositories
    '*.edu',
    
    // Open access journals
    'plos.org',
    '*.plos.org',
  ],
};

const academicService = new NetworkPermissionService(academicConfig);

console.log('Academic AI Network Configuration:');
console.log('Enabled:', academicService.getConfig().enabled);
console.log('Allowed domains:', academicService.getAllowedDomains().length);
console.log();

// Test various academic sources
const academicSources = [
  'https://scholar.google.com/scholar?q=machine+learning',
  'https://arxiv.org/abs/2301.00001',
  'https://pubmed.ncbi.nlm.nih.gov/12345678',
  'https://ieeexplore.ieee.org/document/123456',
  'https://dl.acm.org/doi/10.1145/123456',
  'https://mit.edu/research/paper.pdf',
  'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0123456',
  'https://wikipedia.org', // Should be blocked
  'https://reddit.com', // Should be blocked
];

console.log('Testing academic sources:');
academicSources.forEach(url => {
  const result = academicService.validateDomain(url);
  const status = result.allowed ? '✓ Allowed' : '✗ Blocked';
  console.log(`${status}: ${url}`);
});

console.log('\n=== Examples Complete ===');
