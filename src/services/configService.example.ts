/**
 * 配置服务使用示例
 * Configuration service usage examples
 * 
 * 这个文件展示了如何使用配置持久化服务
 */

import {
  serializeConfig,
  deserializeConfig,
  saveConfig,
  loadConfig,
  loadConfigOrDefault,
  configExists,
  ConfigServiceError,
} from './configService';
import type { SystemConfig } from '../types/config';

// ============================================================================
// 示例 1: 序列化和反序列化配置
// ============================================================================

async function example1_SerializeDeserialize() {
  console.log('=== Example 1: Serialize and Deserialize ===');
  
  const config: SystemConfig = {
    aiServices: [
      {
        id: 'openai-gpt4',
        name: 'OpenAI GPT-4',
        apiKey: 'sk-your-api-key-here',
        apiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        provider: 'openai',
        maxTokens: 4096,
        temperature: 0.7,
      },
    ],
    defaultService: 'openai-gpt4',
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'dark',
    internetAccess: {
      enabled: true,
      allowedDomains: ['arxiv.org', 'scholar.google.com'],
    },
    streamingConfig: {
      chunkSize: 1024,
      updateInterval: 50,
    },
  };
  
  // 序列化为JSON字符串
  const json = serializeConfig(config);
  console.log('Serialized config:', json);
  
  // 反序列化回配置对象
  const deserializedConfig = deserializeConfig(json);
  console.log('Deserialized config:', deserializedConfig);
  
  // 验证往返属性
  console.log('Round-trip successful:', JSON.stringify(config) === JSON.stringify(deserializedConfig));
}

// ============================================================================
// 示例 2: 保存和加载配置
// ============================================================================

async function example2_SaveLoad() {
  console.log('\n=== Example 2: Save and Load Config ===');
  
  const config: SystemConfig = {
    aiServices: [
      {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        apiKey: 'sk-ant-your-key',
        apiUrl: 'https://api.anthropic.com',
        model: 'claude-3-opus',
        provider: 'anthropic',
      },
    ],
    defaultService: 'anthropic-claude',
    promptRepositoryPath: './prompts',
    outputDirectory: './output',
    theme: 'light',
    internetAccess: {
      enabled: false,
    },
    streamingConfig: {
      chunkSize: 2048,
      updateInterval: 100,
    },
  };
  
  try {
    // 保存配置到文件
    await saveConfig(config);
    console.log('Config saved successfully');
    
    // 从文件加载配置
    const loadedConfig = await loadConfig();
    console.log('Config loaded successfully:', loadedConfig);
  } catch (error) {
    if (error instanceof ConfigServiceError) {
      console.error('Config service error:', error.message, error.code);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// ============================================================================
// 示例 3: 加载配置或使用默认值
// ============================================================================

async function example3_LoadOrDefault() {
  console.log('\n=== Example 3: Load Config or Use Default ===');
  
  // 这个函数永远不会抛出错误，如果加载失败会返回默认配置
  const { config, error } = await loadConfigOrDefault();
  
  if (error) {
    console.warn('Failed to load config, using default:', error);
  } else {
    console.log('Config loaded successfully');
  }
  
  console.log('Config:', config);
}

// ============================================================================
// 示例 4: 检查配置文件是否存在
// ============================================================================

async function example4_CheckExists() {
  console.log('\n=== Example 4: Check if Config Exists ===');
  
  const exists = await configExists();
  console.log('Config file exists:', exists);
  
  if (!exists) {
    console.log('Creating default config...');
    const { config } = await loadConfigOrDefault();
    await saveConfig(config);
    console.log('Default config created');
  }
}

// ============================================================================
// 示例 5: 错误处理
// ============================================================================

async function example5_ErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===');
  
  // 尝试反序列化无效的JSON
  try {
    const invalidJson = '{ invalid json }';
    deserializeConfig(invalidJson);
  } catch (error) {
    if (error instanceof ConfigServiceError) {
      console.log('Caught ConfigServiceError:');
      console.log('  Message:', error.message);
      console.log('  Code:', error.code);
      console.log('  Cause:', error.cause);
    }
  }
  
  // 尝试反序列化不符合验证规则的配置
  try {
    const invalidConfig = JSON.stringify({
      aiServices: [],
      defaultService: 'non-existent-service', // 引用不存在的服务
      promptRepositoryPath: './prompts',
      outputDirectory: './output',
      theme: 'dark',
      internetAccess: { enabled: true },
      streamingConfig: { chunkSize: 1024, updateInterval: 50 },
    });
    deserializeConfig(invalidConfig);
  } catch (error) {
    if (error instanceof ConfigServiceError) {
      console.log('Caught validation error:');
      console.log('  Message:', error.message);
      console.log('  Code:', error.code);
    }
  }
}

// ============================================================================
// 运行所有示例
// ============================================================================

export async function runAllExamples() {
  await example1_SerializeDeserialize();
  await example2_SaveLoad();
  await example3_LoadOrDefault();
  await example4_CheckExists();
  await example5_ErrorHandling();
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
