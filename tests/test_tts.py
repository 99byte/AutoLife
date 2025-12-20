"""
TTS（语音合成）单元测试
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from autolife.voice_agent.tts import ZhipuTTS
from autolife.voice_agent.tts.base import TTSConfig


class TestZhipuTTS:
    """测试智谱 TTS 功能"""

    def test_init_with_api_key(self, mock_api_key):
        """测试使用 API 密钥初始化"""
        tts = ZhipuTTS(api_key=mock_api_key)
        assert tts.api_key == mock_api_key
        assert tts.model == "glm-tts"
        assert tts.endpoint == "https://open.bigmodel.cn/api/paas/v4/audio/speech"

    def test_init_with_env_variable(self, mock_zhipu_env):
        """测试从环境变量读取 API 密钥"""
        tts = ZhipuTTS()
        assert tts.api_key == "test_key_12345"

    def test_init_without_api_key(self):
        """测试缺少 API 密钥时抛出异常"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="需要提供 API 密钥"):
                ZhipuTTS()

    @pytest.mark.unit
    @patch('requests.post')
    def test_synthesize_success(self, mock_post, mock_api_key):
        """测试音频合成成功"""
        mock_response = Mock()
        mock_response.content = b"fake audio data"
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        tts = ZhipuTTS(api_key=mock_api_key)
        audio_data = tts.synthesize("测试文本")

        # 验证返回的是字节数据
        assert isinstance(audio_data, bytes)
        assert len(audio_data) > 0
        assert audio_data == b"fake audio data"

        # 验证 API 调用
        assert mock_post.called
        call_args = mock_post.call_args
        assert call_args[1]['json']['model'] == "glm-tts"
        assert call_args[1]['json']['input'] == "测试文本"

    @pytest.mark.unit
    @patch('requests.post')
    def test_synthesize_with_config(self, mock_post, mock_api_key):
        """测试使用自定义配置合成"""
        mock_response = Mock()
        mock_response.content = b"audio with config"
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        tts = ZhipuTTS(api_key=mock_api_key)
        config = TTSConfig(voice="male", speed=1.5, volume=0.8)

        audio_data = tts.synthesize("测试", config)

        # 验证 API 调用参数
        call_args = mock_post.call_args
        json_data = call_args[1]['json']

        assert json_data['voice'] == "jam"  # male -> jam
        assert json_data['speed'] == 1.5
        # volume 可能不在 API 参数中（取决于实现）

    @pytest.mark.unit
    @patch('requests.post')
    def test_synthesize_empty_text(self, mock_post, mock_api_key):
        """测试空文本时的处理"""
        mock_response = Mock()
        mock_response.content = b"empty audio"
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        tts = ZhipuTTS(api_key=mock_api_key)
        audio_data = tts.synthesize("")

        # 应该仍然调用 API
        assert mock_post.called

    @pytest.mark.unit
    @patch('requests.post')
    def test_synthesize_api_error(self, mock_post, mock_api_key):
        """测试 API 调用失败时的错误处理"""
        import requests
        mock_post.side_effect = requests.exceptions.RequestException("Network error")

        tts = ZhipuTTS(api_key=mock_api_key)
        with pytest.raises(RuntimeError, match="TTS API 调用失败"):
            tts.synthesize("测试")

    @pytest.mark.unit
    @patch('requests.post')
    def test_save_to_file(self, mock_post, mock_api_key, tmp_path):
        """测试保存音频到文件"""
        mock_response = Mock()
        mock_response.content = b"test audio content"
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        tts = ZhipuTTS(api_key=mock_api_key)
        output_file = tmp_path / "test_output.wav"

        tts.save_to_file("测试文本", output_file)

        # 验证文件已创建
        assert output_file.exists()

        # 验证文件内容
        with open(output_file, "rb") as f:
            content = f.read()
            assert content == b"test audio content"

    @pytest.mark.unit
    @patch('requests.post')
    @patch('sounddevice.play')
    @patch('sounddevice.wait')
    def test_speak(self, mock_wait, mock_play, mock_post, mock_api_key):
        """测试播放语音"""
        mock_response = Mock()
        # 模拟真实的 WAV 文件头（44字节）+ 音频数据
        fake_wav_header = b'RIFF' + b'\x00' * 40
        fake_audio = fake_wav_header + b'\x00' * 16000  # 假设16kHz单声道1秒
        mock_response.content = fake_audio
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        tts = ZhipuTTS(api_key=mock_api_key)

        # speak 方法应该不抛出异常
        try:
            tts.speak("测试播放")
        except Exception as e:
            # 如果是音频系统相关错误，可以忽略（测试环境可能没有音频设备）
            if "sounddevice" not in str(e).lower():
                raise

        # 验证 API 被调用
        assert mock_post.called

    @pytest.mark.unit
    @patch('requests.post')
    def test_voice_mapping(self, mock_post, mock_api_key):
        """测试语音名称映射"""
        mock_response = Mock()
        mock_response.content = b"audio"
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response

        tts = ZhipuTTS(api_key=mock_api_key)

        # 测试不同的语音配置
        test_cases = [
            (TTSConfig(voice="female"), "tongtong"),
            (TTSConfig(voice="male"), "jam"),
            (TTSConfig(voice="unknown"), "tongtong"),  # 默认值
        ]

        for config, expected_voice in test_cases:
            tts.synthesize("测试", config)

            # 验证 API 调用中的 voice 参数
            call_args = mock_post.call_args
            actual_voice = call_args[1]['json']['voice']
            assert actual_voice == expected_voice, f"Expected {expected_voice}, got {actual_voice}"

    @pytest.mark.manual
    def test_synthesize_real_api(self):
        """集成测试：使用真实 TTS API"""
        import os
        if not os.getenv("ZHIPUAI_API_KEY"):
            pytest.skip("需要设置 ZHIPUAI_API_KEY 环境变量")

        tts = ZhipuTTS()
        audio_data = tts.synthesize("你好，这是一个测试")

        assert isinstance(audio_data, bytes)
        assert len(audio_data) > 0

        # 验证音频数据格式（应该是 WAV 格式）
        assert audio_data[:4] == b'RIFF' or audio_data[:4] == b'ID3\x04'

    @pytest.mark.manual
    def test_save_to_file_real_api(self, tmp_path):
        """集成测试：保存真实 TTS 音频到文件"""
        import os
        if not os.getenv("ZHIPUAI_API_KEY"):
            pytest.skip("需要设置 ZHIPUAI_API_KEY 环境变量")

        tts = ZhipuTTS()
        output_file = tmp_path / "real_tts_output.wav"

        tts.save_to_file("测试语音合成", output_file)

        assert output_file.exists()
        assert output_file.stat().st_size > 0

    @pytest.mark.manual
    def test_different_voices_real_api(self):
        """集成测试：测试不同的语音"""
        import os
        if not os.getenv("ZHIPUAI_API_KEY"):
            pytest.skip("需要设置 ZHIPUAI_API_KEY 环境变量")

        tts = ZhipuTTS()

        configs = [
            TTSConfig(voice="female"),
            TTSConfig(voice="male"),
        ]

        for config in configs:
            audio_data = tts.synthesize("测试不同语音", config)
            assert isinstance(audio_data, bytes)
            assert len(audio_data) > 0

    @pytest.mark.manual
    def test_different_speeds_real_api(self):
        """集成测试：测试不同的语速"""
        import os
        if not os.getenv("ZHIPUAI_API_KEY"):
            pytest.skip("需要设置 ZHIPUAI_API_KEY 环境变量")

        tts = ZhipuTTS()

        speeds = [0.5, 1.0, 1.5, 2.0]

        for speed in speeds:
            config = TTSConfig(speed=speed)
            audio_data = tts.synthesize("测试不同语速", config)
            assert isinstance(audio_data, bytes)
            assert len(audio_data) > 0
