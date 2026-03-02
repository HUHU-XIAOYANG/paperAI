/**
 * 加密工具使用示例
 * Examples of using encryption utilities
 * 
 * 这个文件展示了如何使用加密工具来保护API密钥
 */

import { encryptApiKey, decryptApiKey, isEncrypted } from './encryption';
import type { AIServiceConfig } from '../types/config';

// ============================================================================
// 示例 1: 基本的API密钥加密和解密
// ============================================================================

function example1_BasicEncryption() {
  console.log('=== Example 1: Basic Encryption ===\n');
  
  // 原始API密钥（明文）
  const plainApiKey = 'sk-1234567890abcdef';
  console.log('Original API Key:', plainApiKey);
  
  // 加密API密钥
  const encryptedKey = encryptApiKey(plainApiKey);
  console.log('Encrypted API Key:', encryptedKey);
  console.log('Is Encrypted?', isEncrypted(encryptedKey));
  
  // 解密API密钥
  const decryptedKey = decryptApiKey(encryptedKey);
  console.log('Decrypted API Key:', decryptedKey);
  console.log('Match Original?', decryptedKey === plainApiKey);
  
  console.log('\n');
}

// ============================================================================
// 示例 2: 在AI服务配置中使用加密
// ============================================================================

function example2_ConfigEncryption() {
  console.log('=== Example 2: Config Encryption ===\n');
  
  // 创建AI服务配置（包含明文API密钥）
  const config: AIServiceConfig = {
    id: 'openai-gpt4',
    name: 'OpenAI GPT-4',
    apiKey: 'sk-proj-1234567890abcdef',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7,
  };
  
  console.log('Original Config:', {
    ...config,
    apiKey: config.apiKey.substring(0, 10) + '...',
  });
  
  // 加密API密钥用于存储
  const configForStorage: AIServiceConfig = {
    ...config,
    apiKey: encryptApiKey(config.apiKey),
  };
  
  console.log('Config for Storage:', {
    ...configForStorage,
    apiKey: configForStorage.apiKey.substring(0, 30) + '...',
  });
  console.log('API Key is Encrypted?', isEncrypted(configForStorage.apiKey));
  
  // 从存储加载后解密
  const configFromStorage: AIServiceConfig = {
    ...configForStorage,
    apiKey: decryptApiKey(configForStorage.apiKey),
  };
  
  console.log('Config from Storage:', {
    ...configFromStorage,
    apiKey: configFromStorage.apiKey.substring(0, 10) + '...',
  });
  console.log('API Key Matches Original?', configFromStorage.apiKey === config.apiKey);
  
  console.log('\n');
}

// ============================================================================
// 示例 3: 批量处理多个API密钥
// ============================================================================

function example3_BatchEncryption() {
  console.log('=== Example 3: Batch Encryption ===\n');
  
  const apiKeys = [
    'sk-openai-key-123',
    'sk-anthropic-key-456',
    'sk-custom-key-789',
  ];
  
  console.log('Original Keys:', apiKeys.map(k => k.substring(0, 15) + '...'));
  
  // 批量加密
  const encryptedKeys = apiKeys.map(encryptApiKey);
  console.log('Encrypted Keys:', encryptedKeys.map(k => k.substring(0, 30) + '...'));
  console.log('All Encrypted?', encryptedKeys.every(isEncrypted));
  
  // 批量解密
  const decryptedKeys = encryptedKeys.map(decryptApiKey);
  console.log('Decrypted Keys:', decryptedKeys.map(k => k.substring(0, 15) + '...'));
  console.log('All Match?', decryptedKeys.every((key, i) => key === apiKeys[i]));
  
  console.log('\n');
}

// ============================================================================
// 示例 4: 检查和处理已加密的密钥（幂等性）
// ============================================================================

function example4_IdempotentEncryption() {
  console.log('=== Example 4: Idempotent Encryption ===\n');
  
  const plainKey = 'sk-test-key-123';
  console.log('Original Key:', plainKey);
  
  // 第一次加密
  const encrypted1 = encryptApiKey(plainKey);
  console.log('First Encryption:', encrypted1.substring(0, 30) + '...');
  
  // 检查是否已加密，避免重复加密
  const encrypted2 = isEncrypted(encrypted1) ? encrypted1 : encryptApiKey(encrypted1);
  console.log('Second Encryption (skipped):', encrypted2.substring(0, 30) + '...');
  console.log('Same as First?', encrypted1 === encrypted2);
  
  // 解密应该得到原始密钥
  const decrypted = decryptApiKey(encrypted2);
  console.log('Decrypted:', decrypted);
  console.log('Matches Original?', decrypted === plainKey);
  
  console.log('\n');
}

// ============================================================================
// 示例 5: 错误处理
// ============================================================================

function example5_ErrorHandling() {
  console.log('=== Example 5: Error Handling ===\n');
  
  // 尝试解密无效的加密数据
  try {
    const invalidEncrypted = 'encrypted:invalid-data-here';
    console.log('Attempting to decrypt invalid data...');
    decryptApiKey(invalidEncrypted);
    console.log('ERROR: Should have thrown an error!');
  } catch (error) {
    console.log('✓ Caught expected error:', (error as Error).message);
  }
  
  // 解密未加密的字符串（向后兼容）
  const plainKey = 'sk-plain-key-123';
  console.log('\nDecrypting unencrypted string (backward compatibility)...');
  const result = decryptApiKey(plainKey);
  console.log('Result:', result);
  console.log('✓ Returns original string:', result === plainKey);
  
  console.log('\n');
}

// ============================================================================
// 运行所有示例
// ============================================================================

export function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     API Key Encryption Examples                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  example1_BasicEncryption();
  example2_ConfigEncryption();
  example3_BatchEncryption();
  example4_IdempotentEncryption();
  example5_ErrorHandling();
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     All Examples Completed                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
