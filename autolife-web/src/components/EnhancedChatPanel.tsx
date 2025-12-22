/**
 * 增强对话面板（集成快捷问题和步骤信息）
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Card, Button, Space, Tooltip } from 'antd';
import { Bubble, Welcome, Sender, ThoughtChain } from '@ant-design/x';
import type { ThoughtChainItemType } from '@ant-design/x';
import {
  UserOutlined,
  RobotOutlined,
  PlusOutlined,
  MessageOutlined,
  CloseOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { QuickActions } from './QuickActions.js';
import { ConversationHistory } from './ConversationHistory.js';
import { useAppStore } from '../store/appStore.js';
import { apiService } from '../services/api.js';
import { sseService } from '../services/sse.js';
import type { ExecutionStep } from '../types/index.js';

// 将步骤转换为 ThoughtChain items 的辅助函数
const stepsToThoughtChainItems = (steps: ExecutionStep[]): ThoughtChainItemType[] => {
  return steps.map((step) => {
    let status: 'loading' | 'success' | 'error' = 'loading';
    let icon = <LoadingOutlined />;

    if (step.status === 'completed') {
      status = 'success';
      icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else if (step.status === 'error') {
      status = 'error';
      icon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }

    let actionText = '';
    if (step.action) {
      const actionDesc = step.action.description || '';
      actionText = actionDesc || `${step.action.action}`;
    }

    return {
      key: `step-${step.stepNumber}`,
      icon,
      title: `步骤 ${step.stepNumber}: ${actionText || '处理中...'}`,
      description: step.thinking
        ? step.thinking.length > 150
          ? step.thinking.substring(0, 150) + '...'
          : step.thinking
        : undefined,
      status,
      content: step.result ? (
        <div style={{ color: '#52c41a', fontSize: '12px' }}>
          ✓ {step.result}
        </div>
      ) : undefined,
      collapsible: true,
    };
  });
};

export const EnhancedChatPanel: React.FC = () => {
  const {
    messages,
    addMessage,
    currentTask,
    currentConversation,
    createConversation,
    setChatPanelVisible,
    clearCurrentTask,
    isTaskRunning,  // 添加任务运行状态
  } = useAppStore();

  const [textInput, setTextInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTask]);

  // 发送文本指令
  const handleSendText = async (text?: string) => {
    const messageText = text || textInput;
    if (!messageText.trim()) return;

    // 如果没有当前对话，先创建一个
    if (!currentConversation) {
      createConversation();
    }

    // 1. 添加用户消息
    addMessage({
      role: 'user',
      content: messageText,
    });

    // 2. 清空输入
    setTextInput('');

    try {
      // 3. 启动 SSE 流式接收
      const taskId = apiService.runTaskStream(messageText);
      console.log('Task started:', taskId);

      // 4. 后续步骤会通过 SSE 自动更新到 appStore.currentTask
      // 任务完成后会自动创建活动记录
    } catch (error) {
      console.error('Failed to send text:', error);
      addMessage({
        role: 'assistant',
        content: '抱歉，发送失败，请重试',
      });
    }
  };

  // 处理快捷问题点击
  const handleQuickQuestion = (question: string) => {
    handleSendText(question);
  };

  // 处理新建对话
  const handleNewConversation = () => {
    createConversation();
    clearCurrentTask();  // 清空当前任务
  };

  // 处理关闭面板
  const handleClosePanel = () => {
    setChatPanelVisible(false);
  };

  // 处理取消任务
  const handleCancelTask = () => {
    sseService.cancel();
    addMessage({
      role: 'assistant',
      content: '任务已取消',
    });
  };

  // 转换消息为 Bubble 组件
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <>
          <Welcome
            variant="borderless"
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
            title="AutoLife 助手"
            description="您的智能生活助手，帮您完成日常任务"
          />
          <div style={{ marginTop: 16 }}>
            <QuickActions onSelect={handleQuickQuestion} />
          </div>
        </>
      );
    }

    return messages.map((message) => {
      const isUser = message.role === 'user';

      // 如果消息包含思维链，渲染带思维���的消息
      if (!isUser && message.steps && message.steps.length > 0) {
        const chainItems = stepsToThoughtChainItems(message.steps);
        return (
          <div key={message.id} style={{ marginBottom: '16px' }}>
            {/* 思维链卡片 */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: '8px',
                padding: '12px 16px',
                border: '1px solid #f0f0f0',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <RocketOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                <span style={{ fontWeight: 500, flex: 1 }}>执行过程</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#52c41a' }}>
                  <CheckCircleOutlined />
                  已完成
                </span>
              </div>
              <ThoughtChain
                items={chainItems}
                line="dashed"
                styles={{
                  item: { marginBottom: 8 },
                  itemContent: { fontSize: 12 },
                }}
              />
            </div>
            {/* 结果消息 */}
            <Bubble
              avatar={
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#52c41a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RobotOutlined />
                </div>
              }
              placement="start"
              content={message.content}
              styles={{ content: { background: '#f6ffed' } }}
            />
          </div>
        );
      }

      // 普通消息
      return (
        <div
          key={message.id}
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <Bubble
            avatar={
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isUser ? '#1890ff' : '#52c41a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isUser ? <UserOutlined /> : <RobotOutlined />}
              </div>
            }
            placement={isUser ? 'end' : 'start'}
            content={message.content}
            styles={{
              content: {
                background: isUser ? '#e6f7ff' : '#f6ffed',
              },
            }}
            typing={message.isTyping}
            loading={message.isTyping}
          />
        </div>
      );
    });
  };

  // 将执行步骤转换为 ThoughtChain items
  const thoughtChainItems = useMemo((): ThoughtChainItemType[] => {
    if (!currentTask || currentTask.steps.length === 0) return [];

    return currentTask.steps.map((step) => {
      // 根据步骤状态确定 ThoughtChain 状态
      let status: 'loading' | 'success' | 'error' = 'loading';
      let icon = <LoadingOutlined />;

      if (step.status === 'completed') {
        status = 'success';
        icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      } else if (step.status === 'error') {
        status = 'error';
        icon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      }

      // 构建动作描述
      let actionText = '';
      if (step.action) {
        const actionType = step.action.action || 'Unknown';
        const actionDesc = step.action.description || '';
        actionText = actionDesc || `${actionType}`;
      }

      return {
        key: `step-${step.stepNumber}`,
        icon,
        title: `步骤 ${step.stepNumber}: ${actionText || '处理中...'}`,
        description: step.thinking
          ? step.thinking.length > 150
            ? step.thinking.substring(0, 150) + '...'
            : step.thinking
          : undefined,
        status,
        content: step.result ? (
          <div style={{ color: '#52c41a', fontSize: '12px' }}>
            ✓ {step.result}
          </div>
        ) : undefined,
        collapsible: true,  // 设置为可折叠
      };
    });
  }, [currentTask]);

  // 渲染当前任务步骤（使用 ThoughtChain 组件）
  const renderCurrentTask = () => {
    // 只有当任务存在且有步骤时才显示
    if (!currentTask || currentTask.steps.length === 0) return null;

    // 确定整体状态图标
    let statusIcon = <LoadingOutlined style={{ color: '#1890ff' }} />;
    let statusText = '正在执行';

    if (currentTask.status === 'completed') {
      statusIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      statusText = '执行完成';
    } else if (currentTask.status === 'error') {
      statusIcon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      statusText = '执行失败';
    }

    return (
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div
          style={{
            background: '#fafafa',
            borderRadius: '8px',
            padding: '12px 16px',
            border: '1px solid #f0f0f0',
          }}
        >
          {/* 任务标题 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <RocketOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            <span style={{ fontWeight: 500, flex: 1 }}>{currentTask.task}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
              {statusIcon}
              {statusText}
            </span>
          </div>

          {/* 思维链 */}
          <ThoughtChain
            items={thoughtChainItems}
            line="dashed"
            styles={{
              item: {
                marginBottom: 8,
              },
              itemContent: {
                fontSize: 12,
              },
            }}
          />
        </div>
      </div>
    );
  };

  // 渲染头部三个按钮
  const renderHeaderExtra = () => (
    <Space size="small">
      <Tooltip title="新对话">
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleNewConversation}
        />
      </Tooltip>
      <ConversationHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        <Tooltip title="对话历史">
          <Button
            type="text"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => setHistoryOpen(true)}
          />
        </Tooltip>
      </ConversationHistory>
      <Tooltip title="关闭">
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={handleClosePanel}
        />
      </Tooltip>
    </Space>
  );

  return (
    <Card
      title={
        <span>
          <span style={{ marginRight: 4 }}>✨</span>
          AI 助手
        </span>
      }
      extra={renderHeaderExtra()}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{
        body: {
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* 对话历史 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px',
        }}
      >
        {renderMessages()}
        {renderCurrentTask()}
      </div>

      {/* 输入区 */}
      <Sender
        placeholder="输入指令，如：帮我点外卖"
        value={textInput}
        onChange={setTextInput}
        onSubmit={() => handleSendText()}
        loading={isTaskRunning}
        onCancel={handleCancelTask}
      />
    </Card>
  );
};
