# AutoLife - 智能语音助手 🎤

<div align="center">

**基于 AutoGLM 的语音智能助手**

让你的手机听懂你的话,解放双手,语音控制一切!

[功能特性](#功能特性) •
[快速开始](#快速开始) •
[使用示例](#使用示例) •
[技术架构](#技术架构) •
[参与比赛](#参与比赛)

</div>

---

## 📖 项目简介

AutoLife 是基于 [Open-AutoGLM](https://github.com/zai-org/Open-AutoGLM) 开发的语音智能助手,为 AutoGLM 添加了完整的语音交互能力:

- 🎤 **语音输入** - 通过 ASR (自动语音识别) 将语音转为文本指令
- 🔊 **语音输出** - 通过 TTS (文本转语音) 提供语音反馈
- 👂 **唤醒词检测** - 支持"小智"、"AutoLife"等自定义唤醒词
- 🤖 **智能控制** - 继承 AutoGLM 的多模态手机控制能力
- 💬 **连续对话** - 支持上下文理解和多轮对话

### 典型应用场景

- 🚗 **驾驶场景**: "帮我回复微信消息'我在开车,稍后联系'"
- 🍳 **烹饪场景**: "打开小红书搜索糖醋排骨做法"
- 🏃 **运动场景**: "切换下一首歌"
- 🛋️ **生活场景**: "帮我在美团订午餐"

---

## ✨ 功能特性

### 核心功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 文本控制 | 通过文本指令控制手机 | ✅ 已实现 |
| 语音输入 | ASR 语音识别 (支持智谱 AI) | 🚧 开发中 |
| 语音输出 | TTS 语音合成与播放 | 🚧 开发中 |
| 唤醒词检测 | 自定义唤醒词 | 🚧 开发中 |
| 连续对话 | 多轮对话与上下文理解 | 📋 计划中 |
| 场景自适应 | 根据当前应用智能调整 | 📋 计划中 |

### 语音能力

- **ASR (语音识别)**
  - ✅ 智谱 AI CogAudio API 集成
  - 🔄 OpenAI Whisper 支持
  - 🔄 本地 Whisper 模型支持
  - 🔄 流式识别

- **TTS (语音合成)**
  - ✅ 智谱 AI TTS API 集成
  - 🔄 多音色支持
  - 🔄 语速/音调调节
  - 🔄 实时语音播放

- **唤醒词检测**
  - ✅ 基于关键词的简单检测
  - 🔄 专用唤醒词模型 (Porcupine)
  - 🔄 自定义唤醒词训练

---

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Android 7.0+ 或 HarmonyOS 设备
- ADB 或 HDC 工具
- 智谱 AI API Key (用于 ASR/TTS)

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

# 或使用 Homebrew (macOS)
brew install uv

# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex
```

#### 3. 创建虚拟环境并安装依赖

```bash
# 创建虚拟环境
uv venv

# 激活虚拟环境
# macOS/Linux
source .venv/bin/activate
# Windows
.venv\Scripts\activate

# 安装依赖
uv sync
```

#### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写你的配置
# 必需配置：ZHIPUAI_API_KEY
```

**获取智谱 AI API 密钥：**
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册并登录账号
3. 进入"API 密钥"页面创建密钥
4. 复制密钥到 `.env` 文件的 `ZHIPUAI_API_KEY` 变量

#### 5. 配置手机设备

参考 [设备配置指南](./docs/quickstart.md#4-配置手机设备)

#### 6. 验证安装

```bash
# 显示帮助信息
uv run autolife --help

# 测试文本模式（不需要手机连接）
uv run autolife --text "你好" --verbose
```

如果看到 CLI 正常输出，说明安装成功！

#### 7. 开发模式安装（推荐开发者）

如果你要参与开发或修改代码，建议以**可编辑模式**安装项目：

```bash
# 使用 uv（推荐）
uv pip install -e .

# 或使用 pip
pip install -e .
```

**开发模式的优势**：
- ✅ 代码修改后立即生效，无需重新安装
- ✅ 导入路径与生产环境一致（使用 `from autolife ...`）
- ✅ IDE 能正确识别和补全导入
- ✅ 便于调试和测试

**注意**：项目使用标准的 `src layout` 结构，所有导入应使用 `autolife` 作为包名：
```python
from autolife.voice_agent.agent import VoiceAgent  # ✅ 正确
from src.voice_agent.agent import VoiceAgent       # ❌ 错误
```

---

## 📱 使用示例

### 方式 1: 命令行使用

```bash
# 文本模式 - 直接执行任务
uv run autolife --text "打开小红书搜索美食"

# 音频文件模式 - 从音频文件识别
uv run autolife --audio recording.wav

# 语音监听模式 - 持续监听唤醒词
uv run autolife --listen

# 自定义唤醒词
uv run autolife --listen --wake-words "小智" "助手"

# 禁用语音反馈(仅文本输出)
uv run autolife --text "查询天气" --no-voice-feedback
```

### 方式 2: Python API 使用

```python
from autolife import VoiceAgent
from phone_agent.model import ModelConfig

# 创建语音助手
agent = VoiceAgent(
    model_config=ModelConfig(
        base_url="http://localhost:8000/v1",
        model="autoglm-phone-9b"
    )
)

# 文本控制
agent.run_from_text("打开微信")

# 语音控制
agent.run_from_voice("audio.wav")

# 启动语音监听
agent.start_listening()
```

### 方式 3: 作为库使用

```python
from autolife.voice_agent.asr import ZhipuASR
from autolife.voice_agent.tts import ZhipuTTS

# 单独使用 ASR
asr = ZhipuASR(api_key="your-key")
result = asr.transcribe("audio.wav")
print(f"识别结果: {result.text}")

# 单独使用 TTS
tts = ZhipuTTS(api_key="your-key")
tts.speak("你好,我是智能助手")
```

---

## 🏗️ 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                   用户交互层                      │
├─────────────────────────────────────────────────┤
│  语音输入 → ASR → 文本指令 → AutoGLM → 动作执行   │
│                          ↓                       │
│                    执行结果文本                   │
│                          ↓                       │
│                    TTS → 语音输出                │
└─────────────────────────────────────────────────┘
```

### 模块结构

```
autolife/
├── voice_agent/           # 语音代理核心模块
│   ├── agent.py          # VoiceAgent 主类
│   ├── asr/              # ASR 语音识别模块
│   │   ├── base.py       # ASR 基类
│   │   └── zhipu.py      # 智谱 AI ASR 实现
│   ├── tts/              # TTS 语音合成模块
│   │   ├── base.py       # TTS 基类
│   │   └── zhipu.py      # 智谱 AI TTS 实现
│   └── wakeword/         # 唤醒词检测模块
│       └── detector.py   # 唤醒词检测器
├── cli.py                # 命令行接口
├── examples/             # 使用示例
├── docs/                 # 中文文档
└── demos/                # 演示视频素材
```

### 核心流程

1. **语音输入流程**
   ```
   音频采集 → ASR识别 → 文本指令 → 意图理解
   ```

2. **任务执行流程**
   ```
   文本指令 → GLM理解 → 屏幕识别 → ADB操作 → 反馈
   ```

3. **语音输出流程**
   ```
   执行结果 → TTS合成 → 音频播放
   ```

---

## 🎯 参与 AutoGLM 实战派比赛

本项目专为参加 **AutoGLM 实战派开发者激励活动** 而开发!

### 赛道信息

**赛道 1: 灵感二创赛道 (开发向)**
- 💰 奖金池: 50,000 元
- 🎯 目标: 对 AutoGLM 进行二次开发
- 🏆 奖项: 一等奖 10,000 元 / 二等奖 5,000 元 / 三等奖 1,000 元

**赛道 2: 生活实用赛道 (应用向)**
- 💰 每周奖金: 20,000 元
- 🎯 目标: 展示 AutoGLM 真实应用场景
- 📹 形式: 小红书/CSDN 发布演示视频或技术文章

### 创新点

- ✅ **语音交互**: 将触控操作升级为语音控制
- ✅ **多模态融合**: 语音 + 视觉理解
- ✅ **实用场景**: 解放双手的真实应用
- ✅ **开源贡献**: 完整的代码和文档

### 提交材料

- [ ] 完整可运行的代码
- [ ] 中文技术文档
- [ ] 演示视频
- [ ] 使用教程

---

## 📚 文档

- [安装指南](./docs/installation.md)
- [快速开始](./docs/quickstart.md)
- [API 文档](./docs/api.md)
- [开发指南](./docs/development.md)
- [常见问题](./docs/faq.md)

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议!

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 开源协议

本项目基于 Apache 2.0 协议开源。

---

## 🙏 致谢

- [Open-AutoGLM](https://github.com/zai-org/Open-AutoGLM) - 核心手机控制框架
- [智谱 AI](https://open.bigmodel.cn/) - 提供 GLM 模型和 API 服务
- AutoGLM 实战派活动组织方

---

## 📮 联系方式

- GitHub Issues: [提交问题](https://github.com/yourusername/autolife/issues)
- Email: autolife@example.com

---

<div align="center">

**如果这个项目对你有帮助,请给一个 ⭐️ Star!**

Made with ❤️ for AutoGLM 实战派活动

</div>
