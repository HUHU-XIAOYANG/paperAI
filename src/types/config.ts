/**
 * 配置相关类型定义和验证函数
 * Configuration data models and validation functions
 * 
 * 需求: 2.1, 2.4
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * AI服务提供商类型
 */
export type AIProvider = 'openai' | 'anthropic' | 'custom';

/**
 * AI服务配置
 * 包含连接AI服务所需的所有信息
 */
export interface AIServiceConfig {
  id: string; // 唯一标识符
  name: string; // 服务名称（用户自定义）
  apiKey: string; // API密钥（加密存储）
  apiUrl: string; // API端点URL
  model: string; // 模型名称
  provider: AIProvider; // 服务提供商
  maxTokens?: number; // 最大token数（可选）
  temperature?: number; // 温度参数（可选，0-2）
}

/**
 * 联网访问配置
 */
export interface InternetAccessConfig {
  enabled: boolean; // 是否启用联网功能
  allowedDomains?: string[]; // 允许访问的域名列表（可选）
}

/**
 * 流式输出配置
 */
export interface StreamingConfig {
  chunkSize: number; // 数据块大小（字节）
  updateInterval: number; // UI更新间隔（毫秒）
}

/**
 * 系统配置
 * 包含所有系统级配置选项
 */
export interface SystemConfig {
  aiServices: AIServiceConfig[]; // AI服务列表
  defaultService: string; // 默认AI服务ID
  promptRepositoryPath: string; // 提示词仓库路径
  outputDirectory: string; // 输出目录路径
  theme: 'light' | 'dark' | 'auto'; // UI主题
  internetAccess: InternetAccessConfig; // 联网访问配置
  streamingConfig: StreamingConfig; // 流式输出配置
}

// ============================================================================
// Validation Error Types
// ============================================================================

/**
 * 验证错误
 */
export interface ValidationError {
  field: string; // 错误字段
  message: string; // 错误信息
  value?: unknown; // 错误值（可选）
}

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean; // 是否有效
  errors: ValidationError[]; // 错误列表
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * 验证URL格式
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 验证温度参数范围
 */
function isValidTemperature(temperature: number): boolean {
  return temperature >= 0 && temperature <= 2;
}

/**
 * 验证maxTokens参数
 */
function isValidMaxTokens(maxTokens: number): boolean {
  return maxTokens > 0 && Number.isInteger(maxTokens);
}

/**
 * 验证AI服务配置
 * 
 * @param config - AI服务配置对象
 * @returns 验证结果
 */
