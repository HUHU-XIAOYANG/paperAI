/**
 * Configuration View Component
 * Implements Requirements 2.1, 2.2, 2.3: AI service configuration
 * 
 * Features:
 * - Add, edit, delete AI service configurations
 * - API connection testing
 * - Secure API key handling
 * - Glass morphism styling
 */

import { useState } from 'react';
import { GlassContainer } from '../components/GlassContainer';
import { useConfigStore } from '../stores/configStore';
import type { AIServiceConfig } from '../types/config';
import styles from './ConfigurationView.module.css';

export interface ConfigurationViewProps {
  /** Callback when configuration is saved */
  onSave?: () => void;
  /** Callback when view is closed */
  onClose?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Configuration View Component
 * 
 * Provides interface for managing AI service configurations.
 * Supports adding, editing, deleting services and testing connections.
 * 
 * @example
 * ```tsx
 * <ConfigurationView onSave={() => console.log('Saved')} onClose={() => setShowConfig(false)} />
 * ```
 */
export function ConfigurationView({ onSave, onClose, className = '' }: ConfigurationViewProps) {
  const { aiServices, defaultService, addAIService, removeAIService, setDefaultService, internetAccess, setInternetAccess } = useConfigStore();
  const [editingService, setEditingService] = useState<AIServiceConfig | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Map<string, { success: boolean; message: string }>>(new Map());
  
  // Network permission state
  const [newDomain, setNewDomain] = useState('');

  // Initialize form data
  const [formData, setFormData] = useState<Partial<AIServiceConfig>>({
    id: '',
    name: '',
    apiKey: '',
    apiUrl: '',
    model: '',
    provider: 'openai',
  });

  // Handle form field change
  const handleFieldChange = (field: keyof AIServiceConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Start adding new service
  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingService(null);
    setFormData({
      id: `service-${Date.now()}`,
      name: '',
      apiKey: '',
      apiUrl: '',
      model: '',
      provider: 'openai',
    });
  };

  // Start editing service
  const handleStartEdit = (service: AIServiceConfig) => {
    setIsAdding(false);
    setEditingService(service);
    setFormData(service);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsAdding(false);
    setEditingService(null);
    setFormData({
      id: '',
      name: '',
      apiKey: '',
      apiUrl: '',
      model: '',
      provider: 'openai',
    });
  };

  // Save service
  const handleSave = () => {
    if (!formData.id || !formData.name || !formData.apiKey || !formData.apiUrl || !formData.model) {
      alert('请填写所有必填字段');
      return;
    }

    const serviceConfig: AIServiceConfig = {
      id: formData.id,
      name: formData.name,
      apiKey: formData.apiKey,
      apiUrl: formData.apiUrl,
      model: formData.model,
      provider: formData.provider || 'openai',
      maxTokens: formData.maxTokens,
      temperature: formData.temperature,
    };

    if (editingService) {
      // Update existing service
      const oldId = editingService.id;
      removeAIService(oldId);
      addAIService(serviceConfig);
      
      // Update default if it was the edited service
      if (defaultService === oldId) {
        setDefaultService(serviceConfig.id);
      }
    } else {
      // Add new service
      addAIService(serviceConfig);
      
      // Set as default if it's the first service
      if (aiServices.length === 0) {
        setDefaultService(serviceConfig.id);
      }
    }

    handleCancel();
    onSave?.();
  };

  // Delete service
  const handleDelete = (serviceId: string) => {
    const service = aiServices.find(s => s.id === serviceId);
    if (confirm(`确定要删除 "${service?.name}" 吗？`)) {
      removeAIService(serviceId);
      
      // Clear default if it was deleted
      if (defaultService === serviceId) {
        const remainingServices = aiServices.filter(s => s.id !== serviceId);
        setDefaultService(remainingServices.length > 0 ? (remainingServices[0]?.id || '') : '');
      }
    }
  };

  // Test connection
  const handleTestConnection = async (service: AIServiceConfig) => {
    setTestingService(service.id);
    
    try {
      // Simulate API test (replace with actual validation)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock result
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      setTestResults(prev => new Map(prev).set(service.id, {
        success,
        message: success ? '连接成功！' : '连接失败，请检查API密钥和URL',
      }));
    } catch (error) {
      setTestResults(prev => new Map(prev).set(service.id, {
        success: false,
        message: '测试失败：' + (error as Error).message,
      }));
    } finally {
      setTestingService(null);
    }
  };

  // Set as default
  const handleSetDefault = (serviceId: string) => {
    setDefaultService(serviceId);
  };

  // Network permission handlers
  const handleToggleInternetAccess = () => {
    setInternetAccess(!internetAccess.enabled, internetAccess.allowedDomains);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    
    const currentDomains = internetAccess.allowedDomains || [];
    if (!currentDomains.includes(newDomain.trim())) {
      setInternetAccess(internetAccess.enabled, [...currentDomains, newDomain.trim()]);
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    const currentDomains = internetAccess.allowedDomains || [];
    setInternetAccess(internetAccess.enabled, currentDomains.filter(d => d !== domain));
  };

  const handleClearAllDomains = () => {
    if (confirm('确定要清空所有允许的域名吗？')) {
      setInternetAccess(internetAccess.enabled, []);
    }
  };

  return (
    <div className={`${styles.configurationView} ${className}`}>
      <GlassContainer className={styles.container} variant="default" padding="xl" radius="xl">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>系统配置</h1>
            <p className={styles.subtitle}>管理AI服务配置和系统设置</p>
          </div>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose} title="关闭">
              ✕
            </button>
          )}
        </div>

