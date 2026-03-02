

# Supervisor AI服务文档

## 概述

Supervisor AI是Agent Swarm写作系统的监管层组件，负责质量检查和流程监控。它验证AI输出格式、记录返工次数、触发退稿机制，并检测人手不足情况。

## 核心职责

1. **输出格式验证** - 验证所有AI输出是否符合Output_Format规范
2. **返工机制** - 对不合规输出要求AI返工，并记录返工次数
3. **人手不足检测** - 检测单个AI返工次数超过阈值或整体进度延迟
4. **质量检查报告** - 生成包含工作状态、返工情况和改进建议的报告
5. **动态角色增加触发** - 通知Decision AI执行动态角色增加

## 架构位置

```
┌─────────────────┐
│   Decision AI   │ ← 通知增加角色
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Supervisor AI  │ ← 本服务
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Writing Team   │
│  Review Team    │
└─────────────────┘
```

## 主要功能

### 1. 输出格式验证

验证AI输出是否符合Output_Format规范。

**需求**: 6.1

```typescript
const result = await supervisorAI.validateOutputFormat(
  aiOutput,
  'writer_1'
);

if (!result.isValid) {
  console.log('格式错误:', result.errors);
  // 要求返工
}
```

**验证项目**:
- JSON格式有效性
- 必需字段完整性（messageType, sender, receiver, content, metadata）
- 字段类型正确性
- 字段值有效性（非空、有效枚举值等）

### 2. 返工机制

对不合规输出要求AI返工，并记录返工次数。

**需求**: 6.2, 6.3

```typescript
const reworkMessage = await supervisorAI.requestRework(
  'writer_1',
  '输出格式不符合规范，缺少receiver字段'
);

// 查看返工记录
const records = supervisorAI.getReworkRecords('writer_1');
console.log('返工次数:', records[0].count);
```

**返工阈值**:
- **警告阈值**: 2次 - 触发人手不足检测
- **退稿阈值**: 3次 - 触发退稿机制（由RejectionMechanism处理）

### 3. 人手不足检测

检测以下情况并分析原因：
- 单个AI返工次数超过2次
- 整体进度延迟（平均返工率过高）

**需求**: 6.6, 6.7

```typescript
// 仅检测
const shortageResult = await supervisorAI.detectShortage();

if (shortageResult.hasShortage) {
  console.log('原因:', shortageResult.reason);
  console.log('建议角色:', shortageResult.suggestedRoleName);
}

// 检测并通知Decision AI
const notified = await supervisorAI.detectShortageAndNotify();
```

**建议角色类型**:
- 格式问题 → 格式专家
- 质量问题 → 质量审查专家
- 工作量问题 → 辅助写作AI

### 4. 质量检查报告

生成包含所有AI工作状态、返工情况和改进建议的报告。

**需求**: 6.5

```typescript
const report = await supervisorAI.generateQualityReport();

console.log('整体状态:', report.overallStatus); // 'good' | 'warning' | 'critical'
console.log('瓶颈:', report.bottlenecks);
console.log('建议:', report.recommendations);
```

**报告内容**:
- 活跃AI数量
- 总消息数和返工次数
- 各AI的返工记录
- 整体状态评估（good/warning/critical）
- 瓶颈分析
- 改进建议
- 人手不足检测结果

## 数据结构

### FormatValidationResult

```typescript
interface FormatValidationResult {
  isValid: boolean;           // 格式是否有效
  errors: string[];           // 错误列表
  warnings: string[];         // 警告列表
  shouldRework: boolean;      // 是否需要返工
}
```

### ReworkRecord

```typescript
interface ReworkRecord {
  agentId: string;            // Agent ID
  count: number;              // 返工次数
  reasons: string[];          // 返工原因列表
  lastReworkTime: Date;       // 最后返工时间
}
```

### ShortageDetectionResult

```typescript
interface ShortageDetectionResult {
  hasShortage: boolean;       // 是否人手不足
  reason: string;             // 原因描述
  affectedAgents: string[];   // 受影响的AI列表
  suggestedRoleType?: string; // 建议的角色类型
  suggestedRoleName?: string; // 建议的角色名称
  priority: 'low' | 'medium' | 'high'; // 优先级
}
```

