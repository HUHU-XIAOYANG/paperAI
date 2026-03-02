# 需求文档

## 介绍

Agent Swarm写作系统是一个轻量化的多智能体协作程序，用于学术论文的初稿写作和审稿流程。系统通过决策AI动态创建写作团队，并由固定的审稿团队进行质量把控，实现自动化的论文创作和审核流程。

## 术语表

- **Decision_AI**: 决策AI，负责接收题目、评估工作量、分配AI角色和任务、动态增加团队成员
- **Supervisor_AI**: 监管AI，负责检查AI输出格式规范性、要求不合规内容返工、检测人手不足情况
- **Writing_Team**: 写作团队，由Decision_AI动态创建的多个AI角色，负责论文写作
- **Review_Team**: 审稿团队，包含编辑部、主编、副主编和审稿专家的固定团队结构
- **Editorial_Office**: 编辑部，负责格式审查、组织送审、联络沟通
- **Editor_In_Chief**: 主编，负责把控学术质量、初审筛选、监督流程、最终录用决定
- **Deputy_Editor**: 副主编，协助主编把控学术质量、初审筛选、监督流程
- **Peer_Reviewer**: 审稿专家，负责深入评估、撰写详细审稿报告、协助决策
- **AI_Configuration**: AI配置，包含AI名称、API密钥和URL的用户自定义配置
- **Output_Format**: 输出格式，AI输出内容需遵循的语法规范
- **Prompt_Repository**: 提示词仓库，存储所有AI提示词的专用文件夹
- **Glass_Morphism_UI**: 苹果液态玻璃风格界面，具有半透明、模糊背景效果的现代化UI设计
- **Work_Display_Panel**: 工作显示面板，实时展示各个AI工作状态和输出的界面组件
- **Rejection_Mechanism**: 退稿机制，当内容被退稿超过3次时触发的流程修复机制
- **Document_Export**: 文档导出，将最终报告导出为.docx、.md、.pdf格式的功能
- **Streaming_Output**: 流式输出，AI实时逐步输出内容的显示方式
- **Non_Linear_Interaction**: 非线性交互，AI之间可以相互讨论、反馈、协商的交互模式
- **Dynamic_Role_Addition**: 动态角色增加，在流程执行过程中根据需要增加新AI角色的机制
- **Internet_Access**: 联网功能，AI能够访问互联网获取实时信息的能力

## 需求

### 需求 1: Agent Swarm架构研究

**用户故事:** 作为开发者，我想要研究现有的Agent Swarm实现方案，以便选择合适的架构模式实现多智能体协作。

#### 验收标准

1. THE System SHALL 支持联网查找Agent Swarm实现方案
2. THE System SHALL 记录至少3种不同的Agent Swarm架构模式
3. THE System SHALL 评估每种架构模式的优缺点和适用场景

### 需求 2: AI配置管理

**用户故事:** 作为用户，我想要自定义AI的连接配置，以便使用不同的AI服务提供商。

#### 验收标准

1. THE System SHALL 允许用户配置AI名称、API密钥和URL
2. WHEN 用户保存AI_Configuration，THE System SHALL 持久化存储配置信息
3. WHEN 用户修改AI_Configuration，THE System SHALL 验证API连接有效性
4. THE System SHALL 支持配置多个不同的AI服务
5. THE System SHALL 加密存储API密钥信息

### 需求 3: AI输出格式规范

**用户故事:** 作为系统设计者，我想要定义统一的AI输出格式，以便程序能够解析和传递AI之间的信息。

#### 验收标准

1. THE System SHALL 定义结构化的Output_Format语法规范
2. THE Output_Format SHALL 包含消息类型、发送者、接收者、内容和元数据字段
3. WHEN AI生成输出，THE System SHALL 要求输出符合Output_Format规范
4. THE System SHALL 解析符合Output_Format的AI输出内容
5. THE System SHALL 基于Output_Format实现AI之间的信息传递

### 需求 4: 提示词管理系统

**用户故事:** 作为开发者，我想要将提示词存储在独立文件中，以便灵活修改和维护提示词内容。

#### 验收标准

1. THE System SHALL 创建Prompt_Repository文件夹存储所有提示词
2. THE System SHALL 从Prompt_Repository动态加载提示词，而非硬编码
3. WHEN 提示词文件被修改，THE System SHALL 在下次调用时使用更新后的内容
4. THE System SHALL 为每个AI角色维护独立的提示词文件
5. THE Prompt_Repository SHALL 包含提示词版本控制信息

### 需求 5: 决策AI功能

**用户故事:** 作为用户，我想要Decision_AI能够分析题目并分配任务，以便自动组建合适的写作团队。

#### 验收标准

