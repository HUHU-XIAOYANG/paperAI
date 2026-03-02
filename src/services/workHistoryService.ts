/**
 * Work History Service
 * 
 * Tracks all agent work activities including:
 * - Task start and end times
 * - Output and feedback
 * - Work status changes
 * 
 * Requirements:
 * - 需求 13.5: 记录每个AI的工作过程
 * - 记录任务开始和结束时间
 * - 记录输出和反馈
 */

import type { WorkRecord, Agent } from '../types/agent';
import { useAgentStore } from '../stores/agentStore';

/**
 * WorkHistoryService interface
 * Manages work history tracking for all agents
 */
export interface WorkHistoryService {
  /**
   * Start tracking a new work record
   * @param agentId Agent identifier
   * @param taskId Task identifier
   * @param taskDescription Task description
   * @returns Created work record
   */
  startWork(agentId: string, taskId: string, taskDescription: string): WorkRecord;

  /**
   * Complete a work record
   * @param agentId Agent identifier
   * @param taskId Task identifier
   * @param output Work output
   */
  completeWork(agentId: string, taskId: string, output: string): void;

  /**
   * Mark work as rejected
   * @param agentId Agent identifier
   * @param taskId Task identifier
   * @param feedback Rejection feedback
   */
  rejectWork(agentId: string, taskId: string, feedback: string): void;

  /**
   * Mark work as revised
   * @param agentId Agent identifier
   * @param taskId Task identifier
   * @param output Revised output
   */
  reviseWork(agentId: string, taskId: string, output: string): void;

  /**
   * Add feedback to a work record
   * @param agentId Agent identifier
   * @param taskId Task identifier
   * @param feedback Feedback text
   */
  addFeedback(agentId: string, taskId: string, feedback: string): void;

  /**
   * Get work history for an agent
   * @param agentId Agent identifier
   * @returns Array of work records
   */
  getWorkHistory(agentId: string): WorkRecord[];

  /**
   * Get all work history across all agents
   * @returns Array of work records with agent info
   */
  getAllWorkHistory(): Array<WorkRecord & { agentId: string; agentName: string }>;

  /**
   * Get work record by task ID
   * @param agentId Agent identifier
   * @param taskId Task identifier
   * @returns Work record or undefined
   */
  getWorkRecord(agentId: string, taskId: string): WorkRecord | undefined;

  /**
   * Export work history to JSON
   * @returns JSON string of all work history
   */
  exportWorkHistory(): string;
}

/**
 * WorkHistoryService implementation
 */
export class WorkHistoryServiceImpl implements WorkHistoryService {
  /**
   * Start tracking a new work record
   */
  startWork(agentId: string, taskId: string, taskDescription: string): WorkRecord {
    const agent = useAgentStore.getState().getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const workRecord: WorkRecord = {
      taskId,
      startTime: new Date(),
      output: '',
      status: 'in_progress',
      feedbackReceived: [],
    };

    // Add to agent's work history
    agent.workHistory.push(workRecord);
    useAgentStore.getState().updateAgent(agentId, { workHistory: agent.workHistory });

    console.log(`Work started: Agent ${agent.config.name}, Task ${taskId}`);

    return workRecord;
  }

  /**
   * Complete a work record
   */
  completeWork(agentId: string, taskId: string, output: string): void {
    const workRecord = this.getWorkRecord(agentId, taskId);
    if (!workRecord) {
      throw new Error(`Work record not found: ${agentId}/${taskId}`);
    }

    workRecord.endTime = new Date();
    workRecord.output = output;
    workRecord.status = 'completed';

    this.updateWorkRecord(agentId, workRecord);

    const agent = useAgentStore.getState().getAgent(agentId);
    console.log(`Work completed: Agent ${agent?.config.name}, Task ${taskId}`);
  }

  /**
   * Mark work as rejected
   */
  rejectWork(agentId: string, taskId: string, feedback: string): void {
    const workRecord = this.getWorkRecord(agentId, taskId);
    if (!workRecord) {
      throw new Error(`Work record not found: ${agentId}/${taskId}`);
    }

    workRecord.status = 'rejected';
    workRecord.feedbackReceived.push(feedback);

    this.updateWorkRecord(agentId, workRecord);

    const agent = useAgentStore.getState().getAgent(agentId);
    console.log(`Work rejected: Agent ${agent?.config.name}, Task ${taskId}`);
  }

  /**
   * Mark work as revised
   */
  reviseWork(agentId: string, taskId: string, output: string): void {
    const workRecord = this.getWorkRecord(agentId, taskId);
    if (!workRecord) {
      throw new Error(`Work record not found: ${agentId}/${taskId}`);
    }

    workRecord.endTime = new Date();
    workRecord.output = output;
    workRecord.status = 'revised';

    this.updateWorkRecord(agentId, workRecord);

    const agent = useAgentStore.getState().getAgent(agentId);
    console.log(`Work revised: Agent ${agent?.config.name}, Task ${taskId}`);
  }

  /**
   * Add feedback to a work record
   */
  addFeedback(agentId: string, taskId: string, feedback: string): void {
    const workRecord = this.getWorkRecord(agentId, taskId);
    if (!workRecord) {
      throw new Error(`Work record not found: ${agentId}/${taskId}`);
    }

    workRecord.feedbackReceived.push(feedback);
    this.updateWorkRecord(agentId, workRecord);

    const agent = useAgentStore.getState().getAgent(agentId);
    console.log(`Feedback added: Agent ${agent?.config.name}, Task ${taskId}`);
  }

  /**
   * Get work history for an agent
   */
  getWorkHistory(agentId: string): WorkRecord[] {
    const agent = useAgentStore.getState().getAgent(agentId);
    if (!agent) {
      return [];
    }

    return agent.workHistory;
  }

  /**
   * Get all work history across all agents
   */
  getAllWorkHistory(): Array<WorkRecord & { agentId: string; agentName: string }> {
    const agents = useAgentStore.getState().getAllAgents();
    const allHistory: Array<WorkRecord & { agentId: string; agentName: string }> = [];

    for (const agent of agents) {
      for (const record of agent.workHistory) {
        allHistory.push({
          ...record,
          agentId: agent.id,
          agentName: agent.config.name,
        });
      }
    }

    // Sort by start time (most recent first)
    allHistory.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return allHistory;
  }

  /**
   * Get work record by task ID
   */
  getWorkRecord(agentId: string, taskId: string): WorkRecord | undefined {
    const agent = useAgentStore.getState().getAgent(agentId);
    if (!agent) {
      return undefined;
    }

    return agent.workHistory.find((record) => record.taskId === taskId);
  }

  /**
   * Export work history to JSON
   */
  exportWorkHistory(): string {
    const allHistory = this.getAllWorkHistory();
    return JSON.stringify(allHistory, null, 2);
  }

  /**
   * Update work record in agent's history
   */
  private updateWorkRecord(agentId: string, updatedRecord: WorkRecord): void {
    const agent = useAgentStore.getState().getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const index = agent.workHistory.findIndex((r) => r.taskId === updatedRecord.taskId);
    if (index === -1) {
      throw new Error(`Work record not found in agent history: ${updatedRecord.taskId}`);
    }

    agent.workHistory[index] = updatedRecord;
    useAgentStore.getState().updateAgent(agentId, { workHistory: agent.workHistory });
  }
}

/**
 * Create work history service instance
 */
export function createWorkHistoryService(): WorkHistoryService {
  return new WorkHistoryServiceImpl();
}

/**
 * Singleton instance
 */
export const workHistoryService = createWorkHistoryService();
