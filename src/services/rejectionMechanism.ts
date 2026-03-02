/**
 * Rejection Mechanism服务实现
 * Rejection Mechanism Service Implementation
 * 
 * 负责退稿机制的触发、原因分析、流程修复和重启
 * 
 * 需求: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 * 任务: 12.1 创建RejectionMechanism类
 * 任务: 12.2 实现退稿原因分析
 * 任务: 12.3 实现流程修复逻辑
 * 任务: 12.4 实现流程重启
 */

import type { AIClient } from '../types/ai-client';
import type { AgentMessage } from '../types/message';
import type { Agent } from '../types/agent';
import { loadPrompt } from './promptLoader';
import type { SupervisorAI } from './supervisorAI';
import type { DecisionAI } from './decisionAI';
import type { AgentManager } from './agentManager';

// ============================================================================
// Types
// ============================================================================

/**
 * 退稿原因类别
 */
export type RejectionReasonCategory = 'format' | 'quality' | 'completeness' | 'coherence';

/**
 * 瓶颈类型
 */
export type BottleneckType = 'insufficient_personnel' | 'skill_gap' | 'communication_breakdown';

/**
 * 修复动作类型
 */
export type ActionType = 'add_agent' | 'reassign_task' | 'modify_prompt' | 'adjust_workflow';

/**
 * 退稿原因
 */
export interface RejectionReason {
  category: RejectionReasonCategory;
  description: string;
  affectedSections: string[];
  severity: 'minor' | 'major' | 'critical';
}

/**
 * 流程瓶颈
 */
export interface Bottleneck {
  type: BottleneckType;
  description: string;
  affectedAgents: string[];
  suggestedRoleType?: string;
}

/**
 * 修复动作
 */
export interface Action {
  type: ActionType;
  description: string;
  priority: number;
  targetAgent?: string;
  newRoleType?: string;
}

/**
 * 退稿分析结果
 */
export interface RejectionAnalysis {
  rejectionCount: number;
  reasons: RejectionReason[];
  bottlenecks: Bottleneck[];
  suggestedActions: Action[];
  timestamp: Date;
}

/**
 * 流程修复结果
 */
export interface ProcessFixResult {
  success: boolean;
  actionsExecuted: Action[];
  newAgentsAdded: string[];
  errors: string[];
  message: string;
}

/**
 * 流程重启结果
 */
export interface ProcessRestartResult {
  success: boolean;
  preservedHistory: boolean;
  preservedRevisions: boolean;
  newProcessId: string;
  message: string;
}

// ============================================================================
// Rejection Mechanism Service
// ============================================================================

/**
 * Rejection Mechanism服务类
 * 
 * 提供退稿触发检测、原因分析、流程修复和重启功能
 */
export class RejectionMechanism {
  private aiClient: AIClient;
  private supervisorAI: SupervisorAI;
  private decisionAI: DecisionAI;
  private agentManager: AgentManager;
  
  /** 退稿触发阈值 */
  private readonly REJECTION_THRESHOLD = 3;
  
  /** 退稿历史记录 */
  private rejectionHistory: RejectionAnalysis[] = [];

  constructor(
    aiClient: AIClient,
    supervisorAI: SupervisorAI,
    decisionAI: DecisionAI,
    agentManager: AgentManager
  ) {
    this.aiClient = aiClient;
    this.supervisorAI = supervisorAI;
    this.decisionAI = decisionAI;
    this.agentManager = agentManager;
  }

  /**
   * 检测是否应该触发退稿机制
   * 
   * 需求: 9.1 - 当论文被退稿次数达到3次时触发Rejection_Mechanism
   * 任务: 12.1 实现退稿触发条件检测
   * 
   * @param rejectionCount - 当前退稿次数
   * @returns 是否应该触发退稿机制
   */
  shouldTrigger(rejectionCount: number): boolean {
    const shouldTrigger = rejectionCount >= this.REJECTION_THRESHOLD;
    
    if (shouldTrigger) {
      console.log(
        `[Rejection Mechanism] 退稿次数达到阈值 (${rejectionCount}/${this.REJECTION_THRESHOLD})，触发退稿机制`
      );
    }
    
    return shouldTrigger;
  }

