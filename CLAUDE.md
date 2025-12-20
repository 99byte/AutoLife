# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- `Open-AutoGLM/phone_agent`: 通过 `sys.path.insert` 导入 (见 `agent.py:10-11`),依赖 `openai`, `pillow`
- 语音服务: 智谱 AI API
  - ASR API: `https://open.bigmodel.cn/api/paas/v4/audio/transcriptions`
  - TTS API: `https://open.bigmodel.cn/api/paas/v4/audio/speech`
  - 需要 `ZHIPUAI_API_KEY` 环境变量
- 音频处理: `sounddevice` (录制/播放), `soundfile` (文件读写)
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
# 文本模式测试 (最快速的测试方式,不需要真实设备)
uv run autolife --text "打开微信"

# 语音监听模式 (需要麦克风和 ZHIPUAI_API_KEY)
uv run autolife --listen

# 从音频文件识别并执行
uv run autolife --audio recording.wav

# 自定义唤醒词
uv run autolife --listen --wake-words "小智" "助手"

# 禁用语音反馈
uv run autolife --text "查询天气" --no-voice-feedback

# 详细输出模式 (调试用)
uv run autolife --text "测试任务" --verbose

# 查看 ADB 设备连接
adb devices

# 查看 HDC 设备连接 (鸿蒙)
hdc list targets

# 运行单个测试 (测试框架尚未实现)
# pytest tests/test_asr.py -v
```

### Git 子模块管理

```bash
# 初始化/更新 Open-AutoGLM 子模块
git submodule update --init --recursive

# 更新子模块到最新版本
git submodule update --remote Open-AutoGLM
```

## 开发注意事项

### 1. Open-AutoGLM 子模块导入

由于 Open-AutoGLM 是 git submodule,不是标准 Python 包,**所有需要导入 phone_agent 的模块都必须手动添加到 `sys.path`**:

```python
# src/autolife/voice_agent/agent.py 中的处理方式 (第 10-11 行)
AUTOGLM_PATH = Path(__file__).parent.parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))
from phone_agent import PhoneAgent
```

**重要**: 如果新建模块需要导入 `phone_agent`,必须重复这个路径处理逻辑。路径计算基于当前文件位置:
- `src/autolife/voice_agent/agent.py`: 向上 4 层到项目根目录
- `src/autolife/cli.py`: 从 `cli.py` 导入 agent 时,路径已被处理

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
- VoiceAgent 核心类框架 (`src/autolife/voice_agent/agent.py`)
- ASR/TTS 抽象基类定义和智谱 AI 实现
  - ASR: `src/autolife/voice_agent/asr/zhipu.py` - 使用智谱 glm-asr-2512 模型
  - TTS: `src/autolife/voice_agent/tts/zhipu.py` - 使用智谱 glm-tts 模型
- 音频录制器 (`src/autolife/voice_agent/audio/recorder.py`)
  - 支持定时录音和实时录音
  - 使用 sounddevice 和 soundfile 库
- 语音监听循环实现 (`agent.py:start_listening()`)
  - 唤醒词检测 → 录制指令 → ASR 识别 → 执行任务 → TTS 反馈
- CLI 命令行接口完整实现
- 基础文档 (README, 快速开始, 路线图)

**待实现**:
- 流式语音识别 (当前为批量识别)
- 单元测试 (tests/ 目录为空)
- 错误处理和异常恢复优化
- 性能优化 (降低识别延迟)

### 4. API 密钥配置

项目使用 `python-dotenv` 自动加载 `.env` 文件。CLI (`cli.py:20-33`) 会按优先级查找:
1. 当前目录的 `.env`
2. 项目根目录的 `.env`
3. 系统环境变量

```bash
# 推荐: 在项目根目录创建 .env 文件
cp .env.example .env
# 编辑 .env,填写 ZHIPUAI_API_KEY

# 或者直接设置环境变量
export ZHIPUAI_API_KEY="your-api-key"
export AUTOGLM_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
export AUTOGLM_MODEL="glm-4-flash"
export PHONE_AGENT_DEVICE_ID="device-id"  # 可选,多设备时需要
```

**注意**: `ZHIPUAI_API_KEY` 是必需的,用于 ASR 和 TTS。可从 https://open.bigmodel.cn/ 获取。

### 5. 设备调试要求

- Android 设备需要启用 USB 调试,安装 ADB Keyboard
- 鸿蒙设备需要启用 USB 调试
- 确认设备连接: `adb devices` 或 `hdc list targets`

### 6. 代码风格与工具

- **注释和文档**: 必须使用中文 (用户全局指令要求)
- **格式化**: black (行长 100, 配置在 `pyproject.toml:73-75`)
- **Linting**: ruff (行长 100, Python 3.10+, 配置在 `pyproject.toml:69-71`)
- **类型检查**: mypy (配置在 `pyproject.toml:77-81`, 当前 `disallow_untyped_defs = false`)
- **目标版本**: Python 3.10+

运行代码质量检查 (虽然尚未在 pyproject.toml 中配置脚本):
```bash
# 格式化
black src/

