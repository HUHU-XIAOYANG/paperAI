/**
 * FormatParser使用示例
 * 
 * 本文件展示如何使用FormatParser解析、格式化和验证AI输出。
 * 
 * @module services/formatParser.example
 */

import { FormatParser } from './formatParser';
import type { AgentMessage, OutputFormat } from '../types/message';

// 创建FormatParser实例
const parser = new FormatParser();

// ============================================================================
// 示例1: 解析AI输出字符串
// ============================================================================

console.log('=== 示例1: 解析AI输出字符串 ===\n');

const aiOutput = `{
  "messageType": "work_submission",
  "sender": "writer_1",
  "receiver": "supervisor_ai",
  "content": {
    "text": "我已完成引言部分的初稿，包含研究背景、问题陈述和论文结构概述。",
    "attachments": [
      {
        "type": "reference",
        "content": "Smith et al. (2023) 的相关研究",
        "source": "https://example.com/paper"
      }
    ]
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requiresResponse": true,
    "priority": "high",
    "tags": ["introduction", "draft_v1"]
  }
}`;

const parseResult = parser.parse(aiOutput);

if ('error' in parseResult) {
  console.error('解析失败:', parseResult.error);
  if (parseResult.suggestion) {
    console.log('建议:', parseResult.suggestion);
  }
} else {
  console.log('解析成功!');
  console.log('消息类型:', parseResult.type);
  console.log('发送者:', parseResult.sender);
  console.log('接收者:', parseResult.receiver);
  console.log('内容:', parseResult.content);
  console.log('优先级:', parseResult.metadata.priority);
  console.log('需要响应:', parseResult.metadata.requiresResponse);
  console.log('标签:', parseResult.metadata.tags);
}

console.log('\n');

// ============================================================================
// 示例2: 格式化AgentMessage对象
// ============================================================================

console.log('=== 示例2: 格式化AgentMessage对象 ===\n');

const message: AgentMessage = {
  id: '123',
  type: 'feedback_request',
  sender: 'writer_1',
  receiver: 'writer_2',
  content: '我在引言中提到了你负责的方法部分，能否提供方法的关键点概要？',
  metadata: {
    priority: 'medium',
    requiresResponse: true,
    timestamp: '2024-01-15T10:15:00Z',
    tags: ['introduction', 'methods', 'collaboration']
  },
  timestamp: new Date('2024-01-15T10:15:00Z')
};

const formattedOutput = parser.format(message);
console.log('格式化后的输出:');
console.log(formattedOutput);

console.log('\n');

// ============================================================================
// 示例3: 验证AI输出格式
// ============================================================================

console.log('=== 示例3: 验证AI输出格式 ===\n');

// 有效的输出
const validOutput = `{
  "messageType": "task_assignment",
  "sender": "decision_ai",
  "receiver": "writer_1",
  "content": {
    "text": "请撰写论文的引言部分"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:00:00Z",
    "requiresResponse": false,
    "priority": "high"
  }
}`;

const validationResult1 = parser.validate(validOutput);
console.log('验证有效输出:');
console.log('是否有效:', validationResult1.isValid);
console.log('错误:', validationResult1.errors);
console.log('警告:', validationResult1.warnings);

console.log('\n');

// 无效的输出（缺少必需字段）
const invalidOutput = `{
  "messageType": "work_submission",
  "sender": "writer_1",
  "content": {
    "text": "我已完成工作"
  }
}`;

const validationResult2 = parser.validate(invalidOutput);
console.log('验证无效输出（缺少字段）:');
console.log('是否有效:', validationResult2.isValid);
console.log('错误:', validationResult2.errors);

console.log('\n');

// ============================================================================
// 示例4: 处理多接收者消息
// ============================================================================

console.log('=== 示例4: 处理多接收者消息 ===\n');

const broadcastMessage: AgentMessage = {
  id: '456',
  type: 'discussion',
  sender: 'editor_in_chief',
  receiver: ['deputy_editor', 'peer_reviewer_1', 'peer_reviewer_2'],
  content: '这篇论文的方法部分存在一些创新性，请各位审稿专家提供意见。',
  metadata: {
    priority: 'high',
    requiresResponse: true,
    timestamp: '2024-01-15T14:00:00Z',
    tags: ['review', 'methods', 'discussion']
  },
  timestamp: new Date('2024-01-15T14:00:00Z')
};

const broadcastFormatted = parser.format(broadcastMessage);
console.log('广播消息格式化:');
console.log(broadcastFormatted);

