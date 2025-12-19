"""
智谱 AI 的 TTS 实现
"""

import os
from pathlib import Path
from typing import Union

from autolife.voice_agent.tts.base import TTSBase, TTSConfig


class ZhipuTTS(TTSBase):
    """智谱 AI TTS 客户端"""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://open.bigmodel.cn/api/paas/v4",
        model: str = "tts-1",  # 智谱的 TTS 模型名称
    ):
        """
        初始化智谱 TTS 客户端

        Args:
            api_key: API 密钥,默认从环境变量 ZHIPUAI_API_KEY 读取
            base_url: API 基础 URL
            model: 使用的模型名称
        """
        self.api_key = api_key or os.getenv("ZHIPUAI_API_KEY")
        if not self.api_key:
            raise ValueError("需要提供 API 密钥或设置 ZHIPUAI_API_KEY 环境变量")

        self.base_url = base_url
        self.model = model

        # TODO: 初始化智谱 AI 客户端
        # from zhipuai import ZhipuAI
        # self.client = ZhipuAI(api_key=self.api_key)

    def synthesize(
        self, text: str, output_path: Union[str, Path, None] = None, config: TTSConfig | None = None
    ) -> bytes:
        """
        将文本转换为语音

        Args:
            text: 要合成的文本
            output_path: 输出文件路径
            config: TTS 配置

        Returns:
            bytes: 音频数据
        """
        if config is None:
            config = TTSConfig()

        # TODO: 实现实际的 API 调用
        # response = self.client.audio.speech.create(
        #     model=self.model,
        #     voice=config.voice,
        #     input=text,
        #     speed=config.speed
        # )
        #
        # audio_data = response.content

        # 临时返回空数据
        audio_data = b""

        # 如果指定了输出路径,保存文件
        if output_path:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(audio_data)

        return audio_data

    def speak(self, text: str, config: TTSConfig | None = None) -> None:
        """
        直接播放文本语音

        Args:
            text: 要播放的文本
            config: TTS 配置
        """
        # 合成音频
        audio_data = self.synthesize(text, config=config)

        # TODO: 使用音频库播放
        # import sounddevice as sd
        # import soundfile as sf
        #
        # # 将音频数据转换为 numpy 数组并播放
        # data, samplerate = sf.read(io.BytesIO(audio_data))
        # sd.play(data, samplerate)
        # sd.wait()

        print(f"[TTS] 播放: {text}")
