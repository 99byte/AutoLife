/**
 * 投屏组件
 * Canvas 渲染 + 触控事件处理
 */
import React, { useRef, useState } from 'react';
import { Card, Button, Space, message, Empty } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FullscreenOutlined,
  HomeOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useScrcpy } from '../hooks/useScrcpy.js';

export const ScreenMirror: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deviceSize, setDeviceSize] = useState({ width: 0, height: 0 });

  const { isConnected, error, connect, disconnect, sendTouch, sendKeyEvent } = useScrcpy({
    onFrame: (frame) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 创建图片
      const img = new Image();
      img.onload = () => {
        // 更新设备尺寸
        if (frame.width !== deviceSize.width || frame.height !== deviceSize.height) {
          canvas.width = frame.width;
          canvas.height = frame.height;
          setDeviceSize({ width: frame.width, height: frame.height });
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0);
      };
      img.src = `data:image/jpeg;base64,${frame.data}`;
    },
    onError: (err) => {
      message.error(err);
    },
  });

  // 处理点击事件
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isConnected) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = deviceSize.width / rect.width;
    const scaleY = deviceSize.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    sendTouch(x, y, 'click');
  };

  // 切换投屏
  const toggleScreencast = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <Card
      title="手机投屏"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{
        body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' },
      }}
      extra={
        <Space>
          <Button
            icon={isConnected ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            type={isConnected ? 'primary' : 'default'}
            onClick={toggleScreencast}
            danger={isConnected}
          >
            {isConnected ? '停止投屏' : '开始投屏'}
          </Button>
          <Button
            icon={<HomeOutlined />}
            size="small"
            onClick={() => sendKeyEvent('HOME')}
            disabled={!isConnected}
          >
            Home
          </Button>
          <Button
            icon={<RollbackOutlined />}
            size="small"
            onClick={() => sendKeyEvent('BACK')}
            disabled={!isConnected}
          >
            Back
          </Button>
          <Button
            icon={<FullscreenOutlined />}
            size="small"
            disabled
          >
            全屏
          </Button>
        </Space>
      }
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          background: '#000',
        }}
      >
        {deviceSize.width > 0 ? (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              cursor: isConnected ? 'pointer' : 'default',
            }}
          />
        ) : (
          <Empty
            description={isConnected ? "正在连接设备..." : "点击「开始投屏」查看设备画面"}
            style={{ color: '#fff' }}
          />
        )}
      </div>

      {error && (
        <div style={{ marginTop: '8px', color: 'red', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </Card>
  );
};
