/**
 * 待办事项组件
 */
import React from 'react';
import { List, Checkbox, Tag, Space, Button, Typography, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { TodoItem as TodoItemType, TodoPriority } from '../types/index.js';
import { useAppStore } from '../store/appStore.js';

const { Text } = Typography;

// 优先级颜色
const PRIORITY_COLORS: Record<TodoPriority, string> = {
  high: 'red',
  medium: 'orange',
  low: 'default',
};

// 优先级名称
const PRIORITY_NAMES: Record<TodoPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

interface TodoItemProps {
  todo: TodoItemType;
  onEdit: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onEdit }) => {
  const { toggleTodoStatus, deleteTodo } = useAppStore();

  // 处理切换完成状态
  const handleToggle = () => {
    toggleTodoStatus(todo.id);
  };

  // 处理删除
  const handleDelete = () => {
    deleteTodo(todo.id);
  };

  // 格式化截止时间
  const formatDueDate = (dueDate?: number) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now && todo.status !== 'completed';

    return (
      <Text
        type={isOverdue ? 'danger' : 'secondary'}
        style={{ fontSize: '12px' }}
      >
        <ClockCircleOutlined /> {date.toLocaleDateString('zh-CN')}
      </Text>
    );
  };

  return (
    <List.Item
      actions={[
        <Button
          key="edit"
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(todo.id)}
        />,
        <Popconfirm
          key="delete"
          title="确认删除"
          description="确定要删除这个待办事项吗？"
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
          />
        </Popconfirm>,
      ]}
    >
      <Space style={{ width: '100%' }} direction="vertical" size="small">
        <Space>
          <Checkbox
            checked={todo.status === 'completed'}
            onChange={handleToggle}
          />
          <Text
            style={{
              textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
              opacity: todo.status === 'completed' ? 0.6 : 1,
            }}
          >
            {todo.title}
          </Text>
          <Tag color={PRIORITY_COLORS[todo.priority]} style={{ fontSize: '12px' }}>
            {PRIORITY_NAMES[todo.priority]}优先级
          </Tag>
        </Space>

        {todo.description && (
          <Text
            type="secondary"
            style={{
              fontSize: '12px',
              marginLeft: 24,
              display: 'block',
            }}
          >
            {todo.description}
          </Text>
        )}

        {todo.dueDate && (
          <div style={{ marginLeft: 24 }}>
            {formatDueDate(todo.dueDate)}
          </div>
        )}
      </Space>
    </List.Item>
  );
};
