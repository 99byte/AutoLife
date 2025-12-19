"""
智谱 AI 的 ASR 实现

使用智谱 AI 的语音识别 API (glm-asr-2512)
"""

import os
import requests
from pathlib import Path
from typing import Union

from autolife.voice_agent.asr.base import ASRBase, ASRResult


class ZhipuASR(ASRBase):
    """智谱 AI ASR 客户端"""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://open.bigmodel.cn/api/paas/v4",
        model: str = "glm-asr-2512",
    ):
        """
        初始化智谱 ASR 客户端

        Args:
            api_key: API 密钥,默认从环境变量 ZHIPUAI_API_KEY 读取
            base_url: API 基础 URL
            model: 使用的模型名称（glm-asr-2512）
        """
        self.api_key = api_key or os.getenv("ZHIPUAI_API_KEY")
        if not self.api_key:
            raise ValueError("需要提供 API 密钥或设置 ZHIPUAI_API_KEY 环境变量")

        self.base_url = base_url
        self.model = model
        self.endpoint = f"{base_url}/audio/transcriptions"

    def transcribe(self, audio_input: Union[str, Path, bytes]) -> ASRResult:
        """
        将音频转换为文本

        Args:
            audio_input: 音频文件路径或音频数据

        Returns:
            ASRResult: 识别结果
        """
        # 准备音频文件
        if isinstance(audio_input, (str, Path)):
            audio_path = Path(audio_input)
            if not audio_path.exists():
                raise FileNotFoundError(f"音频文件不存在: {audio_path}")

            with open(audio_path, "rb") as f:
                audio_data = f.read()
            file_name = audio_path.name
        else:
            audio_data = audio_input
            file_name = "audio.wav"

        # 准备请求
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        files = {
            "file": (file_name, audio_data, "audio/wav")
        }

        data = {
            "model": self.model,
            "stream": "false"  # 使用同步调用
        }

        # 调用 API
        try:
            response = requests.post(
                self.endpoint,
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()

            return ASRResult(
                text=result.get("text", ""),
                confidence=1.0,  # 智谱 API 不返回置信度，设为 1.0
                language="zh"
            )

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"ASR API 调用失败: {e}")
        except (KeyError, ValueError) as e:
            raise RuntimeError(f"ASR API 响应解析失败: {e}")

    def transcribe_stream(self, audio_stream) -> ASRResult:
        """
        流式识别音频

        Args:
            audio_stream: 音频流

        Returns:
            ASRResult: 识别结果
        """
        # TODO: 实现流式识别
        # 智谱 API 支持 stream=true，可以实现流式识别
        raise NotImplementedError("流式识别功能正在开发中")
