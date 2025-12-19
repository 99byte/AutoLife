"""
音频录制器

使用 sounddevice 从麦克风录制音频
"""

import sounddevice as sd
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import Optional
import queue
import threading


class AudioRecorder:
    """
    音频录制器

    支持定时录音和实时录音两种模式。

    示例:
        >>> from autolife.voice_agent.audio import AudioRecorder
        >>>
        >>> # 定时录音
        >>> recorder = AudioRecorder()
        >>> audio = recorder.record_for_duration(5.0)
        >>> recorder.save_to_file(audio, "output.wav")
        >>>
        >>> # 实时录音
        >>> recorder.start_recording()
        >>> # ... 录音中 ...
        >>> audio = recorder.stop_recording()
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        channels: int = 1,
        dtype: str = "int16",
    ):
        """
        初始化音频录制器

        Args:
            sample_rate: 采样率，默认 16000 Hz（适合语音识别）
            channels: 声道数，默认 1（单声道）
            dtype: 数据类型，默认 "int16"
        """
        self.sample_rate = sample_rate
        self.channels = channels
        self.dtype = dtype

        # 录音状态
        self.recording = False
        self.audio_queue: queue.Queue = queue.Queue()
        self.stream: Optional[sd.InputStream] = None

    def record_for_duration(self, duration: float) -> np.ndarray:
        """
        录制指定时长的音频

        Args:
            duration: 录音时长（秒）

        Returns:
            np.ndarray: 音频数据数组

        示例:
            >>> recorder = AudioRecorder()
            >>> audio = recorder.record_for_duration(5.0)  # 录制 5 秒
        """
        print(f"[录音] 开始录制 {duration} 秒...")

        # 使用 sounddevice 的同步录音
        audio = sd.rec(
            int(duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=self.dtype,
        )
        sd.wait()  # 等待录音完成

        print("[录音] 录制完成")
        return audio

    def start_recording(self) -> None:
        """
        开始实时录音

        使用队列缓存音频数据，需要调用 stop_recording() 停止。

        示例:
            >>> recorder = AudioRecorder()
            >>> recorder.start_recording()
            >>> # ... 录音中 ...
            >>> audio = recorder.stop_recording()
        """
        if self.recording:
            print("[警告] 录音已在进行中")
            return

        self.recording = True
        self.audio_queue = queue.Queue()

        def callback(indata, frames, time, status):
            """音频流回调函数"""
            if status:
                print(f"[录音] 状态: {status}")
            if self.recording:
                self.audio_queue.put(indata.copy())

        # 创建输入流
        self.stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=self.dtype,
            callback=callback,
        )

        self.stream.start()
        print("[录音] 开始实时录音...")

    def stop_recording(self) -> np.ndarray:
        """
        停止实时录音并返回音频数据

        Returns:
            np.ndarray: 录制的音频数据

        示例:
            >>> recorder = AudioRecorder()
            >>> recorder.start_recording()
            >>> # ... 录音中 ...
            >>> audio = recorder.stop_recording()
        """
        if not self.recording:
            print("[警告] 没有正在进行的录音")
            return np.array([])

        self.recording = False

        # 停止并关闭流
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None

        # 从队列中获取所有音频数据
        audio_chunks = []
        while not self.audio_queue.empty():
            audio_chunks.append(self.audio_queue.get())

        print("[录音] 录制完成")

        if not audio_chunks:
            return np.array([])

        # 合并所有音频块
        return np.concatenate(audio_chunks, axis=0)

    def is_recording(self) -> bool:
        """
        检查是否正在录音

        Returns:
            bool: 是否正在录音
        """
        return self.recording

    def save_to_file(self, audio_data: np.ndarray, file_path: Path | str) -> None:
        """
        保存音频数据到文件

        Args:
            audio_data: 音频数据数组
            file_path: 保存路径

        示例:
            >>> recorder = AudioRecorder()
            >>> audio = recorder.record_for_duration(5.0)
            >>> recorder.save_to_file(audio, "output.wav")
        """
        file_path = Path(file_path)

        # 确保目录存在
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # 保存为 WAV 文件
        sf.write(file_path, audio_data, self.sample_rate)
        print(f"[录音] 已保存到 {file_path}")

    def get_available_devices(self) -> list:
        """
        获取可用的音频设备列表

        Returns:
            list: 可用设备列表

        示例:
            >>> recorder = AudioRecorder()
            >>> devices = recorder.get_available_devices()
            >>> for device in devices:
            ...     print(f"{device['index']}: {device['name']}")
        """
        return sd.query_devices()

    def set_input_device(self, device_id: int | str) -> None:
        """
        设置输入设备

        Args:
            device_id: 设备 ID 或名称

        示例:
            >>> recorder = AudioRecorder()
            >>> recorder.set_input_device(0)  # 使用第一个设备
        """
        sd.default.device = device_id
        print(f"[录音] 已设置输入设备: {device_id}")

    @staticmethod
    def test_audio() -> None:
        """
        测试音频系统

        播放一段测试音频，用于检查音频系统是否正常工作。
        """
        duration = 1.0  # 秒
        frequency = 440  # Hz (A4 音符)
        sample_rate = 44100

        # 生成正弦波
        t = np.linspace(0, duration, int(sample_rate * duration))
        audio = 0.5 * np.sin(2 * np.pi * frequency * t)

        print(f"[测试] 播放 {frequency} Hz 的测试音频...")
        sd.play(audio, sample_rate)
        sd.wait()
        print("[测试] 播放完成")


# 便捷函数
def record_audio(duration: float, output_file: Optional[Path | str] = None) -> np.ndarray:
    """
    便捷函数：录制音频

    Args:
        duration: 录音时长（秒）
        output_file: 可选的输出文件路径

    Returns:
        np.ndarray: 音频数据

    示例:
        >>> from autolife.voice_agent.audio import record_audio
        >>> audio = record_audio(5.0, "recording.wav")
    """
    recorder = AudioRecorder()
    audio = recorder.record_for_duration(duration)

    if output_file:
        recorder.save_to_file(audio, output_file)

    return audio
