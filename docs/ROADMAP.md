# 开发路线图

本文档记录 AutoLife 项目的开发进度和计划。

## 项目概况

- **项目名称**: AutoLife - 生活智能助手
- **基础框架**: Open-AutoGLM
- **核心功能**: 自然语言控制、活动记录、任务管理
- **当前版本**: v0.2.0

## 当前状态 (v0.2.0)

### ✅ 已完成

#### 核心功能
- [x] 项目架构搭建
- [x] 核心 Agent 实现 (AutoLifeAgent)
  - [x] 基础任务执行 (run)
  - [x] 流式任务执行 (run_streaming)
  - [x] 对话历史管理
- [x] CLI 命令行接口
  - [x] 文本指令控制
  - [x] 环境变量配置
  - [x] 命令行参数支持

#### 后端服务
- [x] REST API (FastAPI)
  - [x] 健康检查 (/api/health)
  - [x] 任务执行 (/api/agent/run)
  - [x] 流式任务执行 (/api/agent/stream - SSE)
  - [x] scrcpy 投屏 (/api/scrcpy/ws - WebSocket)
- [x] 依赖注入系统

#### 投屏功能 ✅
- [x] scrcpy 流式投屏
  - [x] H.264 NAL 单元流传输（带宽降低 70%）
  - [x] WebSocket 二进制通信
  - [x] 触控/滑动/按键事件处理
  - [x] 前端 jMuxer/MSE 解码播放
  - [x] 多设备支持（全局 streamer 管理）

#### 前端界面
- [x] React + TypeScript 应用
  - [x] 聊天交互面板 (ChatPanel, EnhancedChatPanel)
  - [x] 对话历史 (ConversationPanel, ConversationHistory)
  - [x] 活动记录系统 (ActivityPanel, ActivityTimeline, ActivityCard)
  - [x] 待办事项管理 (TodoList, TodoItem, TodoForm)
  - [x] 分类过滤 (CategoryFilter)
  - [x] 快捷操作 (QuickActions)
  - [x] 双列布局 (TwoColumnLayout)
  - [x] 流式响应显示
  - [x] 实时任务进度展示
  - [x] 设备投屏播放器 (ScrcpyPlayer)

### 🎯 计划中

#### 短期目标 (v0.3.0)
- [x] 完成 scrcpy 实时投屏功能
- [ ] 完整的单元测试覆盖
- [ ] 增强的错误处理和重试机制
- [ ] 任务执行历史持久化
- [ ] 活动数据统计和分析
- [ ] 多设备支持

#### 中期目标 (v0.4.0)
- [ ] 连续对话和上下文理解增强
- [ ] 场景自适应和智能推荐
- [ ] 定时任务和自动化流程
- [ ] 插件系统

#### 长期目标 (v1.0.0)
- [ ] 多语言支持 (英文、日文等)
- [ ] 智能家居集成
- [ ] 语音输入支持 (可选)
- [ ] 移动端 App

## 开发里程碑

### Milestone 1: MVP - ✅ 已完成 (v0.1.0)
**目标**: 完成基本的手机控制功能

- [x] 文本指令控制
- [x] 前端交互界面
- [x] CLI 命令行工具

### Milestone 2: 生活助手 - ✅ 已完成 (v0.2.0)
**目标**: 重构为生活助手并增强交互体验

- [x] 流式任务执行
- [x] 活动记录系统
- [x] 待办事项管理
- [x] 移除语音功能（简化架构）

### Milestone 3: 完善功能 - 🚧 进行中 (v0.3.0)
**目标**: 完善核心功能和开发者体验

- [x] scrcpy H.264 实时投屏（2024-12-22 完成）
- [ ] 完整的测试覆盖
- [ ] 详细的中文文档
- [ ] 多个应用场景演示
- [ ] 性能优化

### Milestone 4: 正式版本 - 📅 计划中 (v1.0.0)
**目标**: 发布稳定的生产版本

- [ ] 稳定的 API
- [ ] 完整的用户文档
- [ ] 生产级别的错误处理
- [ ] 多平台支持

## 技术债务

- [ ] 改进前端状态管理（考虑使用 Redux Toolkit）
- [ ] 添加 API 速率限制
- [ ] 实现日志系统
- [ ] 添加监控和告警

## 已废弃功能

- ~~语音输入/输出~~ (v0.2.0 移除，简化架构)
- ~~ASR/TTS 集成~~ (v0.2.0 移除)