1. WHEN 用户输入论文题目，THE Decision_AI SHALL 分析题目的复杂度和工作量
2. THE Decision_AI SHALL 根据工作量动态确定Writing_Team的AI数量和角色
3. THE Decision_AI SHALL 为每个Writing_Team成员分配具体的写作任务
4. THE Decision_AI SHALL 生成符合Output_Format的任务分配指令
5. THE Decision_AI SHALL 估算完成时间并通知用户
6. WHEN 检测到人手不足或返工次数过多，THE Decision_AI SHALL 执行Dynamic_Role_Addition增加新的AI角色
7. THE Decision_AI SHALL 为动态增加的AI角色分配针对性任务以解决当前瓶颈

### 需求 6: 监管AI功能

**用户故事:** 作为系统管理者，我想要Supervisor_AI检查输出质量，以便确保所有AI输出符合规范。

#### 验收标准

1. WHEN AI生成输出，THE Supervisor_AI SHALL 验证输出是否符合Output_Format
2. IF 输出不符合Output_Format，THEN THE Supervisor_AI SHALL 要求该AI返工
3. THE Supervisor_AI SHALL 记录每个AI的返工次数
4. WHEN 返工次数超过3次，THE Supervisor_AI SHALL 触发Rejection_Mechanism
5. THE Supervisor_AI SHALL 生成质量检查报告
6. WHEN 检测到人手不足（单个AI返工次数超过2次或整体进度延迟），THE Supervisor_AI SHALL 通知Decision_AI执行Dynamic_Role_Addition
7. THE Supervisor_AI SHALL 分析人手不足的具体原因并建议需要增加的角色类型

### 需求 7: 写作团队管理

**用户故事:** 作为用户，我想要看到Writing_Team的工作过程，以便了解论文创作进度。

#### 验收标准

1. WHEN Decision_AI创建Writing_Team成员，THE System SHALL 为每个成员创建Work_Display_Panel
2. THE Work_Display_Panel SHALL 实时显示AI的当前任务和工作状态
3. THE Work_Display_Panel SHALL 显示AI的输出内容
4. WHEN Writing_Team成员完成任务，THE System SHALL 更新Work_Display_Panel状态
5. THE System SHALL 支持同时显示多个Writing_Team成员的工作面板
6. THE Writing_Team SHALL 支持Non_Linear_Interaction，允许成员之间相互讨论、反馈和协商
7. THE System SHALL 显示Writing_Team成员之间的交互消息和讨论过程
8. WHEN Decision_AI执行Dynamic_Role_Addition，THE System SHALL 动态创建新成员的Work_Display_Panel并集成到现有团队

### 需求 8: 审稿团队结构

**用户故事:** 作为学术管理者，我想要建立标准的审稿流程，以便确保论文质量符合学术标准。

#### 验收标准

1. THE System SHALL 创建固定的Review_Team结构，包含Editorial_Office、Editor_In_Chief、Deputy_Editor和Peer_Reviewer
2. THE Editorial_Office SHALL 执行格式审查、组织送审和联络沟通任务
3. THE Editor_In_Chief SHALL 执行学术质量把控、初审筛选、流程监督和最终录用决定
4. THE Deputy_Editor SHALL 协助Editor_In_Chief执行质量把控和初审筛选
5. THE Peer_Reviewer SHALL 执行深入评估并生成详细审稿报告
6. THE Review_Team SHALL 支持Non_Linear_Interaction，允许成员之间相互讨论、协商和反馈
7. THE System SHALL 显示Review_Team成员之间的交互过程，而非仅显示线性流程
8. THE Review_Team成员 SHALL 能够主动向其他成员请求意见或澄清问题

### 需求 9: 退稿机制

**用户故事:** 作为质量管理者，我想要在多次退稿时自动诊断问题，以便改进写作流程。

#### 验收标准

1. WHEN 论文被退稿次数达到3次，THE Supervisor_AI SHALL 触发Rejection_Mechanism
2. THE Rejection_Mechanism SHALL 分析退稿原因和流程问题
3. THE Rejection_Mechanism SHALL 检测是否因人手不足导致退稿
4. IF 退稿原因为人手不足，THEN THE Rejection_Mechanism SHALL 通知Decision_AI执行Dynamic_Role_Addition
5. THE Rejection_Mechanism SHALL 生成流程改进建议
6. THE Rejection_Mechanism SHALL 修复已识别的流程问题
7. WHEN Rejection_Mechanism完成修复，THE System SHALL 重新启动写作流程

### 需求 10: 苹果液态玻璃风格界面

**用户故事:** 作为用户，我想要使用现代化的界面，以便获得良好的视觉体验。

#### 验收标准

1. THE System SHALL 实现Glass_Morphism_UI设计风格
2. THE Glass_Morphism_UI SHALL 包含半透明背景、模糊效果和柔和阴影
3. THE Glass_Morphism_UI SHALL 支持深色和浅色主题切换
4. THE System SHALL 选择能够完整实现Glass_Morphism_UI效果的技术栈
5. IF 当前技术栈无法实现Glass_Morphism_UI，THEN THE System SHALL 更换为支持该效果的技术栈

