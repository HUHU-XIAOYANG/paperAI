# Rejection Mechanism (退稿机制)

## 概述

Rejection Mechanism是Agent Swarm写作系统的核心组件之一，负责在论文被多次退稿时自动诊断问题、修复流程并重启写作过程。当退稿次数达到阈值（默认3次）时，系统会自动触发退稿机制，分析退稿原因、识别流程瓶颈、执行修复动作，并在修复完成后重新启动写作流程。

## 核心功能

### 1. 退稿触发检测

- **功能**: 检测退稿次数是否达到触发阈值
- **阈值**: 默认为3次退稿
- **需求**: 9.1 - 当论文被退稿次数达到3次时触发Rejection_Mechanism

### 2. 退稿原因分析

- **功能**: 分析退稿的具体原因和流程问题
- **分析维度**:
  - **格式问题** (format): 输出不符合Output_Format规范
  - **质量问题** (quality): 内容质量不达标
  - **完整性问题** (completeness): 输出不完整，缺少必要内容
  - **连贯性问题** (coherence): 论文整体逻辑不连贯
- **需求**: 9.2 - 分析退稿原因和流程问题

### 3. 流程瓶颈识别

- **功能**: 识别导致退稿的流程瓶颈
- **瓶颈类型**:
  - **人手不足** (insufficient_personnel): AI工作负载过重
  - **技能差距** (skill_gap): 团队缺少特定技能
  - **沟通问题** (communication_breakdown): AI之间协作不足
- **需求**: 9.3 - 检测是否因人手不足导致退稿

### 4. 流程修复

- **功能**: 执行修复动作解决已识别的问题
- **修复动作类型**:
  - **增加角色** (add_agent): 动态增加新的AI角色
  - **重新分配任务** (reassign_task): 调整任务分配
  - **修改提示词** (modify_prompt): 优化提示词模板
  - **调整工作流程** (adjust_workflow): 改进协作流程
- **需求**: 9.4, 9.5, 9.6 - 修复流程问题并生成改进建议

### 5. 流程重启

- **功能**: 修复完成后重新启动写作流程
- **选项**:
  - 保留历史记录: 保存之前的工作历史
  - 保留修订信息: 保留返工次数等修订数据
- **需求**: 9.7 - 重启流程并保留历史记录和修订信息

## 数据结构

### RejectionReason (退稿原因)

```typescript
interface RejectionReason {
  category: 'format' | 'quality' | 'completeness' | 'coherence';
  description: string;
  affectedSections: string[];
  severity: 'minor' | 'major' | 'critical';
}
```

### Bottleneck (流程瓶颈)

```typescript
interface Bottleneck {
  type: 'insufficient_personnel' | 'skill_gap' | 'communication_breakdown';
  description: string;
  affectedAgents: string[];
  suggestedRoleType?: string;
}
```

### Action (修复动作)

```typescript
interface Action {
  type: 'add_agent' | 'reassign_task' | 'modify_prompt' | 'adjust_workflow';
  description: string;
  priority: number;
  targetAgent?: string;
  newRoleType?: string;
}
```

### RejectionAnalysis (退稿分析结果)

```typescript
interface RejectionAnalysis {
  rejectionCount: number;
  reasons: RejectionReason[];
  bottlenecks: Bottleneck[];
  suggestedActions: Action[];
  timestamp: Date;
}
```

## 使用方法

### 基本使用

```typescript
import { createRejectionMechanism } from './rejectionMechanism';

// 创建Rejection Mechanism实例
const rejectionMechanism = createRejectionMechanism(
  aiClient,
  supervisorAI,
  decisionAI,
  agentManager
);

// 检测是否应该触发退稿机制
if (rejectionMechanism.shouldTrigger(rejectionCount)) {
  // 1. 分析退稿原因
  const analysis = await rejectionMechanism.analyzeRejection(
    rejectionCount,
    rejectionMessages
  );

  // 2. 修复流程问题
  const fixResult = await rejectionMechanism.fixProcess(analysis);

  // 3. 重启写作流程
  const restartResult = await rejectionMechanism.restartProcess(true, true);
}
```

### 退稿触发检测

```typescript
// 检测退稿次数是否达到阈值
const shouldTrigger = rejectionMechanism.shouldTrigger(3); // true
```

### 退稿原因分析

```typescript
// 分析退稿原因和流程问题
const analysis = await rejectionMechanism.analyzeRejection(
  rejectionCount,
  rejectionMessages
);

console.log('退稿原因:', analysis.reasons);
console.log('流程瓶颈:', analysis.bottlenecks);
console.log('建议动作:', analysis.suggestedActions);
```

### 流程修复

```typescript
// 执行修复动作
const fixResult = await rejectionMechanism.fixProcess(analysis);

if (fixResult.success) {
  console.log('修复成功，新增AI:', fixResult.newAgentsAdded);
} else {
  console.log('修复失败，错误:', fixResult.errors);
}
```

### 流程重启

```typescript
// 重启流程（保留历史记录和修订信息）
const restartResult = await rejectionMechanism.restartProcess(true, true);

console.log('新流程ID:', restartResult.newProcessId);
```

### 退稿历史管理

```typescript
// 获取退稿历史记录
const history = rejectionMechanism.getRejectionHistory();

// 清除退稿历史记录
rejectionMechanism.clearRejectionHistory();
```

## 工作流程

### 完整的退稿机制流程

