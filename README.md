# AutoLife - 智能手机助手 🤖

<div align="center">

**基于 AutoGLM 的智能手机助手**

通过自然语言指令控制手机，让 AI 帮你完成操作！

</div>

---

## 📖 项目简介

AutoLife 是基于 [Open-AutoGLM](https://github.com/zai-org/Open-AutoGLM) 开发的智能手机助手，提供便捷的手机自动化控制能力：

- 💬 **自然语言控制** - 通过文本指令控制手机
- 🤖 **智能理解** - 基于 GLM 模型理解用户意图
- � **多模态操作** - 结合屏幕视觉识别进行精准操作
- 🔄 **任务规划** - 自动规划复杂任务的执行步骤

### 典型应用场景

- 🚗 **自动回复**: "帮我回复微信消息'我在开会，稍后联系'"
- 🍳 **信息查询**: "打开小红书搜索糖醋排骨做法"
- �️ **生活服务**: "帮我在美团订午餐"

---

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Android 7.0+ 或 HarmonyOS 设备
- ADB 或 HDC 工具

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/99byte/autolife.git
cd autolife
git submodule update --init --recursive
```

#### 2. 安装 uv 包管理器

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex
```

#### 3. 创建虚拟环境并安装依赖

```bash
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv sync
```

#### 4. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填写你的配置
```

#### 5. 运行

```bash
# 执行任务
uv run autolife "打开微信"

# 启动 Web 界面
# 1. 启动后端
uv run uvicorn autolife.api.main:app --reload

# 2. 启动前端 (新终端)
cd autolife-web
npm install
npm run dev
```

---

## 📱 使用示例

### 命令行使用

```bash
# 执行任务
uv run autolife "打开小红书搜索美食"
```

### Python API 使用

```python
from autolife import AutoLifeAgent

agent = AutoLifeAgent()
agent.run("打开微信")
```

---

## 🏗️ 技术架构

### 模块结构

```
autolife/
├── agent.py          # AutoLifeAgent 主类
├── cli.py            # 命令行接口
├── api/              # REST API
├── examples/         # 使用示例
└── docs/             # 中文文档
```

---

##  开源协议

本项目基于 Apache 2.0 协议开源。

---

## 🙏 致谢

- [Open-AutoGLM](https://github.com/zai-org/Open-AutoGLM)
- [智谱 AI](https://open.bigmodel.cn/)
