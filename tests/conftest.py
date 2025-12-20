"""
pytest 配置和共享 fixtures
"""

import pytest
import os
from pathlib import Path
from unittest.mock import Mock
import tempfile
import numpy as np


@pytest.fixture
def mock_api_key():
    """模拟 API 密钥"""
    return "test_api_key_12345678"


@pytest.fixture
def test_audio_dir():
    """测试音频文件目录"""
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def test_audio_file(test_audio_dir):
    """测试音频文件路径"""
    audio_file = test_audio_dir / "test_audio.wav"
    if not audio_file.exists():
        # 如果不存在，创建一个假的音频文件
        test_audio_dir.mkdir(exist_ok=True, parents=True)

        # 生成1秒的静音音频（16kHz采样率）
        import soundfile as sf
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)
        audio_data = np.zeros(samples, dtype=np.float32)

        sf.write(audio_file, audio_data, sample_rate)

    return audio_file


@pytest.fixture
def mock_asr_result():
    """模拟 ASR 识别结果"""
    from autolife.voice_agent.asr.base import ASRResult
    return ASRResult(text="测试文本", confidence=0.95, language="zh")


@pytest.fixture
def mock_api_response():
    """模拟 API HTTP 响应"""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"text": "测试识别结果"}
    mock_response.raise_for_status = Mock()
    return mock_response


@pytest.fixture
def mock_stream_response():
    """模拟流式 API 响应"""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.raise_for_status = Mock()

    # 模拟流式响应数据（需要编码中文为字节）
    stream_data = [
        'data: {"text": "测试", "is_final": false}\n'.encode('utf-8'),
        'data: {"text": "测试识别", "is_final": false}\n'.encode('utf-8'),
        'data: {"text": "测试识别结果", "is_final": true}\n'.encode('utf-8'),
        b'[DONE]\n'
    ]
    mock_response.iter_lines.return_value = iter(stream_data)

    return mock_response


@pytest.fixture
def temp_audio_file():
    """创建临时音频文件"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        temp_path = Path(f.name)

        # 生成测试音频数据
        import soundfile as sf
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)
        audio_data = np.random.randn(samples).astype(np.float32) * 0.1

        sf.write(temp_path, audio_data, sample_rate)

        yield temp_path

        # 清理
        temp_path.unlink(missing_ok=True)


@pytest.fixture
def mock_zhipu_env(monkeypatch):
    """设置智谱 API 环境变量"""
    monkeypatch.setenv("ZHIPUAI_API_KEY", "test_key_12345")


@pytest.fixture(autouse=True)
def reset_env(monkeypatch):
    """自动清理环境变量（避免测试间干扰）"""
    # 这个fixture会在每个测试前后自动运行
    pass