### QualityReport

```typescript
interface QualityReport {
  timestamp: Date;                      // 报告时间
  activeAgentsCount: number;            // 活跃AI数量
  totalMessages: number;                // 总消息数
  totalRevisions: number;               // 总返工次数
  reworkRecords: ReworkRecord[];        // 返工记录列表
  overallStatus: 'good' | 'warning' | 'critical'; // 整体状态
  bottlenecks: string[];                // 瓶颈列表
  recommendations: string[];            // 建议列表
  shortageDetection?: ShortageDetectionResult; // 人手不足检测结果
}
```

## 工作流程

### 典型工作流程

```
1. AI提交工作
   ↓
2. Supervisor AI验证格式
   ↓
3a. 格式正确 → 批准
   ↓
3b. 格式错误 → 要求返工
   ↓
4. 记录返工次数
   ↓
5. 检查返工次数
   ↓
6a. 次数正常 → 继续
   ↓
6b. 次数超过阈值 → 触发人手不足检测
   ↓
7. 通知Decision AI增加角色
```

### 质量检查流程

```
1. 收集所有AI的工作状态
   ↓
2. 统计返工次数和原因
   ↓
3. 检测人手不足情况
   ↓
4. 评估整体状态
   ↓
5. 分析瓶颈
   ↓
6. 生成改进建议
   ↓
7. 输出质量报告
```

## 集成示例

### 与FormatParser集成

```typescript
import { formatParser } from './formatParser';
import { createSupervisorAI } from './supervisorAI';

const supervisorAI = createSupervisorAI(aiClient, agentManager, decisionAI);

// Supervisor AI内部使用FormatParser验证格式
const result = await supervisorAI.validateOutputFormat(output, senderId);
```

### 与AgentManager集成

```typescript
// Supervisor AI更新Agent的返工次数
await supervisorAI.requestRework('writer_1', '格式错误');

// AgentManager中的Agent状态会自动更新
const agent = agentManager.getAgent('writer_1');
console.log('返工次数:', agent.state.revisionCount);
```

### 与DecisionAI集成

```typescript
// Supervisor AI检测到人手不足时通知Decision AI
const notified = await supervisorAI.detectShortageAndNotify();

// Decision AI会决策是否增加新角色
if (notified) {
  console.log('Decision AI已收到通知，将决策是否增加新角色');
}
```

## 配置选项

### 返工阈值

```typescript
// 在SupervisorAI类中定义
private readonly REWORK_THRESHOLD = 2;      // 触发人手不足检测
private readonly REJECTION_THRESHOLD = 3;   // 触发退稿机制
```

可以通过修改这些常量来调整阈值。

### 提示词模板

Supervisor AI使用以下提示词模板（位于`prompts/supervisor_ai.yaml`）：

- `format_validation_template` - 格式验证
- `quality_check_template` - 质量检查
- `shortage_detection_template` - 人手不足检测
- `rework_notification_template` - 返工通知

## 错误处理

### 格式验证失败

```typescript
const result = await supervisorAI.validateOutputFormat(output, senderId);

if (!result.isValid) {
  // 自动要求返工
  await supervisorAI.requestRework(senderId, result.errors.join('; '));
}
```

### AI调用失败

如果AI调用失败（如生成返工通知时），Supervisor AI会使用默认消息：

```typescript
// 默认返工消息包含：
// - 返工次数
// - 问题描述
// - 改进建议
// - 如果超过阈值，提示寻求支持
```

### Decision AI通知失败

```typescript
try {
  const notified = await supervisorAI.detectShortageAndNotify();
} catch (error) {
  console.error('通知Decision AI失败:', error);
  // 系统会记录错误但继续运行
}
```

## 性能考虑

### 返工记录存储

- 使用Map存储返工记录，O(1)查询时间
- 记录在内存中，重启后清空
- 如需持久化，可扩展为使用数据库

### 人手不足检测

- 检测操作较轻量，主要是遍历返工记录
- 时间复杂度: O(n)，n为活跃AI数量
- 建议在返工次数超过阈值时触发，而非定期检测

