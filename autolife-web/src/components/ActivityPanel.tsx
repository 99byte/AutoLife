/**
 * 核心活动面板
 * 动态展示项目说明或任务成果报告
 * 支持流式动画效果
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Button, Space } from 'antd';
import { MobileOutlined, FileTextOutlined, HomeOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore.js';
import { XMarkdown } from '@ant-design/x-markdown';

// 默认项目说明
const DEFAULT_CONTENT = `# AutoLife Project

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

type DisplayMode = 'default' | 'report';

// 流式动画配置
const STREAMING_CONFIG = {
  chunkSize: 5,           // 每次添加的字符数
  intervalMs: 30,         // 每次更新的间隔（毫秒）
  fadeDuration: 150,      // 淡入动画持续时间
  easing: 'ease-out',     // 动画缓动函数
};

export const ActivityPanel: React.FC = () => {
  const {
    scrcpyPanelVisible,
    setScrcpyPanelVisible,
    chatPanelVisible,
    setChatPanelVisible,
    taskHistory,
  } = useAppStore();

  const [displayMode, setDisplayMode] = useState<DisplayMode>('default');
  const [currentReport, setCurrentReport] = useState<string | null>(null);

  // 流式动画状态
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const fullContentRef = useRef<string>('');
  const streamingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProcessedTaskIdRef = useRef<string | null>(null);  // 记录已处理的任务ID

  // 清理定时器
  const clearStreamingTimer = useCallback(() => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
  }, []);

  // 启动流式动画
  const startStreamingAnimation = useCallback((content: string) => {
    clearStreamingTimer();
    fullContentRef.current = content;
    setDisplayedContent('');
    setIsStreaming(true);

    let currentIndex = 0;

    streamingTimerRef.current = setInterval(() => {
      currentIndex += STREAMING_CONFIG.chunkSize;

      if (currentIndex >= content.length) {
        // 动画完成
        setDisplayedContent(content);
        setIsStreaming(false);
        clearStreamingTimer();
      } else {
        setDisplayedContent(content.slice(0, currentIndex));
      }
    }, STREAMING_CONFIG.intervalMs);
  }, [clearStreamingTimer]);

  // 组件卸载时清理
  useEffect(() => {
    return () => clearStreamingTimer();
  }, [clearStreamingTimer]);

  // 监听 taskHistory 变化，自动切换到最新报告
  useEffect(() => {
    if (taskHistory.length === 0) {
      return;
    }

    // 获取最新任务
    const latestTask = taskHistory[taskHistory.length - 1];

    // 如果有报告且是新任务，则展示报告（带流式动画）
    if (latestTask.taskReport && latestTask.taskId !== lastProcessedTaskIdRef.current) {
      lastProcessedTaskIdRef.current = latestTask.taskId;
      setDisplayMode('report');
      setCurrentReport(latestTask.taskReport);
      startStreamingAnimation(latestTask.taskReport);
    }
  }, [taskHistory, startStreamingAnimation]);

  // 渲染内容
  const renderContent = () => {
    if (displayMode === 'report' && currentReport) {
      return (
        <XMarkdown
          streaming={{
            hasNextChunk: isStreaming,
            enableAnimation: true,
            animationConfig: {
              fadeDuration: STREAMING_CONFIG.fadeDuration,
              easing: STREAMING_CONFIG.easing,
            },
          }}
        >
          {displayedContent}
        </XMarkdown>
      );
    }

    return <XMarkdown>{DEFAULT_CONTENT}</XMarkdown>;
  };

  // 渲染标题
  const getTitle = () => {
    if (displayMode === 'report') {
      return (
        <Space>
          <FileTextOutlined />
          任务成果报告
        </Space>
      );
    }
    return '项目说明';
  };

  // 额外操作按钮
  const renderExtra = () => (
    <Space>
      {displayMode === 'report' && (
        <Button
          size="small"
          icon={<HomeOutlined />}
          onClick={() => {
            clearStreamingTimer();
            setIsStreaming(false);
            setDisplayMode('default');
            setCurrentReport(null);
            setDisplayedContent('');
          }}
        >
          返回说明
        </Button>
      )}
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
  );

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px' } }}
      title={getTitle()}
      extra={renderExtra()}
    >
      {renderContent()}
    </Card>
  );
};
