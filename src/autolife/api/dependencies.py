"""
FastAPI 依赖注入
提供 AutoLifeAgent 单例实例
"""
import sys
from pathlib import Path
from functools import lru_cache

# 添加 AutoGLM 到 sys.path
AUTOGLM_PATH = Path(__file__).parent.parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))

from autolife.agent import AutoLifeAgent


@lru_cache()
def get_agent() -> AutoLifeAgent:
    """
    获取 AutoLifeAgent 单例
    使用 lru_cache 确保整个应用生命周期中只创建一个实例
    """
    return AutoLifeAgent()
