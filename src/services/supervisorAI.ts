/**
 * Supervisor AI服务实现
 * Supervisor AI Service Implementation
 * 
 * 负责检查AI输出格式规范性、要求不合规内容返工、检测人手不足情况
 * 
 * 需求: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7
 * 任务: 11.2 实现输出格式验证
 * 任务: 11.6 实现返工机制
 * 任务: 11.9 实现人手不足检测
 * 任务: 11.10 生成质量检查报告
 */

import type { AIClient } from '../types/ai-client';
import type { AgentMessage } from '../types/message';
import type { Agent } from '../types/agent';
import { formatParser, type ValidationResult } from './formatParser';
import { loadPrompt } from './promptLoader';
import type { AgentManager } from './agentManager';
import type { DecisionAI } from './decisionAI';

// ============================================================================
// Types
// ============================================================================

/**
 * 格式验证结果
 */
export interface FormatValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  shouldRework: boolean;
}

/**
 * 返工记录
 */
export interface ReworkRecord {
  agentId: string;
  count: number;
  reasons: string[];
  lastReworkTime: Date;
}

/**
 * 人手不足检测结果
 */
export interface ShortageDetectionResult {
  hasShortage: boolean;
  reason: string;
  affectedAgents: string[];
  suggestedRoleType?: string;
  suggestedRoleName?: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * 质量检查报告
 */
export interface QualityReport {
  timestamp: Date;
  activeAgentsCount: number;
  totalMessages: number;
  totalRevisions: number;
  reworkRecords: ReworkRecord[];
  overallStatus: 'good' | 'warning' | 'critical';
  bottlenecks: string[];
  recommendations: string[];
  shortageDetection?: ShortageDetectionResult;
}

// ============================================================================
// Supervisor AI Service
// ============================================================================

/**
 * Supervisor AI服务类
 * 
 * 提供输出格式验证、返工机制、人手不足检测和质量检查报告功能
 */
export class SupervisorAI {
  private aiClient: AIClient;
  private agentManager: AgentManager;
  private decisionAI: DecisionAI;
  
  /** 返工记录映射 (agentId -> ReworkRecord) */
  private reworkRecords: Map<string, ReworkRecord> = new Map();
  
  /** 返工次数阈值 */
  private readonly REWORK_THRESHOLD = 2;
  
  /** 退稿机制触发阈值 */
  private readonly REJECTION_THRESHOLD = 3;

  constructor(
    aiClient: AIClient,
    agentManager: AgentManager,
    decisionAI: DecisionAI
  ) {
    this.aiClient = aiClient;
    this.agentManager = agentManager;
    this.decisionAI = decisionAI;
  }

  /**
   * 验证AI输出格式
   * 
   * 需求: 6.1 - 验证AI输出是否符合Output_Format
   * 任务: 11.2 实现输出格式验证
   * 
   * @param output - AI输出的字符串
   * @param senderId - 发送者AI的ID
   * @returns 格式验证结果
   */
  async validateOutputFormat(
    output: string,
    senderId: string
  ): Promise<FormatValidationResult> {
    console.log(`[Supervisor AI] 验证AI输出格式: ${senderId}`);

    // 使用FormatParser验证格式
    const validation: ValidationResult = formatParser.validate(output);

    const result: FormatValidationResult = {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      shouldRework: !validation.isValid,
    };

    if (!result.isValid) {
      console.warn(`[Supervisor AI] 格式验证失败: ${senderId}`, {
        errors: result.errors,
      });
    } else {
      console.log(`[Supervisor AI] 格式验证通过: ${senderId}`);
    }

    return result;
  }

