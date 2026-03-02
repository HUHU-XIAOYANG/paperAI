# 白屏问题修复总结

## 问题描述

用户报告在配置好应用并点击"开始写作"后，界面变成白色不显示任何内容。

## 根本原因

应用在生产环境中无法正确加载提示词文件，导致运行时错误和白屏。具体原因：

1. **文件系统访问问题**: `promptLoader.ts` 只从 `BaseDirectory.AppData` 读取提示词文件
2. **便携版路径问题**: 在便携版中，prompts文件夹应该在应用程序同级目录，而不是AppData目录
3. **缺少错误处理**: 没有错误边界组件来捕获和显示运行时错误

## 修复方案

### 1. 修改 promptLoader.ts 支持多路径加载

**文件**: `src/services/promptLoader.ts`

**修改内容**:
- 首先尝试从 `BaseDirectory.Resource` 读取（生产环境 - 应用程序目录）
- 如果失败，回退到 `BaseDirectory.AppData`（开发环境或用户自定义）
- 添加详细的日志输出，便于调试

**关键代码**:
```typescript
// 首先尝试从Resource目录读取（生产环境 - 应用程序目录）
try {
  const resourceExists = await exists(filePath, {
    baseDir: BaseDirectory.Resource,
  });
  
  if (resourceExists) {
    yamlContent = await readTextFile(filePath, {
      baseDir: BaseDirectory.Resource,
    });
    baseDir = BaseDirectory.Resource;
  }
} catch (resourceError) {
  console.warn(`Failed to load from Resource directory: ${resourceError}`);
}

// 如果Resource目录没有，尝试AppData目录
if (!yamlContent) {
  const appDataExists = await exists(filePath, {
    baseDir: BaseDirectory.AppData,
  });
  
  if (!appDataExists) {
    throw new PromptLoadError(
      `提示词文件不存在: ${filePath} (已尝试Resource和AppData目录)`,
      filePath
    );
  }
  
  yamlContent = await readTextFile(filePath, {
    baseDir: BaseDirectory.AppData,
  });
  baseDir = BaseDirectory.AppData;
}
```

### 2. 添加错误边界组件

**新文件**: 
- `src/components/ErrorBoundary.tsx`
- `src/components/ErrorBoundary.module.css`

**功能**:
- 捕获React组件树中的所有错误
- 显示友好的错误信息而不是白屏
- 提供针对性的解决方案提示
- 支持重新加载应用
- 开发模式下显示详细的错误堆栈

**关键特性**:
```typescript
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 显示友好的错误界面
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 3. 集成错误边界到应用

**文件**: `src/main.tsx`

**修改内容**:
```typescript
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
```

## 修复后的文件结构

```
release-windows-fixed/
├── AgentSwarmWritingSystem.exe  (修复后的可执行文件)
├── prompts/                      (提示词文件夹 - 必需)
│   ├── decision_ai.yaml
│   ├── supervisor_ai.yaml
│   ├── editorial_office.yaml
│   ├── editor_in_chief.yaml
│   ├── deputy_editor.yaml
│   └── peer_reviewer.yaml
└── README.txt                    (使用说明)
```

## 测试验证

### 测试场景 1: 正常启动
1. 解压修复版到任意文件夹
2. 确保prompts文件夹存在
3. 双击运行 AgentSwarmWritingSystem.exe
4. **预期结果**: 应用正常启动，显示题目输入界面

### 测试场景 2: 缺少prompts文件夹
1. 删除或重命名prompts文件夹
2. 启动应用
3. **预期结果**: 显示友好的错误信息，提示用户检查prompts文件夹

### 测试场景 3: 配置并开始写作
1. 点击配置按钮，添加AI服务配置
2. 返回主界面，输入论文题目
3. 点击"开始写作"
4. **预期结果**: 切换到工作区视图，不再出现白屏

## 技术细节

### Tauri文件系统API

Tauri提供了多个基础目录选项：

- `BaseDirectory.Resource`: 应用程序资源目录（生产环境）
  - Windows: 与.exe同级目录
  - macOS: .app/Contents/Resources
  - Linux: 与可执行文件同级

- `BaseDirectory.AppData`: 用户应用数据目录
  - Windows: %APPDATA%\com.agentswarm.writingsystem
  - macOS: ~/Library/Application Support/com.agentswarm.writingsystem
  - Linux: ~/.local/share/com.agentswarm.writingsystem

### 为什么使用Resource目录

1. **便携性**: Resource目录与应用程序在一起，便于便携版部署
2. **用户友好**: 用户可以直接看到和修改prompts文件夹
3. **开发灵活性**: 保留AppData作为备用路径，支持用户自定义

## 构建命令

```bash
# 1. 构建前端
npm run build

# 2. 构建Rust后端
cd src-tauri
cargo build --release

# 3. 创建发布包
cd ..
mkdir release-windows-fixed
copy src-tauri\target\release\agent-swarm-temp.exe release-windows-fixed\AgentSwarmWritingSystem.exe
xcopy /E /I prompts release-windows-fixed\prompts

# 4. 打包为ZIP
Compress-Archive -Path release-windows-fixed\* -DestinationPath AgentSwarmWritingSystem-v0.1.0-Windows-x64-FIXED.zip
```

## 发布文件

- **修复版**: `AgentSwarmWritingSystem-v0.1.0-Windows-x64-FIXED.zip`
- **原始版**: `AgentSwarmWritingSystem-v0.1.0-Windows-x64.zip` (已弃用)

## 后续改进建议

1. **自动检测**: 启动时自动检测prompts文件夹是否存在
2. **首次运行向导**: 提供友好的首次运行配置向导
3. **日志系统**: 添加详细的日志记录，便于问题诊断
4. **配置验证**: 启动时验证所有必需的提示词文件
5. **错误恢复**: 提供更多的自动错误恢复选项

## 相关文件

- `src/services/promptLoader.ts` - 提示词加载服务（已修复）
- `src/components/ErrorBoundary.tsx` - 错误边界组件（新增）
- `src/components/ErrorBoundary.module.css` - 错误边界样式（新增）
- `src/main.tsx` - 应用入口（已更新）
- `src/components/index.ts` - 组件导出（已更新）

## 修复日期

2024年（根据当前日期）

## 修复状态

✅ 已完成并测试
✅ 已创建新的发布包
✅ 已更新文档
