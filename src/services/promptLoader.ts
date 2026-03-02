/**
 * 提示词加载服务
 * Prompt loading service using js-yaml and Tauri's fs API
 * 
 * 需求: 4.2, 15.1, 15.3
 * 
 * 提供提示词文件的加载、解析和变量替换功能
 */

import { BaseDirectory, exists, readTextFile } from '@tauri-apps/plugin-fs';
import * as yaml from 'js-yaml';
import type {
  AgentRole,
  PromptTemplate,
  PromptFileStructure,
  LoadedPrompt,
  VariableSubstitutionOptions,
  PromptValidationResult,
  PromptValidationError,
  PromptValidationWarning,
  PromptCacheEntry,
  PromptRepositoryConfig,
} from '../types/prompt';
import {
  PromptLoadError,
  VariableSubstitutionError,
  DEFAULT_SUBSTITUTION_OPTIONS,
  PROMPT_FILE_NAMES,
  VERSION_PATTERN,
} from '../types/prompt';

// ============================================================================
// Constants
// ============================================================================

/**
 * 默认提示词仓库路径（相对于AppData目录）
 */
const DEFAULT_PROMPT_REPOSITORY_PATH = 'prompts';

/**
 * 提示词文件扩展名
 */
const PROMPT_FILE_EXTENSION = '.yaml';

/**
 * 提示词缓存
 * 用于避免重复加载相同的提示词文件
 */
const promptCache = new Map<string, PromptCacheEntry>();

// ============================================================================
// Configuration
// ============================================================================

/**
 * 当前提示词仓库配置
 */
let currentConfig: PromptRepositoryConfig = {
  basePath: DEFAULT_PROMPT_REPOSITORY_PATH,
  cacheEnabled: true,
  watchForChanges: false,
  fileExtension: PROMPT_FILE_EXTENSION,
};

/**
 * 配置提示词加载器
 * 
 * @param config - 提示词仓库配置
 */
export function configurePromptLoader(config: Partial<PromptRepositoryConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
  };
  
  // 如果禁用缓存，清空现有缓存
  if (config.cacheEnabled === false) {
    promptCache.clear();
  }
}

/**
 * 获取当前配置
 * 
 * @returns 当前提示词仓库配置
 */
export function getPromptLoaderConfig(): PromptRepositoryConfig {
  return { ...currentConfig };
}

// ============================================================================
// File Path Helpers
// ============================================================================

/**
 * 获取提示词文件路径
 * 
 * @param role - Agent角色
 * @returns 提示词文件路径
 */
function getPromptFilePath(role: AgentRole): string {
  const fileName = PROMPT_FILE_NAMES[role];
  return `${currentConfig.basePath}/${fileName}`;
}

/**
 * 检查提示词文件是否存在
 * 
 * @param role - Agent角色
 * @returns 文件是否存在
 */
export async function promptFileExists(role: AgentRole): Promise<boolean> {
  try {
    const filePath = getPromptFilePath(role);
    // 尝试从Resource目录读取（生产环境）
    const resourceExists = await exists(filePath, {
      baseDir: BaseDirectory.Resource,
    }).catch(() => false);
    
    if (resourceExists) {
      return true;
    }
    
    // 回退到AppData目录（开发环境或用户自定义）
    return await exists(filePath, {
      baseDir: BaseDirectory.AppData,
    });
  } catch {
    return false;
  }
}

// ============================================================================
// YAML Parsing
// ============================================================================

/**
 * 解析YAML文件内容为提示词文件结构
 * 
 * @param yamlContent - YAML文件内容
 * @param filePath - 文件路径（用于错误信息）
 * @returns 提示词文件结构
 * @throws {PromptLoadError} 解析失败时抛出
 */
