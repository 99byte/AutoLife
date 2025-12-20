/**
 * 对话面板组件
 * 使用 antd-x 展示对话历史
 */
import React, { useRef, useEffect } from 'react';
import { Card, Empty, Spin } from 'antd';
import { Conversations, Bubble, Welcome } from '@ant-design/x';
import type { ConversationsProps } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useVoiceStore } from '../store/voiceStore.js';
import type { Message } from '../types/index.js';

export const ConversationPanel: React.FC = () => {
  const { messages } = useVoiceStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 如果没有消息，显示欢迎界面
  if (messages.length === 0) {
    return (
      <Card
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Welcome
          variant="borderless"
          icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
          title="欢迎使用 AutoLife 语音助手"
          description="你可以通过文本输入或语音交互来控制手机设备"
        />
      </Card>
    );
  }

  // 转换消息格式为 antd-x 需要的格式
  const conversationItems: ConversationsProps['items'] = messages.map((msg) => ({
    key: msg.id,
    label: msg.role === 'user' ? '我' : 'AutoLife',
  }));

  return (
    <Card
      title="对话历史"
      style={{ height: '100%' }}
      styles={{
        body: { height: 'calc(100% - 57px)', overflow: 'hidden' }
      }}
    >
      <div
        ref={scrollRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
      >
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
      </div>
    </Card>
  );
};
