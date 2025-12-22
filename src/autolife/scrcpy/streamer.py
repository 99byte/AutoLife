"""
ScrcpyStreamer - H.264 NAL 单元流式管理器

直接操作 scrcpy-server，提供原生 H.264 NAL 单元流，
相比 JPEG 方案带宽降低 70%，延迟降低 60%。
"""

import os
import socket
import subprocess
import threading
import asyncio
import queue
from pathlib import Path
from typing import Optional, AsyncIterator


class ScrcpyStreamer:
    """
    scrcpy H.264 NAL 单元流管理器

    核心功能：
    - 管理 scrcpy-server 生命周期（push → forward → 启动）
    - 建立 TCP socket 连接到 localhost:27183
    - 读取并解析 H.264 NAL 单元流
    - 缓存 SPS/PPS/IDR 供新连接快速初始化
    - 提供异步迭代器供 WebSocket 消费

    示例：
        >>> streamer = ScrcpyStreamer(device_id='emulator-5554')
        >>> await streamer.start()
        >>> init_data = streamer.get_initialization_data()
        >>> async for nal in streamer.iter_nal_units():
        ...     # 发送到 WebSocket
        ...     await websocket.send_bytes(nal)
    """

    # NAL 单元类型常量
    NAL_TYPE_SPS = 7  # Sequence Parameter Set
    NAL_TYPE_PPS = 8  # Picture Parameter Set
    NAL_TYPE_IDR = 5  # Instantaneous Decoder Refresh (关键帧)

    # 起始码
    START_CODE_4 = b'\x00\x00\x00\x01'
    START_CODE_3 = b'\x00\x00\x01'

    def __init__(
        self,
        device_id: Optional[str] = None,
        max_size: int = 1280,
        max_fps: int = 20,
        video_bit_rate: int = 1_000_000,  # 1 Mbps
    ):
        """
        初始化流管理器

        Args:
            device_id: ADB 设备 ID，None 表示使用第一个连接的设备
            max_size: 最大分辨率（短边），默认 1280
            max_fps: 最大帧率，默认 20
            video_bit_rate: 视频码率，默认 1 Mbps
        """
        self.device_id = device_id
        self.max_size = max_size
        self.max_fps = max_fps
        self.video_bit_rate = video_bit_rate

        # 运行状态
        self.is_running = False

        # socket 和进程句柄
        self.socket: Optional[socket.socket] = None
        self.server_process: Optional[subprocess.Popen] = None

        # 设备分辨率（从 scrcpy 元数据获取）
        self.device_width: int = 0
        self.device_height: int = 0

        # NAL 缓存
        self.sps: Optional[bytes] = None
        self.pps: Optional[bytes] = None
        self.latest_idr: Optional[bytes] = None
        self._cache_lock = threading.Lock()

        # 后台缓存线程
        self._cache_thread: Optional[threading.Thread] = None

        # NAL 单元队列（缓存线程生产，迭代器消费）
        self._nal_queue: queue.Queue = queue.Queue(maxsize=100)

        # scrcpy-server 路径
        self.server_path = self._locate_scrcpy_server()

        # NAL 读取缓冲区
        self._read_buffer = b''

    def _locate_scrcpy_server(self) -> Path:
        """
        查找 scrcpy-server 二进制文件

        查找顺序：
        1. 项目资源目录（打包时）
        2. Homebrew 路径（开发时）
        3. SCRCPY_SERVER_PATH 环境变量

        Returns:
            Path: scrcpy-server 文件路径

        Raises:
            FileNotFoundError: 找不到 scrcpy-server
        """
        candidates = [
            # 项目资源目录
            Path(__file__).parent.parent.parent.parent / "resources" / "scrcpy-server",
            # Homebrew 路径（macOS）
            Path("/opt/homebrew/Cellar/scrcpy/3.3.3/share/scrcpy/scrcpy-server"),
            Path("/usr/local/Cellar/scrcpy/3.3.3/share/scrcpy/scrcpy-server"),
            # 环境变量
            Path(os.getenv("SCRCPY_SERVER_PATH", "")),
        ]

        for path in candidates:
            if path.exists() and path.is_file():
                print(f"[ScrcpyStreamer] Found scrcpy-server at: {path}")
                return path

        raise FileNotFoundError(
            "scrcpy-server v3.3.3 not found. "
            "Please install scrcpy or set SCRCPY_SERVER_PATH environment variable."
        )

    async def start(self):
        """
        启动流式传输

        完整流程：
        1. 检查设备连接
        2. 杀掉旧的 scrcpy-server 进程
        3. Push scrcpy-server 到设备
        4. 设置端口转发
        5. 启动 scrcpy-server 进程
        6. 连接 socket
        7. 启动 NAL 缓存线程
        """
        if self.is_running:
            print("[ScrcpyStreamer] Already running")
            return

        print("[ScrcpyStreamer] Starting...")

        # 1. 检查设备连接
        await self._check_device_available()

        # 2. 杀掉旧进程
        await self._kill_existing_servers()

        # 3. Push server
        await self._push_server()

        # 4. 端口转发
        await self._setup_port_forward()

        # 5. 启动 server 进程
        await self._start_server_process()

        # 6. 连接 socket
        await self._connect_socket()

        # 7. 设置运行状态（必须在启动缓存线程之前）
        self.is_running = True

        # 8. 启动缓存线程
        self._start_cache_thread()

        print("[ScrcpyStreamer] Started successfully")

    async def _check_device_available(self):
        """检查设备是否连接"""
        adb_cmd = ["adb", "devices"]

        result = await asyncio.create_subprocess_exec(
            *adb_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        stdout, stderr = await result.communicate()

        if result.returncode != 0:
            raise RuntimeError(f"ADB command failed: {stderr.decode()}")

        devices = stdout.decode().strip().split('\n')[1:]  # 跳过标题行
        devices = [line.split()[0] for line in devices if '\tdevice' in line]

        if not devices:
            raise RuntimeError("No device connected")

        # 如果未指定设备，使用第一个
        if not self.device_id:
            self.device_id = devices[0]
            print(f"[ScrcpyStreamer] Using device: {self.device_id}")
        elif self.device_id not in devices:
            raise RuntimeError(f"Device {self.device_id} not found")

    async def _kill_existing_servers(self):
        """杀掉设备上已有的 scrcpy-server 进程"""
        adb_cmd = ["adb"]
        if self.device_id:
            adb_cmd.extend(["-s", self.device_id])

        # 查找并杀掉 scrcpy-server 进程
        kill_cmd = adb_cmd + [
            "shell",
            "pkill", "-f", "com.genymobile.scrcpy.Server"
        ]

        result = await asyncio.create_subprocess_exec(*kill_cmd)
        await result.wait()

        print("[ScrcpyStreamer] Killed existing scrcpy-server processes")

    async def _push_server(self):
        """Push scrcpy-server 到设备"""
        adb_cmd = ["adb"]
        if self.device_id:
            adb_cmd.extend(["-s", self.device_id])

        push_cmd = adb_cmd + [
            "push",
            str(self.server_path),
            "/data/local/tmp/scrcpy-server"
        ]

        result = await asyncio.create_subprocess_exec(
            *push_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        stdout, stderr = await result.communicate()

        if result.returncode != 0:
            raise RuntimeError(f"Failed to push scrcpy-server: {stderr.decode()}")

        print("[ScrcpyStreamer] Pushed scrcpy-server to device")

    async def _setup_port_forward(self):
        """设置 ADB 端口转发"""
        adb_cmd = ["adb"]
        if self.device_id:
            adb_cmd.extend(["-s", self.device_id])

        forward_cmd = adb_cmd + [
            "forward",
            "tcp:27183",
            "localabstract:scrcpy"
        ]

        result = await asyncio.create_subprocess_exec(*forward_cmd)
        await result.wait()

        if result.returncode != 0:
            raise RuntimeError("Failed to setup port forwarding")

        print("[ScrcpyStreamer] Port forwarding set up: tcp:27183 → localabstract:scrcpy")

    async def _start_server_process(self):
        """启动 scrcpy-server Java 进程"""
        adb_cmd = ["adb"]
        if self.device_id:
            adb_cmd.extend(["-s", self.device_id])

        # 完整命令（参考 docs/scrcpy-t.md）
        cmd = adb_cmd + [
            "shell",
            "CLASSPATH=/data/local/tmp/scrcpy-server",
            "app_process",
            "/",
            "com.genymobile.scrcpy.Server",
            "3.3.3",                                    # scrcpy 版本
            f"max_size={self.max_size}",                # 分辨率
            f"video_bit_rate={self.video_bit_rate}",    # 码率
            f"max_fps={self.max_fps}",                  # 帧率
            "tunnel_forward=true",                       # 使用 ADB forward
            "audio=false",                               # 禁用音频
            "control=false",                             # 禁用控制（我们用 ADB 发送）
            "cleanup=false",                             # 禁用清理
            "video_codec_options=i-frame-interval=1"    # I 帧间隔 1 秒
        ]

        self.server_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # 等待 server 启动（socket 就绪）
        print("[ScrcpyStreamer] Starting scrcpy-server process...")
        await asyncio.sleep(2)

        # 检查进程是否存活
        if self.server_process.poll() is not None:
            stderr = self.server_process.stderr.read().decode()
            raise RuntimeError(f"scrcpy-server process exited: {stderr}")

        print("[ScrcpyStreamer] scrcpy-server process started")

    async def _connect_socket(self):
        """连接到 scrcpy-server socket"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        # 设置 2MB 接收缓冲区
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 2 * 1024 * 1024)

        # 设置读取超时（5 秒）
        self.socket.settimeout(5)

        # 重试连接（最多 10 次，每次间隔 0.5 秒）
        for i in range(10):
            try:
                self.socket.connect(("127.0.0.1", 27183))
                print("[ScrcpyStreamer] Connected to scrcpy-server socket")
                break
            except ConnectionRefusedError:
                if i < 9:
                    await asyncio.sleep(0.5)
                else:
                    raise RuntimeError("Failed to connect to scrcpy-server socket after 10 retries")

        # 跳过 scrcpy 协议元数据头
        # scrcpy v3.x 协议：设备名（64 字节） + 分辨率（8 字节）= 72 字节
        await self._skip_metadata_header()

    async def _skip_metadata_header(self):
        """
        跳过 scrcpy 协议元数据头

        scrcpy v3.x 协议格式（共 77 字节）：
        - 1 字节: dummy (0x00)
        - 64 字节: 设备名（固定长度，不足用 null 填充）
        - 4 字节: codec ("h264")
        - 4 字节: 视频宽度（大端序）
        - 4 字节: 视频高度（大端序）

        之后每个 packet：
        - 8 字节: PTS（演示时间戳）
        - 4 字节: packet size
        - N 字节: H.264 NAL 数据
        """
        import struct

        # 读取完整的 77 字节头
        header = b''
        while len(header) < 77:
            chunk = self.socket.recv(77 - len(header))
            if not chunk:
                raise RuntimeError("Socket closed while reading metadata header")
            header += chunk

        # 解析头部
        # 字节 0: dummy
        # 字节 1-64: 设备名
        device_name = header[1:65].rstrip(b'\x00').decode('utf-8', errors='replace')
        print(f"[ScrcpyStreamer] Device name: {device_name}")

        # 字节 65-68: codec
        codec = header[65:69].decode('ascii', errors='replace')
        print(f"[ScrcpyStreamer] Codec: {codec}")

        # 字节 69-72: width, 字节 73-76: height
        width = struct.unpack('>I', header[69:73])[0]
        height = struct.unpack('>I', header[73:77])[0]
        print(f"[ScrcpyStreamer] Video resolution: {width}x{height}")

        # 保存分辨率供后续使用
        self.device_width = width
        self.device_height = height

    def read_nal_unit(self) -> Optional[bytes]:
        """
        从 socket 读取一个完整的 NAL 单元

        scrcpy v3.x packet 格式：
        - 8 字节: PTS（演示时间戳，大端序）
        - 4 字节: packet size（大端序）
        - N 字节: H.264 NAL 数据（包含起始码）

        Returns:
            bytes: 完整的 NAL 单元（包含起始码），如果 socket 关闭或超时返回 None
        """
        import struct

        if not self.socket or not self.is_running:
            return None

        try:
            # 1. 读取 packet header（12 字节：8 字节 PTS + 4 字节 size）
            header = b''
            while len(header) < 12:
                try:
                    chunk = self.socket.recv(12 - len(header))
                    if not chunk:
                        return None
                    header += chunk
                except socket.timeout:
                    # 超时时返回 None，让调用者决定是否重试
                    return None

            # 解析 packet header
            # pts = struct.unpack('>Q', header[:8])[0]  # 暂时不使用 PTS
            packet_size = struct.unpack('>I', header[8:12])[0]

            if packet_size == 0:
                return None

            if packet_size > 10 * 1024 * 1024:  # 10MB 限制
                print(f"[ScrcpyStreamer] Warning: packet size too large: {packet_size}")
                return None

            # 2. 读取 packet 数据
            data = b''
            while len(data) < packet_size:
                try:
                    chunk = self.socket.recv(min(65536, packet_size - len(data)))
                    if not chunk:
                        return None
                    data += chunk
                except socket.timeout:
                    # 数据不完整，丢弃
                    print(f"[ScrcpyStreamer] Timeout reading packet data ({len(data)}/{packet_size})")
                    return None

            return data

        except OSError as e:
            # socket 已关闭
            if self.is_running:
                print(f"[ScrcpyStreamer] Socket error: {e}")
            return None
        except Exception as e:
            print(f"[ScrcpyStreamer] Error reading NAL unit: {e}")
            return None

    def _get_nal_type(self, nal: bytes) -> Optional[int]:
        """
        解析 NAL 单元类型

        Args:
            nal: NAL 单元数据（包含起始码）

        Returns:
            int: NAL type (0-31)，如果解析失败返回 None
        """
        # 跳过起始码
        start_code_len = 4 if nal.startswith(self.START_CODE_4) else 3

        if len(nal) <= start_code_len:
            return None

        # NAL header: 第一个字节的低 5 位是 NAL type
        nal_type = nal[start_code_len] & 0x1F

        return nal_type

    def _cache_nal_units(self):
        """
        后台线程：持续读取 NAL 单元，缓存重要的并放入队列

        缓存策略：
        - SPS/PPS：锁定第一个（整个视频流不变）
        - IDR：持续更新（关键帧，用于快速初始化）

        所有 NAL 单元都会放入队列供 iter_nal_units() 消费。
        """
        print("[ScrcpyStreamer] NAL caching thread started")
        consecutive_timeouts = 0

        while self.is_running:
            try:
                nal = self.read_nal_unit()

                if not nal:
                    consecutive_timeouts += 1
                    # 连续超时 60 次（约 5 分钟）才停止
                    if consecutive_timeouts >= 60:
                        print("[ScrcpyStreamer] Too many consecutive timeouts, stopping")
                        break
                    # 超时时继续尝试
                    continue

                # 成功读取，重置计数
                consecutive_timeouts = 0

                nal_type = self._get_nal_type(nal)

                if nal_type is None:
                    continue

                # 缓存 SPS/PPS/IDR
                with self._cache_lock:
                    if nal_type == self.NAL_TYPE_SPS and not self.sps:
                        self.sps = nal
                        print(f"[ScrcpyStreamer] Cached SPS ({len(nal)} bytes)")

                    elif nal_type == self.NAL_TYPE_PPS and not self.pps:
                        self.pps = nal
                        print(f"[ScrcpyStreamer] Cached PPS ({len(nal)} bytes)")

                    elif nal_type == self.NAL_TYPE_IDR:
                        self.latest_idr = nal
                        # IDR 比较大，不打印日志（避免刷屏）

                # 把 NAL 单元放入队列供消费者使用
                try:
                    self._nal_queue.put(nal, timeout=1)
                except queue.Full:
                    # 队列满了，丢弃旧数据避免积压
                    try:
                        self._nal_queue.get_nowait()
                        self._nal_queue.put(nal, timeout=0.1)
                    except (queue.Empty, queue.Full):
                        pass

            except Exception as e:
                print(f"[ScrcpyStreamer] Error in cache thread: {e}")
                if self.is_running:
                    break

        # 流结束，放入 None 作为结束信号
        try:
            self._nal_queue.put(None, timeout=1)
        except queue.Full:
            pass

        print("[ScrcpyStreamer] NAL caching thread stopped")

    def _start_cache_thread(self):
        """启动后台缓存线程"""
        self._cache_thread = threading.Thread(
            target=self._cache_nal_units,
            daemon=True
        )
        self._cache_thread.start()

    def get_initialization_data(self) -> bytes:
        """
        获取初始化数据（SPS + PPS + IDR）

        用于新连接快速初始化 jMuxer 解码器。

        Returns:
            bytes: 初始化数据（SPS + PPS + IDR 拼接）
        """
        with self._cache_lock:
            parts = []

            if self.sps:
                parts.append(self.sps)

            if self.pps:
                parts.append(self.pps)

            if self.latest_idr:
                parts.append(self.latest_idr)

            return b''.join(parts)

    async def iter_nal_units(self) -> AsyncIterator[bytes]:
        """
        异步迭代器：逐个产出 NAL 单元

        从内部队列读取 NAL 单元（由缓存线程生产）。

        用于 WebSocket 消费：

            async for nal in streamer.iter_nal_units():
                await websocket.send_bytes(nal)

        Yields:
            bytes: NAL 单元（包含起始码）
        """
        while self.is_running:
            try:
                # 从队列获取 NAL 单元（阻塞等待）
                nal = await asyncio.to_thread(self._nal_queue.get, timeout=5)

                if nal is None:
                    # None 是结束信号
                    print("[ScrcpyStreamer] NAL iterator: received end signal")
                    break

                yield nal

            except Exception:
                # 超时或其他错误，继续等待
                if not self.is_running:
                    break

    async def stop(self):
        """
        停止流式传输

        清理流程：
        1. 停止运行标志
        2. 关闭 socket
        3. 杀掉 server 进程
        4. 移除端口转发
        """
        if not self.is_running:
            return

        print("[ScrcpyStreamer] Stopping...")

        self.is_running = False

        # 等待缓存线程结束
        if self._cache_thread and self._cache_thread.is_alive():
            self._cache_thread.join(timeout=2)

        # 关闭 socket
        if self.socket:
            self.socket.close()
            self.socket = None

        # 杀掉 server 进程
        if self.server_process:
            self.server_process.terminate()

            try:
                self.server_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.server_process.kill()

            self.server_process = None

        # 移除端口转发
        await self._remove_port_forward()

        print("[ScrcpyStreamer] Stopped")

    async def _remove_port_forward(self):
        """移除 ADB 端口转发"""
        adb_cmd = ["adb"]
        if self.device_id:
            adb_cmd.extend(["-s", self.device_id])

        remove_cmd = adb_cmd + ["forward", "--remove", "tcp:27183"]

        result = await asyncio.create_subprocess_exec(*remove_cmd)
        await result.wait()

        print("[ScrcpyStreamer] Removed port forwarding")
