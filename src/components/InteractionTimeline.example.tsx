/**
 * Interaction Timeline Component - Usage Examples
 * 
 * This file demonstrates various usage patterns for the InteractionTimeline component.
 */

import { InteractionTimeline } from './InteractionTimeline';
import { AgentMessage, MessageType } from '../types';

// Example 1: Basic usage with sample messages
export function BasicExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '请撰写论文的引言部分，包括研究背景、问题陈述和论文结构概述。',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        relatedTaskId: 'task-001',
        tags: ['introduction', 'assignment'],
      },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'msg-2',
      type: 'work_submission',
      sender: 'writer_1',
      receiver: 'supervisor_ai',
      content: '我已完成引言部分的初稿。内容包括：\n1. 研究背景和动机\n2. 当前研究现状\n3. 本文的主要贡献\n4. 论文结构安排',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        relatedTaskId: 'task-001',
        tags: ['introduction', 'submission', 'draft_v1'],
      },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: 'msg-3',
      type: 'feedback_request',
      sender: 'writer_1',
      receiver: 'writer_2',
      content: '你能帮我审查一下引言部分的逻辑连贯性吗？特别是研究动机和问题陈述之间的过渡。',
      metadata: {
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        tags: ['peer_review', 'introduction'],
      },
      timestamp: new Date(Date.now() - 900000),
    },
    {
      id: 'msg-4',
      type: 'feedback_response',
      sender: 'writer_2',
      receiver: 'writer_1',
      content: '我看了你的引言部分，整体逻辑清晰。建议在研究动机后增加一段关于现有方法局限性的讨论，这样过渡到问题陈述会更自然。',
      metadata: {
        priority: 'medium',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        tags: ['peer_review', 'feedback'],
      },
      timestamp: new Date(Date.now() - 600000),
    },
    {
      id: 'msg-5',
      type: 'revision_request',
      sender: 'supervisor_ai',
      receiver: 'writer_1',
      content: '引言部分需要修订：\n1. 研究背景部分需要补充更多文献支持\n2. 问题陈述需要更加具体和明确\n3. 论文结构概述可以更简洁',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        relatedTaskId: 'task-001',
        tags: ['revision', 'introduction'],
      },
      timestamp: new Date(Date.now() - 300000),
    },
  ];

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <InteractionTimeline messages={messages} />
    </div>
  );
}

// Example 2: With agent highlighting
export function HighlightExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'discussion',
      sender: 'writer_1',
      receiver: 'writer_2',
      content: '关于方法论部分，我们应该采用定量还是定性研究方法？',
      metadata: {
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        tags: ['methodology', 'discussion'],
      },
      timestamp: new Date(Date.now() - 1200000),
    },
    {
      id: 'msg-2',
      type: 'discussion',
      sender: 'writer_2',
      receiver: 'writer_1',
      content: '我建议采用混合研究方法，结合定量数据分析和定性案例研究。',
      metadata: {
        priority: 'medium',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        tags: ['methodology', 'discussion'],
      },
      timestamp: new Date(Date.now() - 900000),
    },
    {
      id: 'msg-3',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '请根据讨论结果，撰写方法论部分。',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        relatedTaskId: 'task-002',
        tags: ['methodology', 'assignment'],
      },
      timestamp: new Date(Date.now() - 600000),
    },
  ];

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Highlighting writer_1's messages</h2>
      <InteractionTimeline 
        messages={messages} 
        highlightAgent="writer_1"
      />
    </div>
  );
}

// Example 3: With message type filtering
export function FilterByTypeExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '任务1：撰写引言',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'msg-2',
      type: 'discussion',
      sender: 'writer_1',
      receiver: 'writer_2',
      content: '讨论内容...',
      metadata: {
        priority: 'medium',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
      },
      timestamp: new Date(Date.now() - 2400000),
    },
    {
      id: 'msg-3',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_2',
      content: '任务2：撰写方法论',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: 'msg-4',
      type: 'work_submission',
      sender: 'writer_1',
      receiver: 'supervisor_ai',
      content: '提交引言初稿',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      timestamp: new Date(Date.now() - 900000),
    },
  ];

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Showing only task assignments</h2>
      <InteractionTimeline 
        messages={messages} 
        filterByType={['task_assignment']}
      />
    </div>
  );
}