  /**
   * 要求AI返工
   * 
   * 需求: 6.2 - 对不符合Output_Format的输出要求AI返工
   * 需求: 6.3 - 记录每个AI的返工次数
   * 任务: 11.6 实现返工机制
   * 
   * @param agentId - 需要返工的AI ID
   * @param reason - 返工原因
   * @returns 返工通知消息
   */
  async requestRework(agentId: string, reason: string): Promise<AgentMessage> {
    console.log(`[Supervisor AI] 要求返工: ${agentId}, 原因: ${reason}`);

    // 更新返工记录
    const record = this.reworkRecords.get(agentId) || {
      agentId,
      count: 0,
      reasons: [],
      lastReworkTime: new Date(),
    };

    record.count += 1;
    record.reasons.push(reason);
    record.lastReworkTime = new Date();
    this.reworkRecords.set(agentId, record);

    // 更新Agent的返工次数
    const agent = this.agentManager.getAgent(agentId);
    if (agent) {
      agent.state.revisionCount = record.count;
      this.agentManager.updateAgent(agentId, { state: agent.state });
    }

    console.log(`[Supervisor AI] ${agentId} 返工次数: ${record.count}`);

    // 检查是否需要触发人手不足检测
    if (record.count > this.REWORK_THRESHOLD) {
      console.warn(
        `[Supervisor AI] ${agentId} 返工次数超过阈值 (${this.REWORK_THRESHOLD})，触发人手不足检测`
      );
      await this.detectShortageAndNotify();
    }

    // 生成返工通知消息
    const reworkMessage = await this.generateReworkNotification(
      agentId,
      record.count,
      reason
    );

    return reworkMessage;
  }

  /**
   * 检测人手不足情况
   * 
   * 需求: 6.6 - 检测到人手不足时通知Decision AI执行Dynamic_Role_Addition
   * 需求: 6.7 - 分析人手不足的具体原因并建议需要增加的角色类型
   * 任务: 11.9 实现人手不足检测
   * 
   * @returns 人手不足检测结果
   */
  async detectShortage(): Promise<ShortageDetectionResult> {
    console.log(`[Supervisor AI] 开始检测人手不足情况`);

    const activeAgents = this.agentManager.getActiveAgents();
    const affectedAgents: string[] = [];
    const reasons: string[] = [];

    // 检测单个AI返工次数超过阈值
    for (const [agentId, record] of this.reworkRecords.entries()) {
      if (record.count > this.REWORK_THRESHOLD) {
        affectedAgents.push(agentId);
        reasons.push(
          `${agentId} 返工次数过多 (${record.count}次)，可能工作量过大或技能不匹配`
        );
      }
    }

    // 检测整体进度延迟（简化实现：检查平均返工次数）
    const totalReworks = Array.from(this.reworkRecords.values()).reduce(
      (sum, record) => sum + record.count,
      0
    );
    const avgReworks = activeAgents.length > 0 ? totalReworks / activeAgents.length : 0;

    if (avgReworks > 1.5) {
      reasons.push(
        `整体返工率过高 (平均${avgReworks.toFixed(1)}次/人)，团队可能人手不足`
      );
    }

    const hasShortage = affectedAgents.length > 0 || avgReworks > 1.5;

    if (!hasShortage) {
      console.log(`[Supervisor AI] 未检测到人手不足`);
      return {
        hasShortage: false,
        reason: '当前团队配置充足',
        affectedAgents: [],
        priority: 'low',
      };
    }

    // 分析人手不足原因并建议角色类型
    const analysis = await this.analyzeShortageReason(affectedAgents, reasons);

    console.log(`[Supervisor AI] 检测到人手不足:`, {
      affectedAgents,
      suggestedRole: analysis.suggestedRoleType,
    });

    return {
      hasShortage: true,
      reason: reasons.join('; '),
      affectedAgents,
      suggestedRoleType: analysis.suggestedRoleType,
      suggestedRoleName: analysis.suggestedRoleName,
      priority: 'high',
    };
  }

  /**
   * 检测人手不足并通知Decision AI
   * 
   * 需求: 6.6 - 通知Decision AI执行Dynamic_Role_Addition
   * 
   * @returns 是否成功通知Decision AI
   */
  async detectShortageAndNotify(): Promise<boolean> {
    const shortageResult = await this.detectShortage();

    if (!shortageResult.hasShortage) {
      return false;
    }

    // 通知Decision AI执行动态角色增加
    console.log(
      `[Supervisor AI] 通知Decision AI增加角色: ${shortageResult.suggestedRoleType}`
    );

    try {
      const dynamicRoleResult = await this.decisionAI.decideDynamicRoleAddition({
        situation: `检测到人手不足: ${shortageResult.reason}`,
        bottleneck: `受影响的AI: ${shortageResult.affectedAgents.join(', ')}`,
        currentTeamSize: this.agentManager.getActiveAgents().length,
        revisionCounts: this.getRevisionCountsMap(),
      });

      if (dynamicRoleResult.shouldAdd) {
        console.log(
          `[Supervisor AI] Decision AI决定增加角色: ${dynamicRoleResult.roleName}`
        );
        return true;
      } else {
        console.log(
          `[Supervisor AI] Decision AI决定不增加角色: ${dynamicRoleResult.reason}`
        );
        return false;
      }
    } catch (error) {
      console.error(`[Supervisor AI] 通知Decision AI失败:`, error);
      return false;
    }
  }

