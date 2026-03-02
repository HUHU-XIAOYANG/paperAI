/**
 * Review Team Service - 审稿团队管理
 * 
 * 管理固定的审稿团队结构，包括：
 * - Editorial Office (编辑部)
 * - Editor in Chief (主编)
 * - Deputy Editor (副主编)
 * - Peer Reviewer (审稿专家)
 * 
 * 需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 * 任务: 22.1 创建固定的Review Team结构
 */

import type { Agent, AgentConfig, AgentRole } from '../types/agent';
import type { AgentManager } from './agentManager';
import type { IInteractionRouter } from './interactionRouter';
import type { SystemConfig } from '../types/config';

/**
 * 审稿团队角色定义
 */
export const REVIEW_TEAM_ROLES = {
  EDITORIAL_OFFICE: 'editorial_office' as AgentRole,
  EDITOR_IN_CHIEF: 'editor_in_chief' as AgentRole,
  DEPUTY_EDITOR: 'deputy_editor' as AgentRole,
  PEER_REVIEWER: 'peer_reviewer' as AgentRole,
} as const;

/**
 * 审稿阶段
 */
export type ReviewPhase =
  | 'format_check'      // 格式审查阶段
  | 'initial_review'    // 初审阶段
  | 'peer_review'       // 同行评审阶段
  | 'revision'          // 修订阶段
  | 'final_decision'    // 最终决定阶段
  | 'completed';        // 完成

/**
 * 审稿决定
 */
export type ReviewDecision =
  | 'accept'            // 接受
  | 'minor_revision'    // 小修
  | 'major_revision'    // 大修
  | 'reject';           // 拒稿

/**
 * 审稿报告
 */
export interface ReviewReport {
  /** 报告ID */
  id: string;
  /** 审稿人角色 */
  reviewer: AgentRole;
  /** 审稿人ID */
  reviewerId: string;
  /** 审稿阶段 */
  phase: ReviewPhase;
  /** 审稿决定 */
  decision: ReviewDecision;
  /** 审稿意见 */
  comments: string;
  /** 具体问题列表 */
  issues: ReviewIssue[];
  /** 创建时间 */
  timestamp: Date;
}

/**
 * 审稿问题
 */
export interface ReviewIssue {
  /** 问题类型 */
  type: 'format' | 'quality' | 'completeness' | 'coherence' | 'methodology' | 'citation';
  /** 严重程度 */
  severity: 'minor' | 'major' | 'critical';
  /** 问题描述 */
  description: string;
  /** 影响的章节 */
  affectedSection?: string;
  /** 改进建议 */
  suggestion?: string;
}

/**
 * 审稿流程状态
 */
export interface ReviewWorkflowState {
  /** 当前阶段 */
  currentPhase: ReviewPhase;
  /** 审稿报告列表 */
  reports: ReviewReport[];
  /** 最终决定 */
  finalDecision?: ReviewDecision;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
}

/**
 * Review Team接口
 */
export interface IReviewTeam {
  /**
   * 初始化审稿团队
   * 创建所有固定角色的Agent
   */
  initialize(): Promise<void>;

  /**
   * 开始审稿流程
   * @param documentId 文档ID
   * @param documentContent 文档内容
   */
  startReview(documentId: string, documentContent: string): Promise<void>;

  /**
   * 获取审稿流程状态
   */
  getWorkflowState(): ReviewWorkflowState;

  /**
   * 获取审稿团队成员
   */
  getTeamMembers(): Agent[];

  /**
   * 提交审稿报告
   * @param report 审稿报告
   */
  submitReport(report: ReviewReport): Promise<void>;

  /**
   * 进入下一个审稿阶段
   */
  advanceToNextPhase(): Promise<void>;

  /**
   * 销毁审稿团队
   */
  destroy(): Promise<void>;
}

/**
 * Review Team实现类
 */
export class ReviewTeam implements IReviewTeam {
  private agentManager: AgentManager;
  private interactionRouter: IInteractionRouter;
  private systemConfig: SystemConfig;
  private teamMembers: Map<AgentRole, Agent> = new Map();
  private workflowState: ReviewWorkflowState;

  constructor(
    agentManager: AgentManager,
    interactionRouter: IInteractionRouter,
    systemConfig: SystemConfig
  ) {
    this.agentManager = agentManager;
    this.interactionRouter = interactionRouter;
    this.systemConfig = systemConfig;
    this.workflowState = {
      currentPhase: 'format_check',
      reports: [],
      startTime: new Date(),
    };
  }

