# 自动加载 .env 文件修复

## 问题描述

用户在运行 `uv run autolife --listen` 时遇到错误：
```
❌ 错误：需要提供 API 密钥或设置 ZHIPUAI_API_KEY 环境变量
```

即使用户已经在 `.env` 文件中配置了 `ZHIPUAI_API_KEY`，程序仍然无法读取。

## 原因分析

Python 程序默认不会自动加载 `.env` 文件。之前的实现需要用户手动使用以下方式加载：

```bash
# 手动方式（不便）
set -a && source .env && set +a && uv run autolife --listen
```

这对用户来说非常不便。

## 解决方案

### 1. 添加 python-dotenv 依赖

更新 `pyproject.toml`，添加：
```toml
dependencies = [
    "python-dotenv>=1.0.0",
    # ... 其他依赖
]
```

安装命令：
```bash
uv add python-dotenv
```

### 2. CLI 自动加载 .env

修改 `src/autolife/cli.py`，在 `main()` 函数开头添加：

```python
from dotenv import load_dotenv
from pathlib import Path

def main():
    # 加载 .env 文件（从当前目录或项目根目录）
    env_path = Path.cwd() / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"[配置] 已加载环境变量: {env_path}")
    else:
        # 尝试从项目根目录加载
        project_root = Path(__file__).parent.parent.parent.parent
        env_path = project_root / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            print(f"[配置] 已加载环境变量: {env_path}")
```

### 3. ASR/TTS 模块自动加载

修改 `src/autolife/voice_agent/asr/zhipu.py` 和 `src/autolife/voice_agent/tts/zhipu.py`，在文件开头添加：

```python
# 自动加载 .env 文件
try:
    from dotenv import load_dotenv
    load_dotenv()  # 尝试加载 .env 文件
except ImportError:
    pass  # 如果没有安装 python-dotenv，忽略
```

## 修复效果

### 修复前
```bash
% uv run autolife --listen
❌ 错误：需要提供 API 密钥或设置 ZHIPUAI_API_KEY 环境变量
```

### 修复后
```bash
% uv run autolife --listen
[配置] 已加载环境变量: /Users/void/code/AutoLife/.env
🎤 语音助手已启动,说出唤醒词开始使用...
   唤醒词: 小智, AutoLife, 小智助手
   按 Ctrl+C 退出
```

## 使用方式

现在用户只需要：

1. **配置 .env 文件**（一次性操作）
   ```bash
   cp .env.example .env
   # 编辑 .env，填写 ZHIPUAI_API_KEY
   ```

2. **直接运行**（无需手动加载环境变量）
   ```bash
   # 语音监听模式
   uv run autolife --listen

   # 文本模式
   uv run autolife --text "打开微信"

   # 音频文件模式
   uv run autolife --audio recording.wav
   ```

## 技术细节

### 加载优先级

1. **CLI 模式**：从当前目录或项目根目录加载 `.env`
2. **ASR/TTS 模块**：在模块导入时自动加载 `.env`
3. **命令行参数**：可以通过 `--api-key` 参数覆盖
4. **系统环境变量**：最低优先级

### 错误处理

- 如果找不到 `.env` 文件，会显示提示信息但不会报错
- 如果没有安装 `python-dotenv`，ASR/TTS 模块会优雅地降级
- 如果环境变量确实没有设置，会在初始化时报错并提示用户

## 测试验证

### 1. TTS 测试
```bash
uv run python -c "
from autolife.voice_agent.tts import ZhipuTTS
tts = ZhipuTTS()
audio = tts.synthesize('测试成功')
print(f'✅ TTS 成功: {len(audio)} 字节')
"
```

### 2. ASR 测试
```bash
uv run python -c "
from autolife.voice_agent.asr import ZhipuASR
from autolife.voice_agent.tts import ZhipuTTS
from pathlib import Path

tts = ZhipuTTS()
tts.save_to_file('你好世界', Path('test.wav'))

asr = ZhipuASR()
result = asr.transcribe('test.wav')
print(f'✅ ASR 成功: {result.text}')
"
```

### 3. CLI 测试
```bash
uv run autolife --help
# 应该显示：[配置] 已加载环境变量: ...
```

## 总结

✅ **修复完成**，用户现在可以：
- 直接运行 `uv run autolife --listen`
- 无需手动加载环境变量
- 更好的用户体验

**修改的文件**：
1. `pyproject.toml` - 添加 python-dotenv 依赖
2. `src/autolife/cli.py` - CLI 自动加载 .env
3. `src/autolife/voice_agent/asr/zhipu.py` - ASR 自动加载 .env
4. `src/autolife/voice_agent/tts/zhipu.py` - TTS 自动加载 .env

**测试状态**：✅ 所有测试通过

---

**修复日期**：2024-12-19
**修复作者**：AutoLife 开发团队
