/**
 * 提示词数据模型使用示例
 * Examples demonstrating the usage of prompt data models
 */

import type {
  PromptTemplate,
  PromptVariable,
  LoadedPrompt,
  PromptFileStructure,
  VariableSubstitutionOptions,
  AgentRole,
} from './prompt';

// ============================================================================
// 示例 1: 创建提示词模板
// Example 1: Creating a Prompt Template
// ============================================================================

const decisionAITemplate: PromptTemplate = {
  version: '1.0',
  role: 'decision',
  description: '决策AI负责分析题目、评估工作量并组建写作团队',
  systemPrompt: `你是一个学术论文写作项目的决策AI。你的职责是：
1. 分析论文题目的复杂度和所需工作量
2. 确定需要多少个写作AI以及各自的专业分工
3. 为每个AI分配具体的写作任务
4. 估算完成时间
5. 在检测到人手不足时动态增加新的AI角色`,
  templates: {
    task_allocation: `论文题目：{{topic}}

请分析以下内容：
1. 该题目涉及的主要研究领域和子领域
2. 需要撰写的论文章节（引言、文献综述、方法、结果、讨论、结论等）
3. 每个章节的预估工作量（简单/中等/复杂）
4. 建议的写作团队规模和角色分工`,
    dynamic_addition: `当前情况：{{situation}}
瓶颈分析：{{bottleneck}}

请决定：
1. 是否需要增加新的AI角色
2. 新角色的专业方向和职责
3. 新角色应该承担的具体任务`,
  },
  variables: [
    {
      name: 'topic',
      description: '用户输入的论文题目',
      required: true,
    },
    {
      name: 'situation',
      description: '当前流程的具体情况描述',
      required: false,
      defaultValue: '正常进行中',
    },
    {
      name: 'bottleneck',
      description: '识别出的瓶颈问题',
      required: false,
    },
  ],
  metadata: {
    author: 'System',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['decision', 'task-allocation', 'dynamic-scaling'],
    notes: '支持动态团队扩展的决策AI提示词',
  },
};

// ============================================================================
// 示例 2: YAML文件结构
// Example 2: YAML File Structure
// ============================================================================

const yamlStructure: PromptFileStructure = {
  version: '1.0',
  role: 'supervisor',
  description: '监管AI负责检查输出质量和格式规范性',
  system_prompt: `你是一个学术论文写作项目的监管AI。你的职责是：
1. 验证AI输出是否符合格式规范
2. 检查内容质量
3. 要求不合规内容返工
4. 检测人手不足情况并通知决策AI`,
  templates: {
    format_validation: 'AI输出内容：{{output}}\n\n请验证格式是否符合规范。',
    quality_check: '提交内容：{{content}}\n任务要求：{{requirements}}\n\n请评估质量。',
  },
  variables: [
    {
      name: 'output',
      description: 'AI生成的输出内容',
      required: true,
    },
    {
      name: 'content',
      description: '提交的工作内容',
      required: true,
    },
    {
      name: 'requirements',
      description: '任务要求描述',
      required: true,
    },
  ],
  metadata: {
    author: 'System',
    created_at: '2024-01-01T00:00:00Z',
    tags: ['supervisor', 'validation'],
  },
};

// ============================================================================
// 示例 3: 已加载的提示词（变量已替换）
// Example 3: Loaded Prompt (with variables substituted)
// ============================================================================

const loadedPrompt: LoadedPrompt = {
  template: decisionAITemplate,
  resolvedSystemPrompt: decisionAITemplate.systemPrompt,
  resolvedTemplates: {
    task_allocation: `论文题目：深度学习在医学图像分析中的应用

请分析以下内容：
1. 该题目涉及的主要研究领域和子领域
2. 需要撰写的论文章节（引言、文献综述、方法、结果、讨论、结论等）
3. 每个章节的预估工作量（简单/中等/复杂）
4. 建议的写作团队规模和角色分工`,
    dynamic_addition: `当前情况：写作进度延迟，引言部分返工3次
瓶颈分析：缺乏医学领域专业知识

请决定：
1. 是否需要增加新的AI角色
2. 新角色的专业方向和职责
3. 新角色应该承担的具体任务`,
  },
  variables: {
    topic: '深度学习在医学图像分析中的应用',
    situation: '写作进度延迟，引言部分返工3次',
    bottleneck: '缺乏医学领域专业知识',
  },
};

