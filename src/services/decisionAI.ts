/**
 * Decision AI服务实现
 * Decision AI Service Implementation
 * 
 * 负责分析论文题目、评估工作量、组建写作团队和动态增加角色
 * 
 * 需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 任务: 10.2 实现题目分析和工作量评估
 * 任务: 10.3 实现团队组建和任务分配
 * 任务: 10.6 实现动态角色增加决策
 */

import type { AgentRole } from '../types/agent';
import type { AIClient } from '../types/ai-client';
import type { AgentMessage } from '../types/message';
import { loadPrompt } from './promptLoader';
import { formatParser } from './formatParser';
import type { AgentManager } from './agentManager';

// ============================================================================
// Types
// ============================================================================

/**
 * 工作量等级
 */
export type WorkloadLevel = 'simple' | 'medium' | 'complex';

/**
 * 工作量评估结果
 */
export interface WorkloadAssessment {
  level: WorkloadLevel;
  suggestedTeamSize: number;
  estimatedDays: number;
  keyChallen: string[];
  complexity: {
    researchField: WorkloadLevel;
    literatureReview: WorkloadLevel;
    methodology: WorkloadLevel;
    dataAnalysis: WorkloadLevel;
  };
}

/**
 * 任务分配结果
 */
export interface TaskAllocation {
  teamMembers: TeamMember[];
  totalEstimatedDays: number;
  allocationMessage: AgentMessage;
}

/**
 * 团队成员信息
 */
export interface TeamMember {
  id: string;
  role: AgentRole;
  name: string;
  tasks: string[];
  estimatedDays: number;
}

/**
 * 动态角色增加请求
 */
export interface DynamicRoleRequest {
  situation: string;
  bottleneck: string;
  currentTeamSize: number;
  revisionCounts: Record<string, number>;
}

/**
 * 动态角色增加结果
 */
export interface DynamicRoleResult {
  shouldAdd: boolean;
  roleType?: AgentRole;
  roleName?: string;
  tasks?: string[];
  estimatedDays?: number;
  reason?: string;
  assignmentMessage?: AgentMessage;
}

// ============================================================================
// Decision AI Service
// ============================================================================

/**
 * Decision AI服务类
 * 
 * 提供题目分析、工作量评估、团队组建和动态角色增加功能
 */
export class DecisionAI {
  private aiClient: AIClient;
  private agentManager: AgentManager;

  constructor(aiClient: AIClient, agentManager: AgentManager) {
    this.aiClient = aiClient;
    this.agentManager = agentManager;
  }

  /**
   * 分析论文题目并评估工作量
   * 
   * 需求: 5.1 - 分析题目的复杂度和工作量
   * 需求: 5.5 - 估算完成时间并通知用户
   * 
   * @param topic - 论文题目
   * @returns 工作量评估结果
   */
  async analyzeTopicAndAssessWorkload(topic: string): Promise<WorkloadAssessment> {
    console.log(`[Decision AI] 开始分析论文题目: "${topic}"`);

    // 加载工作量分析提示词模板
    const prompt = await loadPrompt('decision', { topic });

    // 构建AI请求
    const aiRequest = {
      prompt: prompt.resolvedTemplates.workload_analysis_template || '',
      systemPrompt: prompt.resolvedSystemPrompt,
      temperature: 0.7,
      maxTokens: 1000,
      stream: false,
    };

    // 调用AI进行分析
    const response = await this.aiClient.sendRequest(aiRequest);

    if ('content' in response) {
      // 解析AI响应
      const assessment = this.parseWorkloadAssessment(response.content, topic);
      
      console.log(`[Decision AI] 工作量评估完成:`, {
        level: assessment.level,
        teamSize: assessment.suggestedTeamSize,
        estimatedDays: assessment.estimatedDays,
      });

      return assessment;
    }

    throw new Error('AI响应格式错误：期望非流式响应');
  }

