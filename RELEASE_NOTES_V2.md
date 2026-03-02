# Agent Swarm Writing System v0.1.0-v2 发布说明

## 版本信息

- **版本号**: v0.1.0-v2
- **发布日期**: 2026-03-02
- **文件名**: `AgentSwarmWritingSystem-v0.1.0-Windows-x64-v2.zip`
- **文件大小**: 3.27 MB
- **平台**: Windows 10/11 (64位)

## 修复内容

### ✅ 修复 1: 白屏问题

**问题描述**:
- 用户配置好 AI 服务后，点击"开始写作"按钮，界面变成白色，不显示任何内容
- 控制台显示无法读取 prompts 文件的错误

**根本原因**:
- `promptLoader.ts` 只从 `BaseDirectory.AppData` 读取 prompts 文件
- 便携版应该从应用程序目录读取 prompts 文件

**解决方案**:
1. 修改 `src/services/promptLoader.ts`
   - 优先尝试从 `BaseDirectory.Resource` 读取（生产环境/便携版）
   - 如果失败，回退到 `BaseDirectory.AppData`（开发环境）

2. 添加 `ErrorBoundary` 组件
   - 创建 `src/components/ErrorBoundary.tsx`
   - 捕获 React 错误并显示友好的错误信息
   - 提供"重新加载"按钮让用户恢复

3. 更新 `src/main.tsx`
   - 用 ErrorBoundary 包裹 App 组件

**测试验证**:
- ✅ 便携版可以正常读取 prompts 文件
- ✅ 配置后点击"开始写作"正常显示界面
- ✅ 错误边界正确捕获和显示错误

---

### ✅ 修复 2: 无限循环崩溃

**问题描述**:
- 点击"开始写作"按钮后，应用崩溃
- 错误信息: "Maximum update depth exceeded"
- 浏览器控制台显示 React 更新深度超限

**根本原因**:
- `DynamicTeamVisualizer` 组件的 `useEffect` 存在循环依赖
- `calculatePositions` 函数在依赖数组中，但每次渲染都会重新创建
- 导致: effect 运行 → 更新状态 → 重新渲染 → 函数重新创建 → effect 再次运行 → 无限循环

**解决方案**:
1. **修复 useEffect 依赖项**
   - 从依赖数组中移除 `calculatePositions` 函数
   - 添加底层数据依赖: `layout` 和 `maxAgents`
   - 依赖数组从 `[agents, calculatePositions]` 改为 `[agents, layout, maxAgents]`

2. **优化 agents 数组**
   - 使用 `useMemo` 缓存 agents 数组
   - 只在 agentsMap 变化时重新创建数组
   - 避免不必要的重新渲染

**代码变更**:
```typescript
// 修复前
const agents = useAgentStore((state) => state.getAllAgents());
useEffect(() => {
  // ...
}, [agents, calculatePositions]); // ❌ 导致无限循环

// 修复后
const agentsMap = useAgentStore((state) => state.agents);
const agents = useMemo(() => Array.from(agentsMap.values()), [agentsMap]);
useEffect(() => {
  // ...
}, [agents, layout, maxAgents]); // ✅ 只依赖数据
```

**测试验证**:
- ✅ 创建 13 个测试用例（5 个 bug 探索 + 8 个保留测试）
- ✅ Bug 探索测试在修复前失败，修复后通过
- ✅ 保留测试确认没有引入回归
- ✅ 全部 587 个测试通过

---

## 技术细节

### 修改的文件

1. **src/services/promptLoader.ts**
   - 添加 Resource 目录优先级
   - 实现回退机制

2. **src/components/ErrorBoundary.tsx** (新增)
   - React 错误边界组件
   - 友好的错误显示界面

3. **src/components/ErrorBoundary.module.css** (新增)
   - 错误边界样式

4. **src/main.tsx**
   - 添加 ErrorBoundary 包裹

5. **src/components/index.ts**
   - 导出 ErrorBoundary

6. **src/components/DynamicTeamVisualizer.tsx**
   - 修复 useEffect 依赖项
   - 优化 agents 数组缓存

### 测试文件

1. **src/components/DynamicTeamVisualizer.bugfix.test.tsx** (新增)
   - 5 个 bug 条件探索测试
   - 验证无限循环已修复

2. **src/components/DynamicTeamVisualizer.preservation.test.tsx** (新增)
   - 8 个保留属性测试
   - 600+ 个属性测试用例
   - 确认没有回归

### 规范文档

1. **.kiro/specs/dynamic-team-visualizer-infinite-loop-fix/**
   - bugfix.md (需求文档)
   - design.md (设计文档)
   - tasks.md (任务列表)
   - COUNTEREXAMPLES.md (反例文档)
   - .config.kiro (配置)

---

## 测试结果

### 单元测试
```
✅ DynamicTeamVisualizer Tests: 13/13 passed
  - Bug condition exploration: 5/5 passed (545ms)
  - Preservation property tests: 8/8 passed (122ms)

✅ Full Test Suite: 587/587 tests passed
```

### 手动测试
- ✅ 便携版启动正常
- ✅ 配置 AI 服务成功
- ✅ 点击"开始写作"正常工作
- ✅ 智能体团队可视化正常显示
- ✅ 无无限循环或崩溃

---

## 安装说明

### 下载
下载 `AgentSwarmWritingSystem-v0.1.0-Windows-x64-v2.zip` (3.27 MB)

### 解压
将压缩包解压到任意目录（建议使用英文路径）

### 文件结构
```
AgentSwarmWritingSystem/
├── AgentSwarmWritingSystem.exe  (主程序)
├── prompts/                      (提示词文件夹)
│   ├── decision_ai.yaml
│   ├── supervisor_ai.yaml
│   ├── editor_in_chief.yaml
│   ├── deputy_editor.yaml
│   ├── editorial_office.yaml
│   └── peer_reviewer.yaml
└── README.txt                    (说明文件)
```

### 运行
双击 `AgentSwarmWritingSystem.exe` 启动程序

---

## 使用指南

### 1. 首次配置
1. 启动程序
2. 点击"配置"按钮
3. 选择 AI 服务类型
4. 输入 API Key 和 Base URL
5. 点击"测试连接"
6. 保存配置

### 2. 开始写作
1. 在主界面输入写作主题
2. 点击"开始写作"
3. 观察智能体团队协作
4. 查看工作进度和交互

### 3. 查看结果
- 工作面板：查看各智能体的工作内容
- 交互时间线：查看智能体之间的交互
- 团队结构：查看智能体团队的组织结构

---

## 已知问题

无已知问题。

---

## 下一步计划

1. 添加更多 AI 服务支持
2. 优化写作流程
3. 增强错误处理
4. 改进用户界面
5. 添加导出功能

---

## 技术支持

如遇到问题，请提供：
- Windows 版本
- 错误截图或错误信息
- 操作步骤

---

## 更新历史

### v0.1.0-v2 (2026-03-02)
- ✅ 修复白屏问题
- ✅ 修复无限循环崩溃
- ✅ 添加 ErrorBoundary
- ✅ 优化性能和稳定性
- ✅ 通过 587 个测试

### v0.1.0-v1 (2026-03-01)
- 初始发布版本
- 基础写作功能
- 智能体团队协作

---

## 致谢

感谢所有测试用户的反馈和支持！

---

**下载链接**: `AgentSwarmWritingSystem-v0.1.0-Windows-x64-v2.zip`

**文件大小**: 3.27 MB

**SHA256**: `EB2021A8AA1D02CF370EB7476942F7980B4543C53E5B4AC017360F6046895903`