  /**
   * 分析退稿原因和流程问题
   * 
   * 需求: 9.2 - 分析退稿原因和流程问题
   * 需求: 9.3 - 检测是否因人手不足导致退稿
   * 任务: 12.2 实现退稿原因分析
   * 
   * @param rejectionCount - 退稿次数
   * @param rejectionMessages - 退稿相关的消息历史
   * @returns 退稿分析结果
   */
  async analyzeRejection(
    rejectionCount: number,
    rejectionMessages: AgentMessage[]
  ): Promise<RejectionAnalysis> {
    console.log(`[Rejection Mechanism] 开始分析退稿原因，退稿次数: ${rejectionCount}`);

    // 收集返工记录
    const reworkRecords = this.supervisorAI.getReworkRecords();
    
    // 获取质量检查报告
    const qualityReport = await this.supervisorAI.generateQualityReport();

    // 分析退稿原因
    const reasons = await this.analyzeRejectionReasons(rejectionMessages, reworkRecords);
    
    // 识别流程瓶颈
    const bottlenecks = await this.identifyBottlenecks(
      reworkRecords,
      qualityReport,
      reasons
    );
    
    // 生成修复建议
    const suggestedActions = this.generateSuggestedActions(reasons, bottlenecks);

    const analysis: RejectionAnalysis = {
      rejectionCount,
      reasons,
      bottlenecks,
      suggestedActions,
      timestamp: new Date(),
    };

    // 保存到历史记录
    this.rejectionHistory.push(analysis);

    console.log(`[Rejection Mechanism] 退稿分析完成:`, {
      reasonsCount: reasons.length,
      bottlenecksCount: bottlenecks.length,
      actionsCount: suggestedActions.length,
    });

    return analysis;
  }

