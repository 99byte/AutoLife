/**
 * 待办事项列表组件
 */
import React, { useState } from 'react';
import { List, Button, Space, Empty, Segmented } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TodoItem } from './TodoItem.js';
import { TodoForm } from './TodoForm.js';
import { useAppStore } from '../store/appStore.js';
import type { TodoStatus } from '../types/index.js';

export const TodoList: React.FC = () => {
  const { todoItems } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<TodoStatus | 'all'>('all');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  // 根据状态筛选待办事项
  let filteredTodos = todoItems;
  if (filterStatus !== 'all') {
    filteredTodos = todoItems.filter(todo => todo.status === filterStatus);
  }

  // 按创建时间倒序排列
  filteredTodos = [...filteredTodos].sort((a, b) => b.createdAt - a.createdAt);

  // 打开添加表单
  const handleAdd = () => {
    setEditingTodoId(null);
    setIsFormVisible(true);
  };

  // 打开编辑表单
  const handleEdit = (id: string) => {
    setEditingTodoId(id);
    setIsFormVisible(true);
  };

  // 关闭表单
  const handleFormClose = () => {
    setIsFormVisible(false);
    setEditingTodoId(null);
  };

  return (
    <div>
      {/* 头部：筛选 + 添加按钮 */}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Segmented
            options={[
              { label: '全部', value: 'all' },
              { label: '待办', value: 'pending' },
              { label: '进行中', value: 'in_progress' },
              { label: '已完成', value: 'completed' },
            ]}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as TodoStatus | 'all')}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>
        </Space>

        {/* 列表 */}
        {filteredTodos.length === 0 ? (
          <Empty
            description={
              filterStatus === 'all'
                ? '还没有待办事项'
                : `没有${filterStatus === 'pending' ? '待办' : filterStatus === 'in_progress' ? '进行中' : '已完成'}的事项`
            }
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={filteredTodos}
            renderItem={(todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={handleEdit}
              />
            )}
          />
        )}
      </Space>

      {/* 添加/编辑表单 */}
      <TodoForm
        visible={isFormVisible}
        todoId={editingTodoId}
        onClose={handleFormClose}
      />
    </div>
  );
};
