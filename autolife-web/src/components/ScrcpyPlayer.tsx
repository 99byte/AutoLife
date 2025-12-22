/**
 * Scrcpy H.264 视频播放器组件
 *
 * 功能：
 * - 通过 WebSocket 接收 H.264 NAL 单元流
 * - 使用 jMuxer 解码并播放视频
 * - 支持触控事件（点击、滑动）
 * - 自动重连机制
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import JMuxer from 'jmuxer';
import { Spin, Space, Button, Typography } from 'antd';
import {
  ReloadOutlined,
  MobileOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// 连接状态类型
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// API 基础 URL
const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

interface DeviceResolution {
  width: number;
  height: number;
  device_id: string;
}

export const ScrcpyPlayer: React.FC = () => {
  // 引用
  const videoRef = useRef<HTMLVideoElement>(null);
  const jmuxerRef = useRef<JMuxer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 状态
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<DeviceResolution | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  // 触控起点（用于滑动检测）
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );

  /**
   * 坐标映射：视频坐标 → 设备坐标
   */
  const mapToDeviceCoords = useCallback(
    (videoX: number, videoY: number): { x: number; y: number } | null => {
      if (!videoRef.current || !resolution) return null;

      // 获取视频在容器中的实际显示尺寸
      const rect = videoRef.current.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // 计算缩放比例
      const scaleX = resolution.width / displayWidth;
      const scaleY = resolution.height / displayHeight;

      // 计算设备坐标
      const deviceX = Math.round(videoX * scaleX);
      const deviceY = Math.round(videoY * scaleY);

      return { x: deviceX, y: deviceY };
    },
    [resolution]
  );

  /**
   * 发送触控事件
   */
  const sendTouch = useCallback(
    async (x: number, y: number, action: string = 'tap') => {
      try {
        await fetch(`${API_BASE}/api/scrcpy/touch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x, y, action }),
        });
      } catch (e) {
        console.error('发送触控失败:', e);
      }
    },
    []
  );

  /**
   * 发送滑动事件
   */
  const sendSwipe = useCallback(
    async (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      duration: number = 300
    ) => {
      try {
        await fetch(`${API_BASE}/api/scrcpy/swipe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x1, y1, x2, y2, duration }),
        });
      } catch (e) {
        console.error('发送滑动失败:', e);
      }
    },
    []
  );

  /**
   * 处理鼠标/触摸事件
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!videoRef.current) return;

      const rect = videoRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      touchStartRef.current = { x, y, time: Date.now() };
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!videoRef.current || !touchStartRef.current) return;

      const rect = videoRef.current.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      const { x: startX, y: startY, time: startTime } = touchStartRef.current;

      const distance = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
      );
      const duration = Date.now() - startTime;

      // 判断是点击还是滑动
      if (distance < 10 && duration < 300) {
        // 点击
        const coords = mapToDeviceCoords(endX, endY);
        if (coords) {
          sendTouch(coords.x, coords.y, 'tap');
        }
      } else if (distance >= 10) {
        // 滑动
        const startCoords = mapToDeviceCoords(startX, startY);
        const endCoords = mapToDeviceCoords(endX, endY);
        if (startCoords && endCoords) {
          sendSwipe(
            startCoords.x,
            startCoords.y,
            endCoords.x,
            endCoords.y,
            Math.min(duration, 1000)
          );
        }
      }

      touchStartRef.current = null;
    },
    [mapToDeviceCoords, sendTouch, sendSwipe]
  );

  /**
   * 获取设备分辨率
   */
  const fetchResolution = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scrcpy/resolution`);
      if (res.ok) {
        const data = await res.json();
        setResolution(data);
        return data;
      }
    } catch (e) {
      console.error('获取分辨率失败:', e);
    }
    return null;
  }, []);

  /**
   * 初始化 jMuxer
   */
  const initJMuxer = useCallback(() => {
    if (!videoRef.current) return;

    // 清理旧实例
    if (jmuxerRef.current) {
      jmuxerRef.current.destroy();
    }

    jmuxerRef.current = new JMuxer({
      node: videoRef.current,
      mode: 'video',
      flushingTime: 0,
      fps: 20,
      debug: false,
      onError: (error: Error) => {
        console.error('jMuxer 错误:', error);
        // 重置流
        resetStream();
      },
    });
  }, []);

  /**
   * 连接 WebSocket
   */
  const connect = useCallback(async () => {
    // 关闭现有连接
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus('connecting');
    setError(null);

    // 获取分辨率
    const res = await fetchResolution();
    if (!res) {
      setStatus('error');
      setError('无法获取设备分辨率，请确保设备已连接');
      return;
    }

    // 初始化 jMuxer
    initJMuxer();

    // 连接 WebSocket
    const deviceId = res.device_id;
    const wsUrl = `${WS_BASE}/api/scrcpy/ws?device_id=${deviceId}`;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('[ScrcpyPlayer] WebSocket 已连接');
        setStatus('connected');
        setReconnectCount(0);
      };

      ws.onmessage = (event) => {
        if (jmuxerRef.current && event.data instanceof ArrayBuffer) {
          jmuxerRef.current.feed({
            video: new Uint8Array(event.data),
          });
        }
      };

      ws.onerror = (event) => {
        console.error('[ScrcpyPlayer] WebSocket 错误:', event);
        setError('WebSocket 连接错误');
      };

      ws.onclose = (event) => {
        console.log('[ScrcpyPlayer] WebSocket 关闭:', event.code, event.reason);
        if (status !== 'disconnected') {
          setStatus('disconnected');
          // 自动重连
          if (reconnectCount < 5) {
            const delay = Math.min(3000 * Math.pow(2, reconnectCount), 30000);
            console.log(`[ScrcpyPlayer] ${delay}ms 后重连...`);
            setTimeout(() => {
              setReconnectCount((prev) => prev + 1);
              connect();
            }, delay);
          } else {
            setError('连接已断开，请手动重连');
          }
        }
      };

      wsRef.current = ws;
    } catch (e) {
      setStatus('error');
      setError(`连接失败: ${e}`);
    }
  }, [fetchResolution, initJMuxer, reconnectCount, status]);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    setStatus('disconnected');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (jmuxerRef.current) {
      jmuxerRef.current.destroy();
      jmuxerRef.current = null;
    }
  }, []);

  /**
   * 重置流
   */
  const resetStream = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/scrcpy/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // 重新连接
      disconnect();
      setTimeout(connect, 1000);
    } catch (e) {
      console.error('重置流失败:', e);
    }
  }, [connect, disconnect]);

  // 组件挂载时不自动连接，等用户点击
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // 渲染状态遮罩
  const renderOverlay = () => {
    if (status === 'connected') return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
        }}
      >
        {status === 'connecting' && (
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text style={{ color: '#fff' }}>正在连接设备...</Text>
          </Space>
        )}

        {status === 'disconnected' && !error && (
          <Space direction="vertical" align="center">
            <MobileOutlined style={{ fontSize: 48, color: '#fff' }} />
            <Text style={{ color: '#fff' }}>点击开始投屏</Text>
            <Button type="primary" onClick={connect}>
              连接设备
            </Button>
          </Space>
        )}

        {(status === 'error' || error) && (
          <Space direction="vertical" align="center">
            <DisconnectOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
            <Text style={{ color: '#ff4d4f' }}>{error || '连接错误'}</Text>
            <Button type="primary" onClick={connect} icon={<ReloadOutlined />}>
              重新连接
            </Button>
          </Space>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          cursor: status === 'connected' ? 'pointer' : 'default',
        }}
      />
      {renderOverlay()}
    </div>
  );
};
