# 快速开始指南

本指南将帮助你快速上手 AutoLife 语音智能助手。

## 前置条件

在开始之前,请确保你已经:

1. ✅ 安装了 Python 3.10 或更高版本
2. ✅ 准备了 Android 7.0+ 或 HarmonyOS 设备
3. ✅ 安装并配置了 ADB 或 HDC 工具
4. ✅ 获取了智谱 AI API Key

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/autolife.git
cd autolife
git submodule update --init --recursive
```

### 2. 安装 uv 包管理器

uv 是一个快速的 Python 包管理器和虚拟环境管理工具：

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# macOS (使用 Homebrew)
brew install uv

# Windows (PowerShell 管理员模式)
irm https://astral.sh/uv/install.ps1 | iex
```

安装后重启终端或执行 `source ~/.bashrc`（Linux）/ `source ~/.zshrc`（macOS）。

### 3. 创建虚拟环境

```bash
# 在项目根目录创建虚拟环境
uv venv

# 虚拟环境会创建在 .venv 目录下
```

### 4. 激活虚拟环境

```bash
# macOS/Linux
source .venv/bin/activate

# Windows (CMD)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

激活后，终端提示符前会显示 `(.venv)`。

### 5. 安装依赖

```bash
# 安装所有依赖
uv sync

# 可选：安装开发依赖
uv sync --extra dev

# 可选：安装 Whisper 支持（本地语音识别）
uv sync --extra whisper
```

### 6. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 使用你喜欢的编辑器打开 .env
nano .env
# 或
vim .env
# 或
code .env  # VS Code
```

**必需配置：**
```bash
ZHIPUAI_API_KEY=your_zhipuai_api_key_here
```

**获取 API 密钥：**
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册并登录
3. 点击右上角头像 → API 密钥 → 创建密钥
4. 复制密钥并粘贴到 `.env` 文件

### 7. 配置手机设备

#### Android 设备

1. 启用开发者模式:
   - 进入 `设置 → 关于手机 → 版本号`
   - 连续点击 7-10 次,直到显示"开发者模式已启用"

2. 启用 USB 调试:
   - 进入 `设置 → 开发者选项 → USB 调试`
   - 打开开关

