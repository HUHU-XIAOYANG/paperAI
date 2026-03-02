# Services

This directory contains service layer implementations:

- **ConfigService**: Configuration persistence and serialization (✅ Implemented)
- **PromptLoader**: Prompt template loading and management (✅ Implemented)
- **AIClient**: Unified AI service interface
- **AgentManager**: Agent lifecycle management
- **InteractionRouter**: Message routing and communication
- **StreamHandler**: Streaming output processing
- **FormatParser**: AI output format parsing and validation
- **DocumentExporter**: Document export functionality

## ConfigService

The configuration service provides serialization, deserialization, and file I/O for system configuration.

### Features

- **Serialization**: Convert SystemConfig objects to JSON strings
- **Deserialization**: Parse JSON strings back to validated SystemConfig objects
- **File I/O**: Save and load configurations using Tauri's fs API
- **Validation**: Automatic validation during deserialization
- **Error Handling**: Descriptive errors with error codes
- **Default Config**: Fallback to default configuration on load failure

### Usage

```typescript
import {
  serializeConfig,
  deserializeConfig,
  saveConfig,
  loadConfig,
  loadConfigOrDefault,
  configExists,
} from './services/configService';

// Serialize configuration
const json = serializeConfig(config);

// Deserialize configuration
const config = deserializeConfig(json);

// Save to file
await saveConfig(config);

// Load from file
const config = await loadConfig();

// Load or use default
const { config, error } = await loadConfigOrDefault();

// Check if config file exists
const exists = await configExists();
```

See `configService.example.ts` for more detailed examples.

## PromptLoader

The prompt loader service provides loading, parsing, and variable substitution for prompt templates stored in YAML files.

### Features

- **YAML Parsing**: Parse YAML prompt files using js-yaml
- **Variable Substitution**: Replace `{{variable}}` placeholders with actual values
- **Validation**: Validate prompt template completeness and correctness
- **Caching**: Cache loaded prompts to avoid repeated file I/O
- **Batch Loading**: Load multiple prompts simultaneously
- **Error Handling**: Descriptive errors for file not found, parse errors, and validation failures
- **Flexible Configuration**: Customize repository path, cache behavior, and file extension

### Usage

```typescript
import {
  loadPrompt,
  loadPromptTemplate,
  substituteVariables,
  validatePromptTemplate,
  configurePromptLoader,
  clearPromptCache,
  reloadPrompts,
} from './services/promptLoader';

// Load prompt with variable substitution
const prompt = await loadPrompt('decision', {
  topic: '人工智能在医疗诊断中的应用研究',
});

// Load template only (no variable substitution)
const template = await loadPromptTemplate('supervisor');

// Manual variable substitution
const text = '论文题目：{{topic}}';
const result = substituteVariables(text, { topic: 'AI研究' });

// Validate prompt template
const validation = validatePromptTemplate(template);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Configure loader
configurePromptLoader({
  basePath: 'custom/prompts',
  cacheEnabled: true,
});

// Clear cache
clearPromptCache();

// Reload all prompts (clears cache)
reloadPrompts();
```

### Variable Substitution Options

```typescript
// Strict mode (default): throws error if required variable is missing
const result = substituteVariables(text, vars, { strict: true });

// Non-strict mode: replaces missing variables with empty string
const result = substituteVariables(text, vars, { strict: false });

// Keep unresolved variables
const result = substituteVariables(text, vars, {
  strict: false,
  keepUnresolved: true,
});

// Custom syntax
const result = substituteVariables(text, vars, {
  prefix: '<',
  suffix: '>',
});
```

See `promptLoader.example.ts` for more detailed examples.

Each remaining service will be implemented in subsequent tasks.