  /**
   * 组建写作团队并分配任务
   * 
   * 需求: 5.2 - 根据工作量动态确定Writing Team的AI数量和角色
   * 需求: 5.3 - 为每个Writing Team成员分配具体的写作任务
   * 需求: 5.4 - 生成符合Output_Format的任务分配指令
   * 
   * @param topic - 论文题目
   * @param assessment - 工作量评估结果
   * @returns 任务分配结果
   */
  async buildTeamAndAllocateTasks(
    topic: string,
    assessment: WorkloadAssessment
  ): Promise<TaskAllocation> {
    console.log(`[Decision AI] 开始组建写作团队，规模: ${assessment.suggestedTeamSize}`);

    // 加载任务分配提示词模板
    const prompt = await loadPrompt('decision', { topic });

    // 构建AI请求
    const aiRequest = {
      prompt: prompt.resolvedTemplates.task_allocation_template || '',
      systemPrompt: prompt.resolvedSystemPrompt,
      temperature: 0.7,
      maxTokens: 2000,
      stream: false,
    };

    // 调用AI进行任务分配
    const response = await this.aiClient.sendRequest(aiRequest);

    if ('content' in response) {
      // 解析任务分配结果
      const allocation = this.parseTaskAllocation(
        response.content,
        assessment.suggestedTeamSize
      );

      // 创建Writing Team成员
      for (const member of allocation.teamMembers) {
        await this.agentManager.createAgent({
          id: member.id,
          name: member.name,
          role: member.role,
          promptTemplate: `prompts/${member.role}.yaml`,
          aiService: 'default', // 使用默认AI服务
          capabilities: {
            canInternetAccess: true,
            canStreamOutput: true,
            canInteractWithPeers: true,
          },
        });

        console.log(`[Decision AI] 创建团队成员: ${member.name} (${member.id})`);
      }

      console.log(`[Decision AI] 团队组建完成，总预计时间: ${allocation.totalEstimatedDays}天`);

      return allocation;
    }

    throw new Error('AI响应格式错误：期望非流式响应');
  }

  /**
   * 决策是否需要动态增加角色
   * 
   * 需求: 5.6 - 执行Dynamic_Role_Addition增加新的AI角色
   * 需求: 5.7 - 为动态增加的AI角色分配针对性任务
   * 需求: 6.6 - Supervisor AI通知Decision AI执行Dynamic_Role_Addition
   * 需求: 9.4 - 退稿原因为人手不足时通知Decision AI执行Dynamic_Role_Addition
   * 
   * @param request - 动态角色增加请求
   * @returns 动态角色增加结果
   */
  async decideDynamicRoleAddition(request: DynamicRoleRequest): Promise<DynamicRoleResult> {
    console.log(`[Decision AI] 收到动态角色增加请求:`, {
      situation: request.situation,
      bottleneck: request.bottleneck,
      currentTeamSize: request.currentTeamSize,
    });

    // 加载动态增加提示词模板
    const prompt = await loadPrompt('decision', {
      situation: request.situation,
      bottleneck: request.bottleneck,
    });

    // 构建AI请求
    const aiRequest = {
      prompt: prompt.resolvedTemplates.dynamic_addition_template || '',
      systemPrompt: prompt.resolvedSystemPrompt,
      temperature: 0.7,
      maxTokens: 1500,
      stream: false,
    };

    // 调用AI进行决策
    const response = await this.aiClient.sendRequest(aiRequest);

    if ('content' in response) {
      // 解析决策结果
      const result = this.parseDynamicRoleDecision(response.content, request);

      if (result.shouldAdd && result.roleType && result.roleName && result.tasks) {
        // 创建新的AI角色
        const newAgent = await this.agentManager.addDynamicAgent(
          result.roleType,
          result.tasks.join('\n')
        );

        console.log(`[Decision AI] 动态增加角色: ${result.roleName} (${newAgent.id})`);

        // 生成任务分配消息
        result.assignmentMessage = this.createTaskAssignmentMessage(
          newAgent.id,
          result.roleName,
          result.tasks,
          result.estimatedDays || 1
        );
      } else {
        console.log(`[Decision AI] 决定不增加新角色: ${result.reason}`);
      }

      return result;
    }

    throw new Error('AI响应格式错误：期望非流式响应');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * 解析工作量评估结果
   */
  private parseWorkloadAssessment(aiResponse: string, topic: string): WorkloadAssessment {
    try {
      // 尝试从AI响应中提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        
        return {
          level: data.workload_level || 'medium',
          suggestedTeamSize: data.suggested_team_size || 2,
          estimatedDays: data.estimated_days || 5,
          keyChallen: data.key_challenges || [],
          complexity: {
            researchField: data.complexity?.research_field || 'medium',
            literatureReview: data.complexity?.literature_review || 'medium',
            methodology: data.complexity?.methodology || 'medium',
            dataAnalysis: data.complexity?.data_analysis || 'medium',
          },
        };
      }
    } catch (error) {
      console.warn('[Decision AI] 解析工作量评估失败，使用默认值:', error);
    }

    // 如果解析失败，使用基于题目长度的启发式评估
    return this.heuristicWorkloadAssessment(topic);
  }

