"""
ASR (自动语音识别) 模块

支持多种 ASR 后端:
- 智谱 CogAudio API
- OpenAI Whisper
- 本地 Whisper 模型
"""

from autolife.voice_agent.asr.base import ASRBase
from autolife.voice_agent.asr.zhipu import ZhipuASR

__all__ = ["ASRBase", "ZhipuASR"]
