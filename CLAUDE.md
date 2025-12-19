# CLAUDE.md

这个文件为 Claude Code (claude.ai/code) 提供在本代码库中工作的指导。

## 项目概述

AutoLife 是基于 Open-AutoGLM 开发的语音智能助手,为 AutoGLM 添加完整的语音交互能力:
- **核心功能**: 语音输入 (ASR) + 语音输出 (TTS) + 唤醒词检测
- **基础框架**: Open-AutoGLM (作为 git submodule)
- **开发状态**: 早期开发阶段,核心框架已搭建,API 集成待完善
- **目标用途**: 参加 AutoGLM 实战派开发者激励活动

## 代码结构

### 主要模块

```
src/autolife/                  # 主源码目录 (autolife 包)
├── cli.py                     # CLI 入口点,处理命令行参数和模式选择
├── voice_agent/
│   ├── agent.py              # VoiceAgent 核心类,整合 PhoneAgent + ASR + TTS
│   ├── asr/                  # ASR 语音识别模块
│   │   ├── base.py           # ASR 抽象基类,定义统一接口
│   │   └── zhipu.py          # 智谱 AI ASR 实现
│   ├── tts/                  # TTS 语音合成模块
│   │   ├── base.py           # TTS 抽象基类,定义统一接口
│   │   └── zhipu.py          # 智谱 AI TTS 实现
│   └── wakeword/             # 唤醒词检测模块
│       └── detector.py       # 关键词检测器
│
Open-AutoGLM/                  # AutoGLM 子模块 (git submodule)
└── phone_agent/               # PhoneAgent 核心代码
    ├── agent.py              # 手机控制代理
    ├── model/                # GLM 模型客户端
    ├── actions/              # 操作执行器 (点击、滑动、输入等)
    └── adb/hdc/             # 设备控制接口
```

### 架构设计

**数据流**: 语音输入 → ASR 识别 → 文本指令 → VoiceAgent → PhoneAgent (GLM 理解 + 屏幕识别) → ADB/HDC 操作 → 执行结果 → TTS 语音反馈

**设计模式**:
- `voice_agent/asr/` 和 `voice_agent/tts/` 使用抽象基类模式,便于扩展多种 ASR/TTS 服务
- `VoiceAgent` 作为外观模式,封装 PhoneAgent + 语音模块的交互
- `WakeWordDetector` 使用关键词匹配,未来可扩展为专用唤醒词模型

### 关键依赖

- `Open-AutoGLM/phone_agent`: 通过 `sys.path.insert` 导入,依赖 `openai`, `pillow`
- 语音服务: 当前设计使用智谱 AI API,但代码框架已就绪,实际 API 调用待实现
- 设备控制: ADB (Android) 或 HDC (鸿蒙) 命令行工具

## 项目构建流程（完整版）

### 首次设置

1. **克隆项目和子模块**
   ```bash
   git clone <repository-url>
   cd AutoLife
   git submodule update --init --recursive
   ```

2. **安装 uv（如果未安装）**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   # 或在 macOS 使用 Homebrew：brew install uv
   ```

3. **创建虚拟环境**
   ```bash
   # uv 会自动创建虚拟环境在 .venv 目录
   uv venv
   ```

4. **激活虚拟环境**
   ```bash
   # macOS/Linux
   source .venv/bin/activate

   # Windows
   .venv\Scripts\activate
   ```

5. **安装项目依赖**
   ```bash
   uv sync
   ```

6. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填写你的 ZHIPUAI_API_KEY
   ```

7. **验证安装**
   ```bash
   uv run autolife --help
   ```

### 日常开发

```bash
# 激活虚拟环境（如果未激活）
source .venv/bin/activate

# 运行命令
uv run autolife --text "测试任务"

# 或直接使用（虚拟环境激活后）
autolife --text "测试任务"
```

## 常用开发命令

### 包管理

```bash
# 使用 uv 包管理器
uv sync                    # 安装所有依赖
uv sync --extra dev        # 安装开发依赖
uv sync --extra whisper    # 安装 Whisper 支持

# 添加新依赖
uv add <package>

# 运行命令
uv run autolife --help
```

### 测试与运行

```bash
# 文本模式测试 (最快速的测试方式)
uv run autolife --text "打开微信"

# 显示帮助信息
uv run autolife --help

# 详细输出模式 (调试用)
uv run autolife --text "测试任务" --verbose

# 查看 ADB 设备连接
adb devices

# 查看 HDC 设备连接 (鸿蒙)
hdc list targets
```

### Git 子模块管理

```bash
# 初始化/更新 Open-AutoGLM 子模块
git submodule update --init --recursive

# 更新子模块到最新版本
git submodule update --remote Open-AutoGLM
```

