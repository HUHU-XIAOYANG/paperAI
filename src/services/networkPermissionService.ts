/**
 * 网络权限服务
 * Network Permission Service
 * 
 * 需求: 18.6 (允许用户配置Internet_Access的权限和范围限制)
 * 任务: 26.2 实现联网权限验证
 * 
 * 功能：
 * - 检查网络访问是否启用
 * - 验证域名是否在允许列表中
 * - 提供描述性错误信息
 */

import type { InternetAccessConfig } from '../types/config';

// ============================================================================
// Types
// ============================================================================

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 域名验证结果
 */
export interface DomainValidationResult {
  allowed: boolean;
  domain: string;
  reason?: string;
}

// ============================================================================
// Network Permission Service
// ============================================================================

/**
 * 网络权限服务类
 * 
 * 负责验证网络访问权限和域名白名单
 */
export class NetworkPermissionService {
  private config: InternetAccessConfig;

  constructor(config: InternetAccessConfig) {
    this.config = config;
  }

  /**
   * 更新配置
   */
  updateConfig(config: InternetAccessConfig): void {
    this.config = config;
  }

  /**
   * 获取当前配置
   */
  getConfig(): InternetAccessConfig {
    return { ...this.config };
  }

  /**
   * 检查网络访问权限
   * 
   * @returns 权限检查结果
   */
  checkPermission(): PermissionCheckResult {
    if (!this.config.enabled) {
      return {
        allowed: false,
        reason: '网络访问已被禁用。请在系统配置中启用联网功能。',
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * 验证域名是否允许访问
   * 
   * @param url - 要访问的URL
   * @returns 域名验证结果
   */
  validateDomain(url: string): DomainValidationResult {
    // 首先检查网络访问是否启用
    const permissionCheck = this.checkPermission();
    if (!permissionCheck.allowed) {
      return {
        allowed: false,
        domain: '',
        reason: permissionCheck.reason,
      };
    }

    // 提取域名
    const domain = this.extractDomain(url);
    if (!domain) {
      return {
        allowed: false,
        domain: '',
        reason: `无效的URL格式: ${url}`,
      };
    }

    // 如果没有配置允许域名列表，则允许所有域名
    if (!this.config.allowedDomains || this.config.allowedDomains.length === 0) {
      return {
        allowed: true,
        domain,
      };
    }

    // 检查域名是否在允许列表中
    const isAllowed = this.isDomainAllowed(domain, this.config.allowedDomains);
    
    if (!isAllowed) {
      return {
        allowed: false,
        domain,
        reason: `域名 "${domain}" 不在允许访问的域名列表中。允许的域名: ${this.config.allowedDomains.join(', ')}`,
      };
    }

    return {
      allowed: true,
      domain,
    };
  }

  /**
   * 批量验证多个URL
   * 
   * @param urls - URL列表
   * @returns 验证结果列表
   */
  validateDomains(urls: string[]): DomainValidationResult[] {
    return urls.map(url => this.validateDomain(url));
  }

  /**
   * 从URL提取域名
   * 
   * @param url - URL字符串
   * @returns 域名，如果无效则返回空字符串
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      // 如果不是完整URL，尝试作为域名处理
      // 但要确保它看起来像一个有效的域名
      const domainMatch = url.match(/^(?:https?:\/\/)?([a-zA-Z0-9\u00a1-\uffff.-]+\.[a-zA-Z\u00a1-\uffff]{2,})/i);
      return domainMatch && domainMatch[1] ? domainMatch[1].toLowerCase() : '';
    }
  }

  /**
   * 检查域名是否在允许列表中
   * 支持通配符匹配（*.example.com）
   * 
   * @param domain - 要检查的域名
   * @param allowedDomains - 允许的域名列表
   * @returns 是否允许
   */
  private isDomainAllowed(domain: string, allowedDomains: string[]): boolean {
    const normalizedDomain = domain.toLowerCase();

    for (const allowedDomain of allowedDomains) {
      const normalizedAllowed = allowedDomain.toLowerCase().trim();

      // 精确匹配
      if (normalizedDomain === normalizedAllowed) {
        return true;
      }

      // 通配符匹配 (*.example.com)
      if (normalizedAllowed.startsWith('*.')) {
        const baseDomain = normalizedAllowed.substring(2);
        if (normalizedDomain.endsWith(baseDomain)) {
          // 确保是子域名匹配，而不是部分字符串匹配
          const prefix = normalizedDomain.substring(0, normalizedDomain.length - baseDomain.length);
          if (prefix === '' || prefix.endsWith('.')) {
            return true;
          }
        }
      }

      // 子域名匹配 (example.com 匹配 sub.example.com)
      if (normalizedDomain.endsWith('.' + normalizedAllowed)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 添加允许的域名
   * 
   * @param domain - 要添加的域名
   */
  addAllowedDomain(domain: string): void {
    if (!this.config.allowedDomains) {
      this.config.allowedDomains = [];
    }

    const normalizedDomain = domain.toLowerCase().trim();
    if (!this.config.allowedDomains.includes(normalizedDomain)) {
      this.config.allowedDomains.push(normalizedDomain);
    }
  }

  /**
   * 移除允许的域名
   * 
   * @param domain - 要移除的域名
   */
  removeAllowedDomain(domain: string): void {
    if (!this.config.allowedDomains) {
      return;
    }

    const normalizedDomain = domain.toLowerCase().trim();
    this.config.allowedDomains = this.config.allowedDomains.filter(
      d => d.toLowerCase() !== normalizedDomain
    );
  }

  /**
   * 清空允许的域名列表
   */
  clearAllowedDomains(): void {
    this.config.allowedDomains = [];
  }

  /**
   * 获取允许的域名列表
   */
  getAllowedDomains(): string[] {
    return this.config.allowedDomains ? [...this.config.allowedDomains] : [];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建网络权限服务实例
 * 
 * @param config - 联网访问配置
 * @returns 网络权限服务实例
 */
export function createNetworkPermissionService(
  config: InternetAccessConfig
): NetworkPermissionService {
  return new NetworkPermissionService(config);
}

// ============================================================================
// Export
// ============================================================================

export type { InternetAccessConfig } from '../types/config';