  /**
   * 启发式工作量评估（当AI解析失败时使用）
   */
  private heuristicWorkloadAssessment(topic: string): WorkloadAssessment {
    const topicLength = topic.length;
    const wordCount = topic.split(/\s+/).length;

    let level: WorkloadLevel = 'medium';
    let teamSize = 2;
    let estimatedDays = 5;

    if (wordCount <= 5 || topicLength <= 30) {
      level = 'simple';
      teamSize = 1;
      estimatedDays = 3;
    } else if (wordCount >= 15 || topicLength >= 100) {
      level = 'complex';
      teamSize = 4;
      estimatedDays = 10;
    }

    return {
      level,
      suggestedTeamSize: teamSize,
      estimatedDays,
      keyChallen: ['需要详细分析题目以确定具体挑战'],
      complexity: {
        researchField: level,
        literatureReview: level,
        methodology: level,
        dataAnalysis: level,
      },
    };
  }

  /**
   * 解析任务分配结果
   */
  private parseTaskAllocation(
    aiResponse: string,
    teamSize: number
  ): TaskAllocation {
    try {
      // 尝试解析AI输出的OutputFormat消息
      const parseResult = formatParser.parse(aiResponse);

      if ('error' in parseResult) {
        console.warn('[Decision AI] AI输出格式不符合OutputFormat，尝试提取信息');
        return this.extractTaskAllocationFromText(aiResponse, teamSize);
      }

      // 从ParsedMessage中提取任务分配信息
      const teamMembers = this.extractTeamMembersFromMessage(
        parseResult.content,
        teamSize
      );

      const allocationMessage: AgentMessage = {
        id: this.generateMessageId(),
        type: parseResult.type,
        sender: parseResult.sender,
        receiver: parseResult.receiver,
        content: parseResult.content,
        metadata: parseResult.metadata,
        timestamp: new Date(parseResult.metadata.timestamp),
      };

      return {
        teamMembers,
        totalEstimatedDays: teamMembers.reduce((sum, m) => sum + m.estimatedDays, 0),
        allocationMessage,
      };
    } catch (error) {
      console.warn('[Decision AI] 解析任务分配失败，使用默认分配:', error);
      return this.createDefaultTaskAllocation(teamSize);
    }
  }

  /**
   * 从文本中提取任务分配信息（当格式解析失败时使用）
   */
  private extractTaskAllocationFromText(
    text: string,
    teamSize: number
  ): TaskAllocation {
    const teamMembers: TeamMember[] = [];

    // 尝试识别Writer 1, Writer 2等模式
    const writerPattern = /Writer\s+(\d+)[^\n]*\n([^\n]+(?:\n-[^\n]+)*)/gi;
    let match;
    let writerIndex = 1;

    while ((match = writerPattern.exec(text)) !== null && writerIndex <= teamSize) {
      const tasks = match[2]
        ? match[2]
            .split('\n')
            .filter((line) => line.trim().startsWith('-'))
            .map((line) => line.trim().substring(1).trim())
        : [];

      teamMembers.push({
        id: `writer_${writerIndex}`,
        role: 'writer',
        name: `写作AI ${writerIndex}`,
        tasks: tasks.length > 0 ? tasks : ['撰写论文内容'],
        estimatedDays: 2,
      });

      writerIndex++;
    }

    // 如果没有识别到足够的成员，补充默认成员
    while (teamMembers.length < teamSize) {
      const index = teamMembers.length + 1;
      teamMembers.push({
        id: `writer_${index}`,
        role: 'writer',
        name: `写作AI ${index}`,
        tasks: ['撰写论文内容'],
        estimatedDays: 2,
      });
    }

    const allocationMessage = this.createTaskAssignmentMessage(
      teamMembers.map((m) => m.id),
      '写作团队',
      ['根据分配的任务撰写论文内容'],
      teamMembers.reduce((sum, m) => sum + m.estimatedDays, 0)
    );

    return {
      teamMembers,
      totalEstimatedDays: teamMembers.reduce((sum, m) => sum + m.estimatedDays, 0),
      allocationMessage,
    };
  }