export function validateAIServiceConfig(config: Partial<AIServiceConfig>): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证必需字段
  if (!config.id || typeof config.id !== 'string' || config.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'ID is required and must be a non-empty string',
      value: config.id,
    });
  }

  if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a non-empty string',
      value: config.name,
    });
  }

  if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
    errors.push({
      field: 'apiKey',
      message: 'API key is required and must be a non-empty string',
      value: config.apiKey,
    });
  }

  if (!config.apiUrl || typeof config.apiUrl !== 'string') {
    errors.push({
      field: 'apiUrl',
      message: 'API URL is required and must be a string',
      value: config.apiUrl,
    });
  } else if (!isValidUrl(config.apiUrl)) {
    errors.push({
      field: 'apiUrl',
      message: 'API URL must be a valid HTTP or HTTPS URL',
      value: config.apiUrl,
    });
  }

  if (!config.model || typeof config.model !== 'string' || config.model.trim() === '') {
    errors.push({
      field: 'model',
      message: 'Model is required and must be a non-empty string',
      value: config.model,
    });
  }

  if (!config.provider || !['openai', 'anthropic', 'custom'].includes(config.provider)) {
    errors.push({
      field: 'provider',
      message: 'Provider must be one of: openai, anthropic, custom',
      value: config.provider,
    });
  }

  // 验证可选字段
  if (config.maxTokens !== undefined) {
    if (typeof config.maxTokens !== 'number') {
      errors.push({
        field: 'maxTokens',
        message: 'maxTokens must be a number',
        value: config.maxTokens,
      });
    } else if (!isValidMaxTokens(config.maxTokens)) {
      errors.push({
        field: 'maxTokens',
        message: 'maxTokens must be a positive integer',
        value: config.maxTokens,
      });
    }
  }

  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number') {
      errors.push({
        field: 'temperature',
        message: 'temperature must be a number',
        value: config.temperature,
      });
    } else if (!isValidTemperature(config.temperature)) {
      errors.push({
        field: 'temperature',
        message: 'temperature must be between 0 and 2',
        value: config.temperature,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证联网访问配置
 * 
 * @param config - 联网访问配置对象
 * @returns 验证结果
 */
export function validateInternetAccessConfig(
  config: Partial<InternetAccessConfig>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof config.enabled !== 'boolean') {
    errors.push({
      field: 'enabled',
      message: 'enabled must be a boolean',
      value: config.enabled,
    });
  }

  if (config.allowedDomains !== undefined) {
    if (!Array.isArray(config.allowedDomains)) {
      errors.push({
        field: 'allowedDomains',
        message: 'allowedDomains must be an array',
        value: config.allowedDomains,
      });
    } else {
      config.allowedDomains.forEach((domain, index) => {
        if (typeof domain !== 'string' || domain.trim() === '') {
          errors.push({
            field: `allowedDomains[${index}]`,
            message: 'Each domain must be a non-empty string',
            value: domain,
          });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证流式输出配置
 * 
 * @param config - 流式输出配置对象
 * @returns 验证结果
 */
export function validateStreamingConfig(config: Partial<StreamingConfig>): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof config.chunkSize !== 'number') {
    errors.push({
      field: 'chunkSize',
      message: 'chunkSize must be a number',
      value: config.chunkSize,
    });
  } else if (config.chunkSize <= 0 || !Number.isInteger(config.chunkSize)) {
    errors.push({
      field: 'chunkSize',
      message: 'chunkSize must be a positive integer',
      value: config.chunkSize,
    });
  }

  if (typeof config.updateInterval !== 'number') {
    errors.push({
      field: 'updateInterval',
      message: 'updateInterval must be a number',
      value: config.updateInterval,
    });
  } else if (config.updateInterval <= 0) {
    errors.push({
      field: 'updateInterval',
      message: 'updateInterval must be a positive number',
      value: config.updateInterval,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证系统配置
 * 
 * @param config - 系统配置对象
 * @returns 验证结果
 */
export function validateSystemConfig(config: Partial<SystemConfig>): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证aiServices
  if (!Array.isArray(config.aiServices)) {
    errors.push({
      field: 'aiServices',
      message: 'aiServices must be an array',
      value: config.aiServices,
    });
  } else {
    config.aiServices.forEach((service, index) => {
      const serviceValidation = validateAIServiceConfig(service);
      if (!serviceValidation.isValid) {
        serviceValidation.errors.forEach((error) => {
          errors.push({
            field: `aiServices[${index}].${error.field}`,
            message: error.message,
            value: error.value,
          });
        });
      }
    });
  }

  // 验证defaultService
  if (typeof config.defaultService !== 'string') {
    errors.push({
      field: 'defaultService',
      message: 'defaultService is required and must be a string',
      value: config.defaultService,
    });
  } else if (
    config.defaultService !== '' && // Allow empty string when no services
    Array.isArray(config.aiServices) &&
    !config.aiServices.some((s) => s.id === config.defaultService)
  ) {
    errors.push({
      field: 'defaultService',
      message: 'defaultService must reference an existing AI service ID',
      value: config.defaultService,
    });
  }

  // 验证promptRepositoryPath
  if (
    !config.promptRepositoryPath ||
    typeof config.promptRepositoryPath !== 'string' ||
    config.promptRepositoryPath.trim() === ''
  ) {
    errors.push({
      field: 'promptRepositoryPath',
      message: 'promptRepositoryPath is required and must be a non-empty string',
      value: config.promptRepositoryPath,
    });
  }

  // 验证outputDirectory
  if (
    !config.outputDirectory ||
    typeof config.outputDirectory !== 'string' ||
    config.outputDirectory.trim() === ''
  ) {
    errors.push({
      field: 'outputDirectory',
      message: 'outputDirectory is required and must be a non-empty string',
      value: config.outputDirectory,
    });
  }

  // 验证theme
  if (!config.theme || !['light', 'dark', 'auto'].includes(config.theme)) {
    errors.push({
      field: 'theme',
      message: 'theme must be one of: light, dark, auto',
      value: config.theme,
    });
  }

  // 验证internetAccess
  if (config.internetAccess) {
    const internetAccessValidation = validateInternetAccessConfig(config.internetAccess);
    if (!internetAccessValidation.isValid) {
      internetAccessValidation.errors.forEach((error) => {
        errors.push({
          field: `internetAccess.${error.field}`,
          message: error.message,
          value: error.value,
        });
      });
    }
  } else {
    errors.push({
      field: 'internetAccess',
      message: 'internetAccess configuration is required',
      value: config.internetAccess,
    });
  }

  // 验证streamingConfig
  if (config.streamingConfig) {
    const streamingConfigValidation = validateStreamingConfig(config.streamingConfig);
    if (!streamingConfigValidation.isValid) {
      streamingConfigValidation.errors.forEach((error) => {
        errors.push({
          field: `streamingConfig.${error.field}`,
          message: error.message,
          value: error.value,
        });
      });
    }
  } else {
    errors.push({
      field: 'streamingConfig',
      message: 'streamingConfig configuration is required',
      value: config.streamingConfig,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * 默认流式输出配置
 */
export const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  chunkSize: 1024, // 1KB
  updateInterval: 50, // 50ms
};

/**
 * 默认联网访问配置
 */
export const DEFAULT_INTERNET_ACCESS_CONFIG: InternetAccessConfig = {
  enabled: true,
  allowedDomains: undefined, // 允许所有域名
};

/**
 * 创建默认系统配置
 * 
 * @returns 默认系统配置
 */
export function createDefaultSystemConfig(): SystemConfig {
  return {
    aiServices: [],
    defaultService: '',
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'auto',
    internetAccess: DEFAULT_INTERNET_ACCESS_CONFIG,
    streamingConfig: DEFAULT_STREAMING_CONFIG,
  };
}
