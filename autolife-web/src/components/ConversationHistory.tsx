/**
 * 对话历史记录组件（使用 Ant Design X Conversations）
 */
import React from 'react';
import { Popover, Empty } from 'antd';
import { Conversations } from '@ant-design/x';
import type { ConversationsProps } from '@ant-design/x';
import { DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore.js';

interface ConversationHistoryProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// 获取日期分组标签
const getDateGroup = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (date >= today) {
    return '今天';
  } else if (date >= yesterday) {
    return '昨天';
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  }
};

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  open,
  onClose,
  children,
}) => {
  const {
    conversations,
    currentConversation,
    loadConversation,
    deleteConversation,
  } = useAppStore();

  // 转换为 Conversations 组件需要的格式
  const items: ConversationsProps['items'] = conversations
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((conv) => ({
      key: conv.id,
      label: currentConversation?.id === conv.id
        ? `[current] ${conv.title}`
        : conv.title,
      group: getDateGroup(conv.updatedAt),
    }));

  // 处理选择对话
  const handleActiveChange: ConversationsProps['onActiveChange'] = (key) => {
    if (key) {
      loadConversation(key);
      onClose();
    }
  };

  // 菜单配置（删除选项）
  const menuConfig: ConversationsProps['menu'] = (conversation) => ({
    items: [
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    onClick: ({ key }) => {
      if (key === 'delete' && conversation.key) {
        deleteConversation(conversation.key);
      }
    },
  });

  const content = (
    <div style={{ width: 280, maxHeight: 400, overflow: 'auto' }}>
      {items.length === 0 ? (
        <Empty
          description="暂无对话记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '24px 0' }}
        />
      ) : (
        <Conversations
          items={items}
          activeKey={currentConversation?.id}
          onActiveChange={handleActiveChange}
          menu={menuConfig}
          groupable
          styles={{
            item: {
              padding: '8px 12px',
            },
          }}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
    >
      {children}
    </Popover>
  );
};
