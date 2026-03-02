===========================================
Agent Swarm Writing System v0.1.0 (修复版)
===========================================

这是一个便携版应用程序，无需安装即可运行。

修复内容：
- 修复了白屏问题：应用现在可以正确从应用程序目录加载提示词文件
- 添加了错误边界：如果出现错误，会显示友好的错误信息而不是白屏
- 改进了文件系统访问：支持从Resource目录（生产环境）和AppData目录（开发环境）加载提示词

使用说明：
1. 解压所有文件到任意文件夹
2. 确保 prompts 文件夹与 AgentSwarmWritingSystem.exe 在同一目录
3. 双击 AgentSwarmWritingSystem.exe 启动应用
4. 首次运行时，请先配置AI服务（点击右上角的配置按钮）

文件结构：
AgentSwarmWritingSystem.exe  - 主程序
prompts/                      - 提示词文件夹（必需）
  ├── decision_ai.yaml
  ├── supervisor_ai.yaml
  ├── editorial_office.yaml
  ├── editor_in_chief.yaml
  ├── deputy_editor.yaml
  └── peer_reviewer.yaml
README.txt                    - 本文件

配置文件位置：
- Windows: %APPDATA%\com.agentswarm.writingsystem\config.json

系统要求：
- Windows 10/11 (64位)
- 至少 4GB RAM
- 互联网连接（用于AI服务）

常见问题：
Q: 应用启动后显示白屏？
A: 确保 prompts 文件夹与可执行文件在同一目录，并包含所有必需的 .yaml 文件

Q: 如何配置AI服务？
A: 点击右上角的配置按钮，添加您的AI服务API密钥和URL

Q: 支持哪些AI服务？
A: 支持 OpenAI、Anthropic 和自定义API兼容服务

技术支持：
如有问题，请查看应用内的错误信息或联系开发团队。

版本历史：
v0.1.0 (2024) - 初始发布
  - 多智能体协作写作系统
  - 动态团队组建
  - 实时流式输出
  - 审稿团队支持
  - 文档导出功能

===========================================