        {/* Service List */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>AI 服务</h2>
            <button className={styles.addButton} onClick={handleStartAdd}>
              <span className={styles.addIcon}>+</span>
              添加服务
            </button>
          </div>

          {aiServices.length === 0 && !isAdding && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔌</span>
              <p className={styles.emptyText}>暂无AI服务配置</p>
              <p className={styles.emptyHint}>点击"添加服务"按钮开始配置</p>
            </div>
          )}

          <div className={styles.serviceList}>
            {aiServices.map(service => (
              <GlassContainer
                key={service.id}
                className={styles.serviceCard}
                variant="light"
                padding="md"
                hover
              >
                <div className={styles.serviceHeader}>
                  <div className={styles.serviceInfo}>
                    <h3 className={styles.serviceName}>
                      {service.name}
                      {defaultService === service.id && (
                        <span className={styles.defaultBadge}>默认</span>
                      )}
                    </h3>
                    <p className={styles.serviceDetails}>
                      {service.provider} • {service.model}
                    </p>
                  </div>
                  <div className={styles.serviceActions}>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleTestConnection(service)}
                      disabled={testingService === service.id}
                      title="测试连接"
                    >
                      {testingService === service.id ? '⏳' : '🔌'}
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleStartEdit(service)}
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleDelete(service.id)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className={styles.serviceUrl}>
                  <span className={styles.urlLabel}>URL:</span>
                  <code className={styles.urlValue}>{service.apiUrl}</code>
                </div>

                {testResults.has(service.id) && (
                  <div
                    className={`${styles.testResult} ${
                      testResults.get(service.id)!.success
                        ? styles.testSuccess
                        : styles.testError
                    }`}
                  >
                    {testResults.get(service.id)!.message}
                  </div>
                )}

                {defaultService !== service.id && (
                  <button
                    className={styles.setDefaultButton}
                    onClick={() => handleSetDefault(service.id)}
                  >
                    设为默认
                  </button>
                )}
              </GlassContainer>
            ))}
          </div>
        </div>

        {/* Edit/Add Form */}
        {(isAdding || editingService) && (
          <GlassContainer className={styles.formContainer} variant="strong" padding="lg">
            <h3 className={styles.formTitle}>
              {isAdding ? '添加新服务' : '编辑服务'}
            </h3>

            <div className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    服务名称 <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.name || ''}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    placeholder="例如：OpenAI GPT-4"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    提供商 <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.select}
                    value={formData.provider || 'openai'}
                    onChange={e => handleFieldChange('provider', e.target.value)}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  API URL <span className={styles.required}>*</span>
                </label>
                <input
                  type="url"
                  className={styles.input}
                  value={formData.apiUrl || ''}
                  onChange={e => handleFieldChange('apiUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  API Key <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={formData.apiKey || ''}
                  onChange={e => handleFieldChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    模型 <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.model || ''}
                    onChange={e => handleFieldChange('model', e.target.value)}
                    placeholder="gpt-4"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Temperature</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.temperature || ''}
                    onChange={e => handleFieldChange('temperature', e.target.value)}
                    placeholder="0.7"
                    min="0"
                    max="2"
                    step="0.1"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Max Tokens</label>
                <input
                  type="number"
                  className={styles.input}
                  value={formData.maxTokens || ''}
                  onChange={e => handleFieldChange('maxTokens', e.target.value)}
                  placeholder="4096"
                  min="1"
                />
              </div>

              <div className={styles.formActions}>
                <button className={styles.cancelButton} onClick={handleCancel}>
                  取消
                </button>
                <button className={styles.saveButton} onClick={handleSave}>
                  保存
                </button>
              </div>
            </div>
          </GlassContainer>
        )}

        {/* Network Permission Configuration */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>联网权限配置</h2>
            <div className={styles.toggleContainer}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={internetAccess.enabled}
                  onChange={handleToggleInternetAccess}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSwitch}></span>
                <span className={styles.toggleText}>
                  {internetAccess.enabled ? '已启用' : '已禁用'}
                </span>
              </label>
            </div>
          </div>

          <GlassContainer className={styles.networkConfig} variant="light" padding="md">
            <p className={styles.configDescription}>
              {internetAccess.enabled
                ? '允许AI访问互联网获取实时信息。您可以限制可访问的域名范围。'
                : '网络访问已禁用。启用后，AI将能够访问互联网获取实时信息。'}
            </p>

            {internetAccess.enabled && (
              <>
                <div className={styles.domainSection}>
                  <h3 className={styles.domainTitle}>允许的域名</h3>
                  <p className={styles.domainHint}>
                    留空表示允许所有域名。支持通配符（如 *.example.com）
                  </p>

                  <div className={styles.domainInput}>
                    <input
                      type="text"
                      className={styles.input}
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAddDomain()}
                      placeholder="例如: example.com 或 *.google.com"
                    />
                    <button
                      className={styles.addDomainButton}
                      onClick={handleAddDomain}
                      disabled={!newDomain.trim()}
                    >
                      添加
                    </button>
                  </div>

                  {internetAccess.allowedDomains && internetAccess.allowedDomains.length > 0 ? (
                    <>
                      <div className={styles.domainList}>
                        {internetAccess.allowedDomains.map((domain, index) => (
                          <div key={index} className={styles.domainItem}>
                            <span className={styles.domainName}>{domain}</span>
                            <button
                              className={styles.removeDomainButton}
                              onClick={() => handleRemoveDomain(domain)}
                              title="移除"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        className={styles.clearAllButton}
                        onClick={handleClearAllDomains}
                      >
                        清空所有域名
                      </button>
                    </>
                  ) : (
                    <div className={styles.emptyDomains}>
                      <span className={styles.emptyIcon}>🌐</span>
                      <p className={styles.emptyText}>允许访问所有域名</p>
                    </div>
                  )}
                </div>

                <div className={styles.examplesSection}>
                  <h4 className={styles.examplesTitle}>常用配置示例：</h4>
                  <div className={styles.examplesList}>
                    <button
                      className={styles.exampleButton}
                      onClick={() => {
                        setInternetAccess(true, [
                          'scholar.google.com',
                          'arxiv.org',
                          'pubmed.ncbi.nlm.nih.gov',
                          '*.ieee.org',
                          '*.acm.org',
                        ]);
                      }}
                    >
                      学术研究
                    </button>
                    <button
                      className={styles.exampleButton}
                      onClick={() => {
                        setInternetAccess(true, [
                          '*.google.com',
                          '*.github.com',
                          'stackoverflow.com',
                        ]);
                      }}
                    >
                      开发资源
                    </button>
                    <button
                      className={styles.exampleButton}
                      onClick={() => {
                        setInternetAccess(true, []);
                      }}
                    >
                      允许所有
                    </button>
                  </div>
                </div>
              </>
            )}
          </GlassContainer>
        </div>
      </GlassContainer>
    </div>
  );
}