### 质量报告生成

- 报告生成涉及统计和分析，相对较重
- 建议按需生成，而非实时生成
- 可以定期生成（如每小时）并缓存结果

## 测试

### 单元测试

```bash
npm test supervisorAI.test.ts
```

测试覆盖：
- 格式验证（有效/无效输出）
- 返工机制（记录、累计、通知）
- 人手不足检测（阈值触发、建议角色）
- 质量报告生成（状态评估、瓶颈分析）

### 集成测试

建议测试场景：
1. 完整工作流程（提交→验证→返工→检测→通知）
2. 多个AI并发返工
3. 退稿机制触发
4. 动态角色增加流程

## 扩展建议

### 1. 持久化返工记录

```typescript
// 扩展为使用数据库存储
class PersistentSupervisorAI extends SupervisorAI {
  async saveReworkRecord(record: ReworkRecord) {
    await db.reworkRecords.insert(record);
  }
  
  async loadReworkRecords() {
    return await db.reworkRecords.findAll();
  }
}
```

### 2. 更智能的人手不足检测

```typescript
// 使用机器学习预测人手不足
async detectShortageWithML(): Promise<ShortageDetectionResult> {
  const features = this.extractFeatures();
  const prediction = await mlModel.predict(features);
  return this.interpretPrediction(prediction);
}
```

### 3. 实时质量监控

```typescript
// 实时监控质量指标
class RealtimeSupervisorAI extends SupervisorAI {
  startMonitoring(interval: number) {
    setInterval(async () => {
      const report = await this.generateQualityReport();
      this.emitQualityUpdate(report);
    }, interval);
  }
}
```

### 4. 自定义验证规则

```typescript
// 允许用户自定义验证规则
interface ValidationRule {
  name: string;
  validate: (output: string) => ValidationResult;
}

class CustomizableSupervisorAI extends SupervisorAI {
  private customRules: ValidationRule[] = [];
  
  addValidationRule(rule: ValidationRule) {
    this.customRules.push(rule);
  }
}
```

## 相关文档

- [Format Parser文档](./FORMAT_PARSER_README.md) - 输出格式解析
- [Agent Manager文档](./AGENT_MANAGER_README.md) - Agent管理
- [Decision AI文档](./DECISION_AI_README.md) - 决策AI
- [设计文档](../../.kiro/specs/agent-swarm-writing-system/design.md) - 系统架构
- [需求文档](../../.kiro/specs/agent-swarm-writing-system/requirements.md) - 功能需求

## 常见问题

### Q: 返工阈值如何确定？

A: 当前设置为2次触发人手不足检测，3次触发退稿机制。这些值基于以下考虑：
- 1次返工是正常的迭代过程
- 2次返工表明可能存在问题，需要关注
- 3次返工表明严重问题，需要干预

可以根据实际使用情况调整这些阈值。

### Q: 如何处理误判的人手不足？

A: Decision AI会进行二次判断，决定是否真的需要增加角色。如果Decision AI判断不需要，则不会增加新角色。

### Q: 质量报告多久生成一次？

A: 质量报告按需生成，没有固定频率。建议：
- 在关键节点生成（如阶段完成时）
- 定期生成（如每小时）
- 检测到问题时立即生成

### Q: 返工记录会持久化吗？

A: 当前实现中，返工记录存储在内存中，重启后会清空。如需持久化，可以扩展为使用数据库存储。

### Q: 如何自定义验证规则？

A: 当前版本使用FormatParser的标准验证规则。如需自定义，可以：
1. 扩展FormatParser添加新规则
2. 在SupervisorAI中添加额外的验证逻辑
3. 修改提示词模板调整AI的验证行为

## 更新日志

### v1.0.0 (2024-01-15)

- ✅ 实现输出格式验证
- ✅ 实现返工机制
- ✅ 实现人手不足检测
- ✅ 实现质量检查报告生成
- ✅ 集成FormatParser、AgentManager和DecisionAI
- ✅ 完整的单元测试覆盖
- ✅ 使用示例和文档

## 许可证

本项目是Agent Swarm写作系统的一部分。