  /**
   * 初始化审稿团队
   * 创建所有固定角色的Agent
   */
  async initialize(): Promise<void> {
    console.log('初始化审稿团队...');

    // 创建Editorial Office
    const editorialOffice = await this.createReviewAgent(
      REVIEW_TEAM_ROLES.EDITORIAL_OFFICE,
      '编辑部'
    );
    this.teamMembers.set(REVIEW_TEAM_ROLES.EDITORIAL_OFFICE, editorialOffice);

    // 创建Editor in Chief
    const editorInChief = await this.createReviewAgent(
      REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF,
      '主编'
    );
    this.teamMembers.set(REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF, editorInChief);

    // 创建Deputy Editor
    const deputyEditor = await this.createReviewAgent(
      REVIEW_TEAM_ROLES.DEPUTY_EDITOR,
      '副主编'
    );
    this.teamMembers.set(REVIEW_TEAM_ROLES.DEPUTY_EDITOR, deputyEditor);

    // 创建Peer Reviewer
    const peerReviewer = await this.createReviewAgent(
      REVIEW_TEAM_ROLES.PEER_REVIEWER,
      '审稿专家'
    );
    this.teamMembers.set(REVIEW_TEAM_ROLES.PEER_REVIEWER, peerReviewer);

    // 注册所有成员到review团队
    this.teamMembers.forEach((agent) => {
      this.interactionRouter.registerTeamMember('review', agent.id);
    });

    console.log('审稿团队初始化完成，共创建4个角色');
  }

  /**
   * 开始审稿流程
   */
  async startReview(documentId: string, documentContent: string): Promise<void> {
    this.workflowState = {
      currentPhase: 'format_check',
      reports: [],
      startTime: new Date(),
    };

    console.log(`开始审稿流程: ${documentId}`);

    // 第一阶段：Editorial Office进行格式审查
    await this.executeFormatCheck();
  }

  /**
   * 获取审稿流程状态
   */
  getWorkflowState(): ReviewWorkflowState {
    return { ...this.workflowState };
  }

  /**
   * 获取审稿团队成员
   */
  getTeamMembers(): Agent[] {
    return Array.from(this.teamMembers.values());
  }

  /**
   * 提交审稿报告
   */
  async submitReport(report: ReviewReport): Promise<void> {
    this.workflowState.reports.push(report);
    console.log(`收到审稿报告: ${report.reviewer} - ${report.decision}`);

    // 根据报告决定下一步行动
    await this.handleReportSubmission(report);
  }

  /**
   * 进入下一个审稿阶段
   */
  async advanceToNextPhase(): Promise<void> {
    const phaseSequence: ReviewPhase[] = [
      'format_check',
      'initial_review',
      'peer_review',
      'final_decision',
      'completed',
    ];

    const currentIndex = phaseSequence.indexOf(this.workflowState.currentPhase);
    if (currentIndex < phaseSequence.length - 1) {
      const nextPhase = phaseSequence[currentIndex + 1];
      if (nextPhase) {
        this.workflowState.currentPhase = nextPhase;
        console.log(`进入审稿阶段: ${this.workflowState.currentPhase}`);

        // 执行新阶段的任务
        await this.executePhase(this.workflowState.currentPhase);
      }
    }
  }

