"""
ASR 基类定义
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Union


@dataclass
class ASRResult:
    """ASR 识别结果"""

    text: str  # 识别的文本
    confidence: float = 1.0  # 置信度 (0-1)
    language: str = "zh"  # 语言代码
    duration: float = 0.0  # 音频时长(秒)


class ASRBase(ABC):
    """ASR 基类"""

    @abstractmethod
    def transcribe(self, audio_input: Union[str, Path, bytes]) -> ASRResult:
        """
        将音频转换为文本

        Args:
            audio_input: 音频文件路径或音频数据

        Returns:
            ASRResult: 识别结果
        """
        pass

    @abstractmethod
    def transcribe_stream(self, audio_stream) -> ASRResult:
        """
        流式识别音频

        Args:
            audio_stream: 音频流

        Returns:
            ASRResult: 识别结果
        """
        pass
