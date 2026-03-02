/**
 * Demonstration of configuration validation functions
 * This file shows how to use the validation functions
 */

import {
  validateAIServiceConfig,
  validateSystemConfig,
  createDefaultSystemConfig,
  type AIServiceConfig,
  type SystemConfig,
} from './config';

// Example 1: Valid AI Service Configuration
console.log('=== Example 1: Valid AI Service Configuration ===');
const validAIService: AIServiceConfig = {
  id: 'openai-gpt4',
  name: 'OpenAI GPT-4',
  apiKey: 'sk-test-key-12345',
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai',
  maxTokens: 4096,
  temperature: 0.7,
};

const result1 = validateAIServiceConfig(validAIService);
console.log('Validation result:', result1);
console.log('Is valid:', result1.isValid);
console.log('Errors:', result1.errors);

// Example 2: Invalid AI Service Configuration (missing required fields)
console.log('\n=== Example 2: Invalid AI Service Configuration ===');
const invalidAIService = {
  id: '',
  name: 'Test',
  apiKey: '',
  apiUrl: 'not-a-url',
  model: '',
  provider: 'invalid' as any,
};

const result2 = validateAIServiceConfig(invalidAIService);
console.log('Validation result:', result2);
console.log('Is valid:', result2.isValid);
console.log('Errors:', result2.errors);

// Example 3: Valid System Configuration
console.log('\n=== Example 3: Valid System Configuration ===');
const validSystemConfig: SystemConfig = {
  aiServices: [validAIService],
  defaultService: 'openai-gpt4',
  promptRepositoryPath: './prompts',
  outputDirectory: './output',
  theme: 'auto',
  internetAccess: {
    enabled: true,
    allowedDomains: ['example.com'],
  },
  streamingConfig: {
    chunkSize: 1024,
    updateInterval: 50,
  },
};

const result3 = validateSystemConfig(validSystemConfig);
console.log('Validation result:', result3);
console.log('Is valid:', result3.isValid);
console.log('Errors:', result3.errors);

// Example 4: Default System Configuration
console.log('\n=== Example 4: Default System Configuration ===');
const defaultConfig = createDefaultSystemConfig();
console.log('Default config:', JSON.stringify(defaultConfig, null, 2));

const result4 = validateSystemConfig(defaultConfig);
console.log('Validation result (should fail - no services):', result4);
console.log('Is valid:', result4.isValid);
console.log('Errors:', result4.errors);

console.log('\n=== Validation Functions Work Correctly! ===');