  /**
   * 从消息内容中提取团队成员信息
   */
  private extractTeamMembersFromMessage(
    content: string,
    teamSize: number
  ): TeamMember[] {
    const teamMembers: TeamMember[] = [];

    // 尝试识别Writer 1, Writer 2等模式
    const writerPattern = /Writer\s+(\d+)[^\n]*\n([^\n]+(?:\n-[^\n]+)*)/gi;
    let match;

    while ((match = writerPattern.exec(content)) !== null) {
      const writerNum = parseInt(match[1] || '0', 10);
      const tasks = match[2]
        ? match[2]
            .split('\n')
            .filter((line) => line.trim().startsWith('-'))
            .map((line) => line.trim().substring(1).trim())
        : [];

      teamMembers.push({
        id: `writer_${writerNum}`,
        role: 'writer',
        name: `写作AI ${writerNum}`,
        tasks: tasks.length > 0 ? tasks : ['撰写论文内容'],
        estimatedDays: 2,
      });
    }

    // 如果没有识别到足够的成员，补充默认成员
    while (teamMembers.length < teamSize) {
      const index = teamMembers.length + 1;
      teamMembers.push({
        id: `writer_${index}`,
        role: 'writer',
        name: `写作AI ${index}`,
        tasks: ['撰写论文内容'],
        estimatedDays: 2,
      });
    }

    return teamMembers;
  }

  /**
   * 创建默认任务分配（当所有解析方法都失败时使用）
   */
  private createDefaultTaskAllocation(teamSize: number): TaskAllocation {
    const teamMembers: TeamMember[] = [];

    for (let i = 1; i <= teamSize; i++) {
      teamMembers.push({
        id: `writer_${i}`,
        role: 'writer',
        name: `写作AI ${i}`,
        tasks: ['撰写论文内容'],
        estimatedDays: 2,
      });
    }

    const allocationMessage = this.createTaskAssignmentMessage(
      teamMembers.map((m) => m.id),
      '写作团队',
      ['根据分配的任务撰写论文内容'],
      teamMembers.reduce((sum, m) => sum + m.estimatedDays, 0)
    );

    return {
      teamMembers,
      totalEstimatedDays: teamMembers.reduce((sum, m) => sum + m.estimatedDays, 0),
      allocationMessage,
    };
  }

  /**
   * 解析动态角色增加决策
   */
  private parseDynamicRoleDecision(
    aiResponse: string,
    request: DynamicRoleRequest
  ): DynamicRoleResult {
    try {
      // 尝试解析AI输出的OutputFormat消息
      const parseResult = formatParser.parse(aiResponse);

      if ('error' in parseResult) {
        console.warn('[Decision AI] AI输出格式不符合OutputFormat，尝试提取决策信息');
        return this.extractDynamicRoleDecisionFromText(aiResponse, request);
      }

      // 从消息内容中提取角色信息
      const content = parseResult.content;
      const roleInfo = this.extractRoleInfoFromContent(content);

      if (roleInfo) {
        return {
          shouldAdd: true,
          roleType: roleInfo.roleType,
          roleName: roleInfo.roleName,
          tasks: roleInfo.tasks,
          estimatedDays: roleInfo.estimatedDays,
          reason: '基于瓶颈分析，决定增加新角色',
        };
      }

      return {
        shouldAdd: false,
        reason: '当前团队配置足够，无需增加新角色',
      };
    } catch (error) {
      console.warn('[Decision AI] 解析动态角色决策失败:', error);
      return {
        shouldAdd: false,
        reason: '决策解析失败，保持当前团队配置',
      };
    }
  }

