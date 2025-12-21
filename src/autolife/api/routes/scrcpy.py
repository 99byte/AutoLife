"""
scrcpy WebSocket 路由
提供视频流传输和控制事件处理
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
import asyncio

from autolife.scrcpy import ScrcpyManager

router = APIRouter(prefix="/api/scrcpy", tags=["scrcpy"])

# 全局管理器字典 {websocket_id: ScrcpyManager}
_managers: Dict[int, ScrcpyManager] = {}


@router.websocket("/ws")
async def screencast_websocket(websocket: WebSocket):
    """
    scrcpy WebSocket 端点

    消息格式:
    - 后端 → 前端: {"type": "frame", "data": "base64_jpeg", "width": 1080, "height": 2400}
    - 前端 → 后端: {"type": "touch", "x": 100, "y": 200, "action": "click"}
    - 前端 → 后端: {"type": "swipe", "x1": 100, "y1": 200, "x2": 500, "y2": 200, "duration": 300}
    - 前端 → 后端: {"type": "keyevent", "key": "HOME"}
    """
    await websocket.accept()
    ws_id = id(websocket)

    # 创建 scrcpy 管理器（流式传输，720p, 15 FPS）
    manager = ScrcpyManager(device_id=None, max_size=720, max_fps=15)
    _managers[ws_id] = manager

    # 定义帧回调
    frame_queue = asyncio.Queue(maxsize=2)  # 限制队列大小，避免积压
    loop = asyncio.get_event_loop()  # 保存主线程的事件循环引用

    def on_frame(base64_jpeg: str, width: int, height: int):
        """帧回调（在独立线程中调用）"""
        try:
            # 非阻塞方式放入队列
            if frame_queue.qsize() < 2:
                asyncio.run_coroutine_threadsafe(
                    frame_queue.put({
                        "type": "frame",
                        "data": base64_jpeg,
                        "width": width,
                        "height": height
                    }),
                    loop  # 使用保存的事件循环引用
                )
        except Exception as e:
            print(f"[WebSocket] Frame callback error: {e}")

    try:
        # 启动 scrcpy
        manager.start(on_frame=on_frame)

        # 创建两个异步任务：发送帧和接收控制消息
        async def send_frames():
            """发送视频帧"""
            while True:
                frame = await frame_queue.get()
                try:
                    await websocket.send_json(frame)
                except Exception as e:
                    print(f"[WebSocket] Send frame error: {e}")
                    break

        async def receive_controls():
            """接收控制消息"""
            while True:
                try:
                    data = await websocket.receive_text()
                    message = json.loads(data)

                    msg_type = message.get("type")

                    if msg_type == "touch":
                        x = message.get("x", 0)
                        y = message.get("y", 0)
                        action = message.get("action", "click")
                        # 在线程池中执行（避免阻塞）
                        await asyncio.to_thread(manager.send_touch, x, y, action)

                    elif msg_type == "swipe":
                        x1 = message.get("x1", 0)
                        y1 = message.get("y1", 0)
                        x2 = message.get("x2", 0)
                        y2 = message.get("y2", 0)
                        duration = message.get("duration", 300)
                        await asyncio.to_thread(manager.send_swipe, x1, y1, x2, y2, duration)

                    elif msg_type == "keyevent":
                        key = message.get("key", "")
                        await asyncio.to_thread(manager.send_keyevent, key)

                except WebSocketDisconnect:
                    break
                except Exception as e:
                    print(f"[WebSocket] Receive error: {e}")
                    break

        # 并发运行两个任务
        await asyncio.gather(
            send_frames(),
            receive_controls(),
            return_exceptions=True
        )

    except Exception as e:
        print(f"[WebSocket] Error: {e}")
    finally:
        # 清理资源
        print(f"[WebSocket] {ws_id} disconnected")
        manager.stop()
        if ws_id in _managers:
            del _managers[ws_id]
