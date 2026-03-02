/**
 * Unit tests for configuration validation functions
 * 
 * 需求: 2.1, 2.4
 */

import { describe, it, expect } from 'vitest';
import {
  validateAIServiceConfig,
  validateInternetAccessConfig,
  validateStreamingConfig,
  validateSystemConfig,
  createDefaultSystemConfig,
  type AIServiceConfig,
  type InternetAccessConfig,
  type StreamingConfig,
  type SystemConfig,
} from './config';

// ============================================================================
// Vitest Tests
// ============================================================================

describe('Configuration Validation', () => {
  it('should validate a valid AI service config', () => {
    const validConfig: AIServiceConfig = {
      id: 'service-1',
      name: 'OpenAI GPT-4',
      apiKey: 'sk-test-key',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      provider: 'openai',
      maxTokens: 4096,
      temperature: 0.7,
    };

    const result = validateAIServiceConfig(validConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should create a valid default system config', () => {
    const defaultConfig = createDefaultSystemConfig();
    
    expect(Array.isArray(defaultConfig.aiServices)).toBe(true);
    expect(defaultConfig.aiServices).toHaveLength(0);
    expect(defaultConfig.theme).toBe('auto');
    expect(defaultConfig.internetAccess.enabled).toBe(true);
  });
});

// ============================================================================
// Test Utilities
// ============================================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

// ============================================================================
// AIServiceConfig Validation Tests
// ============================================================================

function testValidAIServiceConfig(): void {
  const validConfig: AIServiceConfig = {
    id: 'service-1',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-test-key',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7,
  };

  const result = validateAIServiceConfig(validConfig);
  assert(result.isValid, 'Valid config should pass validation');
  assertEqual(result.errors.length, 0, 'Valid config should have no errors');
  console.log('✓ testValidAIServiceConfig passed');
}

function testMissingRequiredFields(): void {
  const invalidConfig = {
    id: '',
    name: '',
    apiKey: '',
    apiUrl: '',
    model: '',
    provider: 'invalid' as any,
  };

  const result = validateAIServiceConfig(invalidConfig);
  assert(!result.isValid, 'Invalid config should fail validation');
  assert(result.errors.length > 0, 'Invalid config should have errors');
  console.log('✓ testMissingRequiredFields passed');
}

function testInvalidUrl(): void {
  const invalidConfig: Partial<AIServiceConfig> = {
    id: 'service-1',
    name: 'Test Service',
    apiKey: 'test-key',
    apiUrl: 'not-a-valid-url',
    model: 'test-model',
    provider: 'custom',
  };

  const result = validateAIServiceConfig(invalidConfig);
  assert(!result.isValid, 'Config with invalid URL should fail');
  assert(
    result.errors.some((e) => e.field === 'apiUrl'),
    'Should have apiUrl error'
  );
  console.log('✓ testInvalidUrl passed');
}

function testInvalidTemperature(): void {
  const invalidConfig: Partial<AIServiceConfig> = {
    id: 'service-1',
    name: 'Test Service',
    apiKey: 'test-key',
    apiUrl: 'https://api.example.com',
    model: 'test-model',
    provider: 'custom',
    temperature: 3.0, // Invalid: > 2
  };

  const result = validateAIServiceConfig(invalidConfig);
  assert(!result.isValid, 'Config with invalid temperature should fail');
  assert(
    result.errors.some((e) => e.field === 'temperature'),
    'Should have temperature error'
  );
  console.log('✓ testInvalidTemperature passed');
}

function testInvalidMaxTokens(): void {
  const invalidConfig: Partial<AIServiceConfig> = {
    id: 'service-1',
    name: 'Test Service',
    apiKey: 'test-key',
    apiUrl: 'https://api.example.com',
    model: 'test-model',
    provider: 'custom',
    maxTokens: -100, // Invalid: negative
  };

  const result = validateAIServiceConfig(invalidConfig);
  assert(!result.isValid, 'Config with invalid maxTokens should fail');
  assert(
    result.errors.some((e) => e.field === 'maxTokens'),
    'Should have maxTokens error'
  );
  console.log('✓ testInvalidMaxTokens passed');
}

// ============================================================================
// InternetAccessConfig Validation Tests
// ============================================================================

function testValidInternetAccessConfig(): void {
  const validConfig: InternetAccessConfig = {
    enabled: true,
    allowedDomains: ['example.com', 'api.example.com'],
  };

  const result = validateInternetAccessConfig(validConfig);
  assert(result.isValid, 'Valid internet access config should pass');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  console.log('✓ testValidInternetAccessConfig passed');
}

function testInvalidInternetAccessConfig(): void {
  const invalidConfig = {
    enabled: 'yes' as any, // Should be boolean
    allowedDomains: 'not-an-array' as any,
  };

  const result = validateInternetAccessConfig(invalidConfig);
  assert(!result.isValid, 'Invalid config should fail');
  assert(result.errors.length > 0, 'Should have errors');
  console.log('✓ testInvalidInternetAccessConfig passed');
}

// ============================================================================
// StreamingConfig Validation Tests
// ============================================================================

function testValidStreamingConfig(): void {
  const validConfig: StreamingConfig = {
    chunkSize: 1024,
    updateInterval: 50,
  };

  const result = validateStreamingConfig(validConfig);
  assert(result.isValid, 'Valid streaming config should pass');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  console.log('✓ testValidStreamingConfig passed');
}

function testInvalidStreamingConfig(): void {
  const invalidConfig = {
    chunkSize: -1, // Invalid: negative
    updateInterval: 0, // Invalid: must be positive
  };

  const result = validateStreamingConfig(invalidConfig);
  assert(!result.isValid, 'Invalid config should fail');
  assert(result.errors.length > 0, 'Should have errors');
  console.log('✓ testInvalidStreamingConfig passed');
}

// ============================================================================
// SystemConfig Validation Tests
// ============================================================================

function testValidSystemConfig(): void {
  const validConfig: SystemConfig = {
    aiServices: [
      {
        id: 'service-1',
        name: 'OpenAI',
        apiKey: 'sk-test',
        apiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        provider: 'openai',
      },
    ],
    defaultService: 'service-1',
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'auto',
    internetAccess: {
      enabled: true,
    },
    streamingConfig: {
      chunkSize: 1024,
      updateInterval: 50,
    },
  };

  const result = validateSystemConfig(validConfig);
  assert(result.isValid, 'Valid system config should pass');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  console.log('✓ testValidSystemConfig passed');
}

function testInvalidDefaultService(): void {
  const invalidConfig: Partial<SystemConfig> = {
    aiServices: [
      {
        id: 'service-1',
        name: 'OpenAI',
        apiKey: 'sk-test',
        apiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        provider: 'openai',
      },
    ],
    defaultService: 'non-existent-service', // Invalid: doesn't exist
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'auto',
    internetAccess: {
      enabled: true,
    },
    streamingConfig: {
      chunkSize: 1024,
      updateInterval: 50,
    },
  };

  const result = validateSystemConfig(invalidConfig);
  assert(!result.isValid, 'Config with invalid defaultService should fail');
  assert(
    result.errors.some((e) => e.field === 'defaultService'),
    'Should have defaultService error'
  );
  console.log('✓ testInvalidDefaultService passed');
}

function testInvalidTheme(): void {
  const invalidConfig: Partial<SystemConfig> = {
    aiServices: [],
    defaultService: '',
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'invalid' as any,
    internetAccess: {
      enabled: true,
    },
    streamingConfig: {
      chunkSize: 1024,
      updateInterval: 50,
    },
  };

  const result = validateSystemConfig(invalidConfig);
  assert(!result.isValid, 'Config with invalid theme should fail');
  assert(
    result.errors.some((e) => e.field === 'theme'),
    'Should have theme error'
  );
  console.log('✓ testInvalidTheme passed');
}

// ============================================================================
// Default Configuration Tests
// ============================================================================

function testDefaultSystemConfig(): void {
  const defaultConfig = createDefaultSystemConfig();
  
  assert(Array.isArray(defaultConfig.aiServices), 'aiServices should be an array');
  assertEqual(defaultConfig.aiServices.length, 0, 'aiServices should be empty initially');
  assertEqual(defaultConfig.theme, 'auto', 'Default theme should be auto');
  assert(defaultConfig.internetAccess.enabled, 'Internet access should be enabled by default');
  assert(defaultConfig.streamingConfig.chunkSize > 0, 'Chunk size should be positive');
  assert(defaultConfig.streamingConfig.updateInterval > 0, 'Update interval should be positive');
  
  console.log('✓ testDefaultSystemConfig passed');
}

// ============================================================================
// Edge Cases Tests
// ============================================================================

function testEmptyStrings(): void {
  const invalidConfig: Partial<AIServiceConfig> = {
    id: '   ', // Whitespace only
    name: '',
    apiKey: '',
    apiUrl: 'https://api.example.com',
    model: '',
    provider: 'custom',
  };

  const result = validateAIServiceConfig(invalidConfig);
  assert(!result.isValid, 'Config with empty strings should fail');
  assert(result.errors.length > 0, 'Should have multiple errors');
  console.log('✓ testEmptyStrings passed');
}

function testOptionalFieldsOmitted(): void {
  const validConfig: Partial<AIServiceConfig> = {
    id: 'service-1',
    name: 'Test Service',
    apiKey: 'test-key',
    apiUrl: 'https://api.example.com',
    model: 'test-model',
    provider: 'custom',
    // maxTokens and temperature omitted
  };

  const result = validateAIServiceConfig(validConfig);
  assert(result.isValid, 'Config without optional fields should pass');
  assertEqual(result.errors.length, 0, 'Should have no errors');
  console.log('✓ testOptionalFieldsOmitted passed');
}

// ============================================================================
// Run All Tests
// ============================================================================

export function runAllConfigTests(): void {
  console.log('\n=== Running Configuration Validation Tests ===\n');

  try {
    // AIServiceConfig tests
    console.log('AIServiceConfig Validation Tests:');
    testValidAIServiceConfig();
    testMissingRequiredFields();
    testInvalidUrl();
    testInvalidTemperature();
    testInvalidMaxTokens();

    // InternetAccessConfig tests
    console.log('\nInternetAccessConfig Validation Tests:');
    testValidInternetAccessConfig();
    testInvalidInternetAccessConfig();

    // StreamingConfig tests
    console.log('\nStreamingConfig Validation Tests:');
    testValidStreamingConfig();
    testInvalidStreamingConfig();

    // SystemConfig tests
    console.log('\nSystemConfig Validation Tests:');
    testValidSystemConfig();
    testInvalidDefaultService();
    testInvalidTheme();

    // Default configuration tests
    console.log('\nDefault Configuration Tests:');
    testDefaultSystemConfig();

    // Edge cases
    console.log('\nEdge Cases Tests:');
    testEmptyStrings();
    testOptionalFieldsOmitted();

    console.log('\n=== All Configuration Tests Passed! ===\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Export the test runner for use in other contexts
// To run tests, import and call runAllConfigTests() from another file