# Linting
ruff check src/

# 类型检查
mypy src/
```

## 扩展开发指南

### 添加新的 ASR 服务

当前实现: `ZhipuASR` (智谱 AI glm-asr-2512)

添加新服务的步骤:
1. 在 `src/autolife/voice_agent/asr/` 创建新文件 (如 `openai_whisper.py`)
2. 继承 `ASRBase` 基类 (`asr/base.py`)
3. 实现 `transcribe(audio_input) -> ASRResult` 方法
4. 可选: 实现 `transcribe_stream()` 用于流式识别
5. 在 `src/autolife/voice_agent/asr/__init__.py` 中导出
6. 在 `VoiceAgent.__init__()` 中作为 `asr_client` 参数传入

参考实现: `src/autolife/voice_agent/asr/zhipu.py`

### 添加新的 TTS 服务

当前实现: `ZhipuTTS` (智谱 AI glm-tts)

添加新服务的步骤:
1. 在 `src/autolife/voice_agent/tts/` 创建新文件
2. 继承 `TTSBase` 基类 (`tts/base.py`)
3. 实现以下方法:
   - `synthesize(text, config) -> bytes`: 合成音频数据
   - `speak(text, config) -> None`: 合成并播放
   - `save_to_file(text, file_path, config) -> None`: 合成并保存
4. 在 `src/autolife/voice_agent/tts/__init__.py` 中导出
5. 在 `VoiceAgent.__init__()` 中作为 `tts_client` 参数传入

参考实现: `src/autolife/voice_agent/tts/zhipu.py` (使用 sounddevice 播放)

### 自定义唤醒词模型

当前实现: `WakeWordDetector` 使用简单的关键词匹配 (`wakeword/detector.py`)
- 工作流程: 录制音频 → ASR 转文本 → 关键词匹配
- 默认唤醒词: "小智", "AutoLife"

可扩展为专用模型:
- **Porcupine**: 专用唤醒词引擎 (需安装 `pvporcupine`)
- **Snowboy**: 自定义唤醒词训练
- **本地 VAD**: 音频特征匹配,降低 ASR 调用次数

## 相关文档

- **Open-AutoGLM 文档**: `Open-AutoGLM/README.md` - 了解 PhoneAgent API 和使用方式
- **快速开始**: `docs/quickstart.md` - 完整安装和使用指南
- **开发路线图**: `docs/ROADMAP.md` - 项目进度和计划
- **项目结构**: `PROJECT_STRUCTURE.md` - 详细的目录结构说明

## 故障排查

### 问题: 找不到 phone_agent 模块

**原因**: Open-AutoGLM 子模块未初始化

**解决方案**:
```bash
git submodule update --init --recursive
ls Open-AutoGLM/phone_agent/  # 确认目录存在
```

如果仍然失败,检查 `sys.path` 设置是否正确 (见"开发注意事项"第1条)。

### 问题: ImportError: No module named 'autolife'

**原因**: 项目未以开发模式安装

**解决方案**:
```bash
uv pip install -e .  # 推荐
# 或
pip install -e .
```

### 问题: ADB 设备未连接

**症状**: `phone_agent` 无法控制设备

**解决方案**:
```bash
adb devices  # 检查设备列表
adb kill-server && adb start-server  # 重启 ADB 服务
```

确保:
- USB 调试已启用 (设置 → 开发者选项)
- 手机上已授权计算机调试 (弹窗点击"允许")
- USB 数据线支持数据传输 (不仅仅是充电线)
- 安装 ADB Keyboard (用于文本输入)

### 问题: 语音识别/合成失败

**症状**: ASR/TTS API 调用失败

**可能原因**:
1. `ZHIPUAI_API_KEY` 未设置或无效
2. API 配额不足
3. 网络问题

**解决方案**:
```bash
# 检查环境变量
echo $ZHIPUAI_API_KEY

# 检查 .env 文件
cat .env | grep ZHIPUAI_API_KEY

# 测试 API
curl -H "Authorization: Bearer $ZHIPUAI_API_KEY" \
  https://open.bigmodel.cn/api/paas/v4/audio/transcriptions
```

### 问题: 音频录制/播放失败

**症状**: `sounddevice` 或 `soundfile` 报错

**可能原因**: 依赖未安装或音频设备问题

**解决方案**:
```bash
# 重新安装音频依赖
uv sync

# 检查可用音频设备
python -c "import sounddevice as sd; print(sd.query_devices())"

# 测试音频系统
python -c "from autolife.voice_agent.audio import AudioRecorder; AudioRecorder.test_audio()"
```

### 问题: 命令行工具找不到

**症状**: `autolife: command not found`

**解决方案**:
```bash
# 检查入口点配置
grep -A 2 '\[project.scripts\]' pyproject.toml

# 重新安装
uv pip install -e .

# 或直接运行
uv run autolife --help
```
