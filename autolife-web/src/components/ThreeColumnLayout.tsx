/**
 * 三栏可拖拽布局组件
 * 支持四种布局模式：
 * 1. 三栏全显示：投屏 + 活动 + 聊天
 * 2. 隐藏投屏：活动 + 聊天
 * 3. 隐藏聊天：投屏 + 活动
 * 4. 仅活动面板
 */
import React from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ActivityPanel } from './ActivityPanel.js';
import { EnhancedChatPanel } from './EnhancedChatPanel.js';
import { ScrcpyPanel } from './ScrcpyPanel.js';
import { useAppStore } from '../store/appStore.js';

// 分隔符组件
const ResizeHandle: React.FC = () => (
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
);

export const ThreeColumnLayout: React.FC = () => {
  const { chatPanelVisible, scrcpyPanelVisible } = useAppStore();

  // 模式4：仅活动面板
  if (!scrcpyPanelVisible && !chatPanelVisible) {
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <div style={{ height: '100%', padding: '16px' }}>
          <ActivityPanel />
        </div>
      </div>
    );
  }

  // 模式2：隐藏投屏（活动 + 聊天）
  if (!scrcpyPanelVisible && chatPanelVisible) {
    return (
      <Group
        orientation="horizontal"
        style={{ height: '100%', width: '100%' }}
      >
        <Panel
          defaultSize={70}
          minSize={50}
          maxSize={85}
          id="activity-panel"
        >
          <div style={{ height: '100%', padding: '16px 8px 16px 16px' }}>
            <ActivityPanel />
          </div>
        </Panel>

        <ResizeHandle />

        <Panel
          defaultSize={30}
          minSize={25}
          maxSize={50}
          id="chat-panel"
        >
          <div style={{ height: '100%', padding: '16px 16px 16px 8px' }}>
            <EnhancedChatPanel />
          </div>
        </Panel>
      </Group>
    );
  }

  // 模式3：隐藏聊天（投屏 + 活动）
  if (scrcpyPanelVisible && !chatPanelVisible) {
    return (
      <Group
        orientation="horizontal"
        style={{ height: '100%', width: '100%' }}
      >
        <Panel
          defaultSize={30}
          minSize={20}
          maxSize={50}
          id="scrcpy-panel"
        >
          <div style={{ height: '100%', padding: '16px 8px 16px 16px' }}>
            <ScrcpyPanel />
          </div>
        </Panel>

        <ResizeHandle />

        <Panel
          defaultSize={70}
          minSize={50}
          maxSize={80}
          id="activity-panel"
        >
          <div style={{ height: '100%', padding: '16px 16px 16px 8px' }}>
            <ActivityPanel />
          </div>
        </Panel>
      </Group>
    );
  }

  // 模式1：三栏全显示（投屏 + 活动 + 聊天）
  return (
    <Group
      orientation="horizontal"
      style={{ height: '100%', width: '100%' }}
    >
      {/* 左侧：投屏面板 (默认 25%) */}
      <Panel
        defaultSize={25}
        minSize={15}
        maxSize={40}
        id="scrcpy-panel"
      >
        <div style={{ height: '100%', padding: '16px 8px 16px 16px' }}>
          <ScrcpyPanel />
        </div>
      </Panel>

      <ResizeHandle />

      {/* 中间：活动面板 (默认 45%) */}
      <Panel
        defaultSize={45}
        minSize={30}
        maxSize={60}
        id="activity-panel"
      >
        <div style={{ height: '100%', padding: '16px 8px' }}>
          <ActivityPanel />
        </div>
      </Panel>

      <ResizeHandle />

      {/* 右侧：对话面板 (默认 30%) */}
      <Panel
        defaultSize={30}
        minSize={20}
        maxSize={45}
        id="chat-panel"
      >
        <div style={{ height: '100%', padding: '16px 16px 16px 8px' }}>
          <EnhancedChatPanel />
        </div>
      </Panel>
    </Group>
  );
};
