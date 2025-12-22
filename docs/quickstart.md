# 快速开始指南

本指南将帮助你快速上手 AutoLife 生活智能助手。

## 前置条件

在开始之前，请确保你已经：

1. ✅ 安装了 Python 3.10 或更高版本
2. ✅ 准备了 Android 7.0+ 或 HarmonyOS 设备
3. ✅ 安装并配置了 ADB 或 HDC 工具
4. ✅ 获取了智谱 AI API Key（或准备好本地模型服务）

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/99byte/autolife.git
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
# AutoGLM 模型配置
AUTOGLM_BASE_URL=http://localhost:8000/v1  # 或使用智谱 AI 在线服务
AUTOGLM_MODEL=autoglm-phone-9b
AUTOGLM_API_KEY=EMPTY  # 本地服务可以是 EMPTY，在线服务需要真实 API Key
```

**获取 API 密钥（使用在线服务）：**
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册并登录
3. 点击右上角头像 → API 密钥 → 创建密钥
4. 复制密钥并粘贴到 `.env` 文件

### 7. 配置手机设备

#### Android 设备

1. 启用开发者模式：
   - 进入 `设置 → 关于手机 → 版本号`
   - 连续点击 7-10 次，直到显示"开发者模式已启用"

2. 启用 USB 调试：
   - 进入 `设置 → 开发者选项 → USB 调试`
   - 打开开关

3. 安装 ADB Keyboard：
   - 下载 [ADB Keyboard APK](https://github.com/senzhk/ADBKeyBoard/blob/master/ADBKeyboard.apk)
   - 安装后在 `设置 → 输入法` 中启用

4. 连接设备：
   ```bash
   # 使用 USB 数据线连接手机和电脑
   adb devices
   # 应该看到你的设备列表
   ```

#### 鸿蒙设备

1. 启用开发者模式（同 Android）
2. 连接设备：
   ```bash
   hdc list targets
   ```

### 8. 启动模型服务

你可以选择本地部署或使用第三方服务：

#### 选项 A: 使用智谱 AI 在线服务

直接使用智谱 AI 的在线服务（推荐新手）：

```bash
# 在 .env 文件中配置
AUTOGLM_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
AUTOGLM_MODEL="autoglm-phone-9b"
AUTOGLM_API_KEY="你的API密钥"
```

#### 选项 B: 本地部署

参考 [Open-AutoGLM 文档](../Open-AutoGLM/README.md) 部署本地模型服务。

## 第一次运行

### 测试 1: 命令行模式

```bash
uv run autolife "打开微信"
```

如果一切正常，你应该看到：
1. 手机屏幕截图分析
2. 执行的操作步骤
3. 最终结果输出

### 测试 2: 查看帮助

```bash
uv run autolife --help
```

查看所有可用的命令行选项。

## 基础使用

### 1. 命令行模式

```bash
# 基础指令
uv run autolife "打开微信"

# 复杂指令
uv run autolife "打开小红书搜索美食，然后分享第一个帖子到微信"

# 指定设备
uv run autolife --device-id DEVICE_ID "打开设置"

# 详细输出模式
uv run autolife -v "查询天气"
```

### 2. Web 界面模式

启动 Web 服务：

```bash
# 1. 启动后端 API 服务
uv run uvicorn autolife.api.main:app --reload

# 2. 启动前端（新开一个终端）
cd autolife-web
npm install
npm run dev
```

然后在浏览器打开 http://localhost:5173 使用 Web 界面。

### 3. Python API 使用

创建 `my_script.py`：

```python
from autolife import AutoLifeAgent
from phone_agent.model import ModelConfig

# 创建助���
agent = AutoLifeAgent(
    model_config=ModelConfig(
        base_url="http://localhost:8000/v1",
        model="autoglm-phone-9b"
    )
)

# 执行任务
result = agent.run("打开微信")
print(result)

# 流式执行任务（逐步返回结果）
for step_result in agent.run_streaming("打开小红书搜索美食"):
    print(f"步骤 {agent.phone_agent.step_count}:")
    print(f"  思考: {step_result.thinking}")
    print(f"  操作: {step_result.action}")
    print(f"  结果: {step_result.message}")
```

运行脚本：

```bash
uv run python my_script.py
```

## 常见应用场景

### 场景 1: 驾驶场景

```bash
# 语音回复消息
uv run autolife "帮我回复微信消息'我在开车，稍后联系'"

# 导航
uv run autolife "打开高德地图导航到公司"

# 播放音乐
uv run autolife "打开网易云音乐播放我喜欢的歌曲"
```

### 场景 2: 生活场景

```bash
# 外卖订餐
uv run autolife "打开美团搜索附近的川菜馆"

# 购物
uv run autolife "打开淘宝搜索蓝牙耳机"

# 社交
uv run autolife "打开小红书搜索健身教程"
```

### 场景 3: 工作场景

```bash
# 查看日程
uv run autolife "打开日历查看今天的会议安排"

# 发送消息
uv run autolife "给老板发钉钉消息说我会迟到10分钟"

# 查询信息
uv run autolife "打开浏览器搜索Python最佳实践"
```

## 故障排查

### 问题 1: 找不到设备

```bash
# 检查 ADB 连接
adb devices

# 如果显示 unauthorized，在手机上允许 USB 调试
# 如果没有设备，检查 USB 数据线是否支持数据传输
```

### 问题 2: API 连接失败

```bash
# 检查环境变量
cat .env | grep AUTOGLM

# 测试 API 连接
curl -H "Authorization: Bearer $AUTOGLM_API_KEY" $AUTOGLM_BASE_URL/models
```

### 问题 3: 模型加载失败

```bash
# 确认模型服务正在运行
curl http://localhost:8000/v1/models

# 查看详细日志
uv run autolife "测试" --verbose
```

### 问题 4: 权限不足

确保手机上已授予以下权限：
- ✅ USB 调试权限
- ✅ ADB Keyboard 输入法权限
- ✅ 屏幕截图权限
- ✅ 应用访问权限

## Web 界面功能

### 聊天面板
- 输入文本指令与 AI 助手对话
- 实时查看任务执行进度（流式显示）
- 查看每一步的思考过程和执行结果

### 活动记录
- 自动记录日常活动
- 按类别筛选活动（工作、生活、健身等）
- 时间线视图展示活动历史

### 待办事项
- 添加、编辑、删除待办事项
- 标记完成状态
- 按优先级排序

### 对话历史
- 查看所有历史对话
- 搜索过往对话内容
- 重新发送历史指令

## 下一步

- 📖 阅读 [开发路线图](./ROADMAP.md) 了解项目规划
- 🛠️ 查看 [CLAUDE.md](../CLAUDE.md) 了解项目结构
- 💡 浏览前端文档 [frontend.md](./frontend.md) 了解 Web 界面
- 🎥 查看投屏功能开发进展 [scrcpy-t.md](./scrcpy-t.md)

## 获取帮助

如果遇到问题：

1. 查看本文档的故障排查部分
2. 搜索 [GitHub Issues](https://github.com/99byte/autolife/issues)
3. 提交新的 Issue 描述你的问题

祝使用愉快！🎉
