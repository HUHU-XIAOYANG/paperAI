/**
 * 配置持久化服务
 * Configuration persistence service using Tauri's fs API
 * 
 * 需求: 14.1, 14.2
 * 
 * 提供配置的序列化、反序列化和文件读写功能
 */

import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { SystemConfig } from '../types/config';
import { validateSystemConfig, createDefaultSystemConfig } from '../types/config';
import { encryptApiKey, decryptApiKey, isEncrypted } from '../utils/encryption';

// ============================================================================
// Constants
// ============================================================================

/**
 * 配置文件名
 */
const CONFIG_FILE_NAME = 'config.json';

/**
 * 配置文件基础目录（使用Tauri的AppData目录）
 */
const CONFIG_BASE_DIR = BaseDirectory.AppData;

// ============================================================================
// Error Types
// ============================================================================

/**
 * 配置服务错误类型
 */
export class ConfigServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'SERIALIZE_ERROR' | 'DESERIALIZE_ERROR' | 'READ_ERROR' | 'WRITE_ERROR' | 'VALIDATION_ERROR',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ConfigServiceError';
  }
}

// ============================================================================
// Encryption Helper Functions
// ============================================================================

/**
 * 加密配置中的所有API密钥
 * 
 * @param config - 系统配置对象
 * @returns 加密后的配置对象（新对象，不修改原对象）
 */
function encryptConfigApiKeys(config: SystemConfig): SystemConfig {
  return {
    ...config,
    aiServices: config.aiServices.map((service) => ({
      ...service,
      apiKey: isEncrypted(service.apiKey) ? service.apiKey : encryptApiKey(service.apiKey),
    })),
  };
}

/**
 * 解密配置中的所有API密钥
 * 
 * @param config - 系统配置对象
 * @returns 解密后的配置对象（新对象，不修改原对象）
 */
function decryptConfigApiKeys(config: SystemConfig): SystemConfig {
  return {
    ...config,
    aiServices: config.aiServices.map((service) => ({
      ...service,
      apiKey: isEncrypted(service.apiKey) ? decryptApiKey(service.apiKey) : service.apiKey,
    })),
  };
}

// ============================================================================
// Serialization Functions
// ============================================================================

/**
 * 序列化配置对象为JSON字符串
 * API密钥会在序列化前自动加密
 * 
 * @param config - 系统配置对象
 * @returns JSON字符串
 * @throws {ConfigServiceError} 序列化失败时抛出
 */
export function serializeConfig(config: SystemConfig): string {
  try {
    // 加密API密钥
    const encryptedConfig = encryptConfigApiKeys(config);
    
    // 使用2个空格缩进，使配置文件更易读
    return JSON.stringify(encryptedConfig, null, 2);
  } catch (error) {
    throw new ConfigServiceError(
      `配置序列化失败: ${error instanceof Error ? error.message : '未知错误'}`,
      'SERIALIZE_ERROR',
      error
    );
  }
}

/**
 * 反序列化JSON字符串为配置对象
 * API密钥会在反序列化后自动解密
 * 
 * @param json - JSON字符串
 * @returns 系统配置对象
 * @throws {ConfigServiceError} 反序列化或验证失败时抛出
 */
export function deserializeConfig(json: string): SystemConfig {
  try {
    const config = JSON.parse(json) as SystemConfig;
    
    // 验证反序列化后的配置（在解密前验证，因为验证不需要明文密钥）
    const validation = validateSystemConfig(config);
    if (!validation.isValid) {
      // 生成详细的验证错误信息
      const errorMessages = validation.errors
        .map(e => `  - ${e.field}: ${e.message}`)
        .join('\n');
      throw new ConfigServiceError(
        `配置验证失败，发现以下问题:\n${errorMessages}`,
        'VALIDATION_ERROR'
      );
    }
    
    // 解密API密钥
    return decryptConfigApiKeys(config);
  } catch (error) {
    if (error instanceof ConfigServiceError) {
      throw error;
    }
    
    // 为JSON解析错误提供更友好的错误信息
    if (error instanceof SyntaxError) {
      throw new ConfigServiceError(
        `配置文件不是有效的JSON格式: ${error.message}`,
        'DESERIALIZE_ERROR',
        error
      );
    }
    
    throw new ConfigServiceError(
      `配置反序列化失败: ${error instanceof Error ? error.message : '未知错误'}`,
      'DESERIALIZE_ERROR',
      error
    );
  }
}

