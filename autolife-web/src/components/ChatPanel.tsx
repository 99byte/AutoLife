/**
 * 对话面板
 */
import React, { useRef, useEffect, useState } from 'react';
import { Card, Space, Button, Divider } from 'antd';
import { Bubble, Welcome, Sender } from '@ant-design/x';
import {
  UserOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore.js';
import { apiService } from '../services/api.js';
import { mockTaskExecution, mockTaskError, clearMockTask } from '../utils/mockSSE.js';

export const ChatPanel: React.FC = () => {
  const {
    messages,
    addMessage,
  } = useAppStore();

  const [textInput, setTextInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送文本指令
  const handleSendText = async () => {
    if (!textInput.trim()) return;

    const text = textInput;

    // 1. 添加用户消息
    addMessage({
      role: 'user',
      content: text,
    });

    // 2. 清空输入
    setTextInput('');

    try {
      // 3. 启动 SSE 流式接收
      const taskId = apiService.runTaskStream(text);
      console.log('Task started:', taskId);

      // 4. 后续消息会通过 SSE 自动更新到 appStore.currentTask
      // StepsPanel 会自动监听 currentTask 的变化并更新 UI

    } catch (error) {
      console.error('Failed to send text:', error);
      addMessage({
        role: 'assistant',
        content: '抱歉，发送失败，请重试',
      });
    }
  };

  // 转换消息为 Bubble 组件
  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <Welcome
          variant="borderless"
          icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
          title="AutoLife 助手"
          description="通过文本指令控制手机设备"
        />
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
            avatar={<div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isUser ? '#1890ff' : '#52c41a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isUser ? <UserOutlined /> : <RobotOutlined />}
            </div>}
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

  return (
    <Card
      title="对话"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{
        body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
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
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 控制区域 */}
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        {/* 输入区 */}
        <Sender
          placeholder="输入指令，如：打开微信"
          value={textInput}
          onChange={setTextInput}
          onSubmit={handleSendText}
        />
        {/* Mock 测试按钮 */}
        <Divider style={{ margin: '8px 0', fontSize: '12px' }}>Mock 测试</Divider>
        <Space style={{ width: '100%' }} size="small">
          <Button
            size="small"
            onClick={() => {
              const taskId = `mock_${Date.now()}`;
              mockTaskExecution(taskId, '测试任务：给张三发微信');
              addMessage({
                role: 'assistant',
                content: '🧪 Mock 测试：模拟任务执行（5个步骤，耗时10秒）',
              });
            }}
          >
            测试成功
          </Button>
          <Button
            size="small"
            onClick={() => {
              const taskId = `mock_${Date.now()}`;
              mockTaskError(taskId, '测试任务：打开不存在的应用');
              addMessage({
                role: 'assistant',
                content: '🧪 Mock 测试：模拟任务失败',
              });
            }}
          >
            测试失败
          </Button>
          <Button
            size="small"
            onClick={() => {
              clearMockTask();
              addMessage({
                role: 'assistant',
                content: '🧪 已清空当前任务',
              });
            }}
          >
            清空任务
          </Button>
        </Space>
      </Space>
    </Card>
  );
};
