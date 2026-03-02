/**
 * Work Display Panel - Usage Examples
 * 
 * Demonstrates various use cases and configurations of the WorkDisplayPanel component.
 */

import { WorkDisplayPanel } from './WorkDisplayPanel';
import { AgentInfo, AgentStatus } from '../types/agent';
import { AgentMessage } from '../types';

// Example 1: Writer Agent - Active Writing
export function WriterAgentExample() {
  const agent: AgentInfo = {
    id: 'writer_1',
    name: 'Writer Alpha',
    role: 'writer',
    currentTask: '撰写论文引言部分，包括研究背景、问题陈述和论文结构概述',
  };

  const status: AgentStatus = 'writing';

  const streamingOutput = `# 引言

## 研究背景

近年来，人工智能技术在学术写作领域取得了显著进展。多智能体系统（Multi-Agent Systems）作为一种新兴的协作模式，为复杂任务的自动化提供了新的解决方案...

## 问题陈述

尽管现有的AI写作工具能够生成基本的文本内容，但在学术论文这种需要严格质量把控和多轮审稿的场景中，单一AI的能力仍然有限...`;

  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '请撰写论文的引言部分，重点关注研究背景和问题陈述。',
      metadata: {
        priority: 'high',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: 'msg-2',
      type: 'feedback_request',
      sender: 'writer_2',
      receiver: 'writer_1',
      content: '你对引言部分的研究背景范围有什么建议？我在写方法部分，需要确保一致性。',
      metadata: {
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
      timestamp: new Date(Date.now() - 120000),
    },
  ];

  const handleInteractionRequest = (agentId: string) => {
    console.log(`Interaction requested for agent: ${agentId}`);
    alert(`请求与 ${agentId} 交互`);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <WorkDisplayPanel
        agent={agent}
        currentTask={agent.currentTask}
        status={status}
        streamingOutput={streamingOutput}
        messages={messages}
        onInteractionRequest={handleInteractionRequest}
      />
    </div>
  );
}

// Example 2: Supervisor AI - Reviewing
export function SupervisorAgentExample() {
  const agent: AgentInfo = {
    id: 'supervisor_ai',
    name: 'Supervisor',
    role: 'supervisor',
    currentTask: '检查所有AI输出的格式规范性',
  };

  const status: AgentStatus = 'thinking';

  const messages: AgentMessage[] = [
    {
      id: 'msg-3',
      type: 'work_submission',
      sender: 'writer_1',
      receiver: 'supervisor_ai',
      content: '已完成引言部分的初稿，请审查。',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: 'msg-4',
      type: 'revision_request',
      sender: 'supervisor_ai',
      receiver: 'writer_3',
      content: '你的输出格式不符合规范，请按照OutputFormat重新提交。',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 30000).toISOString(),
      },
      timestamp: new Date(Date.now() - 30000),
    },
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <WorkDisplayPanel
        agent={agent}
        currentTask={agent.currentTask}
        status={status}
        messages={messages}
        onInteractionRequest={(id) => console.log('Request interaction:', id)}
      />
    </div>
  );
}

// Example 3: Editor in Chief - Waiting for Feedback
export function EditorInChiefExample() {
  const agent: AgentInfo = {
    id: 'editor_in_chief',
    name: 'Chief Editor',
    role: 'editor_in_chief',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
    currentTask: '初审论文质量，等待审稿专家的详细评估',
  };

  const status: AgentStatus = 'waiting_feedback';

  const messages: AgentMessage[] = [
    {
      id: 'msg-5',
      type: 'feedback_request',
      sender: 'editor_in_chief',
      receiver: 'peer_reviewer',
      content: '请对论文的学术质量进行深入评估，特别关注研究方法的严谨性。',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 180000).toISOString(),
      },
      timestamp: new Date(Date.now() - 180000),
    },
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <WorkDisplayPanel
        agent={agent}
        currentTask={agent.currentTask}
        status={status}
        messages={messages}
        onInteractionRequest={(id) => console.log('Request interaction:', id)}
      />
    </div>
  );
}

// Example 4: Decision AI - Idle State
export function DecisionAIIdleExample() {
  const agent: AgentInfo = {
    id: 'decision_ai',
    name: 'Decision AI',
    role: 'decision',
  };

  const status: AgentStatus = 'idle';

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <WorkDisplayPanel
        agent={agent}
        status={status}
      />
    </div>
  );
}

// Example 5: Writer Agent - Completed
export function WriterCompletedExample() {
  const agent: AgentInfo = {
    id: 'writer_4',
    name: 'Writer Delta',
    role: 'writer',
    currentTask: '撰写论文结论部分',
  };

  const status: AgentStatus = 'completed';

  const streamingOutput = `# 结论

本研究提出了一种基于多智能体协作的学术论文写作系统，通过决策AI、监管AI、写作团队和审稿团队的协同工作，实现了自动化的论文创作和审核流程。

实验结果表明，该系统能够有效提高论文写作效率，同时保证学术质量。未来工作将进一步优化AI之间的交互机制，并扩展到更多学科领域。`;

  const messages: AgentMessage[] = [
    {
      id: 'msg-6',
      type: 'approval',
      sender: 'supervisor_ai',
      receiver: 'writer_4',
      content: '结论部分已通过审查，格式规范，内容完整。',
      metadata: {
        priority: 'medium',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 10000).toISOString(),
      },
      timestamp: new Date(Date.now() - 10000),
    },
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <WorkDisplayPanel
        agent={agent}
        currentTask={agent.currentTask}
        status={status}
        streamingOutput={streamingOutput}
        messages={messages}
      />
    </div>
  );
}

// Example 6: Multiple Panels in Grid Layout
export function MultiPanelGridExample() {
  const agents: Array<{
    agent: AgentInfo;
    status: AgentStatus;
    task?: string;
  }> = [
    {
      agent: { id: 'decision_ai', name: 'Decision AI', role: 'decision' },
      status: 'thinking',
      task: '分析论文题目并组建写作团队',
    },
    {
      agent: { id: 'supervisor_ai', name: 'Supervisor', role: 'supervisor' },
      status: 'writing',
      task: '检查AI输出格式',
    },
    {
      agent: { id: 'writer_1', name: 'Writer 1', role: 'writer' },
      status: 'writing',
      task: '撰写引言',
    },
    {
      agent: { id: 'writer_2', name: 'Writer 2', role: 'writer' },
      status: 'revising',
      task: '修订方法部分',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      gap: '1.5rem',
      padding: '2rem',
    }}>
      {agents.map(({ agent, status, task }) => (
        <WorkDisplayPanel
          key={agent.id}
          agent={agent}
          currentTask={task}
          status={status}
          onInteractionRequest={(id) => console.log('Request interaction:', id)}
        />
      ))}
    </div>
  );
}

// Example 7: With Real-time Streaming Simulation
export function StreamingSimulationExample() {
  const agent: AgentInfo = {
    id: 'writer_streaming',
    name: 'Streaming Writer',
    role: 'writer',
    currentTask: '实时生成论文内容',
  };

  const status: AgentStatus = 'writing';

  // In a real application, this would come from StreamHandler
  const streamingOutput = '正在生成内容...';

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <WorkDisplayPanel
        agent={agent}
        currentTask={agent.currentTask}
        status={status}
        streamingOutput={streamingOutput}
        onInteractionRequest={(id) => console.log('Request interaction:', id)}
      />
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#888' }}>
          💡 提示：在实际应用中，此组件会自动订阅StreamHandler的流式输出，
          实时显示AI生成的内容。
        </p>
      </div>
    </div>
  );
}
