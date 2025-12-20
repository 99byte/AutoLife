"""
智谱 AI 的 ASR 实现

使用智谱 AI 的语音识别 API (glm-asr-2512)
"""

import os
import requests
from pathlib import Path
from typing import Union

# 自动加载 .env 文件
try:
    from dotenv import load_dotenv
    load_dotenv()  # 尝试加载 .env 文件
except ImportError:
    pass  # 如果没有安装 python-dotenv，忽略

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

    def transcribe_stream(self, audio_stream, callback=None) -> ASRResult:
        """
        流式识别音频

        Args:
            audio_stream: 音频流（文件路径、Path对象、文件对象或字节数据）
            callback: 可选的回调函数，接收中间识别结果 callback(text: str)

        Returns:
            ASRResult: 最终识别结果
        """
        # 准备音频数据
        if isinstance(audio_stream, (str, Path)):
            audio_path = Path(audio_stream)
            if not audio_path.exists():
                raise FileNotFoundError(f"音频文件不存在: {audio_path}")
            with open(audio_path, "rb") as f:
                audio_data = f.read()
            file_name = audio_path.name
        elif hasattr(audio_stream, 'read'):
            # 文件对象
            audio_data = audio_stream.read()
            file_name = getattr(audio_stream, 'name', 'audio.wav')
        else:
            # 字节数据
            audio_data = audio_stream
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
            "stream": "true"  # 启用流式识别
        }

        # 调用流式 API
        try:
            response = requests.post(
                self.endpoint,
                headers=headers,
                files=files,
                data=data,
                stream=True,  # 启用流式响应
                timeout=60
            )
            response.raise_for_status()

            # 处理流式响应
            full_text = ""
            for line in response.iter_lines():
                if not line:
                    continue

                line_text = line.decode('utf-8')

                # 处理 SSE 格式: data: {...}
                if line_text.startswith('data: '):
                    line_text = line_text[6:]  # 移除 "data: " 前缀

                # 跳过空行和特殊标记
                if not line_text or line_text == '[DONE]':
                    continue

                try:
                    # 解析 JSON 响应
                    import json
                    chunk = json.loads(line_text)

                    # 提取文本内容（根据实际API响应格式调整）
                    if 'text' in chunk:
                        partial_text = chunk['text']
                        full_text = partial_text  # 更新完整文本

                        # 调用回调函数传递中间结果
                        if callback:
                            callback(partial_text)

                    # 检查是否是最终结果
                    if chunk.get('is_final', False):
                        break

                except json.JSONDecodeError:
                    # 如果不是JSON格式，可能是纯文本
                    full_text += line_text
                    if callback:
                        callback(full_text)

            return ASRResult(
                text=full_text,
                confidence=1.0,  # 智谱 API 不返回置信度
                language="zh"
            )

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"流式 ASR API 调用失败: {e}")
        except Exception as e:
            raise RuntimeError(f"流式识别处理失败: {e}")