  /**
   * 修复已识别的流程问题
   * 
   * 需求: 9.4 - 如果退稿原因为人手不足，通知Decision AI执行Dynamic_Role_Addition
   * 需求: 9.5 - 生成流程改进建议
   * 需求: 9.6 - 修复已识别的流程问题
   * 任务: 12.3 实现流程修复逻辑
   * 
   * @param analysis - 退稿分析结果
   * @returns 流程修复结果
   */
  async fixProcess(analysis: RejectionAnalysis): Promise<ProcessFixResult> {
    console.log(`[Rejection Mechanism] 开始修复流程问题`);

    const actionsExecuted: Action[] = [];
    const newAgentsAdded: string[] = [];
    const errors: string[] = [];

    // 按优先级排序动作
    const sortedActions = [...analysis.suggestedActions].sort(
      (a, b) => b.priority - a.priority
    );

    // 执行修复动作
    for (const action of sortedActions) {
      try {
        console.log(`[Rejection Mechanism] 执行修复动作: ${action.type} - ${action.description}`);

        switch (action.type) {
          case 'add_agent':
            // 检测是否因人手不足导致退稿
            const personnelBottleneck = analysis.bottlenecks.find(
              (b) => b.type === 'insufficient_personnel'
            );

            if (personnelBottleneck) {
              // 通知Decision AI增加角色
              const roleType = action.newRoleType || personnelBottleneck.suggestedRoleType || 'writer';
              const dynamicRoleResult = await this.decisionAI.decideDynamicRoleAddition({
                situation: `退稿机制触发: ${analysis.reasons.map((r) => r.description).join('; ')}`,
                bottleneck: personnelBottleneck.description,
                currentTeamSize: this.agentManager.getActiveAgents().length,
                revisionCounts: this.getRevisionCountsMap(),
              });

              if (dynamicRoleResult.shouldAdd && dynamicRoleResult.roleName) {
                newAgentsAdded.push(dynamicRoleResult.roleName);
                actionsExecuted.push(action);
                console.log(`[Rejection Mechanism] 成功增加角色: ${dynamicRoleResult.roleName}`);
              } else {
                errors.push(`增加角色失败: ${dynamicRoleResult.reason || '未知原因'}`);
              }
            }
            break;

          case 'reassign_task':
            // 重新分配任务（简化实现）
            if (action.targetAgent) {
              const agent = this.agentManager.getAgent(action.targetAgent);
              if (agent && agent.state.currentTask) {
                // 清除当前任务，让Decision AI重新分配
                agent.state.currentTask = undefined;
                agent.state.revisionCount = 0;
                this.agentManager.updateAgent(action.targetAgent, { state: agent.state });
                actionsExecuted.push(action);
                console.log(`[Rejection Mechanism] 成功重新分配任务: ${action.targetAgent}`);
              }
            }
            break;

          case 'modify_prompt':
            // 修改提示词（记录建议，需要人工干预）
            console.log(`[Rejection Mechanism] 提示词修改建议: ${action.description}`);
            actionsExecuted.push(action);
            break;

          case 'adjust_workflow':
            // 调整工作流程（记录建议，需要人工干预）
            console.log(`[Rejection Mechanism] 工作流程调整建议: ${action.description}`);
            actionsExecuted.push(action);
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`执行动作 ${action.type} 失败: ${errorMessage}`);
        console.error(`[Rejection Mechanism] 执行动作失败:`, error);
      }
    }

    const success = actionsExecuted.length > 0 && errors.length === 0;
    const message = success
      ? `成功执行 ${actionsExecuted.length} 个修复动作`
      : `执行了 ${actionsExecuted.length} 个动作，但有 ${errors.length} 个错误`;

    console.log(`[Rejection Mechanism] 流程修复完成: ${message}`);

    return {
      success,
      actionsExecuted,
      newAgentsAdded,
      errors,
      message,
    };
  }

  /**
   * 重新启动写作流程
   * 
   * 需求: 9.7 - 完成修复后重新启动写作流程，保留历史记录和修订信息
   * 任务: 12.4 实现流程重启
   * 
   * @param preserveHistory - 是否保留历史记录
   * @param preserveRevisions - 是否保留修订信息
   * @returns 流程重启结果
   */
  async restartProcess(
    preserveHistory: boolean = true,
    preserveRevisions: boolean = true
  ): Promise<ProcessRestartResult> {
    console.log(`[Rejection Mechanism] 开始重启写作流程`, {
      preserveHistory,
      preserveRevisions,
    });

    try {
      // 生成新的流程ID
      const newProcessId = this.generateProcessId();

      // 重置所有Agent的状态（但保留历史记录）
      const activeAgents = this.agentManager.getActiveAgents();
      
      for (const agent of activeAgents) {
        // 保存当前状态到历史记录
        if (preserveHistory && agent.state.currentTask) {
          agent.workHistory.push({
            taskId: agent.state.currentTask.id,
            startTime: agent.state.lastActivity,
            endTime: new Date(),
            output: '',
            status: 'rejected',
            feedbackReceived: [],
          });
        }

        // 重置状态
        agent.state.status = 'idle';
        agent.state.currentTask = undefined;
        
        // 如果不保留修订信息，重置返工次数
        if (!preserveRevisions) {
          agent.state.revisionCount = 0;
        }
        
        agent.state.lastActivity = new Date();

        this.agentManager.updateAgent(agent.id, agent);
      }

      // 清除Supervisor AI的返工记录（如果不保留修订信息）
      if (!preserveRevisions) {
        this.supervisorAI.clearReworkRecords();
      }

      console.log(`[Rejection Mechanism] 流程重启成功，新流程ID: ${newProcessId}`);

      return {
        success: true,
        preservedHistory: preserveHistory,
        preservedRevisions: preserveRevisions,
        newProcessId,
        message: `流程已重启，新流程ID: ${newProcessId}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Rejection Mechanism] 流程重启失败:`, error);

      return {
        success: false,
        preservedHistory: false,
        preservedRevisions: false,
        newProcessId: '',
        message: `流程重启失败: ${errorMessage}`,
      };
    }
  }

