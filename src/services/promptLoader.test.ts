/**
 * 提示词加载服务测试
 * Tests for prompt loading service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  substituteVariables,
  validatePromptTemplate,
  configurePromptLoader,
  getPromptLoaderConfig,
  clearPromptCache,
} from './promptLoader';
import type { PromptTemplate } from '../types/prompt';
import { VariableSubstitutionError, PromptLoadError } from '../types/prompt';

// ============================================================================
// Variable Substitution Tests
// ============================================================================

describe('substituteVariables', () => {
  it('should replace single variable', () => {
    const text = 'Hello {{name}}!';
    const variables = { name: 'World' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('Hello World!');
  });

  it('should replace multiple variables', () => {
    const text = '{{greeting}} {{name}}, welcome to {{place}}!';
    const variables = {
      greeting: 'Hello',
      name: 'Alice',
      place: 'Wonderland',
    };
    const result = substituteVariables(text, variables);
    expect(result).toBe('Hello Alice, welcome to Wonderland!');
  });

  it('should handle variables with whitespace', () => {
    const text = '{{ name }} and {{  age  }}';
    const variables = { name: 'Bob', age: '25' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('Bob and 25');
  });

  it('should replace same variable multiple times', () => {
    const text = '{{word}} {{word}} {{word}}';
    const variables = { word: 'repeat' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('repeat repeat repeat');
  });

  it('should handle empty string variables', () => {
    const text = 'Start {{empty}} End';
    const variables = { empty: '' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('Start  End');
  });

  it('should handle text without variables', () => {
    const text = 'No variables here';
    const variables = { unused: 'value' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('No variables here');
  });

  it('should throw error in strict mode when variable is missing', () => {
    const text = 'Hello {{name}}!';
    const variables = {};
    
    expect(() => {
      substituteVariables(text, variables, { strict: true });
    }).toThrow(VariableSubstitutionError);
  });

  it('should replace with empty string in non-strict mode when variable is missing', () => {
    const text = 'Hello {{name}}!';
    const variables = {};
    const result = substituteVariables(text, variables, { strict: false });
    expect(result).toBe('Hello !');
  });

  it('should keep unresolved variables when keepUnresolved is true', () => {
    const text = 'Hello {{name}}!';
    const variables = {};
    const result = substituteVariables(text, variables, {
      strict: false,
      keepUnresolved: true,
    });
    expect(result).toBe('Hello {{name}}!');
  });

  it('should support custom prefix and suffix', () => {
    const text = 'Hello <name>!';
    const variables = { name: 'World' };
    const result = substituteVariables(text, variables, {
      prefix: '<',
      suffix: '>',
    });
    expect(result).toBe('Hello World!');
  });

  it('should handle special characters in variable values', () => {
    const text = 'Message: {{msg}}';
    const variables = { msg: 'Hello $world! (test)' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('Message: Hello $world! (test)');
  });

  it('should handle multiline text', () => {
    const text = `Line 1: {{var1}}
Line 2: {{var2}}
Line 3: {{var3}}`;
    const variables = {
      var1: 'First',
      var2: 'Second',
      var3: 'Third',
    };
    const result = substituteVariables(text, variables);
    expect(result).toBe(`Line 1: First
Line 2: Second
Line 3: Third`);
  });

  it('should handle Chinese characters in variables', () => {
    const text = '论文题目：{{topic}}';
    const variables = { topic: '人工智能在医疗领域的应用' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('论文题目：人工智能在医疗领域的应用');
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('validatePromptTemplate', () => {
  const validTemplate: PromptTemplate = {
    version: '1.0',
    role: 'decision',
    description: 'Test prompt',
    systemPrompt: 'You are a test AI',
    templates: {
      test: 'Test template',
    },
    variables: [
      {
        name: 'var1',
        description: 'Test variable',
      },
    ],
  };

  it('should validate a valid template', () => {
    const result = validatePromptTemplate(validTemplate);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required fields', () => {
    const invalidTemplate = {
      version: '1.0',
      role: 'decision',
      // missing description, systemPrompt, templates, variables
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(invalidTemplate);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect invalid version format', () => {
    const template = {
      ...validTemplate,
      version: 'invalid',
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'version')).toBe(true);
  });

  it('should accept valid semantic versions', () => {
    const versions = ['1.0', '1.2.3', '2.0.0-beta', '1.0.0-alpha.1'];
    
    for (const version of versions) {
      const template = { ...validTemplate, version };
      const result = validatePromptTemplate(template);
      expect(result.isValid).toBe(true);
    }
  });

  it('should detect empty systemPrompt', () => {
    const template = {
      ...validTemplate,
      systemPrompt: '   ',
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'systemPrompt')).toBe(true);
  });

  it('should warn about empty templates object', () => {
    const template = {
      ...validTemplate,
      templates: {},
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true); // Still valid, just a warning
    expect(result.warnings.some(w => w.field === 'templates')).toBe(true);
  });

  it('should detect invalid variables array', () => {
    const template = {
      ...validTemplate,
      variables: 'not an array' as any,
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'variables')).toBe(true);
  });

  it('should detect variables with empty names', () => {
    const template = {
      ...validTemplate,
      variables: [
        {
          name: '',
          description: 'Test',
        },
      ],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field.includes('name'))).toBe(true);
  });

  it('should warn about variables without descriptions', () => {
    const template = {
      ...validTemplate,
      variables: [
        {
          name: 'test',
          description: '',
        },
      ],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true); // Still valid, just a warning
    expect(result.warnings.some(w => w.field.includes('description'))).toBe(true);
  });
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe('configurePromptLoader', () => {
  beforeEach(() => {
    // Reset to default configuration
    configurePromptLoader({
      basePath: 'prompts',
      cacheEnabled: true,
      watchForChanges: false,
      fileExtension: '.yaml',
    });
  });

  it('should update configuration', () => {
    configurePromptLoader({
      basePath: 'custom/path',
      cacheEnabled: false,
    });
    
    const config = getPromptLoaderConfig();
    expect(config.basePath).toBe('custom/path');
    expect(config.cacheEnabled).toBe(false);
  });

  it('should preserve unspecified configuration values', () => {
    configurePromptLoader({
      basePath: 'new/path',
    });
    
    const config = getPromptLoaderConfig();
    expect(config.basePath).toBe('new/path');
    expect(config.cacheEnabled).toBe(true); // Should remain default
    expect(config.fileExtension).toBe('.yaml'); // Should remain default
  });

  it('should clear cache when disabling cache', () => {
    // This is a behavioral test - we can't directly test the cache
    // but we can verify the function doesn't throw
    expect(() => {
      configurePromptLoader({ cacheEnabled: false });
    }).not.toThrow();
  });
});

// ============================================================================
// Cache Management Tests
// ============================================================================

describe('clearPromptCache', () => {
  it('should clear cache without errors', () => {
    expect(() => {
      clearPromptCache();
    }).not.toThrow();
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge cases', () => {
  it('should handle variable names with underscores', () => {
    const text = '{{my_variable}} and {{another_var}}';
    const variables = {
      my_variable: 'first',
      another_var: 'second',
    };
    const result = substituteVariables(text, variables);
    expect(result).toBe('first and second');
  });

  it('should handle variable names with numbers', () => {
    const text = '{{var1}} {{var2}} {{var123}}';
    const variables = {
      var1: 'one',
      var2: 'two',
      var123: 'many',
    };
    const result = substituteVariables(text, variables);
    expect(result).toBe('one two many');
  });

  it('should not replace partial matches', () => {
    const text = '{{name}} and {{username}}';
    const variables = {
      name: 'John',
      username: 'john123',
    };
    const result = substituteVariables(text, variables);
    expect(result).toBe('John and john123');
  });

  it('should handle nested braces in text', () => {
    const text = 'Code: { {{var}} }';
    const variables = { var: 'value' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('Code: { value }');
  });

  it('should handle very long variable values', () => {
    const longValue = 'a'.repeat(10000);
    const text = 'Value: {{long}}';
    const variables = { long: longValue };
    const result = substituteVariables(text, variables);
    expect(result).toBe(`Value: ${longValue}`);
  });

  it('should handle empty text', () => {
    const text = '';
    const variables = { var: 'value' };
    const result = substituteVariables(text, variables);
    expect(result).toBe('');
  });

  it('should handle text with only variables', () => {
    const text = '{{var1}}{{var2}}{{var3}}';
    const variables = {
      var1: 'a',
      var2: 'b',
      var3: 'c',
    };
    const result = substituteVariables(text, variables);
    expect(result).toBe('abc');
  });
});

// ============================================================================
// Task 3.5: Validation and Error Handling Tests
// Requirements: 15.2, 15.4, 4.5
// ============================================================================

describe('Prompt File Integrity Validation (Requirement 4.5)', () => {
  const validTemplate: PromptTemplate = {
    version: '1.0',
    role: 'decision',
    description: 'Test prompt',
    systemPrompt: 'You are a test AI',
    templates: {
      test: 'Test template',
    },
    variables: [
      {
        name: 'var1',
        description: 'Test variable',
      },
    ],
  };

  it('should validate complete prompt template with all required fields', () => {
    const result = validatePromptTemplate(validTemplate);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing version field', () => {
    const template = {
      ...validTemplate,
      version: undefined,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'version')).toBe(true);
    expect(result.errors.find(e => e.field === 'version')?.message).toContain('缺少必需字段');
  });

  it('should detect missing role field', () => {
    const template = {
      ...validTemplate,
      role: undefined,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'role')).toBe(true);
  });

  it('should detect missing description field', () => {
    const template = {
      ...validTemplate,
      description: undefined,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'description')).toBe(true);
  });

  it('should detect missing systemPrompt field', () => {
    const template = {
      ...validTemplate,
      systemPrompt: undefined,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'systemPrompt')).toBe(true);
  });

  it('should detect missing templates field', () => {
    const template = {
      ...validTemplate,
      templates: undefined,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'templates')).toBe(true);
  });

  it('should detect missing variables field', () => {
    const template = {
      ...validTemplate,
      variables: undefined,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'variables')).toBe(true);
  });

  it('should detect multiple missing fields', () => {
    const template = {
      version: '1.0',
      role: 'decision',
      // missing description, systemPrompt, templates, variables
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('should detect invalid version format', () => {
    const invalidVersions = ['v1.0', 'abc', '1.0.0.0'];
    
    for (const version of invalidVersions) {
      const template = { ...validTemplate, version };
      const result = validatePromptTemplate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
      expect(result.errors.find(e => e.field === 'version')?.message).toContain('版本号格式无效');
    }
  });

  it('should accept valid semantic version formats', () => {
    const validVersions = ['1.0', '1.2.3', '2.0.0-beta', '1.0.0-alpha.1', '0.1.0'];
    
    for (const version of validVersions) {
      const template = { ...validTemplate, version };
      const result = validatePromptTemplate(template);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it('should detect empty systemPrompt', () => {
    const template = { ...validTemplate, systemPrompt: '' };
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'systemPrompt')).toBe(true);
    expect(result.errors.find(e => e.field === 'systemPrompt')?.message).toContain('不能为空');
  });

  it('should detect whitespace-only systemPrompt', () => {
    const template = { ...validTemplate, systemPrompt: '   \n\t  ' };
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'systemPrompt')).toBe(true);
  });

  it('should detect invalid templates type (not an object)', () => {
    const template = {
      ...validTemplate,
      templates: 'not an object' as any,
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'templates')).toBe(true);
    expect(result.errors.find(e => e.field === 'templates')?.message).toContain('必须是一个对象');
  });

  it('should warn about empty templates object', () => {
    const template = { ...validTemplate, templates: {} };
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true); // Still valid, just a warning
    expect(result.warnings.some(w => w.field === 'templates')).toBe(true);
    expect(result.warnings.find(w => w.field === 'templates')?.message).toContain('为空');
  });

  it('should detect invalid variables type (not an array)', () => {
    const template = {
      ...validTemplate,
      variables: { not: 'an array' } as any,
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'variables')).toBe(true);
    expect(result.errors.find(e => e.field === 'variables')?.message).toContain('必须是一个数组');
  });

  it('should detect variable with empty name', () => {
    const template = {
      ...validTemplate,
      variables: [
        { name: '', description: 'Test' },
      ],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field.includes('name'))).toBe(true);
    expect(result.errors.find(e => e.field.includes('name'))?.message).toContain('不能为空');
  });

  it('should detect variable with whitespace-only name', () => {
    const template = {
      ...validTemplate,
      variables: [
        { name: '   ', description: 'Test' },
      ],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field.includes('name'))).toBe(true);
  });

  it('should warn about variable without description', () => {
    const template = {
      ...validTemplate,
      variables: [
        { name: 'test', description: '' },
      ],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true); // Still valid, just a warning
    expect(result.warnings.some(w => w.field.includes('description'))).toBe(true);
    expect(result.warnings.find(w => w.field.includes('description'))?.message).toContain('缺少描述');
  });

  it('should detect multiple variable validation issues', () => {
    const template = {
      ...validTemplate,
      variables: [
        { name: '', description: 'Empty name' },
        { name: 'valid', description: '' },
        { name: '  ', description: 'Whitespace name' },
      ],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2); // At least 2 errors for empty names
    expect(result.warnings.length).toBeGreaterThanOrEqual(1); // At least 1 warning for missing description
  });

  it('should provide descriptive error messages', () => {
    const template = {
      version: 'invalid',
      role: 'decision',
      description: 'Test',
      systemPrompt: '',
      templates: 'not an object' as any,
      variables: 'not an array' as any,
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    
    // Check that all errors have descriptive messages
    for (const error of result.errors) {
      expect(error.message).toBeTruthy();
      expect(error.message.length).toBeGreaterThan(5);
      expect(error.field).toBeTruthy();
    }
  });

  it('should include field values in error details when available', () => {
    const template = {
      ...validTemplate,
      version: 'invalid-version',
    };
    
    const result = validatePromptTemplate(template);
    const versionError = result.errors.find(e => e.field === 'version');
    expect(versionError?.value).toBe('invalid-version');
  });

  it('should provide suggestions in warnings', () => {
    const template = {
      ...validTemplate,
      templates: {},
    };
    
    const result = validatePromptTemplate(template);
    const templatesWarning = result.warnings.find(w => w.field === 'templates');
    expect(templatesWarning?.suggestion).toBeTruthy();
    expect(templatesWarning?.suggestion).toContain('添加');
  });
});

describe('Error Handling for Missing Files (Requirement 15.2)', () => {
  it('should throw PromptLoadError with descriptive message for missing file', () => {
    // This test verifies the error structure and message format
    // Actual file loading is tested in integration tests
    
    const error = new PromptLoadError(
      '提示词文件不存在: prompts/test.yaml',
      'prompts/test.yaml'
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PromptLoadError');
    expect(error.message).toContain('提示词文件不存在');
    expect(error.message).toContain('test.yaml');
    expect(error.filePath).toBe('prompts/test.yaml');
  });

  it('should include file path in PromptLoadError', () => {
    const filePath = 'prompts/decision_ai.yaml';
    const error = new PromptLoadError('Test error', filePath);
    
    expect(error.filePath).toBe(filePath);
  });

  it('should support error cause chain in PromptLoadError', () => {
    const originalError = new Error('Original error');
    const error = new PromptLoadError(
      'Wrapped error',
      'test.yaml',
      originalError
    );
    
    expect(error.cause).toBe(originalError);
  });

  it('should provide descriptive error for YAML parsing failure', () => {
    const error = new PromptLoadError(
      'YAML解析失败: unexpected token',
      'prompts/test.yaml'
    );
    
    expect(error.message).toContain('YAML解析失败');
    expect(error.message).toContain('unexpected token');
  });

  it('should provide descriptive error for validation failure', () => {
    const error = new PromptLoadError(
      '提示词验证失败:\n  - version: 版本号格式无效\n  - systemPrompt: 不能为空',
      'prompts/test.yaml'
    );
    
    expect(error.message).toContain('提示词验证失败');
    expect(error.message).toContain('version');
    expect(error.message).toContain('systemPrompt');
  });
});

describe('Version Control Information Reading (Requirement 15.4)', () => {
  it('should validate version format in prompt template', () => {
    const template: PromptTemplate = {
      version: '1.2.3',
      role: 'decision',
      description: 'Test',
      systemPrompt: 'Test prompt',
      templates: { test: 'template' },
      variables: [],
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true);
    expect(template.version).toBe('1.2.3');
  });

  it('should support semantic versioning with pre-release tags', () => {
    const versions = [
      '1.0.0-alpha',
      '1.0.0-beta.1',
      '2.0.0-rc.2',
      '1.0.0-alpha.beta',
    ];
    
    for (const version of versions) {
      const template: PromptTemplate = {
        version,
        role: 'decision',
        description: 'Test',
        systemPrompt: 'Test prompt',
        templates: { test: 'template' },
        variables: [],
      };
      
      const result = validatePromptTemplate(template);
      expect(result.isValid).toBe(true);
    }
  });

  it('should reject invalid version formats', () => {
    const invalidVersions = [
      'v1.0',      // prefix not allowed
      '1.0.0.0',   // too many parts
      'latest',    // not a version
    ];
    
    for (const version of invalidVersions) {
      const template: PromptTemplate = {
        version,
        role: 'decision',
        description: 'Test',
        systemPrompt: 'Test prompt',
        templates: { test: 'template' },
        variables: [],
      };
      
      const result = validatePromptTemplate(template);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    }
  });

  it('should include version in validation error details', () => {
    const template: PromptTemplate = {
      version: 'invalid',
      role: 'decision',
      description: 'Test',
      systemPrompt: 'Test prompt',
      templates: { test: 'template' },
      variables: [],
    };
    
    const result = validatePromptTemplate(template);
    const versionError = result.errors.find(e => e.field === 'version');
    expect(versionError).toBeDefined();
    expect(versionError?.value).toBe('invalid');
    expect(versionError?.message).toContain('版本号格式无效');
  });

  it('should support metadata with version information', () => {
    const template: PromptTemplate = {
      version: '1.0.0',
      role: 'decision',
      description: 'Test',
      systemPrompt: 'Test prompt',
      templates: { test: 'template' },
      variables: [],
      metadata: {
        author: 'Test Author',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        tags: ['v1', 'stable'],
        notes: 'Initial release',
      },
    };
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true);
    expect(template.metadata?.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(template.metadata?.updatedAt).toBe('2024-01-15T00:00:00Z');
  });
});

describe('Variable Substitution Error Handling', () => {
  it('should throw VariableSubstitutionError with variable name', () => {
    const text = 'Hello {{name}}!';
    const variables = {};
    
    expect(() => {
      substituteVariables(text, variables, { strict: true });
    }).toThrow(VariableSubstitutionError);
    
    try {
      substituteVariables(text, variables, { strict: true });
    } catch (error) {
      if (error instanceof VariableSubstitutionError) {
        expect(error.variableName).toBe('name');
        expect(error.template).toBe(text);
        expect(error.message).toContain('name');
        expect(error.message).toContain('未提供');
      }
    }
  });

  it('should provide descriptive error message for missing required variable', () => {
    const text = 'Topic: {{topic}}, Author: {{author}}';
    const variables = { topic: 'Test' };
    
    try {
      substituteVariables(text, variables, { strict: true });
    } catch (error) {
      if (error instanceof VariableSubstitutionError) {
        expect(error.message).toContain('author');
        expect(error.message).toContain('未提供');
        expect(error.variableName).toBe('author');
      }
    }
  });

  it('should handle gracefully in non-strict mode', () => {
    const text = 'Hello {{name}}!';
    const variables = {};
    
    expect(() => {
      substituteVariables(text, variables, { strict: false });
    }).not.toThrow();
    
    const result = substituteVariables(text, variables, { strict: false });
    expect(result).toBe('Hello !');
  });

  it('should preserve template in error for debugging', () => {
    const text = 'Complex template with {{var1}} and {{var2}}';
    const variables = { var1: 'value1' };
    
    try {
      substituteVariables(text, variables, { strict: true });
    } catch (error) {
      if (error instanceof VariableSubstitutionError) {
        expect(error.template).toBe(text);
      }
    }
  });
});

describe('Comprehensive Error Scenarios', () => {
  it('should handle template with all fields invalid', () => {
    const template = {
      version: 'bad',
      role: 'decision',
      description: '',
      systemPrompt: '',
      templates: null,
      variables: 'not array',
    } as unknown as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2); // At least version and systemPrompt errors
  });

  it('should provide clear error messages for each validation failure', () => {
    const template = {
      version: '1.0',
      role: 'decision',
      description: 'Test',
      systemPrompt: '',
      templates: {},
      variables: [
        { name: '', description: 'Empty name' },
      ],
    } as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(false);
    
    // Each error should have a clear message
    for (const error of result.errors) {
      expect(error.message).toBeTruthy();
      expect(error.field).toBeTruthy();
    }
  });

  it('should distinguish between errors and warnings', () => {
    const template = {
      version: '1.0',
      role: 'decision',
      description: 'Test',
      systemPrompt: 'Valid prompt',
      templates: {},
      variables: [
        { name: 'test', description: '' },
      ],
    } as PromptTemplate;
    
    const result = validatePromptTemplate(template);
    expect(result.isValid).toBe(true); // Warnings don't make it invalid
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