const broadcastParsed = parser.parse(broadcastFormatted);
if (!('error' in broadcastParsed)) {
  console.log('\n解析后的接收者列表:');
  console.log(broadcastParsed.receiver);
}

console.log('\n');

// ============================================================================
// 示例5: 往返测试（Round-trip）
// ============================================================================

console.log('=== 示例5: 往返测试 ===\n');

const originalMessage: AgentMessage = {
  id: 'test-123',
  type: 'revision_request',
  sender: 'supervisor_ai',
  receiver: 'writer_1',
  content: '引言部分需要补充更多的研究背景。',
  metadata: {
    priority: 'high',
    requiresResponse: false,
    timestamp: '2024-01-15T11:00:00Z',
    tags: ['introduction', 'revision']
  },
  timestamp: new Date('2024-01-15T11:00:00Z')
};

console.log('原始消息:');
console.log('类型:', originalMessage.type);
console.log('发送者:', originalMessage.sender);
console.log('内容:', originalMessage.content);

// 格式化
const formatted = parser.format(originalMessage);
console.log('\n格式化后的字符串长度:', formatted.length);

// 解析
const parsed = parser.parse(formatted);
if (!('error' in parsed)) {
  console.log('\n解析后的消息:');
  console.log('类型:', parsed.type);
  console.log('发送者:', parsed.sender);
  console.log('内容:', parsed.content);
  
  console.log('\n往返测试结果:');
  console.log('类型匹配:', originalMessage.type === parsed.type);
  console.log('发送者匹配:', originalMessage.sender === parsed.sender);
  console.log('内容匹配:', originalMessage.content === parsed.content);
  console.log('优先级匹配:', originalMessage.metadata.priority === parsed.metadata.priority);
}

console.log('\n');

// ============================================================================
// 示例6: 错误处理
// ============================================================================

console.log('=== 示例6: 错误处理 ===\n');

// 无效的JSON
const invalidJson = '{ this is not valid json }';
const errorResult1 = parser.parse(invalidJson);
if ('error' in errorResult1) {
  console.log('JSON解析错误:');
  console.log('错误信息:', errorResult1.error);
  console.log('建议:', errorResult1.suggestion);
}

console.log('\n');

// 无效的messageType
const invalidMessageType = `{
  "messageType": "invalid_type",
  "sender": "writer_1",
  "receiver": "supervisor_ai",
  "content": {
    "text": "内容"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requiresResponse": true,
    "priority": "high"
  }
}`;

const errorResult2 = parser.parse(invalidMessageType);
if ('error' in errorResult2) {
  console.log('无效messageType错误:');
  console.log('错误信息:', errorResult2.error);
}

console.log('\n');

// 缺少必需字段
const missingFields = `{
  "messageType": "work_submission",
  "sender": "writer_1"
}`;

const errorResult3 = parser.parse(missingFields);
if ('error' in errorResult3) {
  console.log('缺少必需字段错误:');
  console.log('错误信息:', errorResult3.error);
}

console.log('\n');

// ============================================================================
// 示例7: 实际使用场景 - Supervisor AI验证输出
// ============================================================================

console.log('=== 示例7: Supervisor AI验证输出 ===\n');

function supervisorValidateOutput(aiOutput: string): boolean {
  // 首先验证格式
  const validation = parser.validate(aiOutput);
  
  if (!validation.isValid) {
    console.log('❌ 输出格式不符合规范');
    console.log('错误列表:');
    validation.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    
    if (validation.warnings.length > 0) {
      console.log('警告列表:');
      validation.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    return false;
  }
  
  // 然后解析内容
  const parsed = parser.parse(aiOutput);
  
  if ('error' in parsed) {
    console.log('❌ 解析失败:', parsed.error);
    return false;
  }
  
  console.log('✅ 输出格式正确');
  console.log('消息类型:', parsed.type);
  console.log('发送者:', parsed.sender);
  console.log('接收者:', parsed.receiver);
  
  return true;
}

// 测试有效输出
const testOutput1 = `{
  "messageType": "work_submission",
  "sender": "writer_1",
  "receiver": "supervisor_ai",
  "content": {
    "text": "我已完成引言部分"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requiresResponse": true,
    "priority": "high"
  }
}`;

console.log('测试有效输出:');
supervisorValidateOutput(testOutput1);

console.log('\n');

// 测试无效输出
const testOutput2 = `{
  "messageType": "work_submission",
  "sender": "writer_1"
}`;

console.log('测试无效输出:');
supervisorValidateOutput(testOutput2);

console.log('\n=== 示例完成 ===');
