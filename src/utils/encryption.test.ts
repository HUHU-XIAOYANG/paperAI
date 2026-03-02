/**
 * 加密工具测试
 * Tests for encryption utilities
 */

import { describe, it, expect } from 'vitest';
import {
  encryptString,
  decryptString,
  isEncrypted,
  encryptApiKey,
  decryptApiKey,
} from './encryption';

describe('Encryption Utilities', () => {
  describe('encryptString', () => {
    it('should encrypt a string', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encryptString(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain('encrypted:');
    });

    it('should return empty string for empty input', () => {
      expect(encryptString('')).toBe('');
    });

    it('should produce different ciphertext for same plaintext (due to salt)', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted1 = encryptString(plaintext);
      const encrypted2 = encryptString(plaintext);
      
      // CryptoJS AES uses random salt, so ciphertexts should differ
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decryptString', () => {
    it('should decrypt an encrypted string', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encryptString(plaintext);
      const decrypted = decryptString(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should return empty string for empty input', () => {
      expect(decryptString('')).toBe('');
    });

    it('should return unencrypted string as-is (backward compatibility)', () => {
      const plaintext = 'unencrypted-value';
      const result = decryptString(plaintext);
      
      expect(result).toBe(plaintext);
    });

    it('should throw error for invalid encrypted data', () => {
      const invalidEncrypted = 'encrypted:invalid-data';
      
      expect(() => decryptString(invalidEncrypted)).toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted strings', () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = encryptString(plaintext);
      
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for unencrypted strings', () => {
      expect(isEncrypted('plain-text')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isEncrypted(null as any)).toBe(false);
      expect(isEncrypted(undefined as any)).toBe(false);
    });
  });

  describe('encryptApiKey and decryptApiKey', () => {
    it('should encrypt and decrypt API key', () => {
      const apiKey = 'sk-1234567890abcdef';
      const encrypted = encryptApiKey(apiKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(encrypted).not.toBe(apiKey);
      expect(isEncrypted(encrypted)).toBe(true);
      expect(decrypted).toBe(apiKey);
    });

    it('should handle long API keys', () => {
      const longApiKey = 'sk-' + 'a'.repeat(100);
      const encrypted = encryptApiKey(longApiKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(longApiKey);
    });

    it('should handle special characters in API keys', () => {
      const specialApiKey = 'sk-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptApiKey(specialApiKey);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toBe(specialApiKey);
    });
  });

  describe('Round-trip encryption', () => {
    it('should maintain data integrity through multiple encrypt/decrypt cycles', () => {
      const original = 'my-secret-api-key';
      
      // Encrypt and decrypt multiple times
      let current = original;
      for (let i = 0; i < 5; i++) {
        current = encryptString(current);
        current = decryptString(current);
      }
      
      expect(current).toBe(original);
    });

    it('should handle various string types', () => {
      const testCases = [
        'simple',
        'with spaces',
        'with-dashes',
        'with_underscores',
        'with.dots',
        'with/slashes',
        'with\\backslashes',
        'with"quotes"',
        "with'apostrophes",
        'with\nnewlines',
        'with\ttabs',
        '123456789',
        'mixed123ABC!@#',
        '中文字符',
        'émojis 🔐🔑',
      ];

      testCases.forEach((testCase) => {
        const encrypted = encryptString(testCase);
        const decrypted = decryptString(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
