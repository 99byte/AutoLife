"""
scrcpy WebSocket 路由
提供 H.264 NAL 单元流式传输和设备控制
"""
import os
import asyncio
import subprocess
from typing import Optional, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Request, HTTPException
from pydantic import BaseModel

from autolife.scrcpy.streamer import ScrcpyStreamer

router = APIRouter(prefix="/api/scrcpy", tags=["scrcpy"])

# 是否启用模拟模式（用于测试）
MOCK_MODE = os.getenv("AUTOLIFE_MOCK_MODE", "false").lower() == "true"


class TouchRequest(BaseModel):
    """触控事件请求"""
    x: int
    y: int
    action: str = "tap"  # tap, down, move, up
    device_id: Optional[str] = None


class SwipeRequest(BaseModel):
    """滑动事件请求"""
    x1: int
    y1: int
    x2: int
    y2: int
    duration: int = 300  # 毫秒
    device_id: Optional[str] = None


class KeyEventRequest(BaseModel):
    """按键事件请求"""
    key: str  # HOME, BACK, POWER, VOLUME_UP, VOLUME_DOWN
    device_id: Optional[str] = None


class ResetRequest(BaseModel):
    """重置流请求"""
    device_id: Optional[str] = None


async def get_first_device() -> str:
    """
    获取第一个连接的 ADB 设备

    Returns:
        str: 设备 ID

    Raises:
        HTTPException: 无设备连接
    """
    result = await asyncio.create_subprocess_exec(
        "adb", "devices",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    stdout, _ = await result.communicate()

    devices = stdout.decode().strip().split('\n')[1:]  # 跳过标题行
    devices = [line.split()[0] for line in devices if '\tdevice' in line]

    if not devices:
        raise HTTPException(status_code=404, detail="No device connected")

    return devices[0]


def get_streamers(app) -> Dict[str, ScrcpyStreamer]:
    """获取全局 streamer 字典"""
    if not hasattr(app.state, 'scrcpy_streamers'):
        app.state.scrcpy_streamers = {}
    return app.state.scrcpy_streamers


def get_locks(app) -> Dict[str, asyncio.Lock]:
    """获取全局锁字典"""
    if not hasattr(app.state, 'scrcpy_locks'):
        app.state.scrcpy_locks = {}
    return app.state.scrcpy_locks


def get_or_create_lock(locks: Dict[str, asyncio.Lock], device_id: str) -> asyncio.Lock:
    """获取或创建设备锁"""
    if device_id not in locks:
        locks[device_id] = asyncio.Lock()
    return locks[device_id]


@router.websocket("/ws")
async def video_stream_websocket(
    websocket: WebSocket,
    device_id: Optional[str] = Query(None, description="设备 ID，默认为第一个连接的设备")
):
    """
    H.264 NAL 单元流 WebSocket 端点

    协议：
    - 首包：二进制（SPS + PPS + IDR），供 jMuxer 初始化
    - 后续：逐个 NAL 单元（二进制）

    消息格式：
    - binaryType: 'arraybuffer'
    - 每条消息：一个完整的 NAL 单元（包含起始码）

    使用示例（前端）：
        const ws = new WebSocket('ws://localhost:8000/api/scrcpy/ws?device_id=emulator-5554');
        ws.binaryType = 'arraybuffer';

        ws.onmessage = (event) => {
            jmuxer.feed({
                video: new Uint8Array(event.data)
            });
        };
    """
    await websocket.accept()

    # 获取或创建 device_id
    if not device_id:
        try:
            device_id = await get_first_device()
        except HTTPException as e:
            await websocket.close(code=1008, reason=e.detail)
            return

    print(f"[scrcpy] WebSocket connected: device={device_id}, client={websocket.client}")

    # 获取全局状态
    streamers = get_streamers(websocket.app)
    locks = get_locks(websocket.app)

    streamer: Optional[ScrcpyStreamer] = None
    is_new_streamer = False

    try:
        # 获取设备锁
        lock = get_or_create_lock(locks, device_id)

        async with lock:
            if device_id not in streamers:
                # 创建新 streamer
                print(f"[scrcpy] Creating new streamer for device: {device_id}")
                streamer = ScrcpyStreamer(device_id=device_id)
                await streamer.start()
                streamers[device_id] = streamer
                is_new_streamer = True
            else:
                # 复用已有 streamer
                print(f"[scrcpy] Reusing existing streamer for device: {device_id}")
                streamer = streamers[device_id]

        # 发送初始化数据（首包）
        init_data = streamer.get_initialization_data()

        if init_data:
            print(f"[scrcpy] Sending initialization data ({len(init_data)} bytes)")
            await websocket.send_bytes(init_data)
        else:
            # 等待缓存就绪
            print("[scrcpy] Waiting for SPS/PPS/IDR cache...")
            await asyncio.sleep(1)

            init_data = streamer.get_initialization_data()
            if init_data:
                await websocket.send_bytes(init_data)

        # 持续发送 NAL 单元
        print("[scrcpy] Starting NAL unit streaming...")

        async for nal in streamer.iter_nal_units():
            try:
                await websocket.send_bytes(nal)
            except WebSocketDisconnect:
                print("[scrcpy] WebSocket disconnected")
                break

    except WebSocketDisconnect:
        print("[scrcpy] WebSocket disconnected (expected)")

    except Exception as e:
        print(f"[scrcpy] WebSocket error: {e}")
        import traceback
        traceback.print_exc()

        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass

    finally:
        print(f"[scrcpy] Client disconnected from {device_id}")

        # 注意：不要在这里停止 streamer，因为可能有其他连接
        # 真实实现需要维护连接计数，最后一个断开时才停止


@router.post("/reset")
async def reset_video_stream(
    request: Request,
    reset_req: ResetRequest
):
    """
    重置视频流（用于错误恢复）

    参数：
    - device_id: 设备 ID，None 表示重置所有设备

    返回：
    - success: 是否成功
    - message: 消息
    """
    streamers = get_streamers(request.app)

    device_id = reset_req.device_id

    if device_id:
        # 重置单个设备
        if device_id in streamers:
            print(f"[scrcpy] Resetting stream for device: {device_id}")
            await streamers[device_id].stop()
            del streamers[device_id]
            return {"success": True, "message": f"Reset stream for {device_id}"}
        else:
            return {"success": False, "error": f"Device {device_id} not found"}
    else:
        # 重置所有设备
        print("[scrcpy] Resetting all streams")

        for dev_id, streamer in list(streamers.items()):
            await streamer.stop()

        streamers.clear()

        return {"success": True, "message": "Reset all streams"}


@router.get("/resolution")
async def get_device_resolution(
    device_id: Optional[str] = Query(None, description="设备 ID，默认为第一个连接的设备")
):
    """
    获取设备真实分辨率

    用于前端触控坐标映射。

    返回：
    - width: 宽度（像素）
    - height: 高度（像素）
    """
    if not device_id:
        device_id = await get_first_device()

    # 通过 ADB 获取分辨率
    adb_cmd = ["adb", "-s", device_id, "shell", "wm", "size"]

    result = await asyncio.create_subprocess_exec(
        *adb_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    stdout, stderr = await result.communicate()

    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=f"Failed to get resolution: {stderr.decode()}")

    # 解析输出：Physical size: 1080x2400
    output = stdout.decode().strip()

    if 'Physical size:' in output:
        size_str = output.split('Physical size:')[1].strip()
        width, height = map(int, size_str.split('x'))

        return {
            "width": width,
            "height": height,
            "device_id": device_id
        }
    else:
        raise HTTPException(status_code=500, detail=f"Failed to parse resolution: {output}")


@router.post("/touch")
async def send_touch(touch_req: TouchRequest):
    """
    发送触控事件

    参数：
    - x: X 坐标
    - y: Y 坐标
    - action: 动作类型 (tap, down, move, up)
    - device_id: 设备 ID（可选）

    返回：
    - success: 是否成功
    """
    device_id = touch_req.device_id

    if not device_id:
        device_id = await get_first_device()

    adb_cmd = ["adb", "-s", device_id, "shell", "input"]

    if touch_req.action == "tap":
        # 点击: input tap x y
        cmd = adb_cmd + ["tap", str(touch_req.x), str(touch_req.y)]
    elif touch_req.action in ["down", "move", "up"]:
        # 触摸事件: input touchscreen {action} x y
        # 注意：这需要更复杂的实现，暂时简化为点击
        cmd = adb_cmd + ["tap", str(touch_req.x), str(touch_req.y)]
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {touch_req.action}")

    result = await asyncio.create_subprocess_exec(*cmd)
    await result.wait()

    return {"success": True}


@router.post("/swipe")
async def send_swipe(swipe_req: SwipeRequest):
    """
    发送滑动事件

    参数：
    - x1, y1: 起点坐标
    - x2, y2: 终点坐标
    - duration: 持续时间（毫秒）
    - device_id: 设备 ID（可选）

    返回：
    - success: 是否成功
    """
    device_id = swipe_req.device_id

    if not device_id:
        device_id = await get_first_device()

    # input swipe x1 y1 x2 y2 duration
    cmd = [
        "adb", "-s", device_id, "shell", "input", "swipe",
        str(swipe_req.x1), str(swipe_req.y1),
        str(swipe_req.x2), str(swipe_req.y2),
        str(swipe_req.duration)
    ]

    result = await asyncio.create_subprocess_exec(*cmd)
    await result.wait()

    return {"success": True}


@router.post("/keyevent")
async def send_keyevent(keyevent_req: KeyEventRequest):
    """
    发送按键事件

    参数：
    - key: 按键名称 (HOME, BACK, POWER, VOLUME_UP, VOLUME_DOWN)
    - device_id: 设备 ID（可选）

    返回：
    - success: 是否成功
    """
    device_id = keyevent_req.device_id

    if not device_id:
        device_id = await get_first_device()

    keycode_map = {
        "HOME": "KEYCODE_HOME",
        "BACK": "KEYCODE_BACK",
        "POWER": "KEYCODE_POWER",
        "VOLUME_UP": "KEYCODE_VOLUME_UP",
        "VOLUME_DOWN": "KEYCODE_VOLUME_DOWN",
    }

    keycode = keycode_map.get(keyevent_req.key.upper())

    if not keycode:
        raise HTTPException(status_code=400, detail=f"Unknown key: {keyevent_req.key}")

    # input keyevent KEYCODE
    cmd = ["adb", "-s", device_id, "shell", "input", "keyevent", keycode]

    result = await asyncio.create_subprocess_exec(*cmd)
    await result.wait()

    return {"success": True}
