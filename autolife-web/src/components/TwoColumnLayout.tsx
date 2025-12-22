/**
 * 两栏可拖拽布局组件
 */
import React from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ActivityPanel } from './ActivityPanel.js';
import { EnhancedChatPanel } from './EnhancedChatPanel.js';
import { useAppStore } from '../store/appStore.js';

export const TwoColumnLayout: React.FC = () => {
  const { chatPanelVisible } = useAppStore();

  // 如果聊天面板隐藏，显示全宽活动面板
  if (!chatPanelVisible) {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <div
          style={{
            height: '100%',
            padding: '16px',
          }}
        >
          <ActivityPanel />
        </div>
      </div>
    );
  }

  return (
    <Group
      orientation="horizontal"
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      {/* 左侧：活动面板 (默认 70%) */}
      <Panel
        defaultSize={70}
        minSize={50}
        maxSize={85}
        id="activity-panel"
      >
        <div
          style={{
            height: '100%',
            padding: '16px 8px 16px 16px',
          }}
        >
          <ActivityPanel />
        </div>
      </Panel>

      {/* 拖拽分隔符 */}
      <Separator
        style={{
          width: '8px',
          background: 'transparent',
          cursor: 'col-resize',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4px',
            height: '48px',
            background: '#d9d9d9',
            borderRadius: '2px',
          }}
        />
      </Separator>

      {/* 右侧：对话面板 (默认 30%) */}
      <Panel
        defaultSize={30}
        minSize={25}
        maxSize={50}
        id="chat-panel"
      >
        <div
          style={{
            height: '100%',
            padding: '16px 16px 16px 8px',
          }}
        >
          <EnhancedChatPanel />
        </div>
      </Panel>
    </Group>
  );
};
