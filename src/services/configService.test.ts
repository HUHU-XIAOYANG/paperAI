/**
 * 配置持久化服务单元测试
 * Unit tests for configuration persistence service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SystemConfig } from '../types/config';
import { createDefaultSystemConfig } from '../types/config';

// Mock Tauri API before importing the service
vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: {
    AppData: 'AppData',
  },
  exists: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

// Import after mocking
import {
  serializeConfig,
  deserializeConfig,
  ConfigServiceError,
  validateConfig,
  repairConfig,
} from './configService';
import { isEncrypted } from '../utils/encryption';

describe('Configuration Serialization/Deserialization', () => {
  let validConfig: SystemConfig;

  beforeEach(() => {
    validConfig = {
      aiServices: [
        {
          id: 'service-1',
          name: 'OpenAI GPT-4',
          apiKey: 'sk-test-key-123',
          apiUrl: 'https://api.openai.com/v1',
          model: 'gpt-4',
          provider: 'openai',
          maxTokens: 4096,
          temperature: 0.7,
        },
      ],
      defaultService: 'service-1',
      promptRepositoryPath: './prompts',
      outputDirectory: './output',
      theme: 'dark',
      internetAccess: {
        enabled: true,
        allowedDomains: ['example.com', 'test.com'],
      },
      streamingConfig: {
        chunkSize: 1024,
        updateInterval: 50,
      },
    };
  });

  describe('serializeConfig', () => {
    it('should serialize valid config to JSON string', () => {
      const json = serializeConfig(validConfig);
      
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      expect(json.length).toBeGreaterThan(0);
    });

    it('should produce valid JSON', () => {
      const json = serializeConfig(validConfig);
      
      // Should not throw when parsing
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should preserve all config fields', () => {
      const json = serializeConfig(validConfig);
      const parsed = JSON.parse(json);
      
      // API keys should be encrypted in serialized form
      expect(isEncrypted(parsed.aiServices[0]!.apiKey)).toBe(true);
      
      // Other fields should be preserved as-is
      expect(parsed.aiServices[0]!.id).toBe(validConfig.aiServices[0]!.id);
      expect(parsed.aiServices[0]!.name).toBe(validConfig.aiServices[0]!.name);
      expect(parsed.aiServices[0]!.apiUrl).toBe(validConfig.aiServices[0]!.apiUrl);
      expect(parsed.aiServices[0]!.model).toBe(validConfig.aiServices[0]!.model);
      expect(parsed.aiServices[0]!.provider).toBe(validConfig.aiServices[0]!.provider);
      expect(parsed.aiServices[0]!.maxTokens).toBe(validConfig.aiServices[0]!.maxTokens);
      expect(parsed.aiServices[0]!.temperature).toBe(validConfig.aiServices[0]!.temperature);
      
      expect(parsed.defaultService).toBe(validConfig.defaultService);
      expect(parsed.promptRepositoryPath).toBe(validConfig.promptRepositoryPath);
      expect(parsed.outputDirectory).toBe(validConfig.outputDirectory);
      expect(parsed.theme).toBe(validConfig.theme);
      expect(parsed.internetAccess).toEqual(validConfig.internetAccess);
      expect(parsed.streamingConfig).toEqual(validConfig.streamingConfig);
    });

    it('should handle config with empty aiServices array', () => {
      const emptyConfig = createDefaultSystemConfig();
      const json = serializeConfig(emptyConfig);
      const parsed = JSON.parse(json);
      
      expect(parsed.aiServices).toEqual([]);
    });

    it('should handle config with optional fields undefined', () => {
      const configWithOptionals: SystemConfig = {
        ...validConfig,
        aiServices: [
          {
            id: 'service-1',
            name: 'Test Service',
            apiKey: 'test-key',
            apiUrl: 'https://api.test.com',
            model: 'test-model',
            provider: 'custom',
            // maxTokens and temperature are optional
          },
        ],
        internetAccess: {
          enabled: false,
          // allowedDomains is optional
        },
      };
      
      const json = serializeConfig(configWithOptionals);
      const parsed = JSON.parse(json);
      
      expect(parsed.aiServices[0].maxTokens).toBeUndefined();
      expect(parsed.aiServices[0].temperature).toBeUndefined();
      expect(parsed.internetAccess.allowedDomains).toBeUndefined();
    });
  });

  describe('deserializeConfig', () => {
    it('should deserialize valid JSON to config object', () => {
      const json = serializeConfig(validConfig);
      const config = deserializeConfig(json);
      
      expect(config).toBeDefined();
      expect(config).toEqual(validConfig);
    });

    it('should validate deserialized config', () => {
      const invalidJson = JSON.stringify({
        aiServices: [],
        defaultService: '', // Invalid: empty string
        // Missing required fields
      });
      
      expect(() => deserializeConfig(invalidJson)).toThrow(ConfigServiceError);
    });

    it('should throw ConfigServiceError for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => deserializeConfig(invalidJson)).toThrow(ConfigServiceError);
    });

    it('should throw ConfigServiceError with DESERIALIZE_ERROR code for malformed JSON', () => {
      const invalidJson = '{ "aiServices": [}';
      
      try {
        deserializeConfig(invalidJson);
        expect.fail('Should have thrown ConfigServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigServiceError);
        expect((error as ConfigServiceError).code).toBe('DESERIALIZE_ERROR');
      }
    });

    it('should throw ConfigServiceError with VALIDATION_ERROR code for invalid config', () => {
      const invalidConfig = {
        aiServices: [
          {
            id: 'test',
            name: 'Test',
            apiKey: 'key',
            apiUrl: 'not-a-url', // Invalid URL
            model: 'model',
            provider: 'openai',
          },
        ],
        defaultService: 'test',
        promptRepositoryPath: './prompts',
        outputDirectory: './output',
        theme: 'dark',
        internetAccess: { enabled: true },
        streamingConfig: { chunkSize: 1024, updateInterval: 50 },
      };
      
      const json = JSON.stringify(invalidConfig);
      
      try {
        deserializeConfig(json);
        expect.fail('Should have thrown ConfigServiceError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigServiceError);
        expect((error as ConfigServiceError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should preserve nested objects', () => {
      const json = serializeConfig(validConfig);
      const config = deserializeConfig(json);
      
      expect(config.internetAccess).toEqual(validConfig.internetAccess);
      expect(config.streamingConfig).toEqual(validConfig.streamingConfig);
      expect(config.aiServices[0]).toEqual(validConfig.aiServices[0]);
    });

    it('should handle config with multiple AI services', () => {
      const multiServiceConfig: SystemConfig = {
        ...validConfig,
        aiServices: [
          {
            id: 'service-1',
            name: 'OpenAI',
            apiKey: 'key1',
            apiUrl: 'https://api.openai.com',
            model: 'gpt-4',
            provider: 'openai',
          },
          {
            id: 'service-2',
            name: 'Anthropic',
            apiKey: 'key2',
            apiUrl: 'https://api.anthropic.com',
            model: 'claude-3',
            provider: 'anthropic',
          },
        ],
      };
      
      const json = serializeConfig(multiServiceConfig);
      const config = deserializeConfig(json);
      
      expect(config.aiServices).toHaveLength(2);
      expect(config.aiServices[0]!.id).toBe('service-1');
      expect(config.aiServices[1]!.id).toBe('service-2');
    });
  });

  describe('Round-trip property', () => {
    it('should maintain equivalence after serialize -> deserialize', () => {
      const json = serializeConfig(validConfig);
      const roundTripped = deserializeConfig(json);
      
      expect(roundTripped).toEqual(validConfig);
    });

    it('should maintain equivalence for default config', () => {
      const defaultConfig = createDefaultSystemConfig();
      const json = serializeConfig(defaultConfig);
      const roundTripped = deserializeConfig(json);
      
      expect(roundTripped).toEqual(defaultConfig);
    });

    it('should maintain equivalence for config with all optional fields', () => {
      const fullConfig: SystemConfig = {
        aiServices: [
          {
            id: 'full-service',
            name: 'Full Service',
            apiKey: 'full-key',
            apiUrl: 'https://api.full.com',
            model: 'full-model',
            provider: 'custom',
            maxTokens: 8192,
            temperature: 1.5,
          },
        ],
        defaultService: 'full-service',
        promptRepositoryPath: './custom/prompts',
        outputDirectory: './custom/output',
        theme: 'light',
        internetAccess: {
          enabled: true,
          allowedDomains: ['domain1.com', 'domain2.com', 'domain3.com'],
        },
        streamingConfig: {
          chunkSize: 2048,
          updateInterval: 100,
        },
      };
      
      const json = serializeConfig(fullConfig);
      const roundTripped = deserializeConfig(json);
      
      expect(roundTripped).toEqual(fullConfig);
    });

    it('should maintain equivalence for config with minimal fields', () => {
      const minimalConfig: SystemConfig = {
        aiServices: [
          {
            id: 'min',
            name: 'Min',
            apiKey: 'key',
            apiUrl: 'https://api.min.com',
            model: 'model',
            provider: 'custom',
          },
        ],
        defaultService: 'min',
        promptRepositoryPath: './prompts',
        outputDirectory: './output',
        theme: 'auto',
        internetAccess: {
          enabled: false,
        },
        streamingConfig: {
          chunkSize: 512,
          updateInterval: 25,
        },
      };
      
      const json = serializeConfig(minimalConfig);
      const roundTripped = deserializeConfig(json);
      
      expect(roundTripped).toEqual(minimalConfig);
    });
  });

  describe('Error handling', () => {
    it('should include error code in ConfigServiceError', () => {
      const invalidJson = '{ invalid }';
      
      try {
        deserializeConfig(invalidJson);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigServiceError);
        expect((error as ConfigServiceError).code).toBeDefined();
      }
    });

    it('should include descriptive message in ConfigServiceError', () => {
      const invalidJson = '{ invalid }';
      
      try {
        deserializeConfig(invalidJson);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigServiceError);
        // Error message should be descriptive (in Chinese)
        expect((error as ConfigServiceError).message).toContain('JSON');
      }
    });

    it('should handle missing required fields', () => {
      const incompleteJson = JSON.stringify({
        aiServices: [],
        // Missing other required fields
      });
      
      expect(() => deserializeConfig(incompleteJson)).toThrow(ConfigServiceError);
    });

    it('should handle invalid field types', () => {
      const invalidTypeJson = JSON.stringify({
        aiServices: 'not-an-array', // Should be array
        defaultService: 'test',
        promptRepositoryPath: './prompts',
        outputDirectory: './output',
        theme: 'dark',
        internetAccess: { enabled: true },
        streamingConfig: { chunkSize: 1024, updateInterval: 50 },
      });
      
      expect(() => deserializeConfig(invalidTypeJson)).toThrow(ConfigServiceError);
    });
  });

  describe('API Key Encryption', () => {
    it('should encrypt API keys when serializing', () => {
      const json = serializeConfig(validConfig);
      const parsed = JSON.parse(json);
      
      // API keys in serialized JSON should be encrypted
      expect(parsed.aiServices[0]!.apiKey).not.toBe(validConfig.aiServices[0]!.apiKey);
      expect(isEncrypted(parsed.aiServices[0]!.apiKey)).toBe(true);
    });

    it('should decrypt API keys when deserializing', () => {
      const json = serializeConfig(validConfig);
      const config = deserializeConfig(json);
      
      // API keys in deserialized config should be decrypted (plain text)
      expect(config.aiServices[0]!.apiKey).toBe(validConfig.aiServices[0]!.apiKey);
      expect(isEncrypted(config.aiServices[0]!.apiKey)).toBe(false);
    });

    it('should encrypt all API keys in multiple services', () => {
      const multiServiceConfig: SystemConfig = {
        ...validConfig,
        aiServices: [
          {
            id: 'service-1',
            name: 'Service 1',
            apiKey: 'key-1',
            apiUrl: 'https://api1.com',
            model: 'model-1',
            provider: 'openai',
          },
          {
            id: 'service-2',
            name: 'Service 2',
            apiKey: 'key-2',
            apiUrl: 'https://api2.com',
            model: 'model-2',
            provider: 'anthropic',
          },
          {
            id: 'service-3',
            name: 'Service 3',
            apiKey: 'key-3',
            apiUrl: 'https://api3.com',
            model: 'model-3',
            provider: 'custom',
          },
        ],
      };
      
      const json = serializeConfig(multiServiceConfig);
      const parsed = JSON.parse(json);
      
      // All API keys should be encrypted
      expect(isEncrypted(parsed.aiServices[0]!.apiKey)).toBe(true);
      expect(isEncrypted(parsed.aiServices[1]!.apiKey)).toBe(true);
      expect(isEncrypted(parsed.aiServices[2]!.apiKey)).toBe(true);
      
      // All should be different from original
      expect(parsed.aiServices[0]!.apiKey).not.toBe('key-1');
      expect(parsed.aiServices[1]!.apiKey).not.toBe('key-2');
      expect(parsed.aiServices[2]!.apiKey).not.toBe('key-3');
    });

    it('should maintain API key values through round-trip with encryption', () => {
      const originalKey = 'sk-test-key-123456789';
      const configWithKey: SystemConfig = {
        ...validConfig,
        aiServices: [
          {
            ...validConfig.aiServices[0]!,
            apiKey: originalKey,
          },
        ],
      };
      
      const json = serializeConfig(configWithKey);
      const parsed = JSON.parse(json);
      
      // Verify encryption happened
      expect(parsed.aiServices[0]!.apiKey).not.toBe(originalKey);
      expect(isEncrypted(parsed.aiServices[0]!.apiKey)).toBe(true);
      
      // Verify decryption restores original
      const config = deserializeConfig(json);
      expect(config.aiServices[0]!.apiKey).toBe(originalKey);
    });

    it('should handle already encrypted API keys (idempotent)', () => {
      // First serialization
      const json1 = serializeConfig(validConfig);
      const config1 = deserializeConfig(json1);
      
      // Second serialization of already processed config
      const json2 = serializeConfig(config1);
      const config2 = deserializeConfig(json2);
      
      // Should still match original
      expect(config2.aiServices[0]!.apiKey).toBe(validConfig.aiServices[0]!.apiKey);
    });

    it('should handle special characters in API keys', () => {
      const specialKey = 'sk-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const configWithSpecialKey: SystemConfig = {
        ...validConfig,
        aiServices: [
          {
            ...validConfig.aiServices[0]!,
            apiKey: specialKey,
          },
        ],
      };
      
      const json = serializeConfig(configWithSpecialKey);
      const config = deserializeConfig(json);
      
      expect(config.aiServices[0]!.apiKey).toBe(specialKey);
    });

    it('should handle long API keys', () => {
      const longKey = 'sk-' + 'a'.repeat(200);
      const configWithLongKey: SystemConfig = {
        ...validConfig,
        aiServices: [
          {
            ...validConfig.aiServices[0]!,
            apiKey: longKey,
          },
        ],
      };
      
      const json = serializeConfig(configWithLongKey);
      const config = deserializeConfig(json);
      
      expect(config.aiServices[0]!.apiKey).toBe(longKey);
    });

    it('should not encrypt other fields', () => {
      const json = serializeConfig(validConfig);
      const parsed = JSON.parse(json);
      
      // Other fields should remain unchanged
      expect(parsed.aiServices[0]!.name).toBe(validConfig.aiServices[0]!.name);
      expect(parsed.aiServices[0]!.apiUrl).toBe(validConfig.aiServices[0]!.apiUrl);
      expect(parsed.aiServices[0]!.model).toBe(validConfig.aiServices[0]!.model);
      expect(parsed.defaultService).toBe(validConfig.defaultService);
    });
  });

  describe('Configuration Error Handling (需求 14.4)', () => {
    describe('Corrupted config file scenarios', () => {
      it('should handle completely corrupted JSON', () => {
        const corruptedJson = 'this is not json at all!@#$%';
        
        expect(() => deserializeConfig(corruptedJson)).toThrow(ConfigServiceError);
        
        try {
          deserializeConfig(corruptedJson);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigServiceError);
          expect((error as ConfigServiceError).code).toBe('DESERIALIZE_ERROR');
          expect((error as ConfigServiceError).message).toContain('JSON');
        }
      });

      it('should handle partially corrupted JSON', () => {
        const partiallyCorrupted = '{"aiServices": [{"id": "test", "name": "Test"';
        
        expect(() => deserializeConfig(partiallyCorrupted)).toThrow(ConfigServiceError);
        
        try {
          deserializeConfig(partiallyCorrupted);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigServiceError);
          expect((error as ConfigServiceError).code).toBe('DESERIALIZE_ERROR');
        }
      });

      it('should handle config with missing required fields', () => {
        const missingFields = JSON.stringify({
          aiServices: [],
          // Missing all other required fields
        });
        
        expect(() => deserializeConfig(missingFields)).toThrow(ConfigServiceError);
        
        try {
          deserializeConfig(missingFields);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigServiceError);
          expect((error as ConfigServiceError).code).toBe('VALIDATION_ERROR');
          expect((error as ConfigServiceError).message).toContain('defaultService');
        }
      });

      it('should provide detailed validation errors', () => {
        const invalidConfig = JSON.stringify({
          aiServices: [
            {
              id: '',  // Invalid: empty
              name: 'Test',
              apiKey: 'key',
              apiUrl: 'not-a-url',  // Invalid: not a URL
              model: '',  // Invalid: empty
              provider: 'invalid-provider',  // Invalid: not in enum
            },
          ],
          defaultService: 'test',
          promptRepositoryPath: '',  // Invalid: empty
          outputDirectory: './output',
          theme: 'dark',
          internetAccess: { enabled: true },
          streamingConfig: { chunkSize: 1024, updateInterval: 50 },
        });
        
        try {
          deserializeConfig(invalidConfig);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigServiceError);
          expect((error as ConfigServiceError).code).toBe('VALIDATION_ERROR');
          const message = (error as ConfigServiceError).message;
          
          // Should mention multiple validation errors
          expect(message).toContain('aiServices[0].id');
          expect(message).toContain('aiServices[0].apiUrl');
          expect(message).toContain('aiServices[0].model');
          expect(message).toContain('aiServices[0].provider');
          expect(message).toContain('promptRepositoryPath');
        }
      });

      it('should handle config with wrong field types', () => {
        const wrongTypes = JSON.stringify({
          aiServices: 'not-an-array',  // Should be array
          defaultService: 123,  // Should be string
          promptRepositoryPath: true,  // Should be string
          outputDirectory: null,  // Should be string
          theme: 'invalid',  // Should be light/dark/auto
          internetAccess: 'not-an-object',  // Should be object
          streamingConfig: [],  // Should be object
        });
        
        expect(() => deserializeConfig(wrongTypes)).toThrow(ConfigServiceError);
      });
    });

    describe('Descriptive error messages', () => {
      it('should provide Chinese error messages for better UX', () => {
        const invalidJson = '{ invalid }';
        
        try {
          deserializeConfig(invalidJson);
        } catch (error) {
          const message = (error as ConfigServiceError).message;
          // Should be in Chinese
          expect(message).toMatch(/配置|JSON/);
        }
      });

      it('should include field names in validation errors', () => {
        const invalidConfig = JSON.stringify({
          aiServices: [],
          defaultService: '',
          promptRepositoryPath: '',
          outputDirectory: '',
          theme: 'invalid',
          internetAccess: { enabled: 'not-boolean' },
          streamingConfig: { chunkSize: -1, updateInterval: 0 },
        });
        
        try {
          deserializeConfig(invalidConfig);
        } catch (error) {
          const message = (error as ConfigServiceError).message;
          // Should list specific fields with errors
          expect(message).toContain('promptRepositoryPath');
          expect(message).toContain('outputDirectory');
          expect(message).toContain('theme');
        }
      });

      it('should provide helpful error context', () => {
        const malformedJson = '{"aiServices": [}';
        
        try {
          deserializeConfig(malformedJson);
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigServiceError);
          // Should have a cause with more details
          expect((error as ConfigServiceError).cause).toBeDefined();
        }
      });
    });
  });

  describe('Configuration Validation Helper (需求 14.4)', () => {
    it('should validate valid config', () => {
      const result = validateConfig(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const invalidConfig: Partial<SystemConfig> = {
        ...validConfig,
        aiServices: [
          {
            ...validConfig.aiServices[0]!,
            apiUrl: 'not-a-url',
          },
        ],
      };
      
      const result = validateConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]!).toContain('apiUrl');
    });

    it('should provide warnings for empty AI services', () => {
      const emptyServicesConfig = {
        ...validConfig,
        aiServices: [],
      };
      
      const result = validateConfig(emptyServicesConfig);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]!).toContain('AI服务');
    });

    it('should warn about unrestricted internet access', () => {
      const unrestrictedConfig = {
        ...validConfig,
        internetAccess: {
          enabled: true,
          allowedDomains: undefined,
        },
      };
      
      const result = validateConfig(unrestrictedConfig);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('联网'))).toBe(true);
    });
  });

  describe('Configuration Repair (需求 14.4)', () => {
    it('should repair config with missing fields', () => {
      const partialConfig = {
        aiServices: validConfig.aiServices,
        // Missing other fields
      };
      
      const repaired = repairConfig(partialConfig);
      
      expect(repaired.defaultService).toBeDefined();
      expect(repaired.promptRepositoryPath).toBeDefined();
      expect(repaired.outputDirectory).toBeDefined();
      expect(repaired.theme).toBeDefined();
      expect(repaired.internetAccess).toBeDefined();
      expect(repaired.streamingConfig).toBeDefined();
    });

    it('should filter out invalid AI services', () => {
      const configWithInvalidService = {
        ...validConfig,
        aiServices: [
          validConfig.aiServices[0],
          {
            id: 'invalid',
            name: 'Invalid',
            apiKey: 'key',
            apiUrl: 'not-a-url',  // Invalid
            model: 'model',
            provider: 'openai',
          } as any,
        ],
      };
      
      const repaired = repairConfig(configWithInvalidService);
      
      // Should only keep valid services
      expect(repaired.aiServices).toHaveLength(1);
      expect(repaired.aiServices[0]!.id).toBe(validConfig.aiServices[0]!.id);
    });

    it('should fix invalid defaultService', () => {
      const configWithInvalidDefault = {
        ...validConfig,
        defaultService: 'non-existent-service',
      };
      
      const repaired = repairConfig(configWithInvalidDefault);
      
      // Should set to first available service
      expect(repaired.defaultService).toBe(validConfig.aiServices[0]!.id);
    });

    it('should use defaults for completely missing sections', () => {
      const minimalConfig = {
        aiServices: [],
      };
      
      const repaired = repairConfig(minimalConfig);
      const defaultConfig = createDefaultSystemConfig();
      
      expect(repaired.promptRepositoryPath).toBe(defaultConfig.promptRepositoryPath);
      expect(repaired.outputDirectory).toBe(defaultConfig.outputDirectory);
      expect(repaired.theme).toBe(defaultConfig.theme);
      expect(repaired.internetAccess).toEqual(defaultConfig.internetAccess);
      expect(repaired.streamingConfig).toEqual(defaultConfig.streamingConfig);
    });

    it('should preserve valid fields while fixing invalid ones', () => {
      const mixedConfig: Partial<SystemConfig> = {
        aiServices: validConfig.aiServices,
        defaultService: validConfig.defaultService,
        promptRepositoryPath: './custom/prompts',  // Valid
        outputDirectory: '',  // Invalid
        theme: 'light' as const,  // Valid
        internetAccess: {
          enabled: 'not-boolean' as any,  // Invalid
        },
        streamingConfig: {
          chunkSize: 2048,  // Valid
          updateInterval: -1,  // Invalid
        },
      };
      
      const repaired = repairConfig(mixedConfig);
      
      // Valid fields should be preserved
      expect(repaired.promptRepositoryPath).toBe('./custom/prompts');
      expect(repaired.theme).toBe('light');
      expect(repaired.streamingConfig.chunkSize).toBe(2048);
      
      // Invalid fields should be replaced with defaults
      expect(repaired.outputDirectory).toBeDefined();
      expect(repaired.outputDirectory).not.toBe('');
      expect(typeof repaired.internetAccess.enabled).toBe('boolean');
      expect(repaired.streamingConfig.updateInterval).toBeGreaterThan(0);
    });

    it('should handle null and undefined values', () => {
      const configWithNulls = {
        aiServices: null,
        defaultService: undefined,
        promptRepositoryPath: null,
        outputDirectory: undefined,
      };
      
      const repaired = repairConfig(configWithNulls as any);
      
      expect(Array.isArray(repaired.aiServices)).toBe(true);
      expect(typeof repaired.defaultService).toBe('string');
      expect(typeof repaired.promptRepositoryPath).toBe('string');
      expect(typeof repaired.outputDirectory).toBe('string');
    });
  });
});