```
1. 检测退稿次数
   ↓
2. 触发退稿机制（次数 >= 3）
   ↓
3. 分析退稿原因
   - 收集返工记录
   - 分析退稿消息
   - 识别问题类别
   ↓
4. 识别流程瓶颈
   - 检测人手不足
   - 检测技能差距
   - 检测沟通问题
   ↓
5. 生成修复建议
   - 按优先级排序
   - 针对性解决方案
   ↓
6. 执行修复动作
   - 增加新角色
   - 重新分配任务
   - 调整工作流程
   ↓
7. 重启写作流程
   - 重置Agent状态
   - 保留历史记录
   - 生成新流程ID
```

## 与其他组件的集成

### SupervisorAI集成

Rejection Mechanism依赖SupervisorAI提供的返工记录和质量检查报告：

```typescript
// 获取返工记录
const reworkRecords = supervisorAI.getReworkRecords();

// 获取质量检查报告
const qualityReport = await supervisorAI.generateQualityReport();

// 清除返工记录（重启时）
supervisorAI.clearReworkRecords();
```

### DecisionAI集成

当检测到人手不足时，Rejection Mechanism会通知DecisionAI增加新角色：

```typescript
// 请求动态增加角色
const dynamicRoleResult = await decisionAI.decideDynamicRoleAddition({
  situation: '退稿机制触发',
  bottleneck: '人手不足',
  currentTeamSize: 3,
  revisionCounts: { writer_1: 5, writer_2: 3 },
});
```

### AgentManager集成

Rejection Mechanism通过AgentManager管理Agent状态和重启流程：

```typescript
// 获取活跃的Agent
const activeAgents = agentManager.getActiveAgents();

// 更新Agent状态
agentManager.updateAgent(agentId, { state: newState });

// 动态增加Agent
const newAgent = await agentManager.addDynamicAgent(roleType, task);
```

## 配置选项

### 退稿阈值

默认退稿阈值为3次，可以通过修改`REJECTION_THRESHOLD`常量来调整：

```typescript
private readonly REJECTION_THRESHOLD = 3;
```

### 修复动作优先级

修复动作按优先级执行，优先级范围为1-10：

- **10**: 增加角色（人手不足）
- **9**: 增加专门角色（技能差距）
- **8**: 调整工作流程（沟通问题）
- **7**: 修改提示词
- **6**: 重新分配任务
- **5**: 人工审查

## 错误处理

### 修复失败处理

如果修复动作执行失败，系统会记录错误并继续执行其他动作：

```typescript
const fixResult = await rejectionMechanism.fixProcess(analysis);

if (fixResult.errors.length > 0) {
  console.error('修复过程中出现错误:', fixResult.errors);
}
```

### 重启失败处理

如果流程重启失败，系统会返回失败结果和错误信息：

```typescript
const restartResult = await rejectionMechanism.restartProcess();

if (!restartResult.success) {
  console.error('流程重启失败:', restartResult.message);
}
```

## 最佳实践

### 1. 及时触发

在检测到退稿时立即检查是否应该触发退稿机制：

```typescript
if (rejectionMechanism.shouldTrigger(rejectionCount)) {
  // 立即执行退稿机制流程
}
```

### 2. 完整分析

在执行修复前进行完整的退稿分析：

```typescript
const analysis = await rejectionMechanism.analyzeRejection(
  rejectionCount,
  rejectionMessages
);

// 检查分析结果
if (analysis.bottlenecks.length === 0) {
  console.warn('未识别到明确的瓶颈，建议人工审查');
}
```

### 3. 保留历史

重启流程时建议保留历史记录和修订信息：

```typescript
// 保留历史记录和修订信息
const restartResult = await rejectionMechanism.restartProcess(true, true);
```

### 4. 监控历史

定期检查退稿历史，识别重复出现的问题：

```typescript
const history = rejectionMechanism.getRejectionHistory();

// 分析历史趋势
const formatIssues = history.filter((h) =>
  h.reasons.some((r) => r.category === 'format')
);

if (formatIssues.length > 2) {
  console.warn('格式问题反复出现，建议优化提示词模板');
}
```

## 性能考虑

### 分析性能

退稿分析涉及多个数据源的收集和处理，建议：

- 缓存返工记录和质量报告
- 异步执行分析任务
- 限制历史记录数量

### 修复性能

修复动作按优先级顺序执行，高优先级动作先执行：

```typescript
// 动作已按优先级排序
const sortedActions = [...analysis.suggestedActions].sort(
  (a, b) => b.priority - a.priority
);
```

## 测试

### 单元测试

```bash
npm test rejectionMechanism.test.ts
```

### 测试覆盖

- 退稿触发检测
- 退稿原因分析
- 流程瓶颈识别
- 修复动作执行
- 流程重启
- 历史记录管理
- 边缘情况处理

## 相关文档

- [Supervisor AI文档](./SUPERVISOR_AI_README.md)
- [Decision AI文档](./DECISION_AI_README.md)
- [Agent Manager文档](./AGENT_MANAGER_README.md)
- [设计文档](../../.kiro/specs/agent-swarm-writing-system/design.md)
- [需求文档](../../.kiro/specs/agent-swarm-writing-system/requirements.md)

## 示例代码

完整的使用示例请参考：[rejectionMechanism.example.ts](./rejectionMechanism.example.ts)

## 许可证

本项目采用MIT许可证。
