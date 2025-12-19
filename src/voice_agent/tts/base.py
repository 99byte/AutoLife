"""
TTS 基类定义
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Union


@dataclass
class TTSConfig:
    """TTS 配置"""

    voice: str = "default"  # 音色
    speed: float = 1.0  # 语速 (0.5-2.0)
    pitch: float = 1.0  # 音调 (0.5-2.0)
    volume: float = 1.0  # 音量 (0-1)


class TTSBase(ABC):
    """TTS 基类"""

    @abstractmethod
    def synthesize(
        self, text: str, output_path: Union[str, Path, None] = None, config: TTSConfig | None = None
    ) -> bytes:
        """
        将文本转换为语音

        Args:
            text: 要合成的文本
            output_path: 输出文件路径,如果为 None 则只返回音频数据
            config: TTS 配置

        Returns:
            bytes: 音频数据
        """
        pass

    @abstractmethod
    def speak(self, text: str, config: TTSConfig | None = None) -> None:
        """
        直接播放文本语音

        Args:
            text: 要播放的文本
            config: TTS 配置
        """
        pass
