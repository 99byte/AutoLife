"""
scrcpy 管理模块
提供设备投屏功能

- ScrcpyStreamer: H.264 NAL 流式管理器（推荐）
- ScrcpyManager: JPEG 流管理器（已废弃）
"""
from .manager import ScrcpyManager
from .streamer import ScrcpyStreamer

__all__ = ["ScrcpyStreamer", "ScrcpyManager"]
