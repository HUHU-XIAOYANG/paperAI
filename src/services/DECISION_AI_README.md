# Decision AI Service

Decision AI服务是Agent Swarm写作系统的顶层决策组件，负责分析论文题目、评估工作量、组建写作团队和动态增加角色。

## 功能概述

Decision AI提供以下核心功能：

1. **题目分析和工作量评估** (Task 10.2)
   - 分析论文题目的复杂度
   - 评估所需工作量（简单/中等/复杂）
   - 估算完成时间
   - 识别关键挑战

2. **团队组建和任务分配** (Task 10.3)
   - 根据工作量确定Writing Team规模
   - 为每个成员分配具体任务
   - 生成符合OutputFormat的任务指令
   - 创建团队成员Agent实例

3. **动态角色增加决策** (Task 10.6)
   - 接收Supervisor AI的人手不足通知
   - 分析瓶颈原因
   - 决定新角色类型和任务
   - 调用AgentManager创建新角色

## 需求映射

本服务实现以下需求：

- **需求 5.1**: 分析题目的复杂度和工作量
- **需求 5.2**: 根据工作量动态确定Writing Team的AI数量和角色
- **需求 5.3**: 为每个Writing Team成员分配具体的写作任务
- **需求 5.4**: 生成符合Output_Format的任务分配指令
- **需求 5.5**: 估算完成时间并通知用户
- **需求 5.6**: 执行Dynamic_Role_Addition增加新的AI角色
- **需求 5.7**: 为动态增加的AI角色分配针对性任务

## 架构设计

### 类结构

```typescript
class DecisionAI {
  constructor(aiClient: AIClient, agentManager: AgentManager)
  
  // 题目分析和工作量评估
  analyzeTopicAndAssessWorkload(topic: string): Promise<WorkloadAssessment>
  
  // 团队组建和任务分配
  buildTeamAndAllocateTasks(topic: string, assessment: WorkloadAssessment): Promise<TaskAllocation>
  
  // 动态角色增加决策
  decideDynamicRoleAddition(request: DynamicRoleRequest): Promise<DynamicRoleResult>
}
```

### 数据流

```
用户输入题目
    ↓
analyzeTopicAndAssessWorkload()
    ↓
WorkloadAssessment (工作量评估)
    ↓
buildTeamAndAllocateTasks()
    ↓
TaskAllocation (任务分配)
    ↓
创建Writing Team成员
    ↓
开始写作流程
    ↓
(如果检测到瓶颈)
    ↓
decideDynamicRoleAddition()
    ↓
DynamicRoleResult (动态角色)
    ↓
创建新的AI角色
```

## 使用方法

### 基本用法

```typescript
import { createDecisionAI } from './services/decisionAI';
import { createAIClient } from './services/aiClient';
import { createAgentManager } from './services/agentManager';

// 创建依赖
const aiClient = createAIClient(options);
const agentManager = createAgentManager(systemConfig);

// 创建Decision AI实例
const decisionAI = createDecisionAI(aiClient, agentManager);

// 1. 分析题目
const assessment = await decisionAI.analyzeTopicAndAssessWorkload(
  '机器学习在医疗诊断中的应用'
);

console.log(`工作量等级: ${assessment.level}`);
console.log(`建议团队规模: ${assessment.suggestedTeamSize}人`);
console.log(`预计完成时间: ${assessment.estimatedDays}天`);

// 2. 组建团队
const allocation = await decisionAI.buildTeamAndAllocateTasks(
  '机器学习在医疗诊断中的应用',
  assessment
);

console.log(`创建了 ${allocation.teamMembers.length} 个团队成员`);
allocation.teamMembers.forEach(member => {
  console.log(`- ${member.name}: ${member.tasks.join(', ')}`);
});

// 3. 动态增加角色（当需要时）
const dynamicResult = await decisionAI.decideDynamicRoleAddition({
  situation: 'Writer 1已经返工3次',
  bottleneck: '格式规范理解不足',
  currentTeamSize: 2,
  revisionCounts: { writer_1: 3, writer_2: 1 }
});

if (dynamicResult.shouldAdd) {
  console.log(`增加新角色: ${dynamicResult.roleName}`);
}
```

### 完整工作流程

```typescript
async function completeWorkflow(topic: string) {
  // Phase 1: 题目分析
  const assessment = await decisionAI.analyzeTopicAndAssessWorkload(topic);
  
  // Phase 2: 团队组建
  const allocation = await decisionAI.buildTeamAndAllocateTasks(topic, assessment);
  
  // Phase 3: 监控工作进展
  // ... (由Supervisor AI监控)
  
  // Phase 4: 如果检测到瓶颈，动态增加角色
  const dynamicResult = await decisionAI.decideDynamicRoleAddition({
    situation: '检测到的具体情况',
    bottleneck: '识别出的瓶颈',
    currentTeamSize: allocation.teamMembers.length,
    revisionCounts: { /* 各成员的返工次数 */ }
  });
  
  if (dynamicResult.shouldAdd) {
    console.log(`动态增加了新角色: ${dynamicResult.roleName}`);
  }
}
```

## 类型定义

### WorkloadAssessment

工作量评估结果：

```typescript
interface WorkloadAssessment {
  level: 'simple' | 'medium' | 'complex';
  suggestedTeamSize: number;
  estimatedDays: number;
  keyChallen: string[];
  complexity: {
    researchField: WorkloadLevel;
    literatureReview: WorkloadLevel;
    methodology: WorkloadLevel;
    dataAnalysis: WorkloadLevel;
  };
}
```

