/**
 * AI输出格式规范 - 消息相关类型定义
 * 
 * 本模块定义了Agent Swarm系统中AI之间通信的标准格式。
 * 所有AI输出必须符合OutputFormat规范，以确保系统能够正确解析和传递信息。
 * 
 * @module types/message
 * @see design.md - 数据模型 > 输出格式规范
 */

/**
 * 消息类型枚举
 * 
 * 定义了AI之间可以发送的所有消息类型。
 * 每种类型对应不同的交互场景和处理逻辑。
 * 
 * @enum {string}
 */
export type MessageType = 
  | 'task_assignment'    // 任务分配：Decision AI分配任务给Writing Team
  | 'work_submission'    // 工作提交：AI提交完成的工作给Supervisor AI
  | 'feedback_request'   // 反馈请求：AI请求其他AI提供反馈或意见
  | 'feedback_response'  // 反馈响应：AI回复反馈请求
  | 'discussion'         // 讨论：AI之间的非正式讨论和协商
  | 'revision_request'   // 修订请求：Supervisor AI要求AI返工
  | 'approval'           // 批准：审稿团队批准内容
  | 'rejection';         // 退稿：审稿团队退稿

/**
 * 消息元数据接口
 * 
 * 包含消息的附加信息，用于消息路由、优先级处理和追踪。
 * 
 * @interface MessageMetadata
 */
export interface MessageMetadata {
  /** 消息优先级，影响处理顺序 */
  priority: 'low' | 'medium' | 'high';
  
  /** 是否需要接收者响应 */
  requiresResponse: boolean;
  
  /** 关联的任务ID，用于追踪任务相关的所有消息 */
  relatedTaskId?: string;
  
  /** 附件ID列表，引用Attachment对象 */
  attachments?: string[];
  
  /** 消息时间戳，ISO 8601格式 */
  timestamp: string;
  
  /** 消息标签，用于分类和过滤 */
  tags?: string[];
}

/**
 * Agent消息接口
 * 
 * 系统内部使用的消息对象，包含完整的消息信息和元数据。
 * 这是InteractionRouter处理的标准消息格式。
 * 
 * @interface AgentMessage
 */
export interface AgentMessage {
  /** 消息唯一标识符 */
  id: string;
  
  /** 消息类型 */
  type: MessageType;
  
  /** 发送者Agent ID */
  sender: string;
  
  /** 接收者Agent ID，支持单播（string）和多播（string[]） */
  receiver: string | string[];
  
  /** 消息内容文本 */
  content: string;
  
  /** 消息元数据 */
  metadata: MessageMetadata;
  
  /** 消息创建时间 */
  timestamp: Date;
}

/**
 * 附件接口
 * 
 * 定义消息可以携带的附件类型和内容。
 * 附件用于传递引用、数据或代码片段。
 * 
 * @interface Attachment
 */
export interface Attachment {
  /** 附件类型 */
  type: 'reference' | 'data' | 'code';
  
  /** 附件内容 */
  content: string;
  
  /** 附件来源（如URL、文件路径等） */
  source?: string;
}

/**
 * AI输出格式接口
 * 
 * 这是AI必须遵循的标准输出格式。
 * 所有AI生成的输出都应该符合这个JSON结构，以便系统能够解析和处理。
 * 
 * Supervisor AI会验证所有输出是否符合此格式，不符合的输出会被要求返工。
 * 
 * @interface OutputFormat
 * @see requirements.md - 需求3: AI输出格式规范
 * 
 * @example
 * ```typescript
 * const output: OutputFormat = {
 *   messageType: 'work_submission',
 *   sender: 'writer_1',
 *   receiver: 'supervisor_ai',
 *   content: {
 *     text: '我已完成引言部分的初稿，包含研究背景、问题陈述和论文结构概述。',
 *     attachments: [
 *       {
 *         type: 'reference',
 *         content: 'Smith et al. (2023) 的相关研究',
 *         source: 'https://example.com/paper'
 *       }
 *     ]
 *   },
 *   metadata: {
 *     timestamp: '2024-01-15T10:30:00Z',
 *     requiresResponse: true,
 *     priority: 'high',
 *     tags: ['introduction', 'draft_v1']
 *   }
 * };
 * ```
 */
export interface OutputFormat {
  /** 消息类型 */
  messageType: MessageType;
  
  /** 发送者Agent ID */
  sender: string;
  
  /** 接收者Agent ID，支持单播和多播 */
  receiver: string | string[];
  
  /** 消息内容 */
  content: {
    /** 消息文本内容 */
    text: string;
    
    /** 可选的附件列表 */
    attachments?: Attachment[];
  };
  
  /** 消息元数据 */
  metadata: {
    /** 消息时间戳，ISO 8601格式 */
    timestamp: string;
    
    /** 是否需要响应 */
    requiresResponse: boolean;
    
    /** 消息优先级 */
    priority: 'low' | 'medium' | 'high';
    
    /** 可选的消息标签 */
    tags?: string[];
  };
}
