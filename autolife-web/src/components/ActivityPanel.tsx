/**
 * 活动面板主容器
 */
import React, { useState } from 'react';
import { Card, Tabs, Badge, Button } from 'antd';
import { ClockCircleOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { ActivityTimeline } from './ActivityTimeline.js';
import { TodoList } from './TodoList.js';
import { useAppStore } from '../store/appStore.js';

export const ActivityPanel: React.FC = () => {
  const { getTodayActivities, getTodosByStatus, chatPanelVisible, setChatPanelVisible } = useAppStore();
  const [activeTab, setActiveTab] = useState('activities');

  // 获取今日活动数量
  const todayActivities = getTodayActivities();
  const activityCount = todayActivities.length;

  // 获取未完成的待办事项数量
  const pendingTodos = getTodosByStatus('pending').length + getTodosByStatus('in_progress').length;

  const items = [
    {
      key: 'activities',
      label: (
        <span>
          <ClockCircleOutlined />
          <span style={{ marginLeft: 8 }}>今日活动</span>
          <Badge count={activityCount} style={{ marginLeft: 8 }} showZero />
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <ActivityTimeline />
        </div>
      ),
    },
    {
      key: 'todos',
      label: (
        <span>
          <CheckSquareOutlined />
          <span style={{ marginLeft: 8 }}>待办事项</span>
          <Badge count={pendingTodos} style={{ marginLeft: 8 }} showZero />
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <TodoList />
        </div>
      ),
    },
  ];

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflow: 'hidden', padding: '16px' } }}
      title="Automated Your Life"
      extra={
        !chatPanelVisible && (
          <Button
            type="primary"
            onClick={() => setChatPanelVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 20,
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            <span style={{ marginRight: 4 }}>✨</span>
            AI Copilot
          </Button>
        )
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        type="card"
      />
    </Card>
  );
};
