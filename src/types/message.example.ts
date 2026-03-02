/**
 * OutputFormat使用示例
 * 
 * 本文件展示了如何使用OutputFormat相关类型定义。
 * 这些示例可以作为AI提示词的参考，帮助AI生成符合规范的输出。
 */

import type { OutputFormat, AgentMessage, MessageType, Attachment } from './message';
import type { ParsedMessage, ParseError } from './message.types';

// ============================================================================
// 示例1: 任务分配消息
// ============================================================================

export const taskAssignmentExample: OutputFormat = {
  messageType: 'task_assignment',
  sender: 'decision_ai',
  receiver: 'writer_1',
  content: {
    text: '请撰写论文的引言部分，包括研究背景、问题陈述和论文结构概述。字数要求：800-1000字。',
  },
  metadata: {
    timestamp: '2024-01-15T10:00:00Z',
    requiresResponse: false,
    priority: 'high',
    tags: ['introduction', 'task'],
  },
};

// ============================================================================
// 示例2: 工作提交消息（带附件）
// ============================================================================

export const workSubmissionExample: OutputFormat = {
  messageType: 'work_submission',
  sender: 'writer_1',
  receiver: 'supervisor_ai',
  content: {
    text: '我已完成引言部分的初稿，包含研究背景、问题陈述和论文结构概述。',
    attachments: [
      {
        type: 'reference',
        content: 'Smith et al. (2023) 的相关研究',
        source: 'https://example.com/paper',
      },
      {
        type: 'data',
        content: '引言字数：950字',
      },
    ],
  },
  metadata: {
    timestamp: '2024-01-15T10:30:00Z',
    requiresResponse: true,
    priority: 'high',
    tags: ['introduction', 'draft_v1'],
  },
};

// ============================================================================
// 示例3: 反馈请求消息
// ============================================================================

export const feedbackRequestExample: OutputFormat = {
  messageType: 'feedback_request',
  sender: 'writer_1',
  receiver: 'writer_2',
  content: {
    text: '我在引言中提到了你负责的方法部分，能否提供方法的关键点概要，以便我在引言中准确描述？',
  },
  metadata: {
    timestamp: '2024-01-15T10:15:00Z',
    requiresResponse: true,
    priority: 'medium',
    tags: ['introduction', 'methods', 'collaboration'],
  },
};

// ============================================================================
// 示例4: 反馈响应消息
// ============================================================================

export const feedbackResponseExample: OutputFormat = {
  messageType: 'feedback_response',
  sender: 'writer_2',
  receiver: 'writer_1',
  content: {
    text: '方法部分的关键点包括：1) 采用混合研究方法；2) 样本量为500人；3) 使用问卷调查和深度访谈相结合的数据收集方式。',
  },
  metadata: {
    timestamp: '2024-01-15T10:20:00Z',
    requiresResponse: false,
    priority: 'medium',
    tags: ['methods', 'collaboration'],
  },
};

// ============================================================================
// 示例5: 广播讨论消息
// ============================================================================

export const discussionBroadcastExample: OutputFormat = {
  messageType: 'discussion',
  sender: 'editor_in_chief',
  receiver: ['deputy_editor', 'peer_reviewer_1', 'peer_reviewer_2'],
  content: {
    text: '这篇论文的方法部分存在一些创新性，但实验设计可能不够严谨。请各位审稿专家提供意见。',
  },
  metadata: {
    timestamp: '2024-01-15T14:00:00Z',
    requiresResponse: true,
    priority: 'high',
    tags: ['review', 'methods', 'discussion'],
  },
};

// ============================================================================
// 示例6: 修订请求消息
// ============================================================================

export const revisionRequestExample: OutputFormat = {
  messageType: 'revision_request',
  sender: 'supervisor_ai',
  receiver: 'writer_1',
  content: {
    text: '引言部分需要补充更多的研究背景。当前版本的背景描述过于简略，建议增加至少2-3段相关研究综述。',
  },
  metadata: {
    timestamp: '2024-01-15T11:00:00Z',
    requiresResponse: false,
    priority: 'high',
    tags: ['introduction', 'revision', 'background'],
  },
};

// ============================================================================
// 示例7: 批准消息
// ============================================================================

export const approvalExample: OutputFormat = {
  messageType: 'approval',
  sender: 'editor_in_chief',
  receiver: 'editorial_office',
  content: {
    text: '论文质量符合发表标准，批准录用。请编辑部进行后续的格式整理和出版流程。',
  },
  metadata: {
    timestamp: '2024-01-15T16:00:00Z',
    requiresResponse: false,
    priority: 'high',
    tags: ['review', 'approval', 'publication'],
  },
};

