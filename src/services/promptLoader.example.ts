/**
 * 提示词加载服务使用示例
 * Examples for using the prompt loading service
 */

import {
  loadPrompt,
  loadPromptTemplate,
  substituteVariables,
  validatePromptTemplate,
  configurePromptLoader,
  clearPromptCache,
  reloadPrompts,
} from './promptLoader';
import type { AgentRole, PromptTemplate } from '../types/prompt';

// ============================================================================
// Example 1: 基本使用 - 加载提示词并替换变量
// ============================================================================

async function example1_basicUsage() {
  console.log('=== Example 1: 基本使用 ===\n');
  
  try {
    // 加载Decision AI的提示词，并提供变量值
    const prompt = await loadPrompt('decision', {
      topic: '人工智能在医疗诊断中的应用研究',
    });
    
    console.log('提示词版本:', prompt.template.version);
    console.log('角色:', prompt.template.role);
    console.log('描述:', prompt.template.description);
    console.log('\n系统提示词:');
    console.log(prompt.resolvedSystemPrompt);
    console.log('\n任务分配模板:');
    console.log(prompt.resolvedTemplates.task_allocation);
  } catch (error) {
    console.error('加载提示词失败:', error);
  }
}

// ============================================================================
// Example 2: 仅加载模板（不替换变量）
// ============================================================================

async function example2_loadTemplateOnly() {
  console.log('\n=== Example 2: 仅加载模板 ===\n');
  
  try {
    // 仅加载模板，不进行变量替换
    const template = await loadPromptTemplate('supervisor');
    
    console.log('模板信息:');
    console.log('- 版本:', template.version);
    console.log('- 角色:', template.role);
    console.log('- 可用模板:', Object.keys(template.templates).join(', '));
    console.log('- 变量列表:');
    template.variables.forEach(v => {
      console.log(`  * ${v.name}: ${v.description} ${v.required ? '(必需)' : '(可选)'}`);
    });
  } catch (error) {
    console.error('加载模板失败:', error);
  }
}

// ============================================================================
// Example 3: 手动变量替换
// ============================================================================

function example3_manualSubstitution() {
  console.log('\n=== Example 3: 手动变量替换 ===\n');
  
  const template = '论文题目：{{topic}}\n研究方向：{{field}}';
  const variables = {
    topic: '深度学习在自然语言处理中的应用',
    field: '计算机科学',
  };
  
  const result = substituteVariables(template, variables);
  console.log('替换结果:');
  console.log(result);
}

// ============================================================================
// Example 4: 严格模式和非严格模式
// ============================================================================

function example4_strictMode() {
  console.log('\n=== Example 4: 严格模式和非严格模式 ===\n');
  
  const template = '姓名：{{name}}，年龄：{{age}}';
  const variables = { name: '张三' }; // 缺少age变量
  
  // 非严格模式：缺少的变量替换为空字符串
  console.log('非严格模式:');
  const nonStrict = substituteVariables(template, variables, { strict: false });
  console.log(nonStrict);
  
  // 保留未解析的变量
  console.log('\n保留未解析变量:');
  const keepUnresolved = substituteVariables(template, variables, {
    strict: false,
    keepUnresolved: true,
  });
  console.log(keepUnresolved);
  
  // 严格模式：缺少必需变量会抛出错误
  console.log('\n严格模式:');
  try {
    substituteVariables(template, variables, { strict: true });
  } catch (error) {
    console.log('错误:', error.message);
  }
}

// ============================================================================
// Example 5: 自定义变量语法
// ============================================================================

function example5_customSyntax() {
  console.log('\n=== Example 5: 自定义变量语法 ===\n');
  
  const template = 'Hello <name>, welcome to <place>!';
  const variables = {
    name: 'Alice',
    place: 'Wonderland',
  };
  
  const result = substituteVariables(template, variables, {
    prefix: '<',
    suffix: '>',
  });
  
  console.log('自定义语法结果:');
  console.log(result);
}