### 需求 11: 独立程序编译

**用户故事:** 作为用户，我想要使用独立的桌面程序，以便无需浏览器或本地服务器即可运行。

#### 验收标准

1. THE System SHALL 编译为独立的可执行程序
2. THE System SHALL 不依赖浏览器运行
3. THE System SHALL 不依赖本地端口服务
4. THE System SHALL 支持Windows、macOS和Linux平台
5. THE System SHALL 提供简单的安装和启动流程

### 需求 12: 实时工作显示

**用户故事:** 作为用户，我想要实时看到所有AI的工作状态，以便监控整个创作和审稿流程。

#### 验收标准

1. WHEN 子AI被创建，THE System SHALL 在界面上显示对应的Work_Display_Panel
2. THE Work_Display_Panel SHALL 实时更新AI的工作进度
3. THE Work_Display_Panel SHALL 显示AI之间的通信消息
4. THE System SHALL 支持同时显示Decision_AI、Supervisor_AI、Writing_Team和Review_Team的工作面板
5. THE System SHALL 使用视觉层次区分不同类型的AI工作面板

### 需求 13: 文档导出功能

**用户故事:** 作为用户，我想要导出最终的论文和审稿报告，以便在其他软件中使用。

#### 验收标准

1. WHEN 论文完成，THE System SHALL 支持导出为.docx格式
2. THE System SHALL 支持导出为.md格式
3. THE System SHALL 支持导出为.pdf格式
4. THE Document_Export SHALL 保留文档的格式和样式
5. THE Document_Export SHALL 包含所有审稿意见和修改记录

### 需求 14: 配置解析和序列化

**用户故事:** 作为开发者，我想要可靠地保存和加载配置，以便确保用户设置不会丢失。

#### 验收标准

1. WHEN 用户保存AI_Configuration，THE System SHALL 序列化配置为JSON格式
2. WHEN 程序启动，THE System SHALL 解析并加载已保存的AI_Configuration
3. FOR ALL 有效的AI_Configuration对象，序列化后反序列化 SHALL 产生等价的配置对象（往返属性）
4. IF 配置文件损坏，THEN THE System SHALL 返回描述性错误信息并使用默认配置

### 需求 15: 提示词解析器

**用户故事:** 作为开发者，我想要可靠地加载提示词文件，以便AI能够正确执行任务。

#### 验收标准

1. WHEN 提示词文件存在，THE System SHALL 解析文件内容为提示词对象
2. WHEN 提示词文件不存在或格式错误，THE System SHALL 返回描述性错误信息
3. THE System SHALL 支持提示词文件中的变量替换功能
4. THE System SHALL 验证提示词文件的完整性
5. FOR ALL 有效的提示词文件，加载后格式化再加载 SHALL 产生等价的提示词对象（往返属性）

### 需求 16: AI输出格式解析器

**用户故事:** 作为开发者，我想要可靠地解析AI输出，以便系统能够正确传递信息。

#### 验收标准

1. WHEN AI生成符合Output_Format的输出，THE System SHALL 解析为结构化消息对象
2. WHEN AI输出不符合Output_Format，THE System SHALL 返回描述性错误信息
3. THE Output_Format_Parser SHALL 提取消息类型、发送者、接收者和内容字段
4. THE System SHALL 验证解析后的消息对象完整性
5. FOR ALL 有效的消息对象，格式化后解析再格式化 SHALL 产生等价的输出（往返属性）

### 需求 17: 流式输出显示

**用户故事:** 作为用户，我想要实时看到每个AI的输出过程，以便清晰了解AI的思考和工作进展。

#### 验收标准

1. THE System SHALL 为所有AI配置Streaming_Output模式
2. WHEN AI生成内容，THE System SHALL 实时逐步显示输出内容，而非等待完成后一次性显示
3. THE Work_Display_Panel SHALL 支持Streaming_Output的实时渲染
4. THE Streaming_Output SHALL 保持内容的可读性和格式完整性
5. THE System SHALL 在Streaming_Output过程中显示AI的工作状态指示器
6. WHEN Streaming_Output完成，THE System SHALL 明确标记输出结束状态

### 需求 18: AI联网功能

**用户故事:** 作为用户，我想要AI能够访问互联网，以便获取最新的学术资料和参考信息。

#### 验收标准

1. THE System SHALL 为所有AI配置Internet_Access能力
2. WHEN AI需要查找资料，THE System SHALL 允许AI执行网络搜索
3. THE System SHALL 显示AI的联网查询过程和结果
4. THE Internet_Access SHALL 支持访问学术数据库、搜索引擎和在线资源
5. THE System SHALL 记录AI的联网查询历史和引用来源
6. THE System SHALL 允许用户配置Internet_Access的权限和范围限制
