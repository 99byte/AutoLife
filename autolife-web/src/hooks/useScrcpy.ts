/**
 * scrcpy WebSocket Hook
 * 管理投屏连接和视频流接收
 */
import { useRef, useState, useCallback, useEffect } from 'react';

export interface ScrcpyFrame {
  data: string;      // Base64 JPEG
  width: number;
  height: number;
}

export interface UseScrcpyOptions {
  onFrame?: (frame: ScrcpyFrame) => void;
  onError?: (error: string) => void;
}

export const useScrcpy = (options: UseScrcpyOptions = {}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 连接
  const connect = useCallback(() => {
    if (wsRef.current) {
      return; // 已连接
    }

    const ws = new WebSocket('ws://localhost:8000/api/scrcpy/ws');

    ws.onopen = () => {
      console.log('[useScrcpy] WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'frame' && options.onFrame) {
          options.onFrame({
            data: message.data,
            width: message.width,
            height: message.height,
          });
        }
      } catch (e) {
        console.error('[useScrcpy] Failed to parse message:', e);
      }
    };

    ws.onerror = (event) => {
      const errorMsg = '投屏连接错误';
      console.error('[useScrcpy] WebSocket error:', event);
      setError(errorMsg);
      options.onError?.(errorMsg);
    };

    ws.onclose = () => {
      console.log('[useScrcpy] WebSocket closed');
      setIsConnected(false);
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [options]);

  // 断开
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // 发送触控事件
  const sendTouch = useCallback((x: number, y: number, action: string = 'click') => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'touch',
        x,
        y,
        action,
      }));
    }
  }, [isConnected]);

  // 发送滑动事件
  const sendSwipe = useCallback((x1: number, y1: number, x2: number, y2: number, duration: number = 300) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'swipe',
        x1,
        y1,
        x2,
        y2,
        duration,
      }));
    }
  }, [isConnected]);

  // 发送按键事件
  const sendKeyEvent = useCallback((key: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'keyevent',
        key,
      }));
    }
  }, [isConnected]);

  // 清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendTouch,
    sendSwipe,
    sendKeyEvent,
  };
};
