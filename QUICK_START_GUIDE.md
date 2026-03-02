# Agent Swarm Writing System - 快速开始指南

## 安装步骤

### 1. 下载和解压

1. 下载 `AgentSwarmWritingSystem-v0.1.0-Windows-x64.zip`
2. 右键点击ZIP文件，选择"全部解压缩"
3. 选择解压位置（建议：`C:\Program Files\AgentSwarmWritingSystem\`）

### 2. 首次运行

1. 打开解压后的文件夹
2. 双击 `AgentSwarmWritingSystem.exe`
3. 如果Windows显示安全警告：
   - 点击"更多信息"
   - 点击"仍要运行"

### 3. 配置AI服务

首次启动时，需要配置AI服务：

#### OpenAI配置
```json
{
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "apiKey": "sk-your-api-key-here",
  "apiUrl": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

#### Anthropic配置
```json
{
  "name": "Claude 3",
  "provider": "anthropic",
  "apiKey": "sk-ant-your-api-key-here",
  "apiUrl": "https://api.anthropic.com/v1",
  "model": "claude-3-opus-20240229"
}
```

#### 自定义API配置
```json
{
  "name": "Custom API",
  "provider": "custom",
  "apiKey": "your-api-key",
  "apiUrl": "https://your-api-endpoint.com/v1",
  "model": "your-model-name"
}
```

## 基本使用

### 1. 创建新论文项目

1. 点击"新建项目"按钮
2. 输入论文题目
3. 系统会自动：
   - 分析题目复杂度
   - 评估工作量
   - 组建写作团队
   - 分配任务

### 2. 监控写作进度

在主工作区可以看到：
- **动态团队可视化**: 显示所有AI成员和连接关系
- **工作显示面板**: 实时显示每个AI的工作状态
- **交互时间线**: 查看所有AI之间的消息交互
- **进度指示器**: 显示整体完成进度

### 3. 查看和编辑内容

- 点击任意AI成员查看其输出
- 使用流式输出实时查看写作过程
- 在编辑器中直接修改内容
- 系统会自动保存修改

### 4. 审稿和修订

1. 写作完成后，系统自动提交给Review Team
2. 审稿团队包括：
   - 编辑部 (Editorial Office)
   - 主编 (Editor in Chief)
   - 副主编 (Deputy Editor)
   - 审稿专家 (Peer Reviewers)
3. 查看审稿意见
4. 系统根据意见自动修订

### 5. 导出文档

支持三种格式：

#### DOCX格式
- 完整格式保留
- 包含审稿意见
- 包含修订历史

#### Markdown格式
- 纯文本格式
- 易于版本控制
- 支持GitHub等平台

#### PDF格式
- 最终发布格式
- 专业排版
- 包含所有内容

## 高级功能

### 动态角色增加

当系统检测到工作负载过重时：
1. Decision AI自动评估
2. 决定是否增加新角色
3. 为新角色分配任务
4. 无缝集成到团队

### 退稿机制

当论文被退稿3次时：
1. 系统自动触发Rejection Mechanism
2. 分析退稿原因
3. 识别流程瓶颈
4. 执行修复动作
5. 重启写作流程

### 联网搜索

启用联网功能后：
1. AI可以搜索最新资料
2. 支持多个搜索引擎：
   - Tavily
   - SerpAPI
   - Google
   - Bing
3. 查看搜索历史
4. 管理域名白名单

### 非线性交互

AI之间可以：
- 请求反馈
- 讨论问题
- 协作修改
- 交换意见

## 配置文件

### 位置
```
%APPDATA%\com.agentswarm.writingsystem\
├── config.json          (主配置文件)
├── prompts/             (自定义提示词)
└── output/              (导出文档)
```

### 配置选项

#### AI服务配置
```json
{
  "aiServices": [
    {
      "id": "service-1",
      "name": "OpenAI GPT-4",
      "provider": "openai",
      "apiKey": "encrypted-key",
      "apiUrl": "https://api.openai.com/v1",
      "model": "gpt-4"
    }
  ],
  "defaultService": "service-1"
}
```

#### 联网配置
```json
{
  "internetAccess": {
    "enabled": true,
    "allowedDomains": [
      "scholar.google.com",
      "arxiv.org",
      "*.edu"
    ]
  }
}
```

#### 流式输出配置
```json
{
  "streamingConfig": {
    "chunkSize": 100,
    "updateInterval": 50
  }
}
```

## 快捷键

- `Ctrl + N`: 新建项目
- `Ctrl + S`: 保存当前工作
- `Ctrl + E`: 导出文档
- `Ctrl + F`: 搜索内容
- `Ctrl + ,`: 打开设置
- `F5`: 刷新视图
- `F11`: 全屏模式

## 故障排除

### 程序无法启动

1. 检查系统要求：
   - Windows 10或更高版本
   - 64位操作系统
   - 至少4GB内存

2. 以管理员身份运行：
   - 右键点击程序
   - 选择"以管理员身份运行"

### API连接失败

1. 检查API密钥是否正确
2. 检查网络连接
3. 验证API URL是否正确
4. 查看错误日志

### 性能问题

1. 关闭不必要的AI成员
2. 减少流式输出更新频率
3. 清理历史记录
4. 重启程序

### 配置文件损坏

1. 删除配置文件：
   ```
   %APPDATA%\com.agentswarm.writingsystem\config.json
   ```
2. 重启程序
3. 系统会创建默认配置

## 常见问题

### Q: 支持哪些AI服务？
A: 支持OpenAI、Anthropic和任何兼容OpenAI API的自定义服务。

### Q: 需要联网吗？
A: 需要联网连接AI服务API。联网搜索功能是可选的。

### Q: 数据安全吗？
A: API密钥使用AES加密存储，所有数据保存在本地。

### Q: 可以自定义提示词吗？
A: 可以，编辑`prompts/`目录下的YAML文件。

### Q: 支持多语言吗？
A: 当前版本主要支持中文，AI输出语言取决于提示词设置。

### Q: 如何更新程序？
A: 下载新版本并替换可执行文件，配置文件会自动保留。

## 技术支持

### 文档
- 完整文档: 查看项目README.md
- API文档: 查看各服务目录下的README文件
- 设计文档: 查看.kiro/specs/目录

### 社区
- GitHub Issues: 报告问题和建议
- 讨论区: 交流使用经验

### 联系方式
- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]

## 更新日志

### v0.1.0 (2024)
- ✅ 初始发布
- ✅ 多Agent协作系统
- ✅ 实时流式输出
- ✅ 动态团队可视化
- ✅ 文档导出功能
- ✅ 联网搜索功能
- ✅ 退稿机制
- ✅ 修订历史追踪

## 许可证

请查看LICENSE文件了解详细信息。

---

**版本**: 0.1.0  
**发布日期**: 2024年  
**平台**: Windows 10/11 (x64)

祝您使用愉快！🎉