  /**
   * 生成质量检查报告
   * 
   * 需求: 6.5 - 生成质量检查报告
   * 任务: 11.10 生成质量检查报告
   * 
   * @returns 质量检查报告
   */
  async generateQualityReport(): Promise<QualityReport> {
    console.log(`[Supervisor AI] 生成质量检查报告`);

    const activeAgents = this.agentManager.getActiveAgents();
    const reworkRecords = Array.from(this.reworkRecords.values());
    const totalRevisions = reworkRecords.reduce(
      (sum, record) => sum + record.count,
      0
    );

    // 检测人手不足
    const shortageDetection = await this.detectShortage();

    // 评估整体状态
    let overallStatus: 'good' | 'warning' | 'critical' = 'good';
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // 检查返工次数
    const highReworkAgents = reworkRecords.filter(
      (r) => r.count > this.REWORK_THRESHOLD
    );
    if (highReworkAgents.length > 0) {
      overallStatus = 'warning';
      bottlenecks.push(
        `${highReworkAgents.length}个AI返工次数过多: ${highReworkAgents
          .map((r) => r.agentId)
          .join(', ')}`
      );
      recommendations.push('考虑为高返工率的AI提供额外支持或增加协助角色');
    }

    // 检查退稿风险
    const rejectionRiskAgents = reworkRecords.filter(
      (r) => r.count >= this.REJECTION_THRESHOLD
    );
    if (rejectionRiskAgents.length > 0) {
      overallStatus = 'critical';
      bottlenecks.push(
        `${rejectionRiskAgents.length}个AI接近退稿阈值: ${rejectionRiskAgents
          .map((r) => r.agentId)
          .join(', ')}`
      );
      recommendations.push('紧急干预：重新分配任务或增加专门角色');
    }

    // 检查人手不足
    if (shortageDetection.hasShortage) {
      if (overallStatus === 'good') {
        overallStatus = 'warning';
      }
      bottlenecks.push(`人手不足: ${shortageDetection.reason}`);
      recommendations.push(
        `建议增加${shortageDetection.suggestedRoleType}角色: ${shortageDetection.suggestedRoleName}`
      );
    }

    // 如果一切正常
    if (overallStatus === 'good') {
      recommendations.push('团队运作良好，继续保持当前节奏');
    }

    const report: QualityReport = {
      timestamp: new Date(),
      activeAgentsCount: activeAgents.length,
      totalMessages: 0, // 需要从消息存储中获取
      totalRevisions,
      reworkRecords,
      overallStatus,
      bottlenecks,
      recommendations,
      shortageDetection: shortageDetection.hasShortage
        ? shortageDetection
        : undefined,
    };

    console.log(`[Supervisor AI] 质量检查报告生成完成:`, {
      status: report.overallStatus,
      bottlenecks: report.bottlenecks.length,
      recommendations: report.recommendations.length,
    });

    return report;
  }

  /**
   * 获取返工记录
   * 
   * @param agentId - Agent ID（可选，不提供则返回所有记录）
   * @returns 返工记录
   */
  getReworkRecords(agentId?: string): ReworkRecord[] {
    if (agentId) {
      const record = this.reworkRecords.get(agentId);
      return record ? [record] : [];
    }
    return Array.from(this.reworkRecords.values());
  }

