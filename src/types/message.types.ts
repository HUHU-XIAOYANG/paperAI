/**
 * 消息解析和处理相关类型定义
 * 
 * 本模块定义了消息解析、错误处理和流式输出相关的类型。
 * 这些类型主要用于FormatParser和StreamHandler组件。
 * 
 * @module types/message.types
 * @see design.md - 组件和接口 > Format Parser, Stream Handler
 */

import type { MessageType, MessageMetadata } from './message';

/**
 * 解析后的消息接口
 * 
 * FormatParser将AI的字符串输出解析为此结构。
 * 这是OutputFormat的简化版本，用于内部处理。
 * 
 * @interface ParsedMessage
 */
export interface ParsedMessage {
  /** 消息类型 */
  type: MessageType;
  
  /** 发送者Agent ID */
  sender: string;
  
  /** 接收者Agent ID */
  receiver: string | string[];
  
  /** 消息内容文本 */
  content: string;
  
  /** 消息元数据 */
  metadata: MessageMetadata;
}

/**
 * 解析错误接口
 * 
 * 当AI输出不符合OutputFormat规范时，FormatParser返回此错误对象。
 * 包含描述性错误信息和可选的修复建议。
 * 
 * @interface ParseError
 * @see requirements.md - 需求16.2: 返回描述性错误信息
 */
export interface ParseError {
  /** 错误描述 */
  error: string;
  
  /** 错误所在行号（如果可确定） */
  line?: number;
  
  /** 错误所在列号（如果可确定） */
  column?: number;
  
  /** 修复建议 */
  suggestion?: string;
}

/**
 * 流式会话接口
 * 
 * StreamHandler为每个AI的流式输出创建一个会话。
 * 会话跟踪流式输出的状态和缓冲区。
 * 
 * @interface StreamSession
 * @see requirements.md - 需求17: 流式输出显示
 */
export interface StreamSession {
  /** 会话唯一标识符 */
  id: string;
  
  /** 关联的Agent ID */
  agentId: string;
  
  /** 会话开始时间 */
  startTime: Date;
  
  /** 输出缓冲区，累积接收到的所有数据块 */
  buffer: string;
  
  /** 会话是否仍在活跃状态 */
  isActive: boolean;
}

/**
 * 流式输出回调函数类型
 * 
 * UI组件订阅流式输出时提供的回调函数。
 * 每当接收到新的数据块时，回调函数会被调用。
 * 
 * @callback StreamCallback
 * @param {string} chunk - 新接收到的数据块
 * @param {boolean} isComplete - 流式输出是否已完成
 */
export type StreamCallback = (chunk: string, isComplete: boolean) => void;

/**
 * 消息回调函数类型
 * 
 * Agent订阅消息时提供的回调函数。
 * 每当接收到新消息时，回调函数会被调用。
 * 
 * @callback MessageCallback
 * @param {ParsedMessage} message - 接收到的消息
 */
export type MessageCallback = (message: ParsedMessage) => void;