// ============================================================================
// 示例 4: 变量替换选项
// Example 4: Variable Substitution Options
// ============================================================================

const strictOptions: VariableSubstitutionOptions = {
  strict: true,
  keepUnresolved: false,
  prefix: '{{',
  suffix: '}}',
};

const lenientOptions: VariableSubstitutionOptions = {
  strict: false,
  keepUnresolved: true,
  prefix: '{{',
  suffix: '}}',
};

const customSyntaxOptions: VariableSubstitutionOptions = {
  strict: true,
  keepUnresolved: false,
  prefix: '${',
  suffix: '}',
};

// ============================================================================
// 示例 5: 提示词变量定义
// Example 5: Prompt Variable Definitions
// ============================================================================

const requiredVariable: PromptVariable = {
  name: 'topic',
  description: '用户输入的论文题目',
  required: true,
};

const optionalVariableWithDefault: PromptVariable = {
  name: 'language',
  description: '论文语言',
  required: false,
  defaultValue: '中文',
};

const optionalVariableNoDefault: PromptVariable = {
  name: 'keywords',
  description: '论文关键词',
  required: false,
};

// ============================================================================
// 示例 6: 不同角色的提示词模板
// Example 6: Prompt Templates for Different Roles
// ============================================================================

const writerTemplate: PromptTemplate = {
  version: '1.0',
  role: 'writer',
  description: '写作AI负责撰写论文的特定章节',
  systemPrompt: '你是一个学术论文写作AI，负责撰写高质量的学术内容。',
  templates: {
    write_section: '章节：{{section}}\n要求：{{requirements}}\n\n请撰写该章节内容。',
  },
  variables: [
    { name: 'section', description: '章节名称', required: true },
    { name: 'requirements', description: '章节要求', required: true },
  ],
};

const reviewerTemplate: PromptTemplate = {
  version: '1.0',
  role: 'peer_reviewer',
  description: '审稿专家负责深入评估论文质量',
  systemPrompt: '你是一个学术论文审稿专家，负责提供专业的审稿意见。',
  templates: {
    review_paper: '论文标题：{{title}}\n论文内容：{{content}}\n\n请提供详细的审稿意见。',
  },
  variables: [
    { name: 'title', description: '论文标题', required: true },
    { name: 'content', description: '论文内容', required: true },
  ],
};

// ============================================================================
// 示例 7: 角色到文件名的映射
// Example 7: Role to Filename Mapping
// ============================================================================

const roleToFilename: Record<AgentRole, string> = {
  decision: 'decision_ai.yaml',
  supervisor: 'supervisor_ai.yaml',
  writer: 'writer.yaml',
  editorial_office: 'editorial_office.yaml',
  editor_in_chief: 'editor_in_chief.yaml',
  deputy_editor: 'deputy_editor.yaml',
  peer_reviewer: 'peer_reviewer.yaml',
};

function getPromptFilePath(role: AgentRole, basePath: string): string {
  const filename = roleToFilename[role];
  return `${basePath}/${filename}`;
}

console.log(getPromptFilePath('decision', './prompts'));

// ============================================================================
// 导出示例数据（用于测试）
// Export Example Data (for testing)
// ============================================================================

export const examples = {
  decisionAITemplate,
  yamlStructure,
  loadedPrompt,
  strictOptions,
  lenientOptions,
  customSyntaxOptions,
  requiredVariable,
  optionalVariableWithDefault,
  optionalVariableNoDefault,
  writerTemplate,
  reviewerTemplate,
  roleToFilename,
  getPromptFilePath,
};