  /**
   * 清除返工记录
   * 
   * @param agentId - Agent ID（可选，不提供则清除所有记录）
   */
  clearReworkRecords(agentId?: string): void {
    if (agentId) {
      this.reworkRecords.delete(agentId);
    } else {
      this.reworkRecords.clear();
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * 生成返工通知消息
   */
  private async generateReworkNotification(
    agentId: string,
    revisionCount: number,
    reason: string
  ): Promise<AgentMessage> {
    try {
      // 加载返工通知提示词模板
      const prompt = await loadPrompt('supervisor', {
        agent_id: agentId,
        revision_count: revisionCount.toString(),
        recent_issues: reason,
      });

      // 构建AI请求
      const aiRequest = {
        prompt: prompt.resolvedTemplates.rework_notification_template || '',
        systemPrompt: prompt.resolvedSystemPrompt,
        temperature: 0.7,
        maxTokens: 500,
        stream: false,
      };

      // 调用AI生成返工通知
      const response = await this.aiClient.sendRequest(aiRequest);

      if ('content' in response) {
        // 尝试解析AI输出
        const parseResult = formatParser.parse(response.content);

        if ('error' in parseResult) {
          // 如果AI输出格式不正确，使用默认消息
          return this.createDefaultReworkMessage(agentId, revisionCount, reason);
        }

        // 返回解析后的消息
        return {
          id: this.generateMessageId(),
          type: parseResult.type,
          sender: parseResult.sender,
          receiver: parseResult.receiver,
          content: parseResult.content,
          metadata: parseResult.metadata,
          timestamp: new Date(parseResult.metadata.timestamp),
        };
      }
    } catch (error) {
      console.warn(
        `[Supervisor AI] 生成返工通知失败，使用默认消息:`,
        error
      );
    }

    // 如果AI调用失败，使用默认消息
    return this.createDefaultReworkMessage(agentId, revisionCount, reason);
  }

  /**
   * 创建默认返工消息
   */
  private createDefaultReworkMessage(
    agentId: string,
    revisionCount: number,
    reason: string
  ): AgentMessage {
    let content = `需要返工（第${revisionCount}次）\n\n问题：\n${reason}\n\n`;

    if (revisionCount > this.REWORK_THRESHOLD) {
      content += `\n注意：您的返工次数已超过${this.REWORK_THRESHOLD}次，建议寻求额外支持或请求协助。`;
    }

    content += '\n\n改进建议：\n';
    content += '1. 仔细检查Output_Format规范，确保所有必需字段都存在\n';
    content += '2. 验证字段类型和格式是否正确\n';
    content += '3. 确保JSON格式有效，没有语法错误\n';
    content += '4. 如需帮助，可以向其他团队成员请求反馈';

    return {
      id: this.generateMessageId(),
      type: 'revision_request',
      sender: 'supervisor_ai',
      receiver: agentId,
      content,
      metadata: {
        timestamp: new Date().toISOString(),
        requiresResponse: true,
        priority: 'high',
      },
      timestamp: new Date(),
    };
  }

  /**
   * 分析人手不足原因
   */
  private async analyzeShortageReason(
    affectedAgents: string[],
    reasons: string[]
  ): Promise<{
    suggestedRoleType: string;
    suggestedRoleName: string;
  }> {
    // 简化实现：基于返工原因分析建议的角色类型
    const reasonText = reasons.join(' ');

    // 检查是否是格式问题
    if (reasonText.includes('格式') || reasonText.includes('Output_Format')) {
      return {
        suggestedRoleType: 'writer',
        suggestedRoleName: '格式专家',
      };
    }

    // 检查是否是质量问题
    if (reasonText.includes('质量') || reasonText.includes('内容')) {
      return {
        suggestedRoleType: 'writer',
        suggestedRoleName: '质量审查专家',
      };
    }

    // 检查是否是工作量问题
    if (reasonText.includes('工作量') || reasonText.includes('返工次数')) {
      return {
        suggestedRoleType: 'writer',
        suggestedRoleName: '辅助写作AI',
      };
    }

    // 默认建议
    return {
      suggestedRoleType: 'writer',
      suggestedRoleName: '协助专家',
    };
  }

  /**
   * 获取返工次数映射
   */
  private getRevisionCountsMap(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const [agentId, record] of this.reworkRecords.entries()) {
      map[agentId] = record.count;
    }
    return map;
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * 创建Supervisor AI实例
 */
export function createSupervisorAI(
  aiClient: AIClient,
  agentManager: AgentManager,
  decisionAI: DecisionAI
): SupervisorAI {
  return new SupervisorAI(aiClient, agentManager, decisionAI);
}