  /**
   * 从文本中提取动态角色决策信息
   */
  private extractDynamicRoleDecisionFromText(
    text: string,
    request: DynamicRoleRequest
  ): DynamicRoleResult {
    // 检查是否包含"不需要"、"无需"、"足够"等否定关键词
    const negativeKeywords = ['不需要', '无需', '足够', '不增加', '保持当前'];
    const hasNegative = negativeKeywords.some((keyword) => text.includes(keyword));

    // 检查是否包含"增加"、"新角色"等关键词
    const shouldAddKeywords = ['增加', '新角色', '添加', '创建'];
    const hasPositive = shouldAddKeywords.some((keyword) => text.includes(keyword));

    // 如果有明确的否定词，或者没有肯定词，则不增加
    if (hasNegative || !hasPositive) {
      return {
        shouldAdd: false,
        reason: '基于当前情况，无需增加新角色',
      };
    }

    // 尝试提取角色信息
    const roleInfo = this.extractRoleInfoFromContent(text);

    if (roleInfo) {
      return {
        shouldAdd: true,
        roleType: roleInfo.roleType,
        roleName: roleInfo.roleName,
        tasks: roleInfo.tasks,
        estimatedDays: roleInfo.estimatedDays,
        reason: '基于瓶颈分析，决定增加新角色',
      };
    }

    // 如果无法提取具体信息，使用默认配置
    return {
      shouldAdd: true,
      roleType: 'writer',
      roleName: `写作AI ${request.currentTeamSize + 1}`,
      tasks: ['协助解决当前瓶颈问题'],
      estimatedDays: 1,
      reason: '基于瓶颈分析，决定增加辅助角色',
    };
  }

  /**
   * 从内容中提取角色信息
   */
  private extractRoleInfoFromContent(content: string): {
    roleType: AgentRole;
    roleName: string;
    tasks: string[];
    estimatedDays: number;
  } | null {
    // 尝试识别角色类型
    const rolePatterns: Array<{ pattern: RegExp; role: AgentRole }> = [
      { pattern: /格式专家|格式审查/i, role: 'writer' },
      { pattern: /文献专家|文献综述/i, role: 'writer' },
      { pattern: /方法专家|方法论/i, role: 'writer' },
      { pattern: /数据分析|统计专家/i, role: 'writer' },
    ];

    let roleType: AgentRole = 'writer';
    let roleName = '专家角色';

    for (const { pattern, role } of rolePatterns) {
      if (pattern.test(content)) {
        roleType = role;
        const match = content.match(pattern);
        if (match) {
          roleName = match[0];
        }
        break;
      }
    }

    // 提取任务列表
    const tasks: string[] = [];
    const taskPattern = /(?:任务|职责)[：:]\s*\n([^\n]+(?:\n-[^\n]+)*)/i;
    const taskMatch = content.match(taskPattern);

    if (taskMatch && taskMatch[1]) {
      const taskLines = taskMatch[1]
        .split('\n')
        .filter((line) => line.trim().startsWith('-'))
        .map((line) => line.trim().substring(1).trim());
      tasks.push(...taskLines);
    }

    if (tasks.length === 0) {
      tasks.push('协助团队完成论文写作');
    }

    // 提取预计时间
    const timePattern = /预计[^\d]*(\d+)\s*天/i;
    const timeMatch = content.match(timePattern);
    const estimatedDays = timeMatch && timeMatch[1] ? parseInt(timeMatch[1], 10) : 1;

    return {
      roleType,
      roleName,
      tasks,
      estimatedDays,
    };
  }

  /**
   * 创建任务分配消息
   */
  private createTaskAssignmentMessage(
    receiver: string | string[],
    roleName: string,
    tasks: string[],
    estimatedDays: number
  ): AgentMessage {
    const taskList = tasks.map((task, index) => `${index + 1}. ${task}`).join('\n');

    return {
      id: this.generateMessageId(),
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver,
      content: `任务分配 - ${roleName}\n\n${taskList}\n\n预计完成时间：${estimatedDays}天`,
      metadata: {
        timestamp: new Date().toISOString(),
        requiresResponse: true,
        priority: 'high',
      },
      timestamp: new Date(),
    };
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
 * 创建Decision AI实例
 */
export function createDecisionAI(
  aiClient: AIClient,
  agentManager: AgentManager
): DecisionAI {
  return new DecisionAI(aiClient, agentManager);
}
