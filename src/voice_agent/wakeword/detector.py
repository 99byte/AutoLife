"""
唤醒词检测器

可以使用以下方案:
1. 简单关键词匹配 (通过 ASR 结果)
2. 专用唤醒词模型 (如 Porcupine)
3. 声学特征检测
"""

from typing import Callable


class WakeWordDetector:
    """唤醒词检测器"""

    def __init__(
        self,
        wake_words: list[str] | None = None,
        callback: Callable[[], None] | None = None,
        sensitivity: float = 0.5,
    ):
        """
        初始化唤醒词检测器

        Args:
            wake_words: 唤醒词列表,默认为 ["小智", "AutoLife"]
            callback: 检测到唤醒词时的回调函数
            sensitivity: 灵敏度 (0-1),越高越敏感但误触率也越高
        """
        self.wake_words = wake_words or ["小智", "AutoLife", "小智助手"]
        self.callback = callback
        self.sensitivity = sensitivity
        self.is_listening = False

    def start(self) -> None:
        """开始监听唤醒词"""
        self.is_listening = True
        print(f"[唤醒词] 开始监听: {', '.join(self.wake_words)}")
        # TODO: 实现实际的监听逻辑

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

    def detect_from_audio(self, audio_data: bytes) -> bool:
        """
        从音频数据中检测唤醒词

        Args:
            audio_data: 音频数据

        Returns:
            bool: 是否检测到唤醒词
        """
        # TODO: 实现音频检测
        # 可以先用 ASR 转文本,再检测关键词
        # 或者使用专门的唤醒词检测模型
        raise NotImplementedError("音频唤醒词检测功能正在开发中")
