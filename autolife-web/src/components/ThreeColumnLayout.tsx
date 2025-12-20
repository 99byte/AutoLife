/**
 * 三栏布局组件
 * 左侧：手机投屏 | 中间：操作步骤 | 右侧：对话窗口
 */
import React from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ScreencastPanel } from './ScreencastPanel.js';
import { StepsPanel } from './StepsPanel.js';
import { ChatPanel } from './ChatPanel.js';

export const ThreeColumnLayout: React.FC = () => {
  return (
    <Group
      orientation="horizontal"
      style={{
        height: '100%',
        width: '100%'
      }}
    >
      {/* 左侧：手机投屏 */}
      <Panel defaultSize={30} minSize={15} id="screencast">
        <div style={{ height: '100%' }}>
          <ScreencastPanel />
        </div>
      </Panel>

      <Separator style={{ width: '8px', background: '#e8e8e8', cursor: 'col-resize' }} />

      {/* 中间：操作步骤 */}
      <Panel defaultSize={40} minSize={25} id="steps">
        <div style={{ height: '100%' }}>
          <StepsPanel />
        </div>
      </Panel>

      <Separator style={{ width: '8px', background: '#e8e8e8', cursor: 'col-resize' }} />

      {/* 右侧：对话窗口 */}
      <Panel defaultSize={30} minSize={15} id="chat">
        <div style={{ height: '100%' }}>
          <ChatPanel />
        </div>
      </Panel>
    </Group>
  );
};
