/**
 * 对话面板
 * 合并对话历史和语音控制功能
 */
import React, { useRef, useEffect, useState } from 'react';
import { Card, Empty, Space, Radio, Button, Divider } from 'antd';
import { Conversations, Bubble, Welcome, Sender } from '@ant-design/x';
import type { ConversationsProps } from '@ant-design/x';
import {
  UserOutlined,
  RobotOutlined,
  AudioOutlined,
  StopOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useVoiceStore } from '../store/voiceStore.js';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { apiService } from '../services/api.js';
import { mockTaskExecution, mockTaskError, clearMockTask } from '../utils/mockSSE.js';
import type { Message } from '../types/index.js';

export const ChatPanel: React.FC = () => {
  const {
    messages,
    interactionMode,
    setInteractionMode,
    addMessage,
    clearMessages,
  } = useVoiceStore();

  const [textInput, setTextInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { state, startRecording, stopRecording } = useAudioRecorder();

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
      const taskId = apiService.sendTextCommandStream(text);
      console.log('Task started:', taskId);

      // 4. 后续消息会通过 SSE 自动更新到 voiceStore.currentTask
      // StepsPanel 会自动监听 currentTask 的变化并更新 UI

    } catch (error) {
      console.error('Failed to send text:', error);
      addMessage({
        role: 'assistant',
        content: '抱歉，发送失败，请重试',
      });
    }
  };

  // 处理录音
  const handleRecording = async () => {
    if (state.isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        addMessage({
          role: 'user',
          content: '🎤 语音输入中...',
          isTyping: true,
        });

        try {
          const response = await apiService.sendSingleVoice(audioBlob);
          if (response.success && response.data) {
            addMessage({
              role: 'user',
              content: response.data.asrResult?.text || '语音识别失败',
              confidence: response.data.asrResult?.confidence,
            });
            addMessage({
              role: 'assistant',
              content: response.data.text,
            });
          }
        } catch (error: any) {
          addMessage({
            role: 'assistant',
            content: `抱歉，语音交互失败：${error.message}`,
          });
        }
      }
    } else {
      await startRecording();
    }
  };

  // 转换消息格式
  const conversationItems: ConversationsProps['items'] = messages.map((msg) => ({
    key: msg.id,
    label: msg.role === 'user' ? '我' : 'AutoLife',
  }));

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
        {messages.length === 0 ? (
          <Welcome
            variant="borderless"
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
            title="AutoLife 语音助手"
            description="通过文本或语音控制手机设备"
          />
        ) : (
          <Conversations
            items={conversationItems}
            renderItem={(item) => {
              const message = messages.find((m) => m.id === item.key);
              if (!message) return null;

              const isUser = message.role === 'user';

              return (
                <div
                  key={item.key}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Bubble
                    avatar={{
                      icon: isUser ? <UserOutlined /> : <RobotOutlined />,
                      style: {
                        background: isUser ? '#1890ff' : '#52c41a',
                      },
                    }}
                    placement={isUser ? 'end' : 'start'}
                    content={
                      <div>
                        {message.content}
                        {message.confidence !== undefined && (
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#999',
                              marginTop: '4px',
                            }}
                          >
                            置信度: {(message.confidence * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    }
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
            }}
          />
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* 控制区域 */}
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        {/* 模式选择 */}
        <Radio.Group
          value={interactionMode}
          onChange={(e) => setInteractionMode(e.target.value)}
          size="small"
        >
          <Radio.Button value="text">文本</Radio.Button>
          <Radio.Button value="single">语音</Radio.Button>
        </Radio.Group>

        {/* 输入区 */}
        {interactionMode === 'text' ? (
          <>
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
          </>
        ) : (
          <Space style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={state.isRecording ? <StopOutlined /> : <AudioOutlined />}
              onClick={handleRecording}
              danger={state.isRecording}
              block
            >
              {state.isRecording ? '停止录音' : '开始录音'}
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={clearMessages}
              size="small"
            >
              清空
            </Button>
          </Space>
        )}
      </Space>
    </Card>
  );
};
