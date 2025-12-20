"""
FastAPI 依赖注入
提供 VoiceAgent 单例实例
"""
import sys
from pathlib import Path
from functools import lru_cache

# 添加 AutoGLM 到 sys.path
AUTOGLM_PATH = Path(__file__).parent.parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))

from autolife.voice_agent.agent import VoiceAgent


@lru_cache()
def get_voice_agent() -> VoiceAgent:
    """
    获取 VoiceAgent 单例
    使用 lru_cache 确保整个应用生命周期中只创建一个实例
    """
    return VoiceAgent()
