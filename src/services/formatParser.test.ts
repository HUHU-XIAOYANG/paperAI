/**
 * FormatParser单元测试
 * 
 * 测试AI输出格式解析器的所有功能：
 * 1. parse: 解析AI输出字符串
 * 2. format: 格式化AgentMessage对象
 * 3. validate: 验证格式规范
 * 
 * @module services/formatParser.test
 */

import { describe, it, expect } from 'vitest';
import { FormatParser } from './formatParser';
import type { AgentMessage, OutputFormat } from '../types/message';

describe('FormatParser', () => {
  const parser = new FormatParser();
  
  describe('parse', () => {
    it('应该成功解析有效的OutputFormat字符串', () => {
      const validOutput: OutputFormat = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: {
          text: '我已完成引言部分的初稿'
        },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high',
          tags: ['introduction', 'draft_v1']
        }
      };
      
      const result = parser.parse(JSON.stringify(validOutput));
      
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.type).toBe('work_submission');
        expect(result.sender).toBe('writer_1');
        expect(result.receiver).toBe('supervisor_ai');
        expect(result.content).toBe('我已完成引言部分的初稿');
        expect(result.metadata.priority).toBe('high');
        expect(result.metadata.requiresResponse).toBe(true);
        expect(result.metadata.timestamp).toBe('2024-01-15T10:30:00Z');
        expect(result.metadata.tags).toEqual(['introduction', 'draft_v1']);
      }
    });
    
    it('应该成功解析带附件的OutputFormat', () => {
      const outputWithAttachments: OutputFormat = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: {
          text: '我已完成引言部分',
          attachments: [
            {
              type: 'reference',
              content: 'Smith et al. (2023)',
              source: 'https://example.com/paper'
            }
          ]
        },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(outputWithAttachments));
      
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.metadata.attachments).toEqual(['attachment_0']);
      }
    });
    
    it('应该成功解析多个接收者的消息', () => {
      const multiReceiverOutput: OutputFormat = {
        messageType: 'discussion',
        sender: 'editor_in_chief',
        receiver: ['deputy_editor', 'peer_reviewer_1', 'peer_reviewer_2'],
        content: {
          text: '请各位审稿专家提供意见'
        },
        metadata: {
          timestamp: '2024-01-15T14:00:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(multiReceiverOutput));
      
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(Array.isArray(result.receiver)).toBe(true);
        expect(result.receiver).toEqual(['deputy_editor', 'peer_reviewer_1', 'peer_reviewer_2']);
      }
    });
    
    it('应该拒绝无效的JSON', () => {
      const invalidJson = '{ invalid json }';
      
      const result = parser.parse(invalidJson);
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('JSON解析失败');
        expect(result.suggestion).toBeDefined();
      }
    });
    
    it('应该拒绝缺少messageType的输出', () => {
      const missingMessageType = {
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(missingMessageType));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('messageType');
      }
    });
    
    it('应该拒绝缺少sender的输出', () => {
      const missingSender = {
        messageType: 'work_submission',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(missingSender));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('sender');
      }
    });
    
    it('应该拒绝缺少receiver的输出', () => {
      const missingReceiver = {
        messageType: 'work_submission',
        sender: 'writer_1',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(missingReceiver));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('receiver');
      }
    });
    
    it('应该拒绝缺少content的输出', () => {
      const missingContent = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(missingContent));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('content');
      }
    });
    
    it('应该拒绝缺少metadata的输出', () => {
      const missingMetadata = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容' }
      };
      
      const result = parser.parse(JSON.stringify(missingMetadata));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('metadata');
      }
    });
    
    it('应该拒绝无效的messageType', () => {
      const invalidMessageType = {
        messageType: 'invalid_type',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(invalidMessageType));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('messageType');
      }
    });
    
    it('应该拒绝空的sender', () => {
      const emptySender = {
        messageType: 'work_submission',
        sender: '',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(emptySender));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('sender');
      }
    });
    
    it('应该拒绝空的receiver', () => {
      const emptyReceiver = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: '',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(emptyReceiver));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('receiver');
      }
    });
    
    it('应该拒绝空的receiver数组', () => {
      const emptyReceiverArray = {
        messageType: 'discussion',
        sender: 'writer_1',
        receiver: [],
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(emptyReceiverArray));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('receiver');
      }
    });
    
    it('应该拒绝无效的timestamp格式', () => {
      const invalidTimestamp = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: 'invalid-timestamp',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(invalidTimestamp));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('timestamp');
      }
    });
    
    it('应该拒绝无效的priority值', () => {
      const invalidPriority = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'invalid'
        }
      };
      
      const result = parser.parse(JSON.stringify(invalidPriority));
      
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('priority');
      }
    });
  });
  
  describe('format', () => {
    it('应该成功格式化AgentMessage为OutputFormat字符串', () => {
      const message: AgentMessage = {
        id: '123',
        type: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: '我已完成引言部分的初稿',
        metadata: {
          priority: 'high',
          requiresResponse: true,
          timestamp: '2024-01-15T10:30:00Z',
          tags: ['introduction', 'draft_v1']
        },
        timestamp: new Date('2024-01-15T10:30:00Z')
      };
      
      const formatted = parser.format(message);
      
      // 验证是有效的JSON
      expect(() => JSON.parse(formatted)).not.toThrow();
      
      // 验证格式化后的内容
      const parsed = JSON.parse(formatted) as OutputFormat;
      expect(parsed.messageType).toBe('work_submission');
      expect(parsed.sender).toBe('writer_1');
      expect(parsed.receiver).toBe('supervisor_ai');
      expect(parsed.content.text).toBe('我已完成引言部分的初稿');
      expect(parsed.metadata.priority).toBe('high');
      expect(parsed.metadata.requiresResponse).toBe(true);
      expect(parsed.metadata.timestamp).toBe('2024-01-15T10:30:00Z');
      expect(parsed.metadata.tags).toEqual(['introduction', 'draft_v1']);
    });
    
    it('应该成功格式化多接收者的消息', () => {
      const message: AgentMessage = {
        id: '456',
        type: 'discussion',
        sender: 'editor_in_chief',
        receiver: ['deputy_editor', 'peer_reviewer_1'],
        content: '请提供意见',
        metadata: {
          priority: 'high',
          requiresResponse: true,
          timestamp: '2024-01-15T14:00:00Z'
        },
        timestamp: new Date('2024-01-15T14:00:00Z')
      };
      
      const formatted = parser.format(message);
      const parsed = JSON.parse(formatted) as OutputFormat;
      
      expect(Array.isArray(parsed.receiver)).toBe(true);
      expect(parsed.receiver).toEqual(['deputy_editor', 'peer_reviewer_1']);
    });
    
    it('格式化后的字符串应该可以被parse方法解析', () => {
      const message: AgentMessage = {
        id: '789',
        type: 'feedback_request',
        sender: 'writer_1',
        receiver: 'writer_2',
        content: '能否提供方法的关键点概要？',
        metadata: {
          priority: 'medium',
          requiresResponse: true,
          timestamp: '2024-01-15T10:15:00Z',
          tags: ['collaboration']
        },
        timestamp: new Date('2024-01-15T10:15:00Z')
      };
      
      const formatted = parser.format(message);
      const parsed = parser.parse(formatted);
      
      expect('error' in parsed).toBe(false);
      if (!('error' in parsed)) {
        expect(parsed.type).toBe(message.type);
        expect(parsed.sender).toBe(message.sender);
        expect(parsed.receiver).toBe(message.receiver);
        expect(parsed.content).toBe(message.content);
        expect(parsed.metadata.priority).toBe(message.metadata.priority);
      }
    });
  });
  
  describe('validate', () => {
    it('应该验证通过有效的OutputFormat', () => {
      const validOutput: OutputFormat = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: {
          text: '我已完成引言部分的初稿'
        },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.validate(JSON.stringify(validOutput));
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('应该验证失败无效的JSON', () => {
      const invalidJson = '{ invalid json }';
      
      const result = parser.validate(invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('JSON解析失败');
    });
    
    it('应该验证失败缺少必需字段的输出', () => {
      const missingFields = {
        messageType: 'work_submission',
        sender: 'writer_1'
        // 缺少receiver, content, metadata
      };
      
      const result = parser.validate(JSON.stringify(missingFields));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('receiver'))).toBe(true);
      expect(result.errors.some(e => e.includes('content'))).toBe(true);
      expect(result.errors.some(e => e.includes('metadata'))).toBe(true);
    });
    
    it('应该验证失败无效的messageType', () => {
      const invalidMessageType = {
        messageType: 'invalid_type',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.validate(JSON.stringify(invalidMessageType));
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('messageType'))).toBe(true);
    });
    
    it('应该对空的content.text产生警告', () => {
      const emptyContent = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.validate(JSON.stringify(emptyContent));
      
      // 空content.text应该产生警告
      expect(result.isValid).toBe(true); // 仍然有效，但有警告
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('content.text'))).toBe(true);
    });
    
    it('应该验证所有有效的messageType', () => {
      const messageTypes = [
        'task_assignment',
        'work_submission',
        'feedback_request',
        'feedback_response',
        'discussion',
        'revision_request',
        'approval',
        'rejection'
      ];
      
      messageTypes.forEach(type => {
        const output = {
          messageType: type,
          sender: 'writer_1',
          receiver: 'supervisor_ai',
          content: { text: '内容' },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: true,
            priority: 'high'
          }
        };
        
        const result = parser.validate(JSON.stringify(output));
        expect(result.isValid).toBe(true);
      });
    });
    
    it('应该验证所有有效的priority值', () => {
      const priorities = ['low', 'medium', 'high'];
      
      priorities.forEach(priority => {
        const output = {
          messageType: 'work_submission',
          sender: 'writer_1',
          receiver: 'supervisor_ai',
          content: { text: '内容' },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: true,
            priority: priority
          }
        };
        
        const result = parser.validate(JSON.stringify(output));
        expect(result.isValid).toBe(true);
      });
    });
  });
  
  describe('往返测试 (Round-trip)', () => {
    it('parse和format应该是互逆操作', () => {
      const message: AgentMessage = {
        id: 'test-123',
        type: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: '测试内容',
        metadata: {
          priority: 'high',
          requiresResponse: true,
          timestamp: '2024-01-15T10:30:00Z',
          tags: ['test']
        },
        timestamp: new Date('2024-01-15T10:30:00Z')
      };
      
      // format -> parse -> format
      const formatted1 = parser.format(message);
      const parsed = parser.parse(formatted1);
      
      expect('error' in parsed).toBe(false);
      if (!('error' in parsed)) {
        // 重新构建AgentMessage
        const reconstructed: AgentMessage = {
          id: 'test-456', // ID会不同
          type: parsed.type,
          sender: parsed.sender,
          receiver: parsed.receiver,
          content: parsed.content,
          metadata: parsed.metadata,
          timestamp: new Date(parsed.metadata.timestamp)
        };
        
        const formatted2 = parser.format(reconstructed);
        
        // 两次格式化的结果应该等价（忽略ID）
        const obj1 = JSON.parse(formatted1);
        const obj2 = JSON.parse(formatted2);
        
        expect(obj1.messageType).toBe(obj2.messageType);
        expect(obj1.sender).toBe(obj2.sender);
        expect(obj1.receiver).toBe(obj2.receiver);
        expect(obj1.content.text).toBe(obj2.content.text);
        expect(obj1.metadata.priority).toBe(obj2.metadata.priority);
      }
    });
  });
  
  describe('边缘情况', () => {
    it('应该处理包含特殊字符的内容', () => {
      const specialChars = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '内容包含特殊字符: \n\t"quotes" \'apostrophes\' & <tags>' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(specialChars));
      
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.content).toContain('特殊字符');
      }
    });
    
    it('应该处理非常长的内容', () => {
      const longContent = 'A'.repeat(10000);
      const output = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: longContent },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(output));
      
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.content.length).toBe(10000);
      }
    });
    
    it('应该处理Unicode字符', () => {
      const unicodeContent = {
        messageType: 'work_submission',
        sender: 'writer_1',
        receiver: 'supervisor_ai',
        content: { text: '中文内容 🎉 emoji 日本語 한글' },
        metadata: {
          timestamp: '2024-01-15T10:30:00Z',
          requiresResponse: true,
          priority: 'high'
        }
      };
      
      const result = parser.parse(JSON.stringify(unicodeContent));
      
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.content).toBe('中文内容 🎉 emoji 日本語 한글');
      }
    });
  });

  describe('增强的错误处理 (需求16.2)', () => {
    describe('JSON解析错误', () => {
      it('应该提供错误位置信息', () => {
        const invalidJson = '{ "messageType": "work_submission", "sender": "writer_1" }';
        
        const result = parser.parse(invalidJson);
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBeDefined();
          expect(result.suggestion).toBeDefined();
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为缺少引号的JSON提供详细错误', () => {
        const invalidJson = '{ messageType: "work_submission" }';
        
        const result = parser.parse(invalidJson);
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('JSON解析失败');
          expect(result.suggestion).toBeDefined();
          expect(result.context).toBeDefined();
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为不完整的JSON提供修复建议', () => {
        const incompleteJson = '{ "messageType": "work_submission", "sender": "writer_1"';
        
        const result = parser.parse(incompleteJson);
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('JSON解析失败');
          expect(result.suggestion).toBeDefined();
          // 建议应该包含有用的修复信息
          if (result.suggestion) {
            expect(result.suggestion.length).toBeGreaterThan(20);
          }
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为意外的逗号提供修复建议', () => {
        const trailingComma = '{ "messageType": "work_submission", "sender": "writer_1", }';
        
        const result = parser.parse(trailingComma);
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('JSON解析失败');
          expect(result.suggestion).toBeDefined();
        }
      });
    });
    
    describe('格式验证错误', () => {
      it('应该为缺少字段提供详细的修复建议', () => {
        const missingFields = {
          messageType: 'work_submission',
          sender: 'writer_1'
          // 缺少 receiver, content, metadata
        };
        
        const result = parser.parse(JSON.stringify(missingFields));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('格式验证失败');
          expect(result.suggestion).toBeDefined();
          expect(result.suggestion).toContain('receiver');
          expect(result.context).toBeDefined();
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为无效的messageType提供修复建议', () => {
        const invalidType = {
          messageType: 'invalid_message_type',
          sender: 'writer_1',
          receiver: 'supervisor_ai',
          content: { text: '内容' },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: true,
            priority: 'high'
          }
        };
        
        const result = parser.parse(JSON.stringify(invalidType));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('无效的messageType');
          expect(result.suggestion).toBeDefined();
          expect(result.suggestion).toContain('无效的字段值');
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为无效的priority提供修复建议', () => {
        const invalidPriority = {
          messageType: 'work_submission',
          sender: 'writer_1',
          receiver: 'supervisor_ai',
          content: { text: '内容' },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: true,
            priority: 'urgent' // 无效值
          }
        };
        
        const result = parser.parse(JSON.stringify(invalidPriority));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('无效的metadata.priority');
          expect(result.suggestion).toBeDefined();
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为类型错误提供修复建议', () => {
        const wrongType = {
          messageType: 'work_submission',
          sender: 'writer_1',
          receiver: 'supervisor_ai',
          content: { text: '内容' },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: 'yes', // 应该是布尔值
            priority: 'high'
          }
        };
        
        const result = parser.parse(JSON.stringify(wrongType));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('必须是布尔类型');
          expect(result.suggestion).toBeDefined();
          expect(result.suggestion).toContain('类型正确');
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该为空字段提供修复建议', () => {
        const emptyFields = {
          messageType: 'work_submission',
          sender: '',
          receiver: 'supervisor_ai',
          content: { text: '内容' },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: true,
            priority: 'high'
          }
        };
        
        const result = parser.parse(JSON.stringify(emptyFields));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          // 空字符串会被validateOutputFormat检测为"sender不能为空字符串"
          expect(result.error).toContain('sender');
          expect(result.suggestion).toBeDefined();
          // 建议应该提供有用的修复信息
          if (result.suggestion) {
            expect(result.suggestion.length).toBeGreaterThan(10);
          }
          expect(result.expectedFormat).toBeDefined();
        }
      });
      
      it('应该提供当前字段的上下文信息', () => {
        const partialOutput = {
          messageType: 'work_submission',
          sender: 'writer_1',
          content: { text: '内容' }
          // 缺少 receiver 和 metadata
        };
        
        const result = parser.parse(JSON.stringify(partialOutput));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.context).toBeDefined();
          expect(result.context).toContain('当前包含的字段');
          expect(result.context).toContain('messageType');
        }
      });
    });
    
    describe('错误位置定位', () => {
      it('应该计算正确的行号和列号', () => {
        // 多行JSON，在第3行有错误
        const multilineJson = `{
  "messageType": "work_submission",
  "sender": writer_1,
  "receiver": "supervisor_ai"
}`;
        
        const result = parser.parse(multilineJson);
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.line).toBeDefined();
          expect(result.column).toBeDefined();
        }
      });
      
      it('应该提供错误位置的上下文', () => {
        const jsonWithError = '{ "messageType": "work_submission", "sender": writer_1 }';
        
        const result = parser.parse(jsonWithError);
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.context).toBeDefined();
          // 上下文应该包含错误位置附近的文本
          expect(typeof result.context).toBe('string');
        }
      });
    });
    
    describe('期望格式示例', () => {
      it('所有解析错误都应该包含期望格式示例', () => {
        const testCases = [
          '{ invalid json }',
          '{ "messageType": "work_submission" }',
          JSON.stringify({ messageType: 'invalid_type', sender: 'test' })
        ];
        
        testCases.forEach(testCase => {
          const result = parser.parse(testCase);
          
          expect('error' in result).toBe(true);
          if ('error' in result) {
            expect(result.expectedFormat).toBeDefined();
            if (result.expectedFormat) {
              expect(result.expectedFormat).toContain('messageType');
              expect(result.expectedFormat).toContain('sender');
              expect(result.expectedFormat).toContain('receiver');
              expect(result.expectedFormat).toContain('content');
              expect(result.expectedFormat).toContain('metadata');
            }
          }
        });
      });
      
      it('期望格式示例应该是有效的JSON', () => {
        const invalidJson = '{ invalid }';
        const result = parser.parse(invalidJson);
        
        expect('error' in result).toBe(true);
        if ('error' in result && result.expectedFormat) {
          // 期望格式应该可以被解析
          expect(() => JSON.parse(result.expectedFormat || '')).not.toThrow();
        }
      });
    });
    
    describe('综合错误场景', () => {
      it('应该处理多个错误并提供综合建议', () => {
        const multipleErrors = {
          messageType: 'invalid_type',
          sender: '',
          receiver: [],
          content: { text: 123 }, // 错误类型
          metadata: {
            timestamp: 'invalid-date',
            requiresResponse: 'yes', // 错误类型
            priority: 'urgent' // 无效值
          }
        };
        
        const result = parser.parse(JSON.stringify(multipleErrors));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBeDefined();
          expect(result.suggestion).toBeDefined();
          expect(result.context).toBeDefined();
          expect(result.expectedFormat).toBeDefined();
          
          // 建议应该提供有用的信息
          if (result.suggestion) {
            expect(result.suggestion.length).toBeGreaterThan(10);
          }
        }
      });
      
      it('应该为复杂的嵌套错误提供清晰的指导', () => {
        const nestedError = {
          messageType: 'work_submission',
          sender: 'writer_1',
          receiver: 'supervisor_ai',
          content: {
            // 缺少 text 字段
            attachments: 'not-an-array' // 错误类型
          },
          metadata: {
            timestamp: '2024-01-15T10:30:00Z',
            requiresResponse: true,
            priority: 'high',
            tags: 'not-an-array' // 错误类型
          }
        };
        
        const result = parser.parse(JSON.stringify(nestedError));
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('content.text');
          expect(result.suggestion).toBeDefined();
          expect(result.expectedFormat).toBeDefined();
        }
      });
    });
  });
});