// ============================================================================
// File I/O Functions
// ============================================================================

/**
 * 保存配置到文件
 * 
 * @param config - 系统配置对象
 * @throws {ConfigServiceError} 保存失败时抛出
 */
export async function saveConfig(config: SystemConfig): Promise<void> {
  try {
    // 序列化配置
    const json = serializeConfig(config);
    
    // 写入文件（Tauri会自动创建目录）
    await writeTextFile(CONFIG_FILE_NAME, json, {
      baseDir: CONFIG_BASE_DIR,
    });
  } catch (error) {
    if (error instanceof ConfigServiceError) {
      throw error;
    }
    throw new ConfigServiceError(
      `配置文件写入失败: ${error instanceof Error ? error.message : '未知错误'}`,
      'WRITE_ERROR',
      error
    );
  }
}

/**
 * 从文件加载配置
 * 
 * @returns 系统配置对象
 * @throws {ConfigServiceError} 加载失败时抛出
 */
export async function loadConfig(): Promise<SystemConfig> {
  try {
    // 检查文件是否存在
    const fileExists = await exists(CONFIG_FILE_NAME, {
      baseDir: CONFIG_BASE_DIR,
    });
    
    if (!fileExists) {
      throw new ConfigServiceError(
        '配置文件不存在。请先创建配置或使用默认配置。',
        'READ_ERROR'
      );
    }
    
    // 读取文件内容
    const json = await readTextFile(CONFIG_FILE_NAME, {
      baseDir: CONFIG_BASE_DIR,
    });
    
    // 反序列化配置
    return deserializeConfig(json);
  } catch (error) {
    if (error instanceof ConfigServiceError) {
      throw error;
    }
    throw new ConfigServiceError(
      `配置文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`,
      'READ_ERROR',
      error
    );
  }
}

/**
 * 加载配置，如果失败则返回默认配置
 * 
 * 需求: 14.4 - 处理损坏的配置文件，返回默认配置和描述性错误信息
 * 
 * @returns 系统配置对象和错误信息（如果有）
 */
export async function loadConfigOrDefault(): Promise<{
  config: SystemConfig;
  error?: string;
}> {
  try {
    const config = await loadConfig();
    return { config };
  } catch (error) {
    // 生成描述性错误信息
    let errorMessage: string;
    
    if (error instanceof ConfigServiceError) {
      // 根据错误类型提供具体的错误描述
      switch (error.code) {
        case 'READ_ERROR':
          errorMessage = `无法读取配置文件: ${error.message}. 配置文件可能不存在或无法访问。`;
          break;
        case 'DESERIALIZE_ERROR':
          errorMessage = `配置文件格式错误: ${error.message}. 配置文件可能已损坏或不是有效的JSON格式。`;
          break;
        case 'VALIDATION_ERROR':
          errorMessage = `配置验证失败: ${error.message}. 配置文件包含无效的配置项。`;
          break;
        case 'SERIALIZE_ERROR':
          errorMessage = `配置序列化失败: ${error.message}. 这通常不应该在加载时发生。`;
          break;
        case 'WRITE_ERROR':
          errorMessage = `配置写入失败: ${error.message}. 这通常不应该在加载时发生。`;
          break;
        default:
          errorMessage = `配置加载失败: ${error.message} (错误代码: ${error.code})`;
      }
    } else if (error instanceof Error) {
      errorMessage = `配置加载时发生未知错误: ${error.message}`;
    } else {
      errorMessage = '配置加载时发生未知错误';
    }
    
    console.warn('Failed to load configuration, using default:', errorMessage);
    
    return {
      config: createDefaultSystemConfig(),
      error: errorMessage,
    };
  }
}

/**
 * 检查配置文件是否存在
 * 
 * @returns 配置文件是否存在
 */
