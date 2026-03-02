/**
 * 网络权限服务单元测试
 * Network Permission Service Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkPermissionService } from './networkPermissionService';
import type { InternetAccessConfig } from '../types/config';

describe('NetworkPermissionService', () => {
  let service: NetworkPermissionService;
  let config: InternetAccessConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      allowedDomains: undefined,
    };
    service = new NetworkPermissionService(config);
  });

  describe('checkPermission', () => {
    it('should allow access when enabled', () => {
      const result = service.checkPermission();
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should deny access when disabled', () => {
      service.updateConfig({ enabled: false });
      const result = service.checkPermission();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('网络访问已被禁用');
    });

    it('should provide descriptive error message when disabled', () => {
      service.updateConfig({ enabled: false });
      const result = service.checkPermission();
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('系统配置');
    });
  });

  describe('validateDomain', () => {
    it('should allow any domain when allowedDomains is undefined', () => {
      const result = service.validateDomain('https://example.com');
      expect(result.allowed).toBe(true);
      expect(result.domain).toBe('example.com');
    });

    it('should allow any domain when allowedDomains is empty array', () => {
      service.updateConfig({ enabled: true, allowedDomains: [] });
      const result = service.validateDomain('https://test.com');
      expect(result.allowed).toBe(true);
    });

    it('should deny access when network is disabled', () => {
      service.updateConfig({ enabled: false });
      const result = service.validateDomain('https://example.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('网络访问已被禁用');
    });

    it('should allow exact domain match', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com', 'test.org'],
      });
      const result = service.validateDomain('https://example.com/path');
      expect(result.allowed).toBe(true);
      expect(result.domain).toBe('example.com');
    });

    it('should deny domain not in allowed list', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      const result = service.validateDomain('https://blocked.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('不在允许访问的域名列表中');
    });

    it('should handle wildcard domain patterns', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['*.example.com'],
      });
      
      expect(service.validateDomain('https://sub.example.com').allowed).toBe(true);
      expect(service.validateDomain('https://deep.sub.example.com').allowed).toBe(true);
      expect(service.validateDomain('https://example.com').allowed).toBe(true);
      expect(service.validateDomain('https://notexample.com').allowed).toBe(false);
    });

    it('should handle subdomain matching', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      
      expect(service.validateDomain('https://example.com').allowed).toBe(true);
      expect(service.validateDomain('https://sub.example.com').allowed).toBe(true);
      expect(service.validateDomain('https://deep.sub.example.com').allowed).toBe(true);
    });

    it('should be case-insensitive', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['Example.COM'],
      });
      
      expect(service.validateDomain('https://example.com').allowed).toBe(true);
      expect(service.validateDomain('https://EXAMPLE.COM').allowed).toBe(true);
      expect(service.validateDomain('https://Example.Com').allowed).toBe(true);
    });

    it('should handle URLs without protocol', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      
      const result = service.validateDomain('example.com/path');
      expect(result.allowed).toBe(true);
      expect(result.domain).toBe('example.com');
    });

    it('should reject invalid URLs', () => {
      const result = service.validateDomain('not a url');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('无效的URL格式');
    });

    it('should handle URLs with ports', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      
      const result = service.validateDomain('https://example.com:8080/path');
      expect(result.allowed).toBe(true);
      expect(result.domain).toBe('example.com');
    });

    it('should handle URLs with query parameters', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      
      const result = service.validateDomain('https://example.com/path?query=value');
      expect(result.allowed).toBe(true);
    });
  });

  describe('validateDomains', () => {
    it('should validate multiple URLs', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com', 'test.org'],
      });
      
      const results = service.validateDomains([
        'https://example.com',
        'https://test.org',
        'https://blocked.com',
      ]);
      
      expect(results).toHaveLength(3);
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(false);
    });

    it('should handle empty array', () => {
      const results = service.validateDomains([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('addAllowedDomain', () => {
    it('should add domain to allowed list', () => {
      service.updateConfig({ enabled: true, allowedDomains: [] });
      service.addAllowedDomain('example.com');
      
      const domains = service.getAllowedDomains();
      expect(domains).toContain('example.com');
    });

    it('should normalize domain to lowercase', () => {
      service.updateConfig({ enabled: true, allowedDomains: [] });
      service.addAllowedDomain('Example.COM');
      
      const domains = service.getAllowedDomains();
      expect(domains).toContain('example.com');
    });

    it('should not add duplicate domains', () => {
      service.updateConfig({ enabled: true, allowedDomains: [] });
      service.addAllowedDomain('example.com');
      service.addAllowedDomain('example.com');
      
      const domains = service.getAllowedDomains();
      expect(domains.filter(d => d === 'example.com')).toHaveLength(1);
    });

    it('should initialize allowedDomains if undefined', () => {
      service.updateConfig({ enabled: true, allowedDomains: undefined });
      service.addAllowedDomain('example.com');
      
      const domains = service.getAllowedDomains();
      expect(domains).toContain('example.com');
    });

    it('should trim whitespace', () => {
      service.updateConfig({ enabled: true, allowedDomains: [] });
      service.addAllowedDomain('  example.com  ');
      
      const domains = service.getAllowedDomains();
      expect(domains).toContain('example.com');
    });
  });

  describe('removeAllowedDomain', () => {
    it('should remove domain from allowed list', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com', 'test.org'],
      });
      service.removeAllowedDomain('example.com');
      
      const domains = service.getAllowedDomains();
      expect(domains).not.toContain('example.com');
      expect(domains).toContain('test.org');
    });

    it('should be case-insensitive', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      service.removeAllowedDomain('Example.COM');
      
      const domains = service.getAllowedDomains();
      expect(domains).not.toContain('example.com');
    });

    it('should handle non-existent domain', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      service.removeAllowedDomain('notfound.com');
      
      const domains = service.getAllowedDomains();
      expect(domains).toContain('example.com');
    });

    it('should handle undefined allowedDomains', () => {
      service.updateConfig({ enabled: true, allowedDomains: undefined });
      expect(() => service.removeAllowedDomain('example.com')).not.toThrow();
    });
  });

  describe('clearAllowedDomains', () => {
    it('should clear all allowed domains', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com', 'test.org', 'another.com'],
      });
      service.clearAllowedDomains();
      
      const domains = service.getAllowedDomains();
      expect(domains).toHaveLength(0);
    });
  });

  describe('getAllowedDomains', () => {
    it('should return copy of allowed domains', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      
      const domains = service.getAllowedDomains();
      domains.push('hacker.com');
      
      const actualDomains = service.getAllowedDomains();
      expect(actualDomains).not.toContain('hacker.com');
    });

    it('should return empty array when allowedDomains is undefined', () => {
      service.updateConfig({ enabled: true, allowedDomains: undefined });
      const domains = service.getAllowedDomains();
      expect(domains).toEqual([]);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig: InternetAccessConfig = {
        enabled: false,
        allowedDomains: ['new.com'],
      };
      service.updateConfig(newConfig);
      
      const result = service.checkPermission();
      expect(result.allowed).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return copy of configuration', () => {
      const config = service.getConfig();
      config.enabled = false;
      
      const actualConfig = service.getConfig();
      expect(actualConfig.enabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple wildcards', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['*.example.com', '*.test.org'],
      });
      
      expect(service.validateDomain('https://sub.example.com').allowed).toBe(true);
      expect(service.validateDomain('https://sub.test.org').allowed).toBe(true);
      expect(service.validateDomain('https://sub.other.com').allowed).toBe(false);
    });

    it('should not match partial domain strings', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['example.com'],
      });
      
      // Should not match "notexample.com" even though it contains "example.com"
      expect(service.validateDomain('https://notexample.com').allowed).toBe(false);
      expect(service.validateDomain('https://examplecom.org').allowed).toBe(false);
    });

    it('should handle empty domain in allowed list', () => {
      service.updateConfig({
        enabled: true,
        allowedDomains: ['', 'example.com'],
      });
      
      expect(service.validateDomain('https://example.com').allowed).toBe(true);
    });

    it('should handle very long domain names', () => {
      const longDomain = 'a'.repeat(100) + '.example.com';
      service.updateConfig({
        enabled: true,
        allowedDomains: [longDomain],
      });
      
      const result = service.validateDomain(`https://${longDomain}`);
      expect(result.allowed).toBe(true);
    });
  });
});