  /**
   * 获取退稿历史记录
   * 
   * @returns 退稿分析历史记录
   */
  getRejectionHistory(): RejectionAnalysis[] {
    return [...this.rejectionHistory];
  }

  /**
   * 清除退稿历史记录
   */
  clearRejectionHistory(): void {
    this.rejectionHistory = [];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * 分析退稿原因
   */
  private async analyzeRejectionReasons(
    rejectionMessages: AgentMessage[],
    reworkRecords: any[]
  ): Promise<RejectionReason[]> {
    const reasons: RejectionReason[] = [];

    // 分析格式问题
    const formatIssues = reworkRecords.filter((r) =>
      r.reasons.some((reason: string) => 
        reason.includes('格式') || reason.includes('Output_Format')
      )
    );

    if (formatIssues.length > 0) {
      reasons.push({
        category: 'format',
        description: `${formatIssues.length}个AI存在格式问题，多次返工仍未解决`,
        affectedSections: formatIssues.map((r: any) => r.agentId),
        severity: formatIssues.length > 2 ? 'critical' : 'major',
      });
    }

    // 分析质量问题
    const qualityIssues = reworkRecords.filter((r) =>
      r.reasons.some((reason: string) => 
        reason.includes('质量') || reason.includes('内容')
      )
    );

    if (qualityIssues.length > 0) {
      reasons.push({
        category: 'quality',
        description: `${qualityIssues.length}个AI的输出质量不达标`,
        affectedSections: qualityIssues.map((r: any) => r.agentId),
        severity: qualityIssues.length > 2 ? 'critical' : 'major',
      });
    }

    // 分析完整性问题
    const completenessIssues = reworkRecords.filter((r) =>
      r.reasons.some((reason: string) => 
        reason.includes('完整') || reason.includes('缺少')
      )
    );

    if (completenessIssues.length > 0) {
      reasons.push({
        category: 'completeness',
        description: `${completenessIssues.length}个AI的输出不完整`,
        affectedSections: completenessIssues.map((r: any) => r.agentId),
        severity: 'major',
      });
    }

    // 分析连贯性问题
    const coherenceIssues = rejectionMessages.filter((msg) =>
      msg.content.includes('连贯') || msg.content.includes('逻辑')
    );

    if (coherenceIssues.length > 0) {
      reasons.push({
        category: 'coherence',
        description: `论文整体连贯性存在问题，需要加强AI之间的协作`,
        affectedSections: ['整体结构'],
        severity: 'major',
      });
    }

    // 如果没有识别到具体原因，添加通用原因
    if (reasons.length === 0) {
      reasons.push({
        category: 'quality',
        description: '多次退稿，但未能识别具体原因，建议人工审查',
        affectedSections: ['未知'],
        severity: 'critical',
      });
    }

    return reasons;
  }

  /**
   * 识别流程瓶颈
   */
  private async identifyBottlenecks(
    reworkRecords: any[],
    qualityReport: any,
    reasons: RejectionReason[]
  ): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];

    // 检测人手不足
    const highReworkAgents = reworkRecords.filter((r) => r.count > 2);
    
    if (highReworkAgents.length > 0 || qualityReport.shortageDetection?.hasShortage) {
      bottlenecks.push({
        type: 'insufficient_personnel',
        description: `${highReworkAgents.length}个AI工作负载过重，需要增加人手`,
        affectedAgents: highReworkAgents.map((r: any) => r.agentId),
        suggestedRoleType: qualityReport.shortageDetection?.suggestedRoleType || 'writer',
      });
    }

