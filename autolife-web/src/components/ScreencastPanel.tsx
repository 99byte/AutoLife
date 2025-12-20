/**
 * 手机投屏面板
 * 显示手机实时画面
 */
import React from 'react';
import { Card, Empty, Button } from 'antd';
import { MobileOutlined, FullscreenOutlined } from '@ant-design/icons';

export const ScreencastPanel: React.FC = () => {
  return (
    <Card
      title="手机投屏"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{
        body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      }}
      extra={
        <Button
          icon={<FullscreenOutlined />}
          size="small"
          disabled
        >
          全屏
        </Button>
      }
    >
      <Empty
        image={<MobileOutlined style={{ fontSize: '64px', color: '#999' }} />}
        description={
          <div>
            <p>设备未连接</p>
            <Button type="primary" disabled>
              连接设备
            </Button>
          </div>
        }
      />
    </Card>
  );
};
