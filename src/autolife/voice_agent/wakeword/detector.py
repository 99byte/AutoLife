"""
唤醒词检测器

可以使用以下方案:
1. 简单关键词匹配 (通过 ASR 结果)
2. 专用唤醒词模型 (如 Porcupine)
3. 声学特征检测
"""

from typing import Callable, TYPE_CHECKING
from pathlib import Path

if TYPE_CHECKING:
    from autolife.voice_agent.asr.base import ASRBase


class WakeWordDetector:
    """唤醒词检测器"""

    def __init__(
        self,
        wake_words: list[str] | None = None,
        callback: Callable[[], None] | None = None,
        sensitivity: float = 0.5,
        asr_client: "ASRBase | None" = None,
    ):
        """
        初始化唤醒词检测器

        Args:
            wake_words: 唤醒词列表,默认为 ["小智", "AutoLife"]
            callback: 检测到唤醒词时的回调函数
            sensitivity: 灵敏度 (0-1),越高越敏感但误触率也越高
            asr_client: ASR 客户端,用于音频识别（可选）
        """
        self.wake_words = wake_words or ["小智", "AutoLife", "小智助手"]
        self.callback = callback
        self.sensitivity = sensitivity
        self.is_listening = False
        self.asr_client = asr_client

    def start(self) -> None:
        """开始监听唤醒词"""
        self.is_listening = True
        print(f"[唤醒词] 开始监听: {', '.join(self.wake_words)}")

    def stop(self) -> None:
        """停止监听"""
        self.is_listening = False
        print("[唤醒词] 停止监听")

    def detect(self, text: str) -> bool:
        """
        检测文本中是否包含唤醒词

        Args:
            text: 要检测的文本

        Returns:
            bool: 是否检测到唤醒词
        """
        text_lower = text.lower()
        for wake_word in self.wake_words:
            if wake_word.lower() in text_lower:
                print(f"[唤醒词] 检测到: {wake_word}")
                if self.callback:
                    self.callback()
                return True
        return False

    def detect_from_audio(
        self, audio_input: bytes | Path | str, asr_client: "ASRBase | None" = None
    ) -> bool:
        """
        从音频数据中检测唤醒词

        简单方案：使用 ASR 转文本，然后检测关键词

        Args:
            audio_input: 音频数据（bytes）或音频文件路径
            asr_client: ASR 客户端（可选，如果未提供则使用初始化时的客户端）

        Returns:
            bool: 是否检测到唤醒词

        Raises:
            RuntimeError: 如果没有提供 ASR 客户端
        """
        # 使用提供的 ASR 客户端或初始化时的客户端
        asr = asr_client or self.asr_client

        if asr is None:
            raise RuntimeError("需要提供 ASR 客户端才能检测音频唤醒词")

        try:
            # 使用 ASR 识别音频
            result = asr.transcribe(audio_input)
            text = result.text

            # 检测文本中的唤醒词
            return self.detect(text)

        except Exception as e:
            print(f"[唤醒词] 音频检测失败: {e}")
            return False

    def set_asr_client(self, asr_client: "ASRBase") -> None:
        """
        设置 ASR 客户端

        Args:
            asr_client: ASR 客户端实例
        """
        self.asr_client = asr_client
        print("[唤醒词] 已设置 ASR 客户端")
