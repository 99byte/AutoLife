"""
AutoLife - 基于 AutoGLM 的语音智能助手

AutoLife 是一个语音驱动的智能手机助手,通过语音交互控制手机完成各种任务。
"""

__version__ = "0.1.0"

from autolife.voice_agent.agent import VoiceAgent

__all__ = ["VoiceAgent", "__version__"]
