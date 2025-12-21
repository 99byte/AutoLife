/**
 * 待办事项表单组件
 */
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import type { TodoPriority, TodoStatus } from '../types/index.js';
import { useAppStore } from '../store/appStore.js';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface TodoFormProps {
  visible: boolean;
  todoId: string | null;
  onClose: () => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({ visible, todoId, onClose }) => {
  const [form] = Form.useForm();
  const { todoItems, addTodo, updateTodo } = useAppStore();

  // 是否是编辑模式
  const isEdit = todoId !== null;

  // 当打开表单时，如果是编辑模式，填充表单数据
  useEffect(() => {
    if (visible && isEdit) {
      const todo = todoItems.find(t => t.id === todoId);
      if (todo) {
        form.setFieldsValue({
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          status: todo.status,
          dueDate: todo.dueDate ? dayjs(todo.dueDate) : null,
        });
      }
    } else if (visible) {
      // 新建模式，重置表单
      form.resetFields();
      form.setFieldsValue({
        priority: 'medium',
        status: 'pending',
      });
    }
  }, [visible, isEdit, todoId, todoItems, form]);

  // 处理提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const todoData = {
        title: values.title,
        description: values.description,
        priority: values.priority as TodoPriority,
        status: values.status as TodoStatus,
        dueDate: values.dueDate ? values.dueDate.valueOf() : undefined,
      };

      if (isEdit) {
        updateTodo(todoId!, todoData);
      } else {
        addTodo(todoData);
      }

      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑待办事项' : '添加待办事项'}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="确定"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入待办事项标题' }]}
        >
          <Input placeholder="例如：写周报" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea
            rows={3}
            placeholder="详细描述（可选）"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="优先级"
          initialValue="medium"
        >
          <Select>
            <Select.Option value="low">低优先级</Select.Option>
            <Select.Option value="medium">中优先级</Select.Option>
            <Select.Option value="high">高优先级</Select.Option>
          </Select>
        </Form.Item>

        {isEdit && (
          <Form.Item
            name="status"
            label="状态"
          >
            <Select>
              <Select.Option value="pending">待办</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="dueDate"
          label="截止时间"
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="选择截止时间（可选）"
            showTime
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