function parseYamlPrompt(yamlContent: string, filePath: string): PromptFileStructure {
  try {
    const parsed = yaml.load(yamlContent) as PromptFileStructure;
    
    if (!parsed || typeof parsed !== 'object') {
      throw new PromptLoadError(
        '提示词文件格式错误：文件内容不是有效的YAML对象',
        filePath
      );
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof PromptLoadError) {
      throw error;
    }
    
    throw new PromptLoadError(
      `YAML解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      filePath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * 将YAML文件结构转换为TypeScript提示词模板
 * 
 * @param fileStructure - YAML文件结构
 * @returns 提示词模板
 */
function convertToPromptTemplate(fileStructure: PromptFileStructure): PromptTemplate {
  return {
    version: fileStructure.version,
    role: fileStructure.role as AgentRole,
    description: fileStructure.description,
    systemPrompt: fileStructure.system_prompt,
    templates: fileStructure.templates,
    variables: fileStructure.variables.map(v => ({
      name: v.name,
      description: v.description,
      required: v.required,
      defaultValue: v.default_value,
    })),
    metadata: fileStructure.metadata ? {
      author: fileStructure.metadata.author,
      createdAt: fileStructure.metadata.created_at,
      updatedAt: fileStructure.metadata.updated_at,
      tags: fileStructure.metadata.tags,
      notes: fileStructure.metadata.notes,
    } : undefined,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * 验证提示词模板的完整性
 * 
 * 需求: 15.4 - 验证提示词文件的完整性
 * 
 * @param template - 提示词模板
 * @returns 验证结果
 */
export function validatePromptTemplate(template: PromptTemplate): PromptValidationResult {
  const errors: PromptValidationError[] = [];
  const warnings: PromptValidationWarning[] = [];
  
  // 检查必需字段（使用TypeScript属性名）
  const requiredFields: (keyof PromptTemplate)[] = [
    'version',
    'role',
    'description',
    'systemPrompt',
    'templates',
    'variables',
  ];
  
  for (const field of requiredFields) {
    if (!(field in template) || template[field] === undefined) {
      errors.push({
        field,
        message: `缺少必需字段: ${field}`,
      });
    }
  }
  
  // 验证版本格式
  if (template.version && !VERSION_PATTERN.test(template.version)) {
    errors.push({
      field: 'version',
      message: `版本号格式无效: ${template.version}. 应使用语义化版本格式（如"1.0"或"1.2.3"）`,
      value: template.version,
    });
  }
  
  // 验证systemPrompt不为空
  if (template.systemPrompt !== undefined) {
    if (typeof template.systemPrompt !== 'string') {
      errors.push({
        field: 'systemPrompt',
        message: 'systemPrompt必须是字符串类型',
        value: template.systemPrompt,
      });
    } else if (template.systemPrompt.trim() === '') {
      errors.push({
        field: 'systemPrompt',
        message: 'systemPrompt不能为空字符串',
      });
    }
  }
  
  // 验证templates对象
  if (template.templates) {
    if (typeof template.templates !== 'object') {
      errors.push({
        field: 'templates',
        message: 'templates必须是一个对象',
        value: template.templates,
      });
    } else if (Object.keys(template.templates).length === 0) {
      warnings.push({
        field: 'templates',
        message: 'templates对象为空，没有定义任何模板',
        suggestion: '添加至少一个命名模板',
      });
    }
  }
  
  // 验证variables数组
  if (template.variables) {
    if (!Array.isArray(template.variables)) {
      errors.push({
        field: 'variables',
        message: 'variables必须是一个数组',
        value: template.variables,
      });
    } else {
      template.variables.forEach((variable, index) => {
        if (!variable.name || variable.name.trim() === '') {
          errors.push({
            field: `variables[${index}].name`,
            message: '变量名称不能为空',
          });
        }
        if (!variable.description || variable.description.trim() === '') {
          warnings.push({
            field: `variables[${index}].description`,
            message: `变量 "${variable.name}" 缺少描述`,
            suggestion: '为变量添加清晰的描述',
          });
        }
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Variable Substitution
// ============================================================================

/**
 * 在文本中替换变量
 * 
 * 需求: 15.3 - 支持提示词文件中的变量替换功能
 * 
 * @param text - 包含变量占位符的文本
 * @param variables - 变量值映射
 * @param options - 替换选项
 * @returns 替换后的文本
 * @throws {VariableSubstitutionError} 严格模式下缺少必需变量时抛出
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string>,
  options: VariableSubstitutionOptions = {}
): string {
  const opts = { ...DEFAULT_SUBSTITUTION_OPTIONS, ...options };
  
  // 构建变量占位符的正则表达式
  // 转义特殊字符
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefix = escapeRegex(opts.prefix);
  const suffix = escapeRegex(opts.suffix);
  
  // 匹配 {{variableName}} 格式的占位符
  const regex = new RegExp(`${prefix}\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*${suffix}`, 'g');
  
  return text.replace(regex, (match, variableName: string): string => {
    const trimmedName = variableName.trim();
    
    if (trimmedName in variables && variables[trimmedName] !== undefined) {
      return variables[trimmedName];
    }
    
    // 变量未提供
    if (opts.strict) {
      throw new VariableSubstitutionError(
        `必需变量 "${trimmedName}" 未提供`,
        trimmedName,
        text
      );
    }
    
    // 非严格模式：保留占位符或替换为空字符串
    return opts.keepUnresolved ? match : '';
  });
}

/**
 * 替换提示词模板中的所有变量
 * 
 * @param template - 提示词模板
 * @param variables - 变量值映射
 * @param options - 替换选项
 * @returns 已替换变量的提示词
 * @throws {VariableSubstitutionError} 严格模式下缺少必需变量时抛出
 */
function substitutePromptVariables(
  template: PromptTemplate,
  variables: Record<string, string>,
  options: VariableSubstitutionOptions = {}
): LoadedPrompt {
  // 合并默认值
  const mergedVariables: Record<string, string> = {};
  
  for (const variable of template.variables) {
    const providedValue = variables[variable.name];
    
    if (providedValue !== undefined) {
      mergedVariables[variable.name] = providedValue;
    } else if (variable.defaultValue !== undefined) {
      mergedVariables[variable.name] = variable.defaultValue;
    } else if (variable.required && options.strict !== false) {
      throw new VariableSubstitutionError(
        `必需变量 "${variable.name}" 未提供且没有默认值`,
        variable.name,
        template.systemPrompt
      );
    }
    // If variable is not required and no default, it won't be in mergedVariables
    // This is intentional - the substituteVariables function will handle it
  }
  
  // 替换systemPrompt中的变量
  const resolvedSystemPrompt = substituteVariables(
    template.systemPrompt,
    mergedVariables,
    options
  );
  
  // 替换所有模板中的变量
  const resolvedTemplates: Record<string, string> = {};
  for (const [name, templateText] of Object.entries(template.templates)) {
    resolvedTemplates[name] = substituteVariables(
      templateText,
      mergedVariables,
      options
    );
  }
  
  return {
    template,
    resolvedSystemPrompt,
    resolvedTemplates,
    variables: mergedVariables,
  };
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * 从缓存获取提示词模板
 * 
 * @param role - Agent角色
 * @returns 缓存的提示词模板，如果不存在则返回undefined
 */
function getCachedPrompt(role: AgentRole): PromptTemplate | undefined {
  if (!currentConfig.cacheEnabled) {
    return undefined;
  }
  
  const cacheKey = role;
  const cached = promptCache.get(cacheKey);
  
  return cached?.template;
}

/**
 * 将提示词模板存入缓存
 * 
 * @param role - Agent角色
 * @param template - 提示词模板
 * @param filePath - 文件路径
 */
function cachePrompt(role: AgentRole, template: PromptTemplate, filePath: string): void {
  if (!currentConfig.cacheEnabled) {
    return;
  }
  
  const cacheKey = role;
  promptCache.set(cacheKey, {
    template,
    loadedAt: new Date(),
    filePath,
  });
}

/**
 * 清空提示词缓存
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

/**
 * 重新加载所有提示词（清空缓存）
 * 
 * 需求: 4.3 - 当提示词文件被修改，系统在下次调用时使用更新后的内容
 */
export function reloadPrompts(): void {
  clearPromptCache();
}

// ============================================================================
// Main Loading Functions
// ============================================================================

/**
 * 加载提示词模板（不进行变量替换）
 * 
 * 需求: 4.2, 15.1 - 从Prompt_Repository动态加载提示词
 * 
 * @param role - Agent角色
 * @returns 提示词模板
 * @throws {PromptLoadError} 加载失败时抛出
 */
export async function loadPromptTemplate(role: AgentRole): Promise<PromptTemplate> {
  // 检查缓存
  const cached = getCachedPrompt(role);
  if (cached) {
    return cached;
  }
  
  const filePath = getPromptFilePath(role);
  let yamlContent: string | null = null;
  let baseDir: BaseDirectory = BaseDirectory.Resource;
  
  try {
    // 首先尝试从Resource目录读取（生产环境 - 应用程序目录）
    try {
      const resourceExists = await exists(filePath, {
        baseDir: BaseDirectory.Resource,
      });
      
      if (resourceExists) {
        yamlContent = await readTextFile(filePath, {
          baseDir: BaseDirectory.Resource,
        });
        baseDir = BaseDirectory.Resource;
      }
    } catch (resourceError) {
      console.warn(`Failed to load from Resource directory: ${resourceError}`);
    }
    
    // 如果Resource目录没有，尝试AppData目录（开发环境或用户自定义）
    if (!yamlContent) {
      const appDataExists = await exists(filePath, {
        baseDir: BaseDirectory.AppData,
      });
      
      if (!appDataExists) {
        throw new PromptLoadError(
          `提示词文件不存在: ${filePath} (已尝试Resource和AppData目录)`,
          filePath
        );
      }
      
      yamlContent = await readTextFile(filePath, {
        baseDir: BaseDirectory.AppData,
      });
      baseDir = BaseDirectory.AppData;
    }
    
    // 解析YAML
    const fileStructure = parseYamlPrompt(yamlContent, filePath);
    
    // 转换为TypeScript类型
    const template = convertToPromptTemplate(fileStructure);
    
    // 验证模板
    const validation = validatePromptTemplate(template);
    if (!validation.isValid) {
      const errorMessages = validation.errors
        .map(e => `  - ${e.field}: ${e.message}`)
        .join('\n');
      throw new PromptLoadError(
        `提示词验证失败:\n${errorMessages}`,
        filePath
      );
    }
    
    // 存入缓存
    cachePrompt(role, template, filePath);
    
    console.log(`Successfully loaded prompt for ${role} from ${baseDir === BaseDirectory.Resource ? 'Resource' : 'AppData'} directory`);
    
    return template;
  } catch (error) {
    if (error instanceof PromptLoadError) {
      throw error;
    }
    
    throw new PromptLoadError(
      `提示词加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
      filePath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * 加载提示词并替换变量
 * 
 * 需求: 4.2, 15.1, 15.3 - 加载提示词并进行变量替换
 * 
 * @param role - Agent角色
 * @param variables - 变量值映射（可选）
 * @param options - 变量替换选项（可选）
 * @returns 已加载并替换变量的提示词
 * @throws {PromptLoadError} 加载失败时抛出
 * @throws {VariableSubstitutionError} 变量替换失败时抛出
 */
export async function loadPrompt(
  role: AgentRole,
  variables?: Record<string, string>,
  options?: VariableSubstitutionOptions
): Promise<LoadedPrompt> {
  // 加载模板
  const template = await loadPromptTemplate(role);
  
  // 如果没有提供变量，使用空对象
  const vars = variables || {};
  
  // 替换变量
  return substitutePromptVariables(template, vars, options);
}

/**
 * 获取提示词版本
 * 
 * @param role - Agent角色
 * @returns 提示词版本号
 * @throws {PromptLoadError} 加载失败时抛出
 */
export async function getPromptVersion(role: AgentRole): Promise<string> {
  const template = await loadPromptTemplate(role);
  return template.version;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * 批量加载多个提示词模板
 * 
 * @param roles - Agent角色数组
 * @returns 提示词模板映射
 */
export async function loadPromptTemplates(
  roles: AgentRole[]
): Promise<Map<AgentRole, PromptTemplate>> {
  const results = new Map<AgentRole, PromptTemplate>();
  
  await Promise.all(
    roles.map(async (role) => {
      try {
        const template = await loadPromptTemplate(role);
        results.set(role, template);
      } catch (error) {
        console.error(`Failed to load prompt for role ${role}:`, error);
        // 继续加载其他提示词
      }
    })
  );
  
  return results;
}

/**
 * 批量加载多个提示词并替换变量
 * 
 * @param requests - 加载请求数组
 * @returns 已加载的提示词映射
 */
export async function loadPrompts(
  requests: Array<{
    role: AgentRole;
    variables?: Record<string, string>;
    options?: VariableSubstitutionOptions;
  }>
): Promise<Map<AgentRole, LoadedPrompt>> {
  const results = new Map<AgentRole, LoadedPrompt>();
  
  await Promise.all(
    requests.map(async ({ role, variables, options }) => {
      try {
        const prompt = await loadPrompt(role, variables, options);
        results.set(role, prompt);
      } catch (error) {
        console.error(`Failed to load prompt for role ${role}:`, error);
        // 继续加载其他提示词
      }
    })
  );
  
  return results;
}
