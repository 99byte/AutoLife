/**
 * 对话面板组件
 * 使用 antd-x 展示对话历史
 */
import React, { useRef, useEffect } from 'react';
import { Card } from 'antd';
import { Bubble, Welcome } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore.js';

export const ConversationPanel: React.FC = () => {
  const { messages } = useAppStore();
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
          title="欢迎使用 AutoLife 助手"
          description="你可以通过文本输入来控制手机设备"
        />
      </Card>
    );
  }

  // 渲染消息列表
  const renderMessages = () => {
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
            content={
              <div>
                {message.content}
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
    });
  };

  // 转换消息格式为 antd-x 需要的格式
  // const conversationItems: ConversationsProps['items'] = messages.map((msg) => ({
  //   key: msg.id,
  //   label: msg.role === 'user' ? '我' : 'AutoLife',
  // }));

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
        {renderMessages()}
      </div>
    </Card>
  );
};
