/**
 * 增强对话面板（集成快捷问题和步骤信息）
 */
import React, { useRef, useEffect, useState } from 'react';
import { Card, Divider } from 'antd';
import { Bubble, Welcome, Sender } from '@ant-design/x';
import {
  UserOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { QuickActions } from './QuickActions.js';
import { useAppStore } from '../store/appStore.js';
import { apiService } from '../services/api.js';

export const EnhancedChatPanel: React.FC = () => {
  const {
    messages,
    addMessage,
    currentTask,
  } = useAppStore();

  const [textInput, setTextInput] = useState('');
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

  // 渲染当前任务步骤（可选：如果要在对话中显示步骤）
  const renderCurrentTask = () => {
    if (!currentTask || currentTask.steps.length === 0) return null;

    return (
      <div style={{ marginTop: 16, marginBottom: 16 }}>
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
          content={
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                正在执行：{currentTask.task}
              </div>
              {currentTask.steps.map((step, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {step.status === 'completed' ? '✅' : '⏳'} 步骤 {step.stepNumber}:{' '}
                  {step.action?.description || step.thinking || '处理中...'}
                </div>
              ))}
            </div>
          }
          styles={{
            content: {
              background: '#fffbe6',
            },
          }}
          loading={currentTask.status === 'running'}
        />
      </div>
    );
  };

  return (
    <Card
      title="AI 对话"
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

      <Divider style={{ margin: '8px 0' }} />

      {/* 输入区 */}
      <Sender
        placeholder="输入指令，如：帮我点外卖"
        value={textInput}
        onChange={setTextInput}
        onSubmit={() => handleSendText()}
      />
    </Card>
  );
};
