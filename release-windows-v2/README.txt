========================================
Agent Swarm Writing System v0.1.0
Windows 便携版 (修复版 v2)
========================================

版本信息：
- 版本号：v0.1.0
- 发布日期：2026-03-02
- 修复版本：v2 (包含白屏修复 + 无限循环修复)

修复内容：
✅ 修复 1: 白屏问题
   - 问题：配置后点击运行写作，界面变成白色不显示内容
   - 原因：便携版无法从 AppData 读取 prompts 文件
   - 解决：修改 promptLoader.ts，优先从应用目录读取 prompts
   - 添加：ErrorBoundary 组件，捕获错误并显示友好提示

✅ 修复 2: 无限循环崩溃
   - 问题：点击"开始写作"后报错 "Maximum update depth exceeded"
   - 原因：DynamicTeamVisualizer 组件的 useEffect 依赖项导致无限循环
   - 解决：优化依赖项管理，使用 useMemo 缓存 agents 数组
   - 测试：通过 13 个测试用例验证修复

系统要求：
- 操作系统：Windows 10/11 (64位)
- 内存：建议 4GB 以上
- 磁盘空间：至少 500MB 可用空间
- 网络：需要互联网连接以访问 AI 服务

使用说明：

1. 解压文件
   将所有文件解压到任意目录（建议使用英文路径）

2. 运行程序
   双击 AgentSwarmWritingSystem.exe 启动程序

3. 配置 AI 服务
   首次运行需要配置 AI 服务：
   - 点击"配置"按钮
   - 选择 AI 服务类型（OpenAI、Claude、Gemini 等）
   - 输入 API Key 和 Base URL
   - 点击"测试连接"验证配置
   - 保存配置

4. 开始写作
   - 在主界面输入写作主题
   - 点击"开始写作"按钮
   - 系统将自动创建智能体团队并开始协作写作
   - 在工作面板中查看各智能体的工作进度
   - 在交互时间线中查看智能体之间的交互

文件说明：
- AgentSwarmWritingSystem.exe  主程序
- prompts/                      提示词模板文件夹
  ├── decision_ai.yaml          决策 AI 提示词
  ├── supervisor_ai.yaml        监督 AI 提示词
  ├── editor_in_chief.yaml      主编提示词
  ├── deputy_editor.yaml        副主编提示词
  ├── editorial_office.yaml     编辑部提示词
  └── peer_reviewer.yaml        同行评审提示词
- README.txt                    本说明文件

注意事项：
1. 首次运行时，Windows 可能会显示安全警告，请选择"仍要运行"
2. 请确保 prompts 文件夹与 exe 文件在同一目录
3. 配置信息会保存在用户目录的 AppData 中
4. 如遇到问题，请检查网络连接和 API Key 配置

常见问题：

Q: 程序无法启动？
A: 请检查是否有杀毒软件拦截，尝试添加到白名单

Q: 配置后无法连接 AI 服务？
A: 请检查：
   - API Key 是否正确
   - Base URL 是否正确（包括 http:// 或 https://）
   - 网络连接是否正常
   - 防火墙是否允许程序访问网络

Q: 点击"开始写作"后没有反应？
A: 请确保：
   - 已正确配置 AI 服务
   - 已输入写作主题
   - 查看控制台是否有错误信息

Q: 界面显示白屏？
A: 此问题已在 v2 版本修复，如仍出现请：
   - 确保 prompts 文件夹存在
   - 重新启动程序
   - 查看错误提示信息

技术支持：
如遇到其他问题，请提供以下信息：
- Windows 版本
- 错误截图或错误信息
- 操作步骤

更新日志：
v0.1.0-v2 (2026-03-02)
- 修复白屏问题（promptLoader 路径问题）
- 修复无限循环崩溃（DynamicTeamVisualizer useEffect 依赖项）
- 添加 ErrorBoundary 错误边界组件
- 优化性能和稳定性

v0.1.0-v1 (2026-03-01)
- 初始发布版本
- 基础写作功能
- 智能体团队协作
- 实时交互展示

========================================
感谢使用 Agent Swarm Writing System！
========================================
