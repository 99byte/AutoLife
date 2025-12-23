/**
 * 核心活动面板
 * 展示 Markdown 文档说明
 */
import React from 'react';
import { Card, Button, Space } from 'antd';
import { MobileOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore.js';
import { XMarkdown } from '@ant-design/x-markdown';

const markdownContent = `
# AutoLife Project

## 简介
AutoLife 是一个基于 AI Agent 的智能生活辅助系统，旨在通过自动化技术提升用户的日常生活体验。

## 核心功能
*   **📱 设备投屏**: 集成 Scrcpy，实时控制安卓设备。
*   **🤖 AI Copilot**: 智能对话助手，支持自然语言指令。
*   **⚡️ 自动化任务**: 自动执行跨应用操作。

## 快速开始
1.  点击右侧 "AI Copilot" 唤起助手。
2.  输入指令，例如 "打开微信"。
3.  观察左侧投屏设备的响应。

## 最新更新
*   [New] 集成 Ant Design X 组件库。
*   [Fix] 优化了三栏布局的响应式体验。
`;

export const ActivityPanel: React.FC = () => {
  const {
    scrcpyPanelVisible,
    setScrcpyPanelVisible,
    chatPanelVisible,
    setChatPanelVisible,
  } = useAppStore();

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px' } }}
      title="项目说明"
      extra={
        <Space>
          {!scrcpyPanelVisible && (
            <Button
              type="default"
              onClick={() => setScrcpyPanelVisible(true)}
              style={{
                borderRadius: 20,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <MobileOutlined style={{ marginRight: 4 }} />
              投屏
            </Button>
          )}
          {!chatPanelVisible && (
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
          )}
        </Space>
      }
    >
      <XMarkdown>{markdownContent}</XMarkdown>
    </Card>
  );
};