    // 检测技能差距
    const formatReasons = reasons.filter((r) => r.category === 'format');
    const firstFormatReason = formatReasons[0];
    if (formatReasons.length > 0 && firstFormatReason && firstFormatReason.severity === 'critical') {
      bottlenecks.push({
        type: 'skill_gap',
        description: '团队在格式规范方面存在技能差距，需要专门的格式专家',
        affectedAgents: firstFormatReason.affectedSections || [],
        suggestedRoleType: 'writer',
      });
    }

    // 检测沟通问题
    const coherenceReasons = reasons.filter((r) => r.category === 'coherence');
    if (coherenceReasons.length > 0) {
      bottlenecks.push({
        type: 'communication_breakdown',
        description: 'AI之间的协作和沟通不足，导致内容连贯性问题',
        affectedAgents: ['整体团队'],
      });
    }

    return bottlenecks;
  }

  /**
   * 生成修复建议
   */
  private generateSuggestedActions(
    reasons: RejectionReason[],
    bottlenecks: Bottleneck[]
  ): Action[] {
    const actions: Action[] = [];

    // 针对人手不足的建议
    const personnelBottleneck = bottlenecks.find(
      (b) => b.type === 'insufficient_personnel'
    );
    if (personnelBottleneck) {
      actions.push({
        type: 'add_agent',
        description: `增加${personnelBottleneck.suggestedRoleType}角色以分担工作负载`,
        priority: 10,
        newRoleType: personnelBottleneck.suggestedRoleType,
      });
    }

    // 针对技能差距的建议
    const skillBottleneck = bottlenecks.find((b) => b.type === 'skill_gap');
    if (skillBottleneck) {
      actions.push({
        type: 'add_agent',
        description: '增加专门的格式审查专家',
        priority: 9,
        newRoleType: 'writer',
      });

      actions.push({
        type: 'modify_prompt',
        description: '优化提示词模板，加强格式规范说明',
        priority: 7,
      });
    }

    // 针对沟通问题的建议
    const commBottleneck = bottlenecks.find(
      (b) => b.type === 'communication_breakdown'
    );
    if (commBottleneck) {
      actions.push({
        type: 'adjust_workflow',
        description: '增加AI之间的交互频率，要求定期同步进度',
        priority: 8,
      });
    }

    // 针对高返工率Agent的建议
    for (const bottleneck of bottlenecks) {
      if (bottleneck.affectedAgents.length > 0) {
        for (const agentId of bottleneck.affectedAgents) {
          if (agentId !== '整体团队' && agentId !== '整体结构' && agentId !== '未知') {
            actions.push({
              type: 'reassign_task',
              description: `重新分配${agentId}的任务，降低工作负载`,
              priority: 6,
              targetAgent: agentId,
            });
          }
        }
      }
    }

    // 如果没有生成任何建议，添加默认建议
    if (actions.length === 0) {
      actions.push({
        type: 'adjust_workflow',
        description: '建议人工审查流程，识别具体问题',
        priority: 5,
      });
    }

    return actions;
  }

  /**
   * 获取返工次数映射
   */
  private getRevisionCountsMap(): Record<string, number> {
    const map: Record<string, number> = {};
    const reworkRecords = this.supervisorAI.getReworkRecords();
    
    for (const record of reworkRecords) {
      map[record.agentId] = record.count;
    }
    
    return map;
  }

  /**
   * 生成流程ID
   */
  private generateProcessId(): string {
    return `process_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建Rejection Mechanism实例
 */
export function createRejectionMechanism(
  aiClient: AIClient,
  supervisorAI: SupervisorAI,
  decisionAI: DecisionAI,
  agentManager: AgentManager
): RejectionMechanism {
  return new RejectionMechanism(aiClient, supervisorAI, decisionAI, agentManager);
}