// ============================================================================
// Example 6: 验证提示词模板
// ============================================================================

function example6_validation() {
  console.log('\n=== Example 6: 验证提示词模板 ===\n');
  
  // 有效的模板
  const validTemplate: PromptTemplate = {
    version: '1.0',
    role: 'writer',
    description: '写作AI',
    systemPrompt: '你是一个专业的学术论文写作AI',
    templates: {
      introduction: '撰写引言部分：{{topic}}',
    },
    variables: [
      {
        name: 'topic',
        description: '论文题目',
        required: true,
      },
    ],
  };
  
  console.log('验证有效模板:');
  const result1 = validatePromptTemplate(validTemplate);
  console.log('- 是否有效:', result1.isValid);
  console.log('- 错误数量:', result1.errors.length);
  console.log('- 警告数量:', result1.warnings.length);
  
  // 无效的模板
  const invalidTemplate = {
    version: 'invalid-version',
    role: 'writer',
    description: '',
    systemPrompt: '',
    templates: {},
    variables: [],
  } as PromptTemplate;
  
  console.log('\n验证无效模板:');
  const result2 = validatePromptTemplate(invalidTemplate);
  console.log('- 是否有效:', result2.isValid);
  console.log('- 错误:');
  result2.errors.forEach(e => {
    console.log(`  * ${e.field}: ${e.message}`);
  });
  console.log('- 警告:');
  result2.warnings.forEach(w => {
    console.log(`  * ${w.field}: ${w.message}`);
  });
}

// ============================================================================
// Example 7: 配置提示词加载器
// ============================================================================

function example7_configuration() {
  console.log('\n=== Example 7: 配置提示词加载器 ===\n');
  
  // 配置自定义路径
  configurePromptLoader({
    basePath: 'custom/prompts',
    cacheEnabled: true,
    fileExtension: '.yml',
  });
  
  console.log('已配置自定义提示词路径');
  
  // 禁用缓存
  configurePromptLoader({
    cacheEnabled: false,
  });
  
  console.log('已禁用缓存');
}

// ============================================================================
// Example 8: 缓存管理
// ============================================================================

async function example8_cacheManagement() {
  console.log('\n=== Example 8: 缓存管理 ===\n');
  
  try {
    // 首次加载（从文件）
    console.log('首次加载提示词...');
    const start1 = Date.now();
    await loadPromptTemplate('decision');
    const time1 = Date.now() - start1;
    console.log(`耗时: ${time1}ms`);
    
    // 第二次加载（从缓存）
    console.log('\n第二次加载提示词（应该更快）...');
    const start2 = Date.now();
    await loadPromptTemplate('decision');
    const time2 = Date.now() - start2;
    console.log(`耗时: ${time2}ms`);
    
    // 清空缓存
    console.log('\n清空缓存...');
    clearPromptCache();
    
    // 重新加载（从文件）
    console.log('清空缓存后重新加载...');
    const start3 = Date.now();
    await loadPromptTemplate('decision');
    const time3 = Date.now() - start3;
    console.log(`耗时: ${time3}ms`);
  } catch (error) {
    console.error('缓存管理示例失败:', error);
  }
}

// ============================================================================
// Example 9: 处理提示词文件更新
// ============================================================================

async function example9_handleUpdates() {
  console.log('\n=== Example 9: 处理提示词文件更新 ===\n');
  
  try {
    // 加载提示词
    console.log('加载提示词...');
    const prompt1 = await loadPromptTemplate('decision');
    console.log('版本:', prompt1.version);
    
    // 模拟提示词文件被修改
    console.log('\n提示词文件已更新...');
    
    // 重新加载所有提示词（清空缓存）
    console.log('重新加载提示词...');
    reloadPrompts();
    
    // 再次加载会从文件读取最新内容
    const prompt2 = await loadPromptTemplate('decision');
    console.log('新版本:', prompt2.version);
  } catch (error) {
    console.error('处理更新失败:', error);
  }
}

