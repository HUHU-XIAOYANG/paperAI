/**
 * AI输出格式解析器 (FormatParser)
 * 
 * 本模块实现AI输出格式的解析、格式化和验证功能。
 * 负责在AI输出字符串和结构化消息对象之间进行转换。
 * 
 * @module services/formatParser
 * @see requirements.md - 需求3: AI输出格式规范
 * @see requirements.md - 需求16: AI输出格式解析器
 */

import type { 
  OutputFormat, 
  AgentMessage, 
  MessageType,
  MessageMetadata 
} from '../types/message';

/**
 * 解析后的消息对象
 * 
 * 从AI输出字符串解析后的结构化消息对象。
 * 包含所有必需字段和元数据。
 */
export interface ParsedMessage {
  type: MessageType;
  sender: string;
  receiver: string | string[];
  content: string;
  metadata: MessageMetadata;
}

/**
 * 解析错误对象
 * 
 * 当AI输出不符合OutputFormat规范时返回的错误信息。
 * 包含错误描述、位置和修复建议。
 */
export interface ParseError {
  error: string;
  line?: number;
  column?: number;
  suggestion?: string;
  context?: string; // 错误发生位置的上下文
  expectedFormat?: string; // 期望的格式示例
}

/**
 * 验证结果对象
 * 
 * 格式验证的结果，包含是否有效和错误列表。
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 格式解析器类
 * 
 * 提供AI输出格式的解析、格式化和验证功能。
 * 
 * 主要功能：
 * 1. parse: 将AI输出字符串解析为ParsedMessage对象
 * 2. format: 将AgentMessage对象格式化为字符串
 * 3. validate: 验证AI输出是否符合OutputFormat规范
 * 
 * @class FormatParser
 */
