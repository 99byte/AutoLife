# AutoLife 项目结构

生成时间: 2025-12-19

## 目录结构

```
AutoLife/
├── README.md                          # 项目主文档
├── pyproject.toml                     # 项目配置和依赖管理
├── .gitignore                        # Git忽略文件配置
├── .python-version                   # Python版本指定
├── main.py                           # uv生成的入口文件
│
├── Open-AutoGLM/                     # AutoGLM子模块 (git submodule)
│   ├── README.md
│   ├── main.py                       # AutoGLM原始入口
│   ├── requirements.txt
│   └── phone_agent/                  # AutoGLM核心代码
│       ├── __init__.py
│       ├── agent.py                  # PhoneAgent主类
│       ├── model/                    # 模型客户端
│       ├── actions/                  # 动作处理
│       ├── adb/                      # Android ADB控制
│       ├── hdc/                      # HarmonyOS HDC控制
│       └── config/                   # 配置和提示词
│
└── autolife/                         # AutoLife主项目
    ├── __init__.py                   # 包初始化
    ├── cli.py                        # 命令行接口
    │
    ├── voice_agent/                  # 语音代理模块
    │   ├── __init__.py
    │   ├── agent.py                  # VoiceAgent主类 (整合语音+AutoGLM)
    │   │
    │   ├── asr/                      # ASR语音识别模块
    │   │   ├── __init__.py
    │   │   ├── base.py               # ASR基类
    │   │   └── zhipu.py              # 智谱AI ASR实现
    │   │
    │   ├── tts/                      # TTS语音合成模块
    │   │   ├── __init__.py
    │   │   ├── base.py               # TTS基类
    │   │   └── zhipu.py              # 智谱AI TTS实现
    │   │
    │   └── wakeword/                 # 唤醒词检测模块
    │       ├── __init__.py
    │       └── detector.py           # 唤醒词检测器
    │
    ├── examples/                     # 示例代码
    │   ├── __init__.py
    │   └── basic_usage.py            # 基础使用示例
    │
    ├── docs/                         # 中文文档
    │   ├── quickstart.md             # 快速开始指南
    │   └── ROADMAP.md                # 开发路线图
    │
    └── demos/                        # 演示素材目录
        └── (待添加视频和录音)
```

## 核心模块说明

### 1. autolife/voice_agent/agent.py
**VoiceAgent - 语音智能助手核心类**

```python
class VoiceAgent:
    """
    整合AutoGLM和语音能力的主类
    
    功能:
    - run_from_text(): 文本模式执行任务
    - run_from_voice(): 语音模式执行任务
    - start_listening(): 启动语音监听
    - stop_listening(): 停止语音监听
    """
```

### 2. autolife/voice_agent/asr/
**ASR (自动语音识别) 模块**

- `base.py`: ASR基类和接口定义
- `zhipu.py`: 智谱AI ASR客户端实现
- 支持扩展: OpenAI Whisper, 本地模型等

### 3. autolife/voice_agent/tts/
**TTS (文本转语音) 模块**

- `base.py`: TTS基类和接口定义
- `zhipu.py`: 智谱AI TTS客户端实现
- 支持音色、语速、音调调节

### 4. autolife/voice_agent/wakeword/
**唤醒词检测模块**

- `detector.py`: 唤醒词检测器
- 支持自定义唤醒词 (如"小智"、"AutoLife")
- 可扩展为专用模型 (Porcupine)

### 5. autolife/cli.py
**命令行接口**

提供便捷的CLI工具:
```bash
autolife --text "任务描述"        # 文本模式
autolife --audio "file.wav"       # 音频文件模式
autolife --listen                 # 语音监听模式
```

## 数据流程

### 语音控制流程
```
用户语音输入
    ↓
麦克风录音
    ↓
ASR识别 (autolife/voice_agent/asr/)
    ↓
文本指令
    ↓
VoiceAgent处理 (autolife/voice_agent/agent.py)
    ↓
调用PhoneAgent (Open-AutoGLM/phone_agent/agent.py)
    ↓
GLM模型理解 + 屏幕识别
    ↓
ADB/HDC执行操作
    ↓
执行结果
    ↓
TTS语音反馈 (autolife/voice_agent/tts/)
    ↓
音频播放
```

### 文本控制流程
```
用户文本输入
    ↓
VoiceAgent.run_from_text()
    ↓
PhoneAgent.run()
    ↓
执行操作
    ↓
返回结果
```

## 依赖关系

### 核心依赖
- `openai >= 2.9.0`: OpenAI API客户端 (AutoGLM使用)
- `pillow >= 12.0.0`: 图像处理

### 可选依赖
- `sounddevice`: 音频录制/播放
- `soundfile`: 音频文件读写
- `numpy`: 音频数据处理
- `openai-whisper`: 本地ASR模型
- `pvporcupine`: 唤醒词检测

## 配置文件

### pyproject.toml
项目元信息、依赖管理、构建配置

```toml
[project]
name = "autolife"
version = "0.1.0"
requires-python = ">=3.10"

[project.scripts]
autolife = "autolife.cli:main"
```

### 环境变量
```bash
ZHIPUAI_API_KEY          # 智谱AI API密钥
AUTOGLM_BASE_URL         # AutoGLM模型服务地址
AUTOGLM_MODEL            # 模型名称
PHONE_AGENT_DEVICE_ID    # ADB设备ID
```

## 开发工具

- **包管理器**: uv
- **代码格式化**: black, ruff
- **类型检查**: mypy
- **测试框架**: pytest

## 环境配置文件

### .env（Git 忽略）
运行时环境变量配置文件，包含：
- API 密钥（ZHIPUAI_API_KEY）
- 模型服务地址（AUTOGLM_BASE_URL）
- 设备配置等

### .env.example
环境变量模板文件，提供：
- 完整的配置项说明
- 默认值示例
- 使用智谱官方 API 的推荐配置

## 辅助脚本

### scripts/verify_setup.sh
项目构建验证脚本，用于检查：
- Python 版本和环境
- uv 安装情况
- 虚拟环境创建
- Git 子模块初始化
- 环境变量配置
- 设备连接状态
- 依赖安装完整性

## 文件统计

- Python文件: ~20个
- 核心代码: ~1500行
- 文档: ~2000行
- 示例: 5+个场景

## 下一步开发

参考 `autolife/docs/ROADMAP.md` 了解详细的开发计划。

---

**维护者**: AutoLife Team
**最后更新**: 2024-12-19
