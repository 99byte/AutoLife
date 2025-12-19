"""
智谱 AI 的 TTS 实现

使用智谱 AI 的文本转语音 API (glm-tts)
"""

import os
import requests
from pathlib import Path

# 自动加载 .env 文件
try:
    from dotenv import load_dotenv
    load_dotenv()  # 尝试加载 .env 文件
except ImportError:
    pass  # 如果没有安装 python-dotenv，忽略

from autolife.voice_agent.tts.base import TTSBase, TTSConfig


class ZhipuTTS(TTSBase):
    """智谱 AI TTS 客户端"""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://open.bigmodel.cn/api/paas/v4",
        model: str = "glm-tts",
    ):
        """
        初始化智谱 TTS 客户端

        Args:
            api_key: API 密钥,默认从环境变量 ZHIPUAI_API_KEY 读取
            base_url: API 基础 URL
            model: 使用的模型名称（glm-tts）
        """
        self.api_key = api_key or os.getenv("ZHIPUAI_API_KEY")
        if not self.api_key:
            raise ValueError("需要提供 API 密钥或设置 ZHIPUAI_API_KEY 环境变量")

        self.base_url = base_url
        self.model = model
        self.endpoint = f"{base_url}/audio/speech"

    def synthesize(self, text: str, config: TTSConfig | None = None) -> bytes:
        """
        合成语音

        Args:
            text: 要合成的文本（最长 1024 字符）
            config: TTS 配置

        Returns:
            bytes: 音频数据（WAV 格式）
        """
        config = config or TTSConfig()

        # 智谱 AI 支持的音色映射
        # tongtong（默认）、chuichui、xiaochen、jam、kazi、douji、luodo
        voice_map = {
            "female": "tongtong",  # 女声
            "male": "jam",         # 男声
        }
        voice = voice_map.get(config.voice, "tongtong")

        # 准备请求
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "input": text[:1024],  # 限制最大长度
            "voice": voice,
            "speed": config.speed,
            "volume": int(config.volume * 10),  # 转换为 0-10 范围
            "response_format": "wav"
        }

        # 调用 API
        try:
            response = requests.post(
                self.endpoint,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()

            # API 返回音频数据
            return response.content

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"TTS API 调用失败: {e}")

    def save_to_file(self, text: str, file_path: Path, config: TTSConfig | None = None) -> None:
        """
        合成语音并保存到文件

        Args:
            text: 要合成的文本
            file_path: 保存路径
            config: TTS 配置
        """
        audio_data = self.synthesize(text, config)
        with open(file_path, "wb") as f:
            f.write(audio_data)

    def speak(self, text: str, config: TTSConfig | None = None) -> None:
        """
        合成语音并播放

        Args:
            text: 要合成的文本
            config: TTS 配置
        """
        audio_data = self.synthesize(text, config)

        # 播放音频
        try:
            import sounddevice as sd
            import soundfile as sf
            import io

            # 将音频数据转为音频数组
            audio_array, sample_rate = sf.read(io.BytesIO(audio_data))

            # 播放音频
            sd.play(audio_array, sample_rate)
            sd.wait()  # 等待播放完成

        except ImportError:
            print(f"[TTS] 播放: {text}")
            print("[提示] 需要安装 sounddevice 和 soundfile 才能播放音频")
            print("运行: uv add sounddevice soundfile")
        except Exception as e:
            print(f"[TTS] 播放失败: {e}")
            print(f"[TTS] 文本内容: {text}")
