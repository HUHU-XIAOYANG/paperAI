/**
 * 加密工具模块
 * Encryption utilities for API key storage
 * 
 * 需求: 2.5
 * 
 * 使用AES-256加密算法保护API密钥
 */

import CryptoJS from 'crypto-js';

// ============================================================================
// Constants
// ============================================================================

/**
 * 加密密钥
 * 在生产环境中，这应该从安全的密钥管理系统获取
 * 或使用用户特定的密钥（如基于设备ID生成）
 * 
 * 注意：这是一个示例实现。在实际生产环境中，应该：
 * 1. 使用硬件安全模块（HSM）或操作系统密钥链
 * 2. 基于设备特征生成唯一密钥
 * 3. 使用密钥派生函数（KDF）
 */
const ENCRYPTION_KEY = 'agent-swarm-writing-system-encryption-key-v1';

/**
 * 加密标记前缀
 * 用于识别已加密的字符串
 */
const ENCRYPTED_PREFIX = 'encrypted:';

// ============================================================================
// Encryption Functions
// ============================================================================

/**
 * 使用AES-256加密字符串
 * 
 * @param plaintext - 明文字符串
 * @returns 加密后的字符串（带前缀标记）
 * 
 * @example
 * ```typescript
 * const apiKey = 'sk-1234567890abcdef';
 * const encrypted = encryptString(apiKey);
 * // encrypted: 'encrypted:U2FsdGVkX1...'
 * ```
 */
export function encryptString(plaintext: string): string {
  if (!plaintext) {
    return plaintext;
  }
  
  // 使用AES-256加密
  const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
  
  // 添加前缀标记
  return `${ENCRYPTED_PREFIX}${encrypted}`;
}

/**
 * 解密AES-256加密的字符串
 * 
 * @param ciphertext - 加密后的字符串（带前缀标记）
 * @returns 解密后的明文字符串
 * @throws {Error} 如果解密失败
 * 
 * @example
 * ```typescript
 * const encrypted = 'encrypted:U2FsdGVkX1...';
 * const decrypted = decryptString(encrypted);
 * // decrypted: 'sk-1234567890abcdef'
 * ```
 */
export function decryptString(ciphertext: string): string {
  if (!ciphertext) {
    return ciphertext;
  }
  
  // 检查是否有加密前缀
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
    // 如果没有前缀，假设是未加密的字符串（向后兼容）
    return ciphertext;
  }
  
  // 移除前缀
  const encryptedData = ciphertext.substring(ENCRYPTED_PREFIX.length);
  
  try {
    // 使用AES-256解密
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return plaintext;
  } catch (error) {
    throw new Error(
      `Failed to decrypt string: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 检查字符串是否已加密
 * 
 * @param value - 要检查的字符串
 * @returns 如果字符串已加密返回true，否则返回false
 * 
 * @example
 * ```typescript
 * isEncrypted('encrypted:U2FsdGVkX1...'); // true
 * isEncrypted('sk-1234567890abcdef'); // false
 * ```
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith(ENCRYPTED_PREFIX) ?? false;
}

// ============================================================================
// API Key Encryption Functions
// ============================================================================

/**
 * 加密API密钥
 * 
 * @param apiKey - 明文API密钥
 * @returns 加密后的API密钥
 */
export function encryptApiKey(apiKey: string): string {
  return encryptString(apiKey);
}

/**
 * 解密API密钥
 * 
 * @param encryptedApiKey - 加密的API密钥
 * @returns 解密后的明文API密钥
 * @throws {Error} 如果解密失败
 */
export function decryptApiKey(encryptedApiKey: string): string {
  return decryptString(encryptedApiKey);
}