### TaskAllocation

任务分配结果：

```typescript
interface TaskAllocation {
  teamMembers: TeamMember[];
  totalEstimatedDays: number;
  allocationMessage: AgentMessage;
}

interface TeamMember {
  id: string;
  role: AgentRole;
  name: string;
  tasks: string[];
  estimatedDays: number;
}
```

### DynamicRoleRequest

动态角色增加请求：

```typescript
interface DynamicRoleRequest {
  situation: string;
  bottleneck: string;
  currentTeamSize: number;
  revisionCounts: Record<string, number>;
}
```

### DynamicRoleResult

动态角色增加结果：

```typescript
interface DynamicRoleResult {
  shouldAdd: boolean;
  roleType?: AgentRole;
  roleName?: string;
  tasks?: string[];
  estimatedDays?: number;
  reason?: string;
  assignmentMessage?: AgentMessage;
}
```

## 提示词模板

Decision AI使用以下提示词模板（位于 `prompts/decision_ai.yaml`）：

1. **task_allocation_template**: 任务分配模板
   - 变量: `{{topic}}`
   - 用途: 分析题目并分配任务

2. **dynamic_addition_template**: 动态增加模板
   - 变量: `{{situation}}`, `{{bottleneck}}`
   - 用途: 决策是否增加新角色

3. **workload_analysis_template**: 工作量分析模板
   - 变量: `{{topic}}`
   - 用途: 评估工作量和复杂度

## 决策逻辑

### 工作量评估逻辑

Decision AI使用以下标准评估工作量：

1. **简单 (Simple)**
   - 题目简短（≤5个词）
   - 研究领域单一
   - 建议团队规模: 1人
   - 预计时间: 3天

2. **中等 (Medium)**
   - 题目适中（6-14个词）
   - 涉及多个子领域
   - 建议团队规模: 2-3人
   - 预计时间: 5-7天

3. **复杂 (Complex)**
   - 题目复杂（≥15个词）
   - 跨学科研究
   - 建议团队规模: 4-5人
   - 预计时间: 10+天

### 动态角色增加决策标准

Decision AI在以下情况下会考虑增加新角色：

1. **返工次数过多**
   - 单个AI返工次数 > 2次
   - 说明该AI能力不足或任务过重

2. **进度延迟**
   - 整体进度延迟 > 预期的50%
   - 说明团队人手不足

3. **特定领域问题**
   - 反复出现特定类型的问题（如格式、文献、方法）
   - 需要该领域的专家角色

4. **质量问题**
   - 内容质量持续不达标
   - 需要专门的质量把控角色

## 错误处理

### AI响应解析失败

当AI响应无法解析时，Decision AI会：

1. **工作量评估**: 使用启发式方法（基于题目长度）
2. **任务分配**: 创建默认的团队配置
3. **动态角色**: 使用保守策略（不增加新角色）

### AI服务不可用

当AI服务不可用时：

- 抛出错误并记录日志
- 上层调用者应该捕获错误并通知用户
- 可以考虑使用备用AI服务

### 配置错误

当配置不正确时：

- AgentManager会抛出配置验证错误
- PromptLoader会抛出提示词加载错误
- 应该在系统初始化时验证配置

## 性能考虑

### AI调用优化

- 使用非流式响应以减少复杂度
- 设置合理的token限制（1000-2000）
- 使用适中的temperature（0.7）

### 缓存策略

- 提示词模板会被PromptLoader缓存
- 相同题目的重复分析可以考虑缓存结果
- Agent实例由AgentManager管理，避免重复创建

### 并发处理

- 团队成员创建可以并行执行
- 使用Promise.all()加速团队组建过程

## 测试

### 单元测试

运行单元测试：

```bash
npm test decisionAI.test.ts
```

测试覆盖：

- ✓ 简单题目分析
- ✓ 复杂题目分析
- ✓ 启发式评估
- ✓ 团队组建
- ✓ 任务分配
- ✓ 动态角色增加
- ✓ 错误处理
- ✓ 完整工作流程

### 集成测试

集成测试需要：

- 有效的AI服务配置
- 提示词文件存在
- AgentManager正常工作

## 示例

详细的使用示例请参考 `decisionAI.example.ts`：

- Example 1: 分析简单题目并组建团队
- Example 2: 分析复杂题目
- Example 3: 动态增加角色 - 格式问题
- Example 4: 动态增加角色 - 工作量过大
- Example 5: 完整工作流程
- Example 6: 错误处理

## 依赖关系

Decision AI依赖以下服务：

- **AIClient**: 调用AI服务进行分析和决策
- **AgentManager**: 创建和管理AI角色
- **PromptLoader**: 加载提示词模板
- **FormatParser**: 解析AI输出格式

## 未来扩展

可能的扩展方向：

1. **学习优化**: 根据历史数据优化工作量评估
2. **多语言支持**: 支持英文、中文等多种语言
3. **自定义规则**: 允许用户自定义决策规则
4. **可视化**: 提供决策过程的可视化展示
5. **A/B测试**: 测试不同的决策策略效果

## 相关文档

- [需求文档](../../../.kiro/specs/agent-swarm-writing-system/requirements.md)
- [设计文档](../../../.kiro/specs/agent-swarm-writing-system/design.md)
- [Agent Manager文档](./AGENT_MANAGER_README.md)
- [Prompt Loader文档](../types/PROMPT_README.md)
- [Format Parser文档](./FORMAT_PARSER_README.md)

## 许可证

本项目采用MIT许可证。