// Example 4: With agent filtering
export function FilterByAgentExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '任务分配给writer_1',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'msg-2',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_2',
      content: '任务分配给writer_2',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
      },
      timestamp: new Date(Date.now() - 2400000),
    },
    {
      id: 'msg-3',
      type: 'work_submission',
      sender: 'writer_1',
      receiver: 'supervisor_ai',
      content: 'writer_1提交工作',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      timestamp: new Date(Date.now() - 1800000),
    },
  ];

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Showing only messages involving writer_1</h2>
      <InteractionTimeline 
        messages={messages} 
        filterByAgent="writer_1"
      />
    </div>
  );
}

// Example 5: With message click handler
export function WithClickHandlerExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'approval',
      sender: 'editor_in_chief',
      receiver: 'writer_1',
      content: '你的论文已通过初审，质量很好！',
      metadata: {
        priority: 'high',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        tags: ['approval', 'review'],
      },
      timestamp: new Date(Date.now() - 600000),
    },
    {
      id: 'msg-2',
      type: 'rejection',
      sender: 'peer_reviewer',
      receiver: 'writer_2',
      content: '论文需要重大修改：\n1. 研究方法不够严谨\n2. 数据分析存在问题\n3. 结论缺乏支持',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        tags: ['rejection', 'review'],
      },
      timestamp: new Date(Date.now() - 300000),
    },
  ];

  const handleMessageClick = (message: AgentMessage) => {
    console.log('Message clicked:', message);
    alert(`Clicked message: ${message.type} from ${message.sender}`);
  };

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Click on messages to see details</h2>
      <InteractionTimeline 
        messages={messages} 
        onMessageClick={handleMessageClick}
      />
    </div>
  );
}

// Example 6: With broadcast messages (multiple receivers)
export function BroadcastExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: ['writer_1', 'writer_2', 'writer_3'],
      content: '团队任务：请大家协作完成文献综述部分。writer_1负责理论基础，writer_2负责相关研究，writer_3负责研究空白。',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        relatedTaskId: 'task-team-001',
        tags: ['team_task', 'literature_review'],
      },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: 'msg-2',
      type: 'discussion',
      sender: 'writer_1',
      receiver: ['writer_2', 'writer_3'],
      content: '我们需要统一文献综述的结构和风格，建议先讨论一下大纲。',
      metadata: {
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        tags: ['team_discussion', 'literature_review'],
      },
      timestamp: new Date(Date.now() - 900000),
    },
  ];

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Messages with multiple receivers</h2>
      <InteractionTimeline messages={messages} />
    </div>
  );
}

// Example 7: Sort order comparison
export function SortOrderExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '第一条消息',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'msg-2',
      type: 'work_submission',
      sender: 'writer_1',
      receiver: 'supervisor_ai',
      content: '第二条消息',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: 'msg-3',
      type: 'approval',
      sender: 'supervisor_ai',
      receiver: 'writer_1',
      content: '第三条消息',
      metadata: {
        priority: 'high',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      timestamp: new Date(Date.now() - 900000),
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <div style={{ flex: 1, height: '600px' }}>
        <h2>Newest First (desc)</h2>
        <InteractionTimeline messages={messages} sortOrder="desc" />
      </div>
      <div style={{ flex: 1, height: '600px' }}>
        <h2>Oldest First (asc)</h2>
        <InteractionTimeline messages={messages} sortOrder="asc" />
      </div>
    </div>
  );
}

// Example 8: Empty state
export function EmptyStateExample() {
  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>No messages</h2>
      <InteractionTimeline messages={[]} />
    </div>
  );
}

// Example 9: Complex filtering scenario
export function ComplexFilteringExample() {
  const messages: AgentMessage[] = [
    {
      id: 'msg-1',
      type: 'task_assignment',
      sender: 'decision_ai',
      receiver: 'writer_1',
      content: '任务1',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'msg-2',
      type: 'feedback_request',
      sender: 'writer_1',
      receiver: 'writer_2',
      content: '请求反馈',
      metadata: {
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
      },
      timestamp: new Date(Date.now() - 2400000),
    },
    {
      id: 'msg-3',
      type: 'feedback_response',
      sender: 'writer_2',
      receiver: 'writer_1',
      content: '反馈响应',
      metadata: {
        priority: 'medium',
        requiresResponse: false,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: 'msg-4',
      type: 'work_submission',
      sender: 'writer_1',
      receiver: 'supervisor_ai',
      content: '提交工作',
      metadata: {
        priority: 'high',
        requiresResponse: true,
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      timestamp: new Date(Date.now() - 900000),
    },
  ];

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Feedback messages involving writer_1</h2>
      <InteractionTimeline 
        messages={messages}
        filterByAgent="writer_1"
        filterByType={['feedback_request', 'feedback_response']}
        highlightAgent="writer_1"
      />
    </div>
  );
}
