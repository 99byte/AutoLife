# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

这个文件为 Claude Code (claude.ai/code) 提供在本代码库中工作的指导。

## 项目概述

AutoLife 是基于 Open-AutoGLM 开发的生活智能助手，提供手机自动化控制和日常活动管理能力。

- **核心功能**: 自然语言控制、活动记录、任务管理
- **基础框架**: Open-AutoGLM (作为 git submodule)
- **技术架构**: Python + FastAPI (后端) + React + TypeScript (前端)
- **当前版本**: v0.2.0

## 代码结构

### 主要模块

```
src/autolife/                  # 主源码目录 (autolife 包)
├── cli.py                     # CLI 入口点
├── agent.py                   # AutoLifeAgent 核心类
│   ├── run()                 # 基础任务执行
│   └── run_streaming()       # 流式任务执行（逐步返回结果）
├── api/                       # FastAPI REST API 服务
│   ├── main.py               # FastAPI 应用入口
│   ├── models.py             # API 数据模型
│   ├── dependencies.py       # 依赖注入
│   └── routes/               # API 路由
│       ├── health.py         # 健康检查
│       ├── agent.py          # 任务执行路由（支持 SSE 流式）
│       └── scrcpy.py         # 投屏 WebSocket（开发中）
└── scrcpy/                   # scrcpy 投屏模块（开发中）
    └── manager.py            # ScrcpyManager 投屏管理器

autolife-web/                  # React 前端应用
├── src/
│   ├── components/           # React 组件
│   │   ├── ChatPanel.tsx              # 聊天面板
│   │   ├── EnhancedChatPanel.tsx     # 增强聊天面板
│   │   ├── ConversationPanel.tsx      # 对话面板
│   │   ├── ConversationHistory.tsx    # 对话历史
│   │   ├── ActivityPanel.tsx          # 活动记录面板
│   │   ├── ActivityTimeline.tsx       # 活动时间线
│   │   ├── ActivityCard.tsx           # 活动卡片
│   │   ├── TodoList.tsx               # 待办事项列表
│   │   ├── TodoItem.tsx               # 待办事项
│   │   ├── TodoForm.tsx               # 待办表单
│   │   ├── CategoryFilter.tsx         # 分类过滤
│   │   ├── QuickActions.tsx           # 快捷操作
│   │   └── TwoColumnLayout.tsx        # 双列布局
│   ├── services/             # API 服务调用
│   ├── store/                # Zustand 状态管理
│   ├── types/                # TypeScript 类型定义
│   └── utils/                # 工具函数

Open-AutoGLM/                  # AutoGLM 子模块 (git submodule)
```

### 架构设计

**数据流**:
```
文本指令 → AutoLifeAgent → PhoneAgent (GLM 理解 + 屏幕识别)
         → ADB/HDC 操作 → 执行结果 → 流式返回前端
```

**流式执行**:
- 后端使用 `run_streaming()` 方法逐步执行任务
- 通过 SSE (Server-Sent Events) 实时推送执行进度
- 前端使用 EventSource 接收流式数据并实时渲染

### 关键依赖

**后端 (Python)**:
- `Open-AutoGLM/phone_agent`: 通过 `sys.path.insert` 导入
- Web 框架: `FastAPI` (REST API + SSE), `uvicorn` (ASGI 服务器)
- 设备控制: ADB (Android) 或 HDC (鸿蒙) 命令行工具
- 计划中: `scrcpy` + `ffmpeg` (H.264 流式投屏)

**前端 (React + TypeScript)**:
- 核心框架: `React 19.2`, `TypeScript 5.9`
- UI 框架: `Ant Design 6.1`, `Ant Design X 2.1`
- 通信: `axios` (HTTP), `EventSource` (SSE 流式)
- 状态管理: `zustand`

## 开发命令

### 包管理

```bash
# 安装依赖
uv sync

# 运行任务
uv run autolife "任务描述"
```

### API 服务

```bash
# 启动开发服务器（支持热重载）
uv run uvicorn autolife.api.main:app --reload

# 生产模式启动
uv run uvicorn autolife.api.main:app --host 0.0.0.0 --port 8000
```

### 前端开发

```bash
cd autolife-web
npm install
npm run dev      # 开发模式
npm run build    # 构建生产版本
```

## 开发注意事项

### 已实现功能
- ✅ 核心 Agent (基础 + 流式执行)
- ✅ CLI 命令行工具
- ✅ REST API (任务执行 + SSE 流式)
- ✅ 前端界面 (聊天、活动记录、待办事项)
- ✅ 对话历史管理

### 开发中功能
- 🚧 scrcpy 实时投屏 (参考 docs/scrcpy-t.md)
  - 目标: H.264 流 + jMuxer/MSE 解码
  - 状态: 架构设计完成，正在实现

### 已废弃功能
- ❌ 语音输入/输出 (v0.2.0 移除)
- ❌ ASR/TTS 集成 (v0.2.0 移除)

## 代码风格

- Python 代码遵循 PEP 8
- 使用 `black` 格式化 (line-length=100)
- 使用 `ruff` 进行代码检查
- TypeScript 使用 ESLint + Prettier

## 测试

```bash
# 运行 Python 测试
uv run pytest

# 前端测试
cd autolife-web
npm test
```