// ============================================================================
// 示例8: 退稿消息
// ============================================================================

export const rejectionExample: OutputFormat = {
  messageType: 'rejection',
  sender: 'editor_in_chief',
  receiver: 'supervisor_ai',
  content: {
    text: '论文存在以下问题需要修改：1) 研究方法不够严谨；2) 数据分析存在逻辑漏洞；3) 结论部分缺乏充分支撑。建议全面修订后重新提交。',
    attachments: [
      {
        type: 'data',
        content: '详细审稿意见见附件',
      },
    ],
  },
  metadata: {
    timestamp: '2024-01-15T15:00:00Z',
    requiresResponse: false,
    priority: 'high',
    tags: ['review', 'rejection', 'major_revision'],
  },
};

// ============================================================================
// 示例9: AgentMessage（系统内部使用）
// ============================================================================

export const agentMessageExample: AgentMessage = {
  id: 'msg_001',
  type: 'work_submission',
  sender: 'writer_1',
  receiver: 'supervisor_ai',
  content: '我已完成引言部分的初稿。',
  metadata: {
    priority: 'high',
    requiresResponse: true,
    timestamp: '2024-01-15T10:30:00Z',
    tags: ['introduction', 'draft_v1'],
  },
  timestamp: new Date('2024-01-15T10:30:00Z'),
};

// ============================================================================
// 示例10: ParsedMessage（解析后的消息）
// ============================================================================

export const parsedMessageExample: ParsedMessage = {
  type: 'work_submission',
  sender: 'writer_1',
  receiver: 'supervisor_ai',
  content: '我已完成引言部分的初稿。',
  metadata: {
    priority: 'high',
    requiresResponse: true,
    timestamp: '2024-01-15T10:30:00Z',
    tags: ['introduction', 'draft_v1'],
  },
};

// ============================================================================
// 示例11: ParseError（解析错误）
// ============================================================================

export const parseErrorExample: ParseError = {
  error: "缺少必需字段 'messageType'",
  line: 1,
  column: 1,
  suggestion: "请确保输出包含 messageType 字段，值必须是有效的消息类型（task_assignment, work_submission, feedback_request, feedback_response, discussion, revision_request, approval, rejection）",
};

// ============================================================================
// 示例12: 附件示例
// ============================================================================

export const referenceAttachmentExample: Attachment = {
  type: 'reference',
  content: 'Smith, J., & Doe, A. (2023). A comprehensive study on AI collaboration. Journal of AI Research, 15(3), 123-145.',
  source: 'https://doi.org/10.1234/jair.2023.15.3.123',
};

export const dataAttachmentExample: Attachment = {
  type: 'data',
  content: JSON.stringify({
    wordCount: 950,
    paragraphs: 5,
    references: 8,
  }),
};

export const codeAttachmentExample: Attachment = {
  type: 'code',
  content: `
function analyzeText(text: string): TextAnalysis {
  return {
    wordCount: text.split(/\\s+/).length,
    characterCount: text.length,
  };
}
  `.trim(),
  source: 'src/utils/textAnalysis.ts',
};

// ============================================================================
// 辅助函数：创建标准时间戳
// ============================================================================

/**
 * 创建ISO 8601格式的时间戳
 * @returns ISO 8601格式的时间戳字符串
 */
export function createTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// 辅助函数：验证消息类型
// ============================================================================

/**
 * 验证字符串是否是有效的消息类型
 * @param type - 要验证的字符串
 * @returns 是否是有效的消息类型
 */
export function isValidMessageType(type: string): type is MessageType {
  const validTypes: MessageType[] = [
    'task_assignment',
    'work_submission',
    'feedback_request',
    'feedback_response',
    'discussion',
    'revision_request',
    'approval',
    'rejection',
  ];
  return validTypes.includes(type as MessageType);
}

// ============================================================================
// 辅助函数：创建基础OutputFormat
// ============================================================================

/**
 * 创建基础的OutputFormat对象
 * @param type - 消息类型
 * @param sender - 发送者ID
 * @param receiver - 接收者ID
 * @param text - 消息文本
 * @returns OutputFormat对象
 */
export function createOutputFormat(
  type: MessageType,
  sender: string,
  receiver: string | string[],
  text: string
): OutputFormat {
  return {
    messageType: type,
    sender,
    receiver,
    content: {
      text,
    },
    metadata: {
      timestamp: createTimestamp(),
      requiresResponse: false,
      priority: 'medium',
    },
  };
}