## 开发注意事项

### 1. 导入路径处理

由于 Open-AutoGLM 是 git submodule,不是标准 Python 包,需要手动添加到 `sys.path`:

```python
# src/voice_agent/agent.py 中的处理方式
AUTOGLM_PATH = Path(__file__).parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))
from phone_agent import PhoneAgent
```

在修改导入相关代码时,确保 Open-AutoGLM 目录能被正确找到。

### 2. 包导入规范

**重要**: 项目使用标准的 `src layout` 结构，包名为 `autolife`，所有导入必须使用 `autolife` 前缀：

```python
# ✅ 正确的导入方式
from autolife.voice_agent.agent import VoiceAgent
from autolife.voice_agent.asr import ZhipuASR
from autolife.voice_agent.tts import ZhipuTTS

# ❌ 错误的导入方式（不要使用 src 前缀）
from src.voice_agent.agent import VoiceAgent
```

**开发环境设置**:

为了让导入正常工作，必须以**开发模式**安装项目：

```bash
# 使用 uv（推荐）
uv pip install -e .

# 或使用 pip
pip install -e .
```

开发模式安装的优势：
- 代码修改立即生效，无需重新安装
- 导入路径与生产环境完全一致
- IDE 能正确识别和补全导入

**目录结构**:
- 源代码位于 `src/autolife/` 目录
- CLI 入口定义在 `pyproject.toml`: `autolife = "autolife.cli:main"`
- 安装后，`autolife` 包可从任何位置导入

### 3. 当前开发状态

**已完成**:
- 项目架构和目录结构
- VoiceAgent 核心类框架
- ASR/TTS 抽象基类定义
- CLI 命令行接口
- 基础文档 (README, 快速开始, 路线图)

**待实现**:
- 智谱 AI ASR/TTS API 的实际调用 (当前只有接口定义)
- 音频录制和播放功能
- 实时语音监听循环
- 流式语音识别
- 单元测试

### 4. API 密钥配置

```bash
# 设置环境变量
export ZHIPUAI_API_KEY="your-api-key"
export AUTOGLM_BASE_URL="http://localhost:8000/v1"
export AUTOGLM_MODEL="autoglm-phone-9b"
export PHONE_AGENT_DEVICE_ID="device-id"  # 可选
```

### 5. 设备调试要求

- Android 设备需要启用 USB 调试,安装 ADB Keyboard
- 鸿蒙设备需要启用 USB 调试
- 确认设备连接: `adb devices` 或 `hdc list targets`

### 6. 代码风格

- 使用中文注释和中文文档 (用户全局指令要求)
- 工具配置: black (格式化), ruff (linting), mypy (类型检查)
- 目标 Python 版本: 3.10+

## 扩展开发指南

### 添加新的 ASR 服务

1. 在 `src/autolife/voice_agent/asr/` 创建新文件 (如 `openai_whisper.py`)
2. 继承 `ASRBase` 基类
3. 实现 `transcribe()` 方法,返回 `ASRResult`
4. 在 `src/autolife/voice_agent/asr/__init__.py` 中导出

### 添加新的 TTS 服务

1. 在 `src/autolife/voice_agent/tts/` 创建新文件
2. 继承 `TTSBase` 基类
3. 实现 `speak()` 和 `synthesize()` 方法
4. 在 `src/autolife/voice_agent/tts/__init__.py` 中导出

### 自定义唤醒词模型

当前 `WakeWordDetector` 使用简单的关键词匹配,可扩展为:
- Porcupine: 专用唤醒词引擎
- Snowboy: 自定义唤醒词训练
- 本地音频特征匹配

## 相关文档

- **Open-AutoGLM 文档**: `Open-AutoGLM/README.md` - 了解 PhoneAgent API 和使用方式
- **快速开始**: `docs/quickstart.md` - 完整安装和使用指南
- **开发路线图**: `docs/ROADMAP.md` - 项目进度和计划
- **项目结构**: `PROJECT_STRUCTURE.md` - 详细的目录结构说明

## 故障排查

### 问题: 找不到 phone_agent 模块

检查 Open-AutoGLM 子模块是否已初始化:
```bash
git submodule update --init --recursive
ls Open-AutoGLM/phone_agent/  # 确认目录存在
```

### 问题: ADB 设备未连接

```bash
adb devices  # 检查设备列表
adb kill-server && adb start-server  # 重启 ADB 服务
```

确保:
- USB 调试已启用
- 手机上已授权计算机调试
- USB 数据线支持数据传输

### 问题: 命令行工具找不到

检查 `pyproject.toml` 中的入口点配置:
```toml
[project.scripts]
autolife = "autolife.cli:main"
```

确保以开发模式重新安装: `uv pip install -e .`
