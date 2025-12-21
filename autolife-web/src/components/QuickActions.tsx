/**
 * 快捷问题列表组件
 */
import React from 'react';
import { Space, Button, Typography } from 'antd';
import {
  ShoppingOutlined,
  CoffeeOutlined,
  CalendarOutlined,
  MailOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// 快捷问题配置
const QUICK_QUESTIONS = [
  {
    icon: <ShoppingOutlined />,
    text: '帮我点外卖',
    emoji: '🍔',
  },
  {
    icon: <CoffeeOutlined />,
    text: '订一杯咖啡',
    emoji: '☕',
  },
  {
    icon: <CalendarOutlined />,
    text: '查看今日日程',
    emoji: '📅',
  },
  {
    icon: <MailOutlined />,
    text: '发送工作邮件',
    emoji: '✉️',
  },
  {
    icon: <CustomerServiceOutlined />,
    text: '打开音乐',
    emoji: '🎵',
  },
];

interface QuickActionsProps {
  onSelect: (question: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelect }) => {
  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong style={{ fontSize: '14px', color: '#666' }}>
        💡 快捷问题
      </Text>
      {QUICK_QUESTIONS.map((q, idx) => (
        <Button
          key={idx}
          size="middle"
          block
          style={{
            textAlign: 'left',
            height: 'auto',
            padding: '8px 12px',
          }}
          onClick={() => onSelect(q.text)}
        >
          <span style={{ marginRight: 8 }}>{q.emoji}</span>
          {q.text}
        </Button>
      ))}
    </Space>
  );
};