export async function configExists(): Promise<boolean> {
  try {
    return await exists(CONFIG_FILE_NAME, {
      baseDir: CONFIG_BASE_DIR,
    });
  } catch {
    return false;
  }
}

/**
 * 验证配置对象并返回详细的验证结果
 * 
 * 需求: 14.4 - 提供描述性的配置验证错误信息
 * 
 * @param config - 要验证的配置对象
 * @returns 验证结果，包含是否有效和详细的错误信息
 */
export function validateConfig(config: Partial<SystemConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const validation = validateSystemConfig(config);
  const warnings: string[] = [];
  
  // 添加警告信息
  if (Array.isArray(config.aiServices) && config.aiServices.length === 0) {
    warnings.push('配置中没有AI服务。您需要添加至少一个AI服务才能使用系统。');
  }
  
  if (config.internetAccess?.enabled && !config.internetAccess.allowedDomains) {
    warnings.push('联网功能已启用但未限制允许的域名。AI将能够访问任何网站。');
  }
  
  return {
    isValid: validation.isValid,
    errors: validation.errors.map(e => `${e.field}: ${e.message}`),
    warnings,
  };
}

/**
 * 尝试修复损坏的配置
 * 
 * 需求: 14.4 - 处理损坏的配置文件
 * 
 * 此函数尝试从损坏的配置中恢复尽可能多的有效数据，
 * 并用默认值填充缺失或无效的字段。
 * 
 * @param partialConfig - 可能损坏或不完整的配置对象
 * @returns 修复后的完整配置对象
 */
export function repairConfig(partialConfig: Partial<SystemConfig>): SystemConfig {
  const defaultConfig = createDefaultSystemConfig();
  
  // 修复aiServices
  let aiServices: SystemConfig['aiServices'] = [];
  if (Array.isArray(partialConfig.aiServices)) {
    aiServices = partialConfig.aiServices.filter(service => {
      const validation = validateSystemConfig({ 
        ...defaultConfig, 
        aiServices: [service] 
      });
      return validation.isValid;
    });
  }
  
  // 修复defaultService
  let defaultService = defaultConfig.defaultService;
  if (typeof partialConfig.defaultService === 'string') {
    if (aiServices.some(s => s.id === partialConfig.defaultService)) {
      defaultService = partialConfig.defaultService;
    } else if (aiServices.length > 0 && aiServices[0]) {
      defaultService = aiServices[0].id;
    }
  }
  
  // 修复其他字段
  return {
    aiServices,
    defaultService,
    promptRepositoryPath: 
      typeof partialConfig.promptRepositoryPath === 'string' && partialConfig.promptRepositoryPath.trim() !== ''
        ? partialConfig.promptRepositoryPath
        : defaultConfig.promptRepositoryPath,
    outputDirectory:
      typeof partialConfig.outputDirectory === 'string' && partialConfig.outputDirectory.trim() !== ''
        ? partialConfig.outputDirectory
        : defaultConfig.outputDirectory,
    theme:
      partialConfig.theme && ['light', 'dark', 'auto'].includes(partialConfig.theme)
        ? partialConfig.theme
        : defaultConfig.theme,
    internetAccess: {
      enabled: typeof partialConfig.internetAccess?.enabled === 'boolean'
        ? partialConfig.internetAccess.enabled
        : defaultConfig.internetAccess.enabled,
      allowedDomains: Array.isArray(partialConfig.internetAccess?.allowedDomains)
        ? partialConfig.internetAccess.allowedDomains.filter(d => typeof d === 'string' && d.trim() !== '')
        : defaultConfig.internetAccess.allowedDomains,
    },
    streamingConfig: {
      chunkSize:
        typeof partialConfig.streamingConfig?.chunkSize === 'number' &&
        partialConfig.streamingConfig.chunkSize > 0
          ? partialConfig.streamingConfig.chunkSize
          : defaultConfig.streamingConfig.chunkSize,
      updateInterval:
        typeof partialConfig.streamingConfig?.updateInterval === 'number' &&
        partialConfig.streamingConfig.updateInterval > 0
          ? partialConfig.streamingConfig.updateInterval
          : defaultConfig.streamingConfig.updateInterval,
    },
  };
}