  /**
   * 销毁审稿团队
   */
  async destroy(): Promise<void> {
    console.log('销毁审稿团队...');

    // 注销所有团队成员
    this.teamMembers.forEach((agent) => {
      this.interactionRouter.unregisterTeamMember('review', agent.id);
    });

    // 销毁所有Agent
    for (const agent of this.teamMembers.values()) {
      await this.agentManager.destroyAgent(agent.id);
    }

    this.teamMembers.clear();
    console.log('审稿团队已销毁');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * 创建审稿Agent
   */
  private async createReviewAgent(role: AgentRole, name: string): Promise<Agent> {
    const agentId = this.generateAgentId(role);

    const config: AgentConfig = {
      id: agentId,
      name,
      role,
      promptTemplate: `prompts/${role}.yaml`,
      aiService: this.systemConfig.defaultService,
      capabilities: {
        canInternetAccess: this.systemConfig.internetAccess?.enabled ?? false,
        canStreamOutput: true,
        canInteractWithPeers: true, // 支持非线性交互
      },
    };

    return await this.agentManager.createAgent(config);
  }

  /**
   * 生成Agent ID
   */
  private generateAgentId(role: AgentRole): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${role}_${timestamp}_${random}`;
  }

  /**
   * 执行格式审查阶段
   */
  private async executeFormatCheck(): Promise<void> {
    console.log('执行格式审查...');

    const editorialOffice = this.teamMembers.get(REVIEW_TEAM_ROLES.EDITORIAL_OFFICE);
    if (!editorialOffice) {
      throw new Error('Editorial Office未初始化');
    }

    // 更新Editorial Office状态
    this.agentManager.updateAgent(editorialOffice.id, {
      state: {
        ...editorialOffice.state,
        status: 'writing',
        currentTask: {
          id: this.generateTaskId(),
          description: '执行格式审查，检查文档格式规范性',
          assignedBy: 'review_team',
          priority: 'high',
        },
      },
    });

    // 这里应该调用AI进行实际的格式审查
    // 为了演示，我们模拟一个审查结果
    // 实际实现中，这里会调用AI Client
  }

  /**
   * 执行初审阶段
   */
  private async executeInitialReview(): Promise<void> {
    console.log('执行初审...');

    const editorInChief = this.teamMembers.get(REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF);
    const deputyEditor = this.teamMembers.get(REVIEW_TEAM_ROLES.DEPUTY_EDITOR);

    if (!editorInChief || !deputyEditor) {
      throw new Error('Editor in Chief或Deputy Editor未初始化');
    }

    // 主编和副主编协作进行初审
    // 支持非线性交互：他们可以相互讨论
    this.agentManager.updateAgent(editorInChief.id, {
      state: {
        ...editorInChief.state,
        status: 'writing',
        currentTask: {
          id: this.generateTaskId(),
          description: '执行初审，评估学术质量和创新性',
          assignedBy: 'review_team',
          priority: 'high',
        },
      },
    });

    this.agentManager.updateAgent(deputyEditor.id, {
      state: {
        ...deputyEditor.state,
        status: 'writing',
        currentTask: {
          id: this.generateTaskId(),
          description: '协助主编进行初审，提供补充意见',
          assignedBy: 'review_team',
          priority: 'high',
        },
      },
    });
  }

  /**
   * 执行同行评审阶段
   */
  private async executePeerReview(): Promise<void> {
    console.log('执行同行评审...');

    const peerReviewer = this.teamMembers.get(REVIEW_TEAM_ROLES.PEER_REVIEWER);
    if (!peerReviewer) {
      throw new Error('Peer Reviewer未初始化');
    }

    this.agentManager.updateAgent(peerReviewer.id, {
      state: {
        ...peerReviewer.state,
        status: 'writing',
        currentTask: {
          id: this.generateTaskId(),
          description: '执行深入的同行评审，撰写详细审稿报告',
          assignedBy: 'review_team',
          priority: 'high',
        },
      },
    });
  }

  /**
   * 执行最终决定阶段
   */
  private async executeFinalDecision(): Promise<void> {
    console.log('执行最终决定...');

    const editorInChief = this.teamMembers.get(REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF);
    if (!editorInChief) {
      throw new Error('Editor in Chief未初始化');
    }

    // 主编基于所有审稿报告做出最终决定
    this.agentManager.updateAgent(editorInChief.id, {
      state: {
        ...editorInChief.state,
        status: 'writing',
        currentTask: {
          id: this.generateTaskId(),
          description: '基于所有审稿意见做出最终录用决定',
          assignedBy: 'review_team',
          priority: 'high',
        },
      },
    });
  }

  /**
   * 执行指定阶段的任务
   */
  private async executePhase(phase: ReviewPhase): Promise<void> {
    switch (phase) {
      case 'format_check':
        await this.executeFormatCheck();
        break;
      case 'initial_review':
        await this.executeInitialReview();
        break;
      case 'peer_review':
        await this.executePeerReview();
        break;
      case 'final_decision':
        await this.executeFinalDecision();
        break;
      case 'completed':
        this.workflowState.endTime = new Date();
        console.log('审稿流程完成');
        break;
    }
  }

  /**
   * 处理审稿报告提交
   */
  private async handleReportSubmission(report: ReviewReport): Promise<void> {
    // 根据决定类型处理
    if (report.decision === 'reject') {
      // 如果是拒稿，可能需要触发退稿机制
      console.log('收到拒稿决定');
    } else if (report.decision === 'major_revision' || report.decision === 'minor_revision') {
      // 如果需要修订，进入修订阶段
      this.workflowState.currentPhase = 'revision';
      console.log('进入修订阶段');
    } else if (report.decision === 'accept') {
      // 如果接受，可能进入下一阶段或完成
      console.log('收到接受决定');
    }

    // 检查是否所有必需的报告都已提交
    const canAdvance = this.canAdvanceToNextPhase();
    if (canAdvance) {
      await this.advanceToNextPhase();
    }
  }

  /**
   * 检查是否可以进入下一阶段
   */
  private canAdvanceToNextPhase(): boolean {
    const currentPhase = this.workflowState.currentPhase;
    const reports = this.workflowState.reports;

    switch (currentPhase) {
      case 'format_check':
        // 需要Editorial Office的报告
        return reports.some(
          (r) => r.reviewer === REVIEW_TEAM_ROLES.EDITORIAL_OFFICE && r.phase === 'format_check'
        );
      case 'initial_review':
        // 需要Editor in Chief的报告
        return reports.some(
          (r) => r.reviewer === REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF && r.phase === 'initial_review'
        );
      case 'peer_review':
        // 需要Peer Reviewer的报告
        return reports.some(
          (r) => r.reviewer === REVIEW_TEAM_ROLES.PEER_REVIEWER && r.phase === 'peer_review'
        );
      case 'final_decision':
        // 需要Editor in Chief的最终决定
        return reports.some(
          (r) => r.reviewer === REVIEW_TEAM_ROLES.EDITOR_IN_CHIEF && r.phase === 'final_decision'
        );
      default:
        return false;
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${random}`;
  }
}

/**
 * 创建Review Team实例
 */
export function createReviewTeam(
  agentManager: AgentManager,
  interactionRouter: IInteractionRouter,
  systemConfig: SystemConfig
): IReviewTeam {
  return new ReviewTeam(agentManager, interactionRouter, systemConfig);
}
