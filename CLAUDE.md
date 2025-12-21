# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

这个文件为 Claude Code (claude.ai/code) 提供在本代码库中工作的指导。

## 项目概述

AutoLife 是基于 Open-AutoGLM 开发的智能手机助手，提供便捷的手机自动化控制能力。
- **核心功能**: 自然语言控制
- **基础框架**: Open-AutoGLM (作为 git submodule)
- **技术架构**: Python + FastAPI (后端) + React + TypeScript (前端)

## 代码结构

### 主要模块

```
src/autolife/                  # 主源码目录 (autolife 包)
├── cli.py                     # CLI 入口点
├── agent.py                   # AutoLifeAgent 核心类
├── api/                       # FastAPI REST API 服务
│   ├── main.py               # FastAPI 应用入口
│   ├── models.py             # API 数据模型
│   ├── dependencies.py       # 依赖注入
│   └── routes/               # API 路由
│       ├── health.py         # 健康检查
│       └── agent.py          # 任务执行路由

autolife-web/                  # React 前端应用
├── src/
│   ├── components/           # React 组件
│   ├── services/             # API 服务调用
│   ├── store/                # Zustand 状态管理
│   ├── types/                # TypeScript 类型定义
│   └── utils/                # 工具函数

Open-AutoGLM/                  # AutoGLM 子模块 (git submodule)
```

### 架构设计

**数据流**: 文本指令 → AutoLifeAgent → PhoneAgent (GLM 理解 + 屏幕识别) → ADB/HDC 操作 → 执行结果

### 关键依赖

**后端 (Python)**:
- `Open-AutoGLM/phone_agent`: 通过 `sys.path.insert` 导入
- Web 框架: `FastAPI` (REST API), `uvicorn` (ASGI 服务器)
- 设备控制: ADB (Android) 或 HDC (鸿蒙) 命令行工具

**前端 (React + TypeScript)**:
- 核心框架: `React 19.2`, `TypeScript 5.9`
- UI 框架: `Ant Design 6.1`, `Ant Design X 2.1`
- 通信: `axios` (HTTP), `EventSource` (SSE)
- 状态管理: `zustand`

## 开发命令

### 包管理

```bash
uv sync
uv run autolife "任务描述"
```

### API 服务

```bash
uv run uvicorn autolife.api.main:app --reload
```

### 前端开发

```bash
cd autolife-web
npm run dev
```