export class FormatParser {
  /**
   * 解析AI输出字符串为结构化消息对象
   * 
   * 将符合OutputFormat规范的JSON字符串解析为ParsedMessage对象。
   * 如果解析失败或格式不符合规范，返回ParseError。
   * 
   * @param output - AI输出的字符串（应为JSON格式）
   * @returns 解析后的消息对象或解析错误
   * 
   * @example
   * ```typescript
   * const parser = new FormatParser();
   * const result = parser.parse(aiOutput);
   * 
   * if ('error' in result) {
   *   console.error('解析失败:', result.error);
   * } else {
   *   console.log('消息类型:', result.type);
   *   console.log('发送者:', result.sender);
   * }
   * ```
   */
  parse(output: string): ParsedMessage | ParseError {
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(output) as OutputFormat;
      
      // 验证必需字段
      const validation = this.validateOutputFormat(parsed);
      if (!validation.isValid) {
        return this.createDetailedParseError(
          `格式验证失败: ${validation.errors[0]}`,
          output,
          validation.errors
        );
      }
      
      // 提取字段并构建ParsedMessage
      const parsedMessage: ParsedMessage = {
        type: parsed.messageType,
        sender: parsed.sender,
        receiver: parsed.receiver,
        content: parsed.content.text,
        metadata: {
          priority: parsed.metadata.priority,
          requiresResponse: parsed.metadata.requiresResponse,
          timestamp: parsed.metadata.timestamp,
          relatedTaskId: undefined,
          attachments: parsed.content.attachments?.map((_, index) => `attachment_${index}`),
          tags: parsed.metadata.tags
        }
      };
      
      return parsedMessage;
      
    } catch (error) {
      // JSON解析失败
      if (error instanceof SyntaxError) {
        return this.createJSONParseError(error, output);
      }
      
      // 其他错误
      return {
        error: `解析失败: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: '请检查输出格式是否正确',
        context: this.getErrorContext(output, 0),
        expectedFormat: this.getExpectedFormatExample()
      };
    }
  }
  
  /**
   * 将AgentMessage对象格式化为OutputFormat字符串
   * 
   * 将系统内部的AgentMessage对象转换为符合OutputFormat规范的JSON字符串。
   * 生成的字符串可以被parse方法重新解析。
   * 
   * @param message - Agent消息对象
   * @returns 格式化后的JSON字符串
   * 
   * @example
   * ```typescript
   * const parser = new FormatParser();
   * const message: AgentMessage = {
   *   id: '123',
   *   type: 'work_submission',
   *   sender: 'writer_1',
   *   receiver: 'supervisor_ai',
   *   content: '我已完成引言部分',
   *   metadata: { ... },
   *   timestamp: new Date()
   * };
   * 
   * const formatted = parser.format(message);
   * console.log(formatted); // 输出JSON字符串
   * ```
   */
  format(message: AgentMessage): string {
    const outputFormat: OutputFormat = {
      messageType: message.type,
      sender: message.sender,
      receiver: message.receiver,
      content: {
        text: message.content,
        attachments: undefined // 简化实现，不包含附件
      },
      metadata: {
        timestamp: message.metadata.timestamp,
        requiresResponse: message.metadata.requiresResponse,
        priority: message.metadata.priority,
        tags: message.metadata.tags
      }
    };
    
    return JSON.stringify(outputFormat, null, 2);
  }
  
  /**
   * 验证AI输出字符串是否符合OutputFormat规范
   * 
   * 检查输出字符串是否：
   * 1. 是有效的JSON格式
   * 2. 包含所有必需字段
   * 3. 字段类型正确
   * 4. 字段值有效
   * 
   * @param output - AI输出的字符串
   * @returns 验证结果对象
   * 
   * @example
   * ```typescript
   * const parser = new FormatParser();
   * const result = parser.validate(aiOutput);
   * 
   * if (result.isValid) {
   *   console.log('格式正确');
   * } else {
   *   console.error('错误:', result.errors);
   *   console.warn('警告:', result.warnings);
   * }
   * ```
   */
  validate(output: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(output) as OutputFormat;
      
      // 验证OutputFormat结构
      const formatValidation = this.validateOutputFormat(parsed);
      errors.push(...formatValidation.errors);
      warnings.push(...formatValidation.warnings);
      
    } catch (error) {
      // JSON解析失败
      if (error instanceof SyntaxError) {
        errors.push(`JSON解析失败: ${error.message}`);
      } else {
        errors.push(`验证失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * 验证OutputFormat对象的结构和字段
   * 
   * 内部方法，用于验证已解析的OutputFormat对象。
   * 
   * @param format - OutputFormat对象
   * @returns 验证结果
   * @private
   */
  private validateOutputFormat(format: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 验证必需字段存在
    if (!format.messageType) {
      errors.push('缺少必需字段 "messageType"');
    }
    if (!format.sender) {
      errors.push('缺少必需字段 "sender"');
    }
    if (!format.receiver) {
      errors.push('缺少必需字段 "receiver"');
    }
    if (!format.content) {
      errors.push('缺少必需字段 "content"');
    }
    if (!format.metadata) {
      errors.push('缺少必需字段 "metadata"');
    }
    
    // 如果缺少必需字段，直接返回
    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }
    
    // 验证messageType有效性
    const validMessageTypes: MessageType[] = [
      'task_assignment',
      'work_submission',
      'feedback_request',
      'feedback_response',
      'discussion',
      'revision_request',
      'approval',
      'rejection'
    ];
    
    if (!validMessageTypes.includes(format.messageType)) {
      errors.push(`无效的messageType: "${format.messageType}"`);
    }
    
    // 验证sender和receiver非空
    if (typeof format.sender === 'string' && format.sender.trim() === '') {
      errors.push('sender不能为空字符串');
    }
    
    if (typeof format.receiver === 'string' && format.receiver.trim() === '') {
      errors.push('receiver不能为空字符串');
    } else if (Array.isArray(format.receiver) && format.receiver.length === 0) {
      errors.push('receiver数组不能为空');
    } else if (Array.isArray(format.receiver)) {
      const emptyReceivers = format.receiver.filter((r: any) => 
        typeof r === 'string' && r.trim() === ''
      );
      if (emptyReceivers.length > 0) {
        errors.push('receiver数组中不能包含空字符串');
      }
    }
    
    // 验证content结构
    if (format.content.text === undefined || format.content.text === null) {
      errors.push('缺少必需字段 "content.text"');
    } else if (typeof format.content.text !== 'string') {
      errors.push('content.text必须是字符串类型');
    } else if (format.content.text.trim() === '') {
      warnings.push('content.text为空字符串');
    }
    
    // 验证metadata结构
    if (!format.metadata.timestamp) {
      errors.push('缺少必需字段 "metadata.timestamp"');
    } else {
      // 验证timestamp是否为有效的ISO 8601格式
      const timestampDate = new Date(format.metadata.timestamp);
      if (isNaN(timestampDate.getTime())) {
        errors.push('metadata.timestamp不是有效的ISO 8601格式');
      }
    }
    
    if (format.metadata.requiresResponse === undefined) {
      errors.push('缺少必需字段 "metadata.requiresResponse"');
    } else if (typeof format.metadata.requiresResponse !== 'boolean') {
      errors.push('metadata.requiresResponse必须是布尔类型');
    }
    
    if (!format.metadata.priority) {
      errors.push('缺少必需字段 "metadata.priority"');
    } else {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(format.metadata.priority)) {
        errors.push(`无效的metadata.priority: "${format.metadata.priority}"`);
      }
    }
    
    // 验证可选字段类型
    if (format.metadata.tags !== undefined && !Array.isArray(format.metadata.tags)) {
      errors.push('metadata.tags必须是数组类型');
    }
    
    if (format.content.attachments !== undefined && !Array.isArray(format.content.attachments)) {
      errors.push('content.attachments必须是数组类型');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 创建详细的JSON解析错误信息
   * 
   * 从SyntaxError中提取位置信息并生成详细的错误报告。
   * 
   * @param error - JSON解析错误
   * @param output - 原始输出字符串
   * @returns 详细的ParseError对象
   * @private
   */
  private createJSONParseError(error: SyntaxError, output: string): ParseError {
    // 尝试从错误消息中提取位置信息
    // 典型的错误消息格式: "Unexpected token } in JSON at position 123"
    const positionMatch = error.message.match(/position (\d+)/);
    const position = positionMatch && positionMatch[1] ? parseInt(positionMatch[1], 10) : 0;
    
    // 计算行号和列号
    const { line, column } = this.getLineAndColumn(output, position);
    
    // 获取错误上下文
    const context = this.getErrorContext(output, position);
    
    // 生成修复建议
    const suggestion = this.generateJSONFixSuggestion(error.message, output, position);
    
    return {
      error: `JSON解析失败: ${error.message}`,
      line,
      column,
      context,
      suggestion,
      expectedFormat: this.getExpectedFormatExample()
    };
  }

  /**
   * 创建详细的格式验证错误信息
   * 
   * 为格式验证失败生成详细的错误报告。
   * 
   * @param mainError - 主要错误消息
   * @param output - 原始输出字符串
   * @param allErrors - 所有验证错误列表
   * @returns 详细的ParseError对象
   * @private
   */
  private createDetailedParseError(
    mainError: string,
    output: string,
    allErrors: string[]
  ): ParseError {
    // 生成针对性的修复建议
    const suggestion = this.generateValidationFixSuggestion(allErrors);
    
    // 获取相关的上下文
    const context = this.getValidationContext(output, allErrors);
    
    return {
      error: mainError,
      suggestion,
      context,
      expectedFormat: this.getExpectedFormatExample()
    };
  }

  /**
   * 计算字符串中指定位置的行号和列号
   * 
   * @param text - 文本字符串
   * @param position - 字符位置
   * @returns 行号和列号（从1开始）
   * @private
   */
  private getLineAndColumn(text: string, position: number): { line: number; column: number } {
    const lines = text.substring(0, position).split('\n');
    const lastLine = lines[lines.length - 1];
    return {
      line: lines.length,
      column: lastLine ? lastLine.length + 1 : 1
    };
  }

  /**
   * 获取错误位置的上下文
   * 
   * 返回错误位置前后的文本片段，帮助定位问题。
   * 
   * @param text - 文本字符串
   * @param position - 错误位置
   * @param contextSize - 上下文大小（字符数）
   * @returns 上下文字符串
   * @private
   */
  private getErrorContext(text: string, position: number, contextSize: number = 50): string {
    const start = Math.max(0, position - contextSize);
    const end = Math.min(text.length, position + contextSize);
    const context = text.substring(start, end);
    
    // 添加位置标记
    const relativePosition = position - start;
    const marker = ' '.repeat(relativePosition) + '^';
    
    return `${context}\n${marker}`;
  }

  /**
   * 生成JSON解析错误的修复建议
   * 
   * 根据错误类型提供具体的修复建议。
   * 
   * @param errorMessage - 错误消息
   * @param output - 原始输出
   * @param position - 错误位置
   * @returns 修复建议
   * @private
   */
  private generateJSONFixSuggestion(
    errorMessage: string,
    output: string,
    position: number
  ): string {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('unexpected token')) {
      const char = output[position];
      return `在位置 ${position} 发现意外的字符 "${char}"。请检查：\n` +
             `1. 是否缺少引号或逗号\n` +
             `2. 是否有多余的逗号或括号\n` +
             `3. 字符串是否正确转义`;
    }
    
    if (lowerError.includes('unexpected end')) {
      return `JSON结构不完整。请检查：\n` +
             `1. 是否缺少闭合的括号 } 或 ]\n` +
             `2. 是否缺少必需的字段\n` +
             `3. 最后一个字段后是否有多余的逗号`;
    }
    
    if (lowerError.includes('expected')) {
      return `JSON格式不正确。请确保：\n` +
             `1. 所有字符串都用双引号包围\n` +
             `2. 对象的键值对用冒号分隔\n` +
             `3. 多个项目用逗号分隔`;
    }
    
    return `请确保输出是有效的JSON格式。常见问题：\n` +
           `1. 使用双引号而非单引号\n` +
           `2. 不要在最后一个元素后添加逗号\n` +
           `3. 确保所有括号正确配对`;
  }

  /**
   * 生成格式验证错误的修复建议
   * 
   * 根据验证错误列表提供针对性的修复建议。
   * 
   * @param errors - 验证错误列表
   * @returns 修复建议
   * @private
   */
  private generateValidationFixSuggestion(errors: string[]): string {
    const suggestions: string[] = [];
    
    // 检查缺少字段的错误
    const missingFields = errors
      .filter(e => e.includes('缺少必需字段'))
      .map(e => e.match(/"([^"]+)"/)?.[1])
      .filter(Boolean);
    
    if (missingFields.length > 0) {
      suggestions.push(`请添加缺少的必需字段: ${missingFields.join(', ')}`);
    }
    
    // 检查无效值的错误
    const invalidValues = errors.filter(e => e.includes('无效的'));
    if (invalidValues.length > 0) {
      suggestions.push(`请修正无效的字段值。参考下方的期望格式示例。`);
    }
    
    // 检查类型错误
    const typeErrors = errors.filter(e => e.includes('必须是') || e.includes('类型'));
    if (typeErrors.length > 0) {
      suggestions.push(`请确保字段类型正确（字符串、布尔值、数组等）`);
    }
    
    // 检查空值错误
    const emptyErrors = errors.filter(e => e.includes('不能为空'));
    if (emptyErrors.length > 0) {
      suggestions.push(`请确保所有必需字段都有非空值`);
    }
    
    if (suggestions.length === 0) {
      suggestions.push('请确保输出符合OutputFormat规范，参考下方的期望格式示例');
    }
    
    return suggestions.join('\n');
  }

  /**
   * 获取验证错误的上下文
   * 
   * 为验证错误提供相关的上下文信息。
   * 
   * @param output - 原始输出
   * @param errors - 错误列表
   * @returns 上下文字符串
   * @private
   */
  private getValidationContext(output: string, errors: string[]): string {
    try {
      const parsed = JSON.parse(output);
      const contextParts: string[] = [];
      
      // 显示当前的顶层字段
      const fields = Object.keys(parsed);
      contextParts.push(`当前包含的字段: ${fields.join(', ')}`);
      
      // 如果有messageType，显示它
      if (parsed.messageType) {
        contextParts.push(`messageType: "${parsed.messageType}"`);
      }
      
      return contextParts.join('\n');
    } catch {
      return '无法解析输出以提供上下文';
    }
  }

  /**
   * 获取期望格式的示例
   * 
   * 返回一个完整的OutputFormat示例，帮助用户理解正确的格式。
   * 
   * @returns 格式示例字符串
   * @private
   */
  private getExpectedFormatExample(): string {
    return `{
  "messageType": "work_submission",
  "sender": "writer_1",
  "receiver": "supervisor_ai",
  "content": {
    "text": "消息内容文本"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requiresResponse": true,
    "priority": "high"
  }
}`;
  }
}

/**
 * 默认导出FormatParser实例
 * 
 * 提供一个单例实例供全局使用。
 */
export const formatParser = new FormatParser();
