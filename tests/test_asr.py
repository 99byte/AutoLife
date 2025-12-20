"""
ASR（语音识别）单元测试
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from autolife.voice_agent.asr import ZhipuASR
from autolife.voice_agent.asr.base import ASRResult


class TestZhipuASR:
    """测试智谱 ASR 功能"""

    def test_init_with_api_key(self, mock_api_key):
        """测试使用 API 密钥初始化"""
        asr = ZhipuASR(api_key=mock_api_key)
        assert asr.api_key == mock_api_key
        assert asr.model == "glm-asr-2512"
        assert asr.endpoint == "https://open.bigmodel.cn/api/paas/v4/audio/transcriptions"

    def test_init_with_env_variable(self, mock_zhipu_env):
        """测试从环境变量读取 API 密钥"""
        asr = ZhipuASR()
        assert asr.api_key == "test_key_12345"

    def test_init_without_api_key(self):
        """测试缺少 API 密钥时抛出异常"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="需要提供 API 密钥"):
                ZhipuASR()

    @pytest.mark.unit
    @patch('requests.post')
    def test_transcribe_with_file_path(self, mock_post, mock_api_key, test_audio_file):
        """测试使用文件路径进行识别"""
        # Mock API 响应
        mock_response = Mock()
        mock_response.json.return_value = {"text": "你好世界"}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        asr = ZhipuASR(api_key=mock_api_key)
        result = asr.transcribe(test_audio_file)

        # 验证结果
        assert isinstance(result, ASRResult)
        assert result.text == "你好世界"
        assert result.confidence == 1.0
        assert result.language == "zh"

        # 验证 API 调用
        assert mock_post.called
        call_args = mock_post.call_args
        assert call_args[1]['data']['model'] == "glm-asr-2512"
        assert call_args[1]['data']['stream'] == "false"

    @pytest.mark.unit
    @patch('requests.post')
    def test_transcribe_with_bytes(self, mock_post, mock_api_key):
        """测试使用字节数据进行识别"""
        mock_response = Mock()
        mock_response.json.return_value = {"text": "测试文本"}
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        asr = ZhipuASR(api_key=mock_api_key)
        audio_bytes = b"fake audio data"
        result = asr.transcribe(audio_bytes)

        assert result.text == "测试文本"
        assert isinstance(result, ASRResult)

    @pytest.mark.unit
    def test_transcribe_file_not_found(self, mock_api_key):
        """测试文件不存在时抛出异常"""
        asr = ZhipuASR(api_key=mock_api_key)
        with pytest.raises(FileNotFoundError):
            asr.transcribe("/non/existent/file.wav")

    @pytest.mark.unit
    @patch('requests.post')
    def test_transcribe_api_error(self, mock_post, mock_api_key, test_audio_file):
        """测试 API 调用失败时的错误处理"""
        import requests
        mock_post.side_effect = requests.exceptions.RequestException("Network error")

        asr = ZhipuASR(api_key=mock_api_key)
        with pytest.raises(RuntimeError, match="ASR API 调用失败"):
            asr.transcribe(test_audio_file)

    @pytest.mark.unit
    @patch('requests.post')
    def test_transcribe_invalid_response(self, mock_post, mock_api_key, test_audio_file):
        """测试 API 返回无效响应时的错误处理"""
        mock_response = Mock()
        mock_response.json.return_value = {}  # 缺少 text 字段
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        asr = ZhipuASR(api_key=mock_api_key)
        result = asr.transcribe(test_audio_file)

        # 应该返回空文本而不是抛出异常
        assert result.text == ""

    @pytest.mark.stream
    @patch('requests.post')
    def test_transcribe_stream_with_callback(self, mock_post, mock_api_key, test_audio_file):
        """测试流式识别（带回调函数）"""
        # Mock 流式响应
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.iter_lines.return_value = iter([
            'data: {"text": "测试", "is_final": false}'.encode('utf-8'),
            'data: {"text": "测试识别", "is_final": false}'.encode('utf-8'),
            'data: {"text": "测试识别结果", "is_final": true}'.encode('utf-8'),
        ])
        mock_post.return_value = mock_response

        asr = ZhipuASR(api_key=mock_api_key)

        # 记录回调结果
        callback_results = []

        def callback(text):
            callback_results.append(text)

        result = asr.transcribe_stream(test_audio_file, callback=callback)

        # 验证最终结果
        assert result.text == "测试识别结果"
        assert len(callback_results) == 3
        assert callback_results[-1] == "测试识别结果"

        # 验证 API 调用使用了 stream=true
        call_args = mock_post.call_args
        assert call_args[1]['data']['stream'] == "true"
        assert call_args[1]['stream'] is True

    @pytest.mark.stream
    @patch('requests.post')
    def test_transcribe_stream_without_callback(self, mock_post, mock_api_key, test_audio_file):
        """测试流式识别（不带回调函数）"""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.iter_lines.return_value = iter([
            'data: {"text": "完整结果"}'.encode('utf-8'),
        ])
        mock_post.return_value = mock_response

        asr = ZhipuASR(api_key=mock_api_key)
        result = asr.transcribe_stream(test_audio_file)

        assert result.text == "完整结果"

    @pytest.mark.stream
    @patch('requests.post')
    def test_transcribe_stream_with_sse_format(self, mock_post, mock_api_key, temp_audio_file):
        """测试 SSE 格式的流式响应"""
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.iter_lines.return_value = iter([
            'data: {"text": "SSE格式"}'.encode('utf-8'),
            b'',
            b'data: [DONE]',
        ])
        mock_post.return_value = mock_response

        asr = ZhipuASR(api_key=mock_api_key)
        result = asr.transcribe_stream(temp_audio_file)

        assert result.text == "SSE格式"

    @pytest.mark.manual
    def test_transcribe_real_api(self, test_audio_file):
        """集成测试：使用真实 API（需要 ZHIPUAI_API_KEY 环境变量）"""
        import os
        if not os.getenv("ZHIPUAI_API_KEY"):
            pytest.skip("需要设置 ZHIPUAI_API_KEY 环境变量")

        asr = ZhipuASR()
        result = asr.transcribe(test_audio_file)

        assert isinstance(result, ASRResult)
        assert isinstance(result.text, str)
        assert result.confidence > 0

    @pytest.mark.manual
    @pytest.mark.stream
    def test_transcribe_stream_real_api(self, test_audio_file):
        """集成测试：使用真实流式 API"""
        import os
        if not os.getenv("ZHIPUAI_API_KEY"):
            pytest.skip("需要设置 ZHIPUAI_API_KEY 环境变量")

        asr = ZhipuASR()
        callback_count = [0]

        def callback(text):
            callback_count[0] += 1
            print(f"  回调 {callback_count[0]}: {text}")

        result = asr.transcribe_stream(test_audio_file, callback=callback)

        assert isinstance(result, ASRResult)
        assert isinstance(result.text, str)
