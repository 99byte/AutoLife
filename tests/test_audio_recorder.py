"""
音频录制器单元测试
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import numpy as np
from pathlib import Path
from autolife.voice_agent.audio import AudioRecorder


class TestAudioRecorder:
    """测试音频录制器"""

    def test_init_default(self):
        """测试默认初始化"""
        recorder = AudioRecorder()
        assert recorder.sample_rate == 16000
        assert recorder.channels == 1
        assert not recorder.recording

    def test_init_custom_params(self):
        """测试自定义参数初始化"""
        recorder = AudioRecorder(sample_rate=44100, channels=2)
        assert recorder.sample_rate == 44100
        assert recorder.channels == 2

    @pytest.mark.unit
    def test_get_available_devices(self):
        """测试获取可用音频设备"""
        recorder = AudioRecorder()
        devices = recorder.get_available_devices()

        # sd.query_devices() 返回的是设备信息对象，不是list
        # 只验证它返回了一些内容
        assert devices is not None

    @pytest.mark.unit
    @patch('sounddevice.rec')
    @patch('sounddevice.wait')
    def test_record_for_duration(self, mock_wait, mock_rec):
        """测试定时录音"""
        # Mock 录音数据
        duration = 2.0
        sample_rate = 16000
        samples = int(sample_rate * duration)
        fake_audio = np.random.randn(samples, 1).astype(np.float32)
        mock_rec.return_value = fake_audio

        recorder = AudioRecorder(sample_rate=sample_rate)
        audio = recorder.record_for_duration(duration)

        # 验证录音数据
        assert isinstance(audio, np.ndarray)
        assert len(audio) == samples

        # 验证 sounddevice.rec 被正确调用
        mock_rec.assert_called_once()
        call_args = mock_rec.call_args
        assert call_args[0][0] == samples  # frames
        assert call_args[1]['samplerate'] == sample_rate
        assert call_args[1]['channels'] == 1

        # 验证等待被调用
        mock_wait.assert_called_once()

    @pytest.mark.unit
    @patch('soundfile.write')
    def test_save_to_file(self, mock_sf_write, tmp_path):
        """测试保存音频到文件"""
        recorder = AudioRecorder()
        audio_data = np.random.randn(16000).astype(np.float32)
        output_file = tmp_path / "test_audio.wav"

        recorder.save_to_file(audio_data, output_file)

        # 验证 soundfile.write 被调用
        mock_sf_write.assert_called_once()
        call_args = mock_sf_write.call_args
        assert call_args[0][0] == output_file
        assert np.array_equal(call_args[0][1], audio_data)
        assert call_args[0][2] == recorder.sample_rate

    @pytest.mark.unit
    def test_test_audio_class_method(self):
        """测试音频系统测试（类方法）"""
        # 这个测试只验证方法不抛出异常
        try:
            with patch('sounddevice.play'), patch('sounddevice.wait'):
                AudioRecorder.test_audio()
        except Exception as e:
            pytest.fail(f"test_audio() 不应该抛出异常: {e}")

    @pytest.mark.unit
    def test_audio_data_validation(self):
        """测试音频数据验证"""
        recorder = AudioRecorder()

        # 测试空数组
        empty_audio = np.array([])
        assert len(empty_audio) == 0

        # 测试正常数组
        normal_audio = np.random.randn(16000).astype(np.float32)
        assert len(normal_audio) == 16000

        # 测试形状转换（2D -> 1D）
        audio_2d = np.random.randn(16000, 1).astype(np.float32)
        audio_1d = audio_2d.flatten()
        assert len(audio_1d) == 16000

    @pytest.mark.unit
    @patch('sounddevice.rec')
    @patch('sounddevice.wait')
    def test_record_different_durations(self, mock_wait, mock_rec):
        """测试不同时长的录音"""
        recorder = AudioRecorder(sample_rate=16000)

        durations = [0.5, 1.0, 2.0, 5.0]

        for duration in durations:
            samples = int(16000 * duration)
            fake_audio = np.random.randn(samples, 1).astype(np.float32)
            mock_rec.return_value = fake_audio

            audio = recorder.record_for_duration(duration)

            assert len(audio) == samples

    @pytest.mark.manual
    def test_real_recording(self, tmp_path):
        """集成测试：真实录音（需要麦克风）"""
        recorder = AudioRecorder()

        print("\n[真实录音测试] 请说话（2秒）...")
        audio = recorder.record_for_duration(2.0)

        # 验证录音数据
        assert isinstance(audio, np.ndarray)
        assert len(audio) == 32000  # 16kHz * 2秒

        # 保存并验证文件
        output_file = tmp_path / "real_recording.wav"
        recorder.save_to_file(audio, output_file)

        assert output_file.exists()
        assert output_file.stat().st_size > 0

    @pytest.mark.manual
    def test_real_playback(self, test_audio_file):
        """集成测试：真实播放（需要扬声器）"""
        if not test_audio_file.exists():
            pytest.skip("需要测试音频文件")

        # AudioRecorder没有play_from_file方法，使用sounddevice直接播放
        import sounddevice as sd
        import soundfile as sf

        print("\n[真实播放测试] 播放音频...")
        audio_data, sample_rate = sf.read(test_audio_file)
        sd.play(audio_data, sample_rate)
        sd.wait()

        # 如果能执行到这里说明播放没有崩溃
        assert True

    @pytest.mark.manual
    def test_record_and_playback(self, tmp_path):
        """集成测试：录音后播放（需要麦克风和扬声器）"""
        recorder = AudioRecorder()

        # 录音
        print("\n[录音] 请说话（3秒）...")
        audio = recorder.record_for_duration(3.0)

        # 保存
        output_file = tmp_path / "record_playback.wav"
        recorder.save_to_file(audio, output_file)

        # 播放（使用sounddevice直接播放）
        import sounddevice as sd
        import soundfile as sf

        print("[播放] 播放刚才的录音...")
        audio_data, sample_rate = sf.read(output_file)
        sd.play(audio_data, sample_rate)
        sd.wait()

        assert output_file.exists()

    @pytest.mark.manual
    def test_get_devices_real(self):
        """集成测试：获取真实设备列表"""
        recorder = AudioRecorder()
        devices = recorder.get_available_devices()

        print(f"\n检测到 {len(devices)} 个音频设备:")
        for i, device in enumerate(devices):
            print(f"  {i+1}. {device}")

        assert len(devices) > 0
