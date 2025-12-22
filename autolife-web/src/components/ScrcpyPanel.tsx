/**
 * 独立投屏面板组件
 */
import React from 'react';
import { Card, Button } from 'antd';
import { MobileOutlined, CloseOutlined } from '@ant-design/icons';
import { ScrcpyPlayer } from './ScrcpyPlayer.js';
import { useAppStore } from '../store/appStore.js';

export const ScrcpyPanel: React.FC = () => {
  const { setScrcpyPanelVisible } = useAppStore();

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflow: 'hidden', padding: '16px' } }}
      title={
        <span>
          <MobileOutlined style={{ marginRight: 8 }} />
          设备投屏
        </span>
      }
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={() => setScrcpyPanelVisible(false)}
        />
      }
    >
      <div style={{ height: 'calc(100vh - 130px)', overflow: 'hidden' }}>
        <ScrcpyPlayer />
      </div>
    </Card>
  );
};
