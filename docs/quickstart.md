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

### 2. 安装依赖

使用 uv 包管理器安装:

```bash
# 安装 uv (如果未安装)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装项目依赖
uv sync
```

### 3. 配置环境变量

创建 `.env` 文件或直接设置环境变量:

```bash
# 智谱 AI API 密钥
export ZHIPUAI_API_KEY="your-api-key-here"

# AutoGLM 模型服务地址
export AUTOGLM_BASE_URL="http://localhost:8000/v1"

# 模型名称
export AUTOGLM_MODEL="autoglm-phone-9b"
```

### 4. 配置手机设备

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
