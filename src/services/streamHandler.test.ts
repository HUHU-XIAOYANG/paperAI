/**
 * StreamHandler单元测试
 * 
 * 测试流式输出处理器的核心功能：
 * - 会话创建和管理
 * - 数据块处理
 * - 订阅机制
 * - 会话清理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamHandler } from './streamHandler';
import type { StreamSession } from '../types/message.types';

describe('StreamHandler', () => {
  let handler: StreamHandler;

  beforeEach(() => {
    handler = new StreamHandler();
  });

  describe('startStream', () => {
    it('should create a new stream session', () => {
      const agentId = 'writer_1';
      const session = handler.startStream(agentId);

      expect(session).toBeDefined();
      expect(session.id).toContain(agentId);
      expect(session.agentId).toBe(agentId);
      expect(session.isActive).toBe(true);
      expect(session.buffer).toBe('');
      expect(session.startTime).toBeInstanceOf(Date);
    });

    it('should generate unique session IDs', () => {
      const session1 = handler.startStream('agent_1');
      handler.endStream(session1.id);
      
      const session2 = handler.startStream('agent_1');
      
      expect(session1.id).not.toBe(session2.id);
    });

    it('should throw error if agent already has active session', () => {
      const agentId = 'writer_1';
      handler.startStream(agentId);

      expect(() => {
        handler.startStream(agentId);
      }).toThrow(/already has an active stream session/);
    });

    it('should allow starting new session after previous one ended', () => {
      const agentId = 'writer_1';
      const session1 = handler.startStream(agentId);
      handler.endStream(session1.id);

      const session2 = handler.startStream(agentId);
      
      expect(session2).toBeDefined();
      expect(session2.agentId).toBe(agentId);
      expect(session2.isActive).toBe(true);
    });
  });

  describe('handleStreamChunk', () => {
    it('should append chunk to session buffer', () => {
      const session = handler.startStream('writer_1');
      
      handler.handleStreamChunk(session.id, 'Hello ');
      handler.handleStreamChunk(session.id, 'World');

      const updatedSession = handler.getSession(session.id);
      expect(updatedSession?.buffer).toBe('Hello World');
    });

    it('should throw error if session does not exist', () => {
      expect(() => {
        handler.handleStreamChunk('nonexistent_session', 'chunk');
      }).toThrow(/Stream session not found/);
    });

    it('should throw error if session is not active', () => {
      const session = handler.startStream('writer_1');
      handler.endStream(session.id);

      expect(() => {
        handler.handleStreamChunk(session.id, 'chunk');
      }).toThrow(/Stream session is not active/);
    });

    it('should notify subscribers when chunk is received', () => {
      const session = handler.startStream('writer_1');
      const callback = vi.fn();
      
      handler.subscribeToStream(session.id, callback);
      handler.handleStreamChunk(session.id, 'test chunk');

      expect(callback).toHaveBeenCalledWith('test chunk', false);
    });
  });

  describe('endStream', () => {
    it('should mark session as inactive', () => {
      const session = handler.startStream('writer_1');
      handler.endStream(session.id);

      const updatedSession = handler.getSession(session.id);
      expect(updatedSession?.isActive).toBe(false);
    });

    it('should throw error if session does not exist', () => {
      expect(() => {
        handler.endStream('nonexistent_session');
      }).toThrow(/Stream session not found/);
    });

    it('should notify subscribers that stream is complete', () => {
      const session = handler.startStream('writer_1');
      const callback = vi.fn();
      
      handler.subscribeToStream(session.id, callback);
      handler.endStream(session.id);

      expect(callback).toHaveBeenCalledWith('', true);
    });
  });

  describe('subscribeToStream', () => {
    it('should call callback when new chunks arrive', () => {
      const session = handler.startStream('writer_1');
      const callback = vi.fn();
      
      handler.subscribeToStream(session.id, callback);
      
      handler.handleStreamChunk(session.id, 'chunk1');
      handler.handleStreamChunk(session.id, 'chunk2');

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, 'chunk1', false);
      expect(callback).toHaveBeenNthCalledWith(2, 'chunk2', false);
    });

    it('should send existing buffer to new subscriber', () => {
      const session = handler.startStream('writer_1');
      
      handler.handleStreamChunk(session.id, 'existing content');
      
      const callback = vi.fn();
      handler.subscribeToStream(session.id, callback);

      expect(callback).toHaveBeenCalledWith('existing content', false);
    });

    it('should throw error if session does not exist', () => {
      expect(() => {
        handler.subscribeToStream('nonexistent_session', vi.fn());
      }).toThrow(/Stream session not found/);
    });

    it('should support multiple subscribers', () => {
      const session = handler.startStream('writer_1');
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      handler.subscribeToStream(session.id, callback1);
      handler.subscribeToStream(session.id, callback2);
      
      handler.handleStreamChunk(session.id, 'test');

      expect(callback1).toHaveBeenCalledWith('test', false);
      expect(callback2).toHaveBeenCalledWith('test', false);
    });

    it('should return unsubscribe function', () => {
      const session = handler.startStream('writer_1');
      const callback = vi.fn();
      
      const unsubscribe = handler.subscribeToStream(session.id, callback);
      unsubscribe();
      
      handler.handleStreamChunk(session.id, 'test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in subscriber callbacks gracefully', () => {
      const session = handler.startStream('writer_1');
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = vi.fn();
      
      handler.subscribeToStream(session.id, errorCallback);
      handler.subscribeToStream(session.id, normalCallback);
      
      // Should not throw, and normal callback should still be called
      expect(() => {
        handler.handleStreamChunk(session.id, 'test');
      }).not.toThrow();
      
      expect(normalCallback).toHaveBeenCalledWith('test', false);
    });
  });

  describe('getSession', () => {
    it('should return session by ID', () => {
      const session = handler.startStream('writer_1');
      const retrieved = handler.getSession(session.id);

      expect(retrieved).toBe(session);
    });

    it('should return undefined for nonexistent session', () => {
      const retrieved = handler.getSession('nonexistent_session');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getActiveSessionByAgent', () => {
    it('should return active session for agent', () => {
      const session = handler.startStream('writer_1');
      const retrieved = handler.getActiveSessionByAgent('writer_1');

      expect(retrieved).toBe(session);
    });

    it('should return undefined if agent has no active session', () => {
      const retrieved = handler.getActiveSessionByAgent('writer_1');

      expect(retrieved).toBeUndefined();
    });

    it('should return undefined if agent session is ended', () => {
      const session = handler.startStream('writer_1');
      handler.endStream(session.id);
      
      const retrieved = handler.getActiveSessionByAgent('writer_1');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions', () => {
      const session1 = handler.startStream('writer_1');
      const session2 = handler.startStream('writer_2');
      handler.startStream('writer_3');

      handler.endStream(session1.id);

      const activeSessions = handler.getActiveSessions();

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.find(s => s.id === session2.id)).toBeDefined();
    });

    it('should return empty array if no active sessions', () => {
      const activeSessions = handler.getActiveSessions();

      expect(activeSessions).toEqual([]);
    });
  });

  describe('cleanupInactiveSessions', () => {
    it('should remove inactive sessions', () => {
      const session1 = handler.startStream('writer_1');
      const session2 = handler.startStream('writer_2');
      
      handler.endStream(session1.id);
      
      const cleaned = handler.cleanupInactiveSessions();

      expect(cleaned).toBe(1);
      expect(handler.getSession(session1.id)).toBeUndefined();
      expect(handler.getSession(session2.id)).toBeDefined();
    });

    it('should not remove active sessions', () => {
      handler.startStream('writer_1');
      handler.startStream('writer_2');
      
      const cleaned = handler.cleanupInactiveSessions();

      expect(cleaned).toBe(0);
      expect(handler.getActiveSessions()).toHaveLength(2);
    });

    it('should return 0 if no sessions to clean', () => {
      const cleaned = handler.cleanupInactiveSessions();

      expect(cleaned).toBe(0);
    });
  });

  describe('clearAllSessions', () => {
    it('should remove all sessions', () => {
      handler.startStream('writer_1');
      handler.startStream('writer_2');
      
      handler.clearAllSessions();

      expect(handler.getActiveSessions()).toEqual([]);
    });

    it('should remove all subscribers', () => {
      const session = handler.startStream('writer_1');
      const callback = vi.fn();
      
      handler.subscribeToStream(session.id, callback);
      handler.clearAllSessions();
      
      // Create new session with same agent
      const newSession = handler.startStream('writer_1');
      handler.handleStreamChunk(newSession.id, 'test');

      // Old callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete streaming workflow', () => {
      const agentId = 'writer_1';
      const chunks: string[] = [];
      let isComplete = false;

      // Start session
      const session = handler.startStream(agentId);

      // Subscribe
      handler.subscribeToStream(session.id, (chunk, complete) => {
        if (chunk) chunks.push(chunk);
        if (complete) isComplete = true;
      });

      // Send chunks
      handler.handleStreamChunk(session.id, 'Hello ');
      handler.handleStreamChunk(session.id, 'World');
      handler.handleStreamChunk(session.id, '!');

      // End stream
      handler.endStream(session.id);

      expect(chunks).toEqual(['Hello ', 'World', '!']);
      expect(isComplete).toBe(true);
      expect(handler.getSession(session.id)?.buffer).toBe('Hello World!');
    });

    it('should handle multiple concurrent streams', () => {
      const session1 = handler.startStream('writer_1');
      const session2 = handler.startStream('writer_2');
      
      const chunks1: string[] = [];
      const chunks2: string[] = [];

      handler.subscribeToStream(session1.id, (chunk) => {
        if (chunk) chunks1.push(chunk);
      });

      handler.subscribeToStream(session2.id, (chunk) => {
        if (chunk) chunks2.push(chunk);
      });

      handler.handleStreamChunk(session1.id, 'A');
      handler.handleStreamChunk(session2.id, '1');
      handler.handleStreamChunk(session1.id, 'B');
      handler.handleStreamChunk(session2.id, '2');

      expect(chunks1).toEqual(['A', 'B']);
      expect(chunks2).toEqual(['1', '2']);
    });

    it('should handle late subscribers receiving full buffer', () => {
      const session = handler.startStream('writer_1');
      
      handler.handleStreamChunk(session.id, 'Part 1. ');
      handler.handleStreamChunk(session.id, 'Part 2. ');
      
      const lateCallback = vi.fn();
      handler.subscribeToStream(session.id, lateCallback);

      // Late subscriber should receive full buffer immediately
      expect(lateCallback).toHaveBeenCalledWith('Part 1. Part 2. ', false);
      
      // And continue receiving new chunks
      handler.handleStreamChunk(session.id, 'Part 3.');
      expect(lateCallback).toHaveBeenCalledWith('Part 3.', false);
    });
  });
});
