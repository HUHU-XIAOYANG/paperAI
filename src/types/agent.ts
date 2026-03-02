/**
 * Agent数据模型
 * 
 * 定义Agent系统的核心数据结构，包括：
 * - Agent角色类型和状态
 * - Agent配置和能力
 * - 任务和工作记录
 * 
 * 需求: 5.2, 7.1
 */

/**
 * Agent角色枚举
 * 定义系统中所有可能的Agent角色类型
 */
export type AgentRole = 
  | 'decision'          // 决策AI - 负责任务分析和团队组建
  | 'supervisor'        // 监管AI - 负责质量检查和流程监控
  | 'writer'            // 写作AI - 负责论文内容撰写
  | 'editorial_office'  // 编辑部 - 负责格式审查和组织送审
  | 'editor_in_chief'   // 主编 - 负责学术质量把控
  | 'deputy_editor'     // 副主编 - 协助主编工作
  | 'peer_reviewer';    // 审稿专家 - 负责深入评估

/**
 * Agent工作状态
 * 表示Agent当前的工作状态
 */
export type AgentStatus = 
  | 'idle'              // 空闲 - 等待任务分配
  | 'thinking'          // 思考中 - 正在分析问题
  | 'writing'           // 写作中 - 正在生成内容
  | 'waiting_feedback'  // 等待反馈 - 等待其他Agent响应
  | 'revising'          // 修订中 - 正在修改内容
  | 'completed';        // 已完成 - 任务完成

/**
 * Agent能力配置
 * 定义Agent具备的功能能力
 */
export interface AgentCapabilities {
  /** 是否可以访问互联网 */
  canInternetAccess: boolean;
  /** 是否支持流式输出 */
  canStreamOutput: boolean;
  /** 是否可以与其他Agent交互 */
  canInteractWithPeers: boolean;
}

/**
 * Agent配置
 * 定义创建Agent所需的配置信息
 */
export interface AgentConfig {
  /** Agent唯一标识符 */
  id: string;
  /** Agent显示名称 */
  name: string;
  /** Agent角色类型 */
  role: AgentRole;
  /** 提示词模板路径或内容 */
  promptTemplate: string;
  /** AI服务配置名称（引用AIServiceConfig） */
  aiService: string;
  /** Agent能力配置 */
  capabilities: AgentCapabilities;
}

/**
 * 任务定义
 * 表示分配给Agent的具体任务
 */
export interface Task {
  /** 任务唯一标识符 */
  id: string;
  /** 任务描述 */
  description: string;
  /** 任务分配者ID */
  assignedBy: string;
  /** 任务截止时间（可选） */
  deadline?: Date;
  /** 任务优先级 */
  priority: 'low' | 'medium' | 'high';
  /** 依赖的其他任务ID列表（可选） */
  dependencies?: string[];
}

/**
 * Agent状态
 * 表示Agent的当前运行时状态
 */
export interface AgentState {
  /** 当前工作状态 */
  status: AgentStatus;
  /** 当前正在执行的任务（可选） */
  currentTask?: Task;
  /** 返工次数计数器 */
  revisionCount: number;
  /** 最后活动时间 */
  lastActivity: Date;
}

/**
 * 工作记录
 * 记录Agent执行任务的历史信息
 */
export interface WorkRecord {
  /** 关联的任务ID */
  taskId: string;
  /** 任务开始时间 */
  startTime: Date;
  /** 任务结束时间（可选） */
  endTime?: Date;
  /** 任务输出内容 */
  output: string;
  /** 任务执行状态 */
  status: 'in_progress' | 'completed' | 'rejected' | 'revised';
  /** 收到的反馈列表 */
  feedbackReceived: string[];
}

/**
 * Agent实例
 * 表示一个完整的Agent实例，包含配置、状态和历史记录
 */
export interface Agent {
  /** Agent唯一标识符 */
  id: string;
  /** Agent配置信息 */
  config: AgentConfig;
  /** Agent当前状态 */
  state: AgentState;
  /** 工作历史记录 */
  workHistory: WorkRecord[];
  /** 交互消息ID列表 */
  interactionHistory: string[];
}

/**
 * Agent基本信息
 * 用于UI显示的简化Agent信息
 */
export interface AgentInfo {
  /** Agent唯一标识符 */
  id: string;
  /** Agent显示名称 */
  name: string;
  /** Agent角色类型 */
  role: AgentRole;
  /** Agent头像URL（可选） */
  avatar?: string;
  /** 当前任务描述（可选） */
  currentTask?: string;
}
