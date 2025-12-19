"""
TTS (文本转语音) 模块

支持多种 TTS 后端:
- 智谱 AI TTS API
- 其他 TTS 服务
"""

from autolife.voice_agent.tts.base import TTSBase
from autolife.voice_agent.tts.zhipu import ZhipuTTS

__all__ = ["TTSBase", "ZhipuTTS"]
