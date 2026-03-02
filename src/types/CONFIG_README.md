# Configuration Data Models and Validation

This document describes the configuration data models and validation functions for the Agent Swarm Writing System.

## Overview

The configuration system provides type-safe data models for:
- AI service configurations
- System-wide settings
- Internet access controls
- Streaming output settings

All configuration objects include comprehensive validation functions to ensure data integrity.

## Type Definitions

### AIServiceConfig

Represents a single AI service configuration.

```typescript
interface AIServiceConfig {
  id: string;              // Unique identifier
  name: string;            // User-friendly name
  apiKey: string;          // API key (encrypted in storage)
  apiUrl: string;          // API endpoint URL
  model: string;           // Model name
  provider: AIProvider;    // 'openai' | 'anthropic' | 'custom'
  maxTokens?: number;      // Optional: max tokens (positive integer)
  temperature?: number;    // Optional: temperature (0-2)
}
```

### SystemConfig

Complete system configuration.

```typescript
interface SystemConfig {
  aiServices: AIServiceConfig[];           // List of AI services
  defaultService: string;                  // Default service ID
  promptRepositoryPath: string;            // Path to prompts folder
  outputDirectory: string;                 // Output directory path
  theme: 'light' | 'dark' | 'auto';       // UI theme
  internetAccess: InternetAccessConfig;    // Internet access settings
  streamingConfig: StreamingConfig;        // Streaming settings
}
```

### InternetAccessConfig

Controls internet access for AI agents.

```typescript
interface InternetAccessConfig {
  enabled: boolean;              // Enable/disable internet access
  allowedDomains?: string[];     // Optional: whitelist of domains
}
```

### StreamingConfig

Controls streaming output behavior.

```typescript
interface StreamingConfig {
  chunkSize: number;        // Data chunk size in bytes
  updateInterval: number;   // UI update interval in milliseconds
}
```

## Validation Functions

### validateAIServiceConfig(config)

Validates an AI service configuration.

**Parameters:**
- `config: Partial<AIServiceConfig>` - Configuration to validate

**Returns:**
- `ValidationResult` - Object with `isValid` boolean and `errors` array

**Validation Rules:**
- `id`: Required, non-empty string
- `name`: Required, non-empty string
- `apiKey`: Required, non-empty string
- `apiUrl`: Required, valid HTTP/HTTPS URL
- `model`: Required, non-empty string
- `provider`: Required, must be 'openai', 'anthropic', or 'custom'
- `maxTokens`: Optional, positive integer if provided
- `temperature`: Optional, number between 0 and 2 if provided

**Example:**
```typescript
const config: AIServiceConfig = {
  id: 'openai-gpt4',
  name: 'OpenAI GPT-4',
  apiKey: 'sk-...',
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  provider: 'openai',
  temperature: 0.7,
};

const result = validateAIServiceConfig(config);
if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}
```

### validateSystemConfig(config)

Validates a complete system configuration.

**Parameters:**
- `config: Partial<SystemConfig>` - Configuration to validate

**Returns:**
- `ValidationResult` - Object with `isValid` boolean and `errors` array

**Validation Rules:**
- All nested configurations are validated recursively
- `defaultService` must reference an existing service ID
- `theme` must be 'light', 'dark', or 'auto'
- All required fields must be present and valid

**Example:**
```typescript
const config: SystemConfig = {
  aiServices: [/* ... */],
  defaultService: 'openai-gpt4',
  promptRepositoryPath: './prompts',
  outputDirectory: './output',
  theme: 'auto',
  internetAccess: { enabled: true },
  streamingConfig: { chunkSize: 1024, updateInterval: 50 },
};

const result = validateSystemConfig(config);
if (result.isValid) {
  // Save configuration
}
```

### validateInternetAccessConfig(config)

Validates internet access configuration.

**Parameters:**
- `config: Partial<InternetAccessConfig>` - Configuration to validate

**Returns:**
- `ValidationResult` - Object with `isValid` boolean and `errors` array

### validateStreamingConfig(config)

Validates streaming configuration.

**Parameters:**
- `config: Partial<StreamingConfig>` - Configuration to validate

**Returns:**
- `ValidationResult` - Object with `isValid` boolean and `errors` array

## Default Configurations

### createDefaultSystemConfig()

Creates a default system configuration with sensible defaults.

**Returns:**
- `SystemConfig` - Default configuration object

**Default Values:**
- `aiServices`: Empty array
- `defaultService`: Empty string
- `promptRepositoryPath`: './prompts'
- `outputDirectory`: './output'
- `theme`: 'auto'
- `internetAccess.enabled`: true
- `streamingConfig.chunkSize`: 1024 bytes
- `streamingConfig.updateInterval`: 50ms

**Example:**
```typescript
const defaultConfig = createDefaultSystemConfig();
// Customize as needed
defaultConfig.aiServices.push(myAIService);
defaultConfig.defaultService = myAIService.id;
```

## Validation Result Structure

```typescript
interface ValidationResult {
  isValid: boolean;      // True if validation passed
  errors: ValidationError[];  // Array of validation errors
}

interface ValidationError {
  field: string;         // Field name that failed validation
  message: string;       // Human-readable error message
  value?: unknown;       // The invalid value (optional)
}
```

## Error Handling

When validation fails, the `errors` array contains detailed information about each validation failure:

```typescript
const result = validateAIServiceConfig(config);
if (!result.isValid) {
  result.errors.forEach(error => {
    console.error(`Field: ${error.field}`);
    console.error(`Error: ${error.message}`);
    console.error(`Value: ${error.value}`);
  });
}
```

## Best Practices

1. **Always validate before saving**: Validate configurations before persisting to storage
2. **Handle validation errors gracefully**: Show user-friendly error messages
3. **Use default configurations**: Start with `createDefaultSystemConfig()` for new setups
4. **Validate on load**: Re-validate configurations when loading from storage
5. **Encrypt sensitive data**: API keys should be encrypted before storage (see encryption module)

## Testing

Unit tests are provided in `config.test.ts`. To run tests:

```typescript
import { runAllConfigTests } from './config.test';
runAllConfigTests();
```

Tests cover:
- Valid configurations
- Missing required fields
- Invalid field values
- Edge cases (empty strings, invalid URLs, etc.)
- Optional field handling
- Nested configuration validation

## Requirements Mapping

This implementation satisfies the following requirements:
- **需求 2.1**: AI配置管理 - 允许用户配置AI名称、API密钥和URL
- **需求 2.4**: 支持配置多个不同的AI服务
- **需求 14.1-14.4**: 配置解析和序列化

## Related Files

- `config.ts` - Type definitions and validation functions
- `config.test.ts` - Unit tests
- `config-validation-demo.ts` - Usage examples
- `../services/configService.ts` - Configuration persistence (to be implemented)
