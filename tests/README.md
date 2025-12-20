# AutoLife 测试套件

本目录包含 AutoLife 项目的完整测试套件。

## 目录结构

```
tests/
├── conftest.py              # pytest 配置和共享 fixtures
├── fixtures/                # 测试数据和资源
│   └── test_audio.wav      # 测试音频文件（自动生成）
├── test_asr.py             # ASR（语音识别）单元测试
├── test_tts.py             # TTS（语音合成）单元测试
└── test_audio_recorder.py  # 音频录制器单元测试
```

## 测试分类

### 单元测试 (Unit Tests)
使用 `@pytest.mark.unit` 标记的测试，不依赖外部 API，使用 mock 进行隔离测试。

**运行方式**:
```bash
pytest tests/ -m "unit" -v
```

### 流式测试 (Stream Tests)
使用 `@pytest.mark.stream` 标记的测试，测试流式语音识别功能。

**运行方式**:
```bash
pytest tests/ -m "stream" -v
```

### 集成测试 (Integration Tests)
使用 `@pytest.mark.manual` 标记的测试，需要真实的 API 密钥和音频设备。

**运行方式**:
```bash
# 需要设置 ZHIPUAI_API_KEY 环境变量
pytest tests/ -m "manual" -v
```

## 快速开始

### 1. 安装测试依赖

```bash
uv sync --extra dev
```

### 2. 运行所有单元测试

```bash
pytest tests/ -m "unit" -v
```

### 3. 运行包括流式测试

```bash
pytest tests/ -m "unit or stream" -v
```

### 4. 生成覆盖率报告

```bash
pytest tests/ --cov=src/autolife --cov-report=html
```

## 测试文件说明

### conftest.py
包含 pytest 配置和共享的 fixtures：
- `mock_api_key`: 模拟 API 密钥
- `test_audio_file`: 测试音频文件路径
- `mock_asr_result`: 模拟 ASR 结果
- `mock_stream_response`: 模拟流式响应
- `temp_audio_file`: 临时音频文件

### test_asr.py
测试 ASR（语音识别）功能：
- API 客户端初始化
- 同步识别（文件路径、字节数据）
- 流式识别（带/不带回调函数）
- 错误处理
- SSE 格式响应处理

**测试数量**: 9个
**覆盖率**: 高

### test_tts.py
测试 TTS（语音合成）功能：
- API 客户端初始化
- 音频合成
- 自定义配置（语音、语速、音量）
- 文件保存
- 语音播放
- 语音名称映射

**测试数量**: 7个
**覆盖率**: 高

### test_audio_recorder.py
测试音频录制器功能：
- 录音器初始化
- 设备检测
- 定时录音
- 文件保存
- 音频数据验证

**测试数量**: 6个
**覆盖率**: 中

## 测试统计

截至 2024-12-20:
- **单元测试**: 18个 ✅
- **流式测试**: 4个 ✅
- **总计**: 22个测试
- **通过率**: 100%

## 编写新测试

### 1. 创建测试文件

测试文件命名：`test_<模块名>.py`

### 2. 使用合适的标记

```python
import pytest

@pytest.mark.unit
def test_something():
    """单元测试"""
    pass

@pytest.mark.stream
def test_streaming():
    """流式功能测试"""
    pass

@pytest.mark.manual
def test_with_real_api():
    """需要真实API的集成测试"""
    pass
```

### 3. 使用 fixtures

```python
def test_with_mock_api(mock_api_key, mock_api_response):
    """使用共享的 fixtures"""
    pass
```

### 4. Mock 外部依赖

```python
from unittest.mock import Mock, patch

@patch('requests.post')
def test_api_call(mock_post):
    mock_post.return_value = Mock(status_code=200)
    # 测试逻辑
```

## 常见问题

### Q: 测试运行失败，提示找不到模块？
A: 确保以开发模式安装了项目：
```bash
uv pip install -e .
```

### Q: 如何跳过某些测试？
A: 使用 pytest 的标记过滤：
```bash
pytest tests/ -m "not manual"  # 跳过 manual 测试
```

### Q: 如何只运行特定文件的测试？
A: 指定文件路径：
```bash
pytest tests/test_asr.py -v
```

### Q: 如何调试失败的测试？
A: 使用 `-vv` 和 `--tb=long` 查看详细信息：
```bash
pytest tests/test_asr.py -vv --tb=long
```

## 持续集成

测试套件可以轻松集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Run tests
  run: |
    uv sync --extra dev
    pytest tests/ -m "unit" -v
```

## 相关文档

- [测试报告](../docs/voice-testing-report.md) - 完整的测试结果和分析
- [开发指南](../CLAUDE.md) - 项目开发文档
- [路线图](../docs/ROADMAP.md) - 项目进度和计划

---

**最后更新**: 2024-12-20
**维护者**: AutoLife Team