// ============================================================================
// Example 10: 批量加载多个提示词
// ============================================================================

async function example10_batchLoading() {
  console.log('\n=== Example 10: 批量加载多个提示词 ===\n');
  
  try {
    const roles: AgentRole[] = ['decision', 'supervisor', 'writer'];
    
    console.log('批量加载提示词...');
    const results = await Promise.all(
      roles.map(async (role) => {
        try {
          const template = await loadPromptTemplate(role);
          return { role, success: true, version: template.version };
        } catch (error) {
          return { role, success: false, error: error.message };
        }
      })
    );
    
    console.log('\n加载结果:');
    results.forEach(r => {
      if (r.success) {
        console.log(`✓ ${r.role}: v${r.version}`);
      } else {
        console.log(`✗ ${r.role}: ${r.error}`);
      }
    });
  } catch (error) {
    console.error('批量加载失败:', error);
  }
}

// ============================================================================
// Example 11: 完整的工作流程
// ============================================================================

async function example11_completeWorkflow() {
  console.log('\n=== Example 11: 完整的工作流程 ===\n');
  
  try {
    // 1. 配置加载器
    console.log('1. 配置提示词加载器...');
    configurePromptLoader({
      basePath: 'prompts',
      cacheEnabled: true,
    });
    
    // 2. 加载提示词模板
    console.log('\n2. 加载Decision AI模板...');
    const template = await loadPromptTemplate('decision');
    console.log(`   版本: ${template.version}`);
    console.log(`   可用模板: ${Object.keys(template.templates).join(', ')}`);
    
    // 3. 验证模板
    console.log('\n3. 验证模板...');
    const validation = validatePromptTemplate(template);
    console.log(`   有效: ${validation.isValid}`);
    if (validation.warnings.length > 0) {
      console.log('   警告:');
      validation.warnings.forEach(w => console.log(`   - ${w.message}`));
    }
    
    // 4. 准备变量
    console.log('\n4. 准备变量...');
    const variables = {
      topic: '基于深度学习的图像识别技术研究',
    };
    console.log(`   论文题目: ${variables.topic}`);
    
    // 5. 加载并替换变量
    console.log('\n5. 加载提示词并替换变量...');
    const prompt = await loadPrompt('decision', variables);
    
    // 6. 使用解析后的提示词
    console.log('\n6. 使用提示词:');
    console.log('   系统提示词长度:', prompt.resolvedSystemPrompt.length);
    console.log('   已解析的模板数量:', Object.keys(prompt.resolvedTemplates).length);
    console.log('   使用的变量:', Object.keys(prompt.variables).join(', '));
    
    console.log('\n✓ 工作流程完成');
  } catch (error) {
    console.error('工作流程失败:', error);
  }
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         提示词加载服务使用示例                              ║');
  console.log('║         Prompt Loader Service Examples                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // 注意：某些示例需要实际的提示词文件存在才能运行
  // 这里只运行不需要文件系统的示例
  
  example3_manualSubstitution();
  example4_strictMode();
  example5_customSyntax();
  example6_validation();
  example7_configuration();
  
  // 需要文件系统的示例（注释掉，仅供参考）
  // await example1_basicUsage();
  // await example2_loadTemplateOnly();
  // await example8_cacheManagement();
  // await example9_handleUpdates();
  // await example10_batchLoading();
  // await example11_completeWorkflow();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         所有示例运行完成                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  example1_basicUsage,
  example2_loadTemplateOnly,
  example3_manualSubstitution,
  example4_strictMode,
  example5_customSyntax,
  example6_validation,
  example7_configuration,
  example8_cacheManagement,
  example9_handleUpdates,
  example10_batchLoading,
  example11_completeWorkflow,
  runAllExamples,
};
