"""
scrcpy 管理器
使用 scrcpy + ffmpeg 实现真正的流式投屏
"""
import subprocess
import threading
import time
import base64
import re
from typing import Callable, Optional
from io import BytesIO


class ScrcpyManager:
    """
    scrcpy 流式投屏管理器

    使用 scrcpy 命令行工具 + ffmpeg 解码实现流式传输
    帧率: 15-30 FPS（取决于设备性能）
    """

    def __init__(self, device_id: Optional[str] = None, max_size: int = 720, max_fps: int = 15):
        """
        初始化 scrcpy 管理器

        Args:
            device_id: 设备 ID，None 表示使用默认设备
            max_size: 最大分辨率（短边），默认 720
            max_fps: 最大帧率，默认 15
        """
        self.device_id = device_id
        self.max_size = max_size
        self.max_fps = max_fps
        self.is_running = False
        self.frame_callback: Optional[Callable[[str, int, int], None]] = None

        # 进程句柄
        self.scrcpy_process: Optional[subprocess.Popen] = None
        self.ffmpeg_process: Optional[subprocess.Popen] = None
        self.read_thread: Optional[threading.Thread] = None

    def start(self, on_frame: Callable[[str, int, int], None]):
        """
        启动流式投屏

        Args:
            on_frame: 帧回调函数 (base64_jpeg, width, height)
        """
        if self.is_running:
            return

        self.frame_callback = on_frame
        self.is_running = True

        # 启动 scrcpy + ffmpeg 管道
        self._start_streaming()

        print(f"[ScrcpyManager] Started streaming at {self.max_size}p, {self.max_fps} FPS")

    def _start_streaming(self):
        """启动 scrcpy 和 ffmpeg 流式管道"""
        try:
            # 构建 scrcpy 命令
            scrcpy_cmd = [
                "scrcpy",
                "--video-source=display",
                "--no-audio",
                "--no-control",  # 禁用控制（我们通过 ADB 发送）
                "--no-window",   # 不显示窗口
                f"--max-size={self.max_size}",
                f"--max-fps={self.max_fps}",
                "--record=-",    # 输出到 stdout
                "--record-format=mkv",
            ]

            if self.device_id:
                scrcpy_cmd.extend(["--serial", self.device_id])

            # 启动 scrcpy 进程
            self.scrcpy_process = subprocess.Popen(
                scrcpy_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,  # 保留 stderr 用于调试
            )

            # 启动线程读取 scrcpy stderr（用于调试）
            def read_scrcpy_stderr():
                if self.scrcpy_process and self.scrcpy_process.stderr:
                    for line in self.scrcpy_process.stderr:
                        print(f"[scrcpy] {line.decode('utf-8', errors='ignore').strip()}")

            threading.Thread(target=read_scrcpy_stderr, daemon=True).start()

            # 构建 ffmpeg 命令（解码 MKV 输出 JPEG 帧流）
            ffmpeg_cmd = [
                "ffmpeg",
                "-i", "pipe:0",           # 从 stdin 读取
                "-f", "image2pipe",        # 输出图片流
                "-vcodec", "mjpeg",        # JPEG 编码
                "-q:v", "3",               # 质量（1-31，越小越好）
                "pipe:1",                  # 输出到 stdout
            ]

            # 启动 ffmpeg 进程，连接 scrcpy 的 stdout
            self.ffmpeg_process = subprocess.Popen(
                ffmpeg_cmd,
                stdin=self.scrcpy_process.stdout,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,  # 保留 stderr 用于调试
            )

            # 启动线程读取 ffmpeg stderr（用于调试）
            def read_ffmpeg_stderr():
                if self.ffmpeg_process and self.ffmpeg_process.stderr:
                    for line in self.ffmpeg_process.stderr:
                        print(f"[ffmpeg] {line.decode('utf-8', errors='ignore').strip()}")

            threading.Thread(target=read_ffmpeg_stderr, daemon=True).start()

            # 不要关闭 scrcpy_process.stdout - 它正在被 ffmpeg 使用！
            # 启动读取线程
            self.read_thread = threading.Thread(target=self._read_frames, daemon=True)
            self.read_thread.start()

        except Exception as e:
            print(f"[ScrcpyManager] Failed to start streaming: {e}")
            self.stop()

    def _read_frames(self):
        """从 ffmpeg 输出读取 JPEG 帧"""
        if not self.ffmpeg_process or not self.ffmpeg_process.stdout:
            return

        # JPEG 文件头和尾标记
        JPEG_START = b'\xff\xd8'
        JPEG_END = b'\xff\xd9'

        buffer = b''
        frame_count = 0

        try:
            while self.is_running:
                # 读取数据块
                chunk = self.ffmpeg_process.stdout.read(4096)
                if not chunk:
                    break

                buffer += chunk

                # 查找完整的 JPEG 帧
                while True:
                    start_idx = buffer.find(JPEG_START)
                    if start_idx == -1:
                        break

                    end_idx = buffer.find(JPEG_END, start_idx + 2)
                    if end_idx == -1:
                        break

                    # 提取完整 JPEG 帧
                    jpeg_data = buffer[start_idx:end_idx + 2]
                    buffer = buffer[end_idx + 2:]

                    # 转换为 Base64
                    base64_jpeg = base64.b64encode(jpeg_data).decode('utf-8')

                    # 简单估算尺寸（实际尺寸需要解码 JPEG header，这里用估算值）
                    # TODO: 解析 JPEG 头获取真实尺寸
                    width = self.max_size
                    height = int(self.max_size * 16 / 9)  # 假设 16:9

                    # 回调
                    if self.frame_callback:
                        self.frame_callback(base64_jpeg, width, height)

                    frame_count += 1

        except Exception as e:
            print(f"[ScrcpyManager] Frame read error: {e}")
        finally:
            print(f"[ScrcpyManager] Stopped reading frames (total: {frame_count})")

    def stop(self):
        """停止流式投屏"""
        if not self.is_running:
            return

        self.is_running = False

        # 终止进程
        if self.ffmpeg_process:
            self.ffmpeg_process.terminate()
            try:
                self.ffmpeg_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.ffmpeg_process.kill()

        if self.scrcpy_process:
            self.scrcpy_process.terminate()
            try:
                self.scrcpy_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.scrcpy_process.kill()

        # 等待读取线程结束
        if self.read_thread and self.read_thread.is_alive():
            self.read_thread.join(timeout=2)

        print("[ScrcpyManager] Stopped")

    def send_touch(self, x: int, y: int, action: str = "click"):
        """
        发送触控事件（通过 ADB）

        Args:
            x: X 坐标
            y: Y 坐标
            action: 动作类型 (click, down, move, up)
        """
        try:
            adb_cmd = ["adb"]
            if self.device_id:
                adb_cmd.extend(["-s", self.device_id])

            if action == "click":
                # 点击: input tap x y
                subprocess.run(
                    adb_cmd + ["shell", "input", "tap", str(x), str(y)],
                    capture_output=True,
                    timeout=1,
                )
            elif action in ["down", "move", "up"]:
                # 触摸事件: input touchscreen {swipe, drag}
                # 暂时简化为点击
                subprocess.run(
                    adb_cmd + ["shell", "input", "tap", str(x), str(y)],
                    capture_output=True,
                    timeout=1,
                )

        except Exception as e:
            print(f"[ScrcpyManager] Send touch error: {e}")

    def send_swipe(self, x1: int, y1: int, x2: int, y2: int, duration_ms: int = 300):
        """
        发送滑动事件

        Args:
            x1, y1: 起点坐标
            x2, y2: 终点坐标
            duration_ms: 持续时间（毫秒）
        """
        try:
            adb_cmd = ["adb"]
            if self.device_id:
                adb_cmd.extend(["-s", self.device_id])

            # input swipe x1 y1 x2 y2 duration
            subprocess.run(
                adb_cmd + [
                    "shell", "input", "swipe",
                    str(x1), str(y1), str(x2), str(y2), str(duration_ms)
                ],
                capture_output=True,
                timeout=2,
            )

        except Exception as e:
            print(f"[ScrcpyManager] Send swipe error: {e}")

    def send_keyevent(self, key: str):
        """
        发送按键事件

        Args:
            key: 按键名称 (HOME, BACK, POWER, VOLUME_UP, VOLUME_DOWN)
        """
        try:
            keycode_map = {
                "HOME": "KEYCODE_HOME",
                "BACK": "KEYCODE_BACK",
                "POWER": "KEYCODE_POWER",
                "VOLUME_UP": "KEYCODE_VOLUME_UP",
                "VOLUME_DOWN": "KEYCODE_VOLUME_DOWN",
            }

            keycode = keycode_map.get(key.upper())
            if not keycode:
                return

            adb_cmd = ["adb"]
            if self.device_id:
                adb_cmd.extend(["-s", self.device_id])

            # input keyevent KEYCODE
            subprocess.run(
                adb_cmd + ["shell", "input", "keyevent", keycode],
                capture_output=True,
                timeout=1,
            )

        except Exception as e:
            print(f"[ScrcpyManager] Send keyevent error: {e}")