3. 安装 ADB Keyboard:
   - 下载 [ADB Keyboard APK](https://github.com/senzhk/ADBKeyBoard/blob/master/ADBKeyboard.apk)
   - 安装后在 `设置 → 输入法` 中启用

4. 连接设备:
   ```bash
   # 使用 USB 数据线连接手机和电脑
   adb devices
   # 应该看到你的设备列表
   ```

#### 鸿蒙设备

1. 启用开发者模式 (同 Android)
2. 连接设备:
   ```bash
   hdc list targets
   ```

### 5. 启动模型服务

你可以选择本地部署或使用第三方服务:

#### 选项 A: 使用第三方服务

直接使用智谱 AI 的在线服务:

```bash
export AUTOGLM_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
export AUTOGLM_MODEL="autoglm-phone-9b"
```

#### 选项 B: 本地部署

参考 [Open-AutoGLM 文档](../Open-AutoGLM/README.md) 部署本地模型服务。

### 6. 开发模式安装（推荐开发者）

如果你计划参与开发或修改代码，强烈建议以**可编辑模式**安装项目：

```bash
# 确保虚拟环境已激活
source .venv/bin/activate  # macOS/Linux
# 或 .venv\Scripts\activate  # Windows

# 使用 uv 以可编辑模式安装
uv pip install -e .

# 或使用 pip
pip install -e .
```

**为什么需要开发模式？**

1. **代码修改即时生效** - 修改 Python 代码后无需重新安装
2. **正确的导入路径** - 项目使用 `autolife` 作为包名（而非 `src`）
3. **IDE 支持更好** - 代码补全、跳转定义等功能完美工作

**导入规范**：

项目采用标准的 `src layout` 结构，所有代码导入必须使用 `autolife` 包名：

```python
# ✅ 正确的导入方式
from autolife.voice_agent.agent import VoiceAgent
from autolife.voice_agent.asr import ZhipuASR, ASRBase
from autolife.voice_agent.tts import ZhipuTTS, TTSBase

# ❌ 错误的导入方式（不要使用）
from src.voice_agent.agent import VoiceAgent
```

**目录结构**：
- 源代码位于 `src/autolife/` 目录
- 开发模式安装后，`autolife` 包可从任何位置导入
- 修改 `src/autolife/` 下的代码会立即反映在运行时

## 第一次运行

### 测试 1: 文本模式

```bash
uv run autolife --text "打开微信"
```

如果一切正常,你应该看到:
1. 手机屏幕截图分析
2. 执行的操作步骤
3. 最终结果输出

### 测试 2: 查看帮助

```bash
uv run autolife --help
```

查看所有可用的命令行选项。

## 基础使用

### 1. 文本模式 - 直接执行任务

```bash
# 基础指令
uv run autolife --text "打开微信"

# 复杂指令
uv run autolife --text "打开小红书搜索美食,然后分享第一个帖子到微信"

# 禁用语音反馈
uv run autolife --text "查询天气" --no-voice-feedback
```

### 2. 音频文件模式 - 从音频识别

```bash
# 准备音频文件 (WAV 或 MP3 格式)
uv run autolife --audio recording.wav
```

### 3. 语音监听模式 - 实时语音控制

```bash
# 启动语音监听
uv run autolife --listen

# 自定义唤醒词
uv run autolife --listen --wake-words "小智" "助手"
```

### 4. Python API 使用

创建 `my_script.py`:

```python
from autolife import VoiceAgent
from phone_agent.model import ModelConfig

# 创建助手
agent = VoiceAgent(
    model_config=ModelConfig(
        base_url="http://localhost:8000/v1",
        model="autoglm-phone-9b"
    )
)

# 执行任务
result = agent.run_from_text("打开微信")
print(result)
```

运行脚本:

```bash
uv run python my_script.py
```

## 常见应用场景

### 场景 1: 驾驶场景

```bash
# 语音回复消息
uv run autolife --text "帮我回复微信消息'我在开车,稍后联系'"

# 导航
uv run autolife --text "打开高德地图导航到公司"

# 播放音乐
uv run autolife --text "打开网易云音乐播放我喜欢的歌曲"
```

### 场景 2: 生活场景

```bash
# 外卖订餐
uv run autolife --text "打开美团搜索附近的川菜馆"

# 购物
uv run autolife --text "打开淘宝搜索蓝牙耳机"

# 社交
uv run autolife --text "打开小红书搜索健身教程"
```

### 场景 3: 工作场景

```bash
# 查看日程
uv run autolife --text "打开日历查看今天的会议安排"

# 发送消息
uv run autolife --text "给老板发钉钉消息说我会迟到10分钟"

# 查询信息
uv run autolife --text "打开浏览器搜索Python最佳实践"
```

## 故障排查

### 问题 1: 找不到设备

```bash
# 检查 ADB 连接
adb devices

# 如果显示 unauthorized,在手机上允许 USB 调试
# 如果没有设备,检查 USB 数据线是否支持数据传输
```

### 问题 2: API 连接失败

```bash
# 检查环境变量
echo $ZHIPUAI_API_KEY
echo $AUTOGLM_BASE_URL

# 测试 API 连接
curl -H "Authorization: Bearer $ZHIPUAI_API_KEY" $AUTOGLM_BASE_URL/models
```

### 问题 3: 模型加载失败

```bash
# 确认模型服务正在运行
curl http://localhost:8000/v1/models

# 查看日志
uv run autolife --text "测试" --verbose
```

### 问题 4: 权限不足

确保手机上已授予以下权限:
- ✅ USB 调试权限
- ✅ ADB Keyboard 输入法权限
- ✅ 屏幕截图权限
- ✅ 应用访问权限

## 下一步

- 📖 阅读 [API 文档](./api.md) 了解详细的编程接口
- 🛠️ 查看 [开发指南](./development.md) 参与项目开发
- 💡 浏览 [示例代码](../examples/) 学习更多用法
- ❓ 遇到问题查看 [常见问题](./faq.md)

## 获取帮助

如果遇到问题:

1. 查看 [常见问题](./faq.md)
2. 搜索 [GitHub Issues](https://github.com/yourusername/autolife/issues)
3. 提交新的 Issue 描述你的问题

祝使用愉快! 🎉
