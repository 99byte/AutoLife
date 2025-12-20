/**
 * 操作步骤展示面板
 * 显示 AutoGLM 的思考过程和执行动作
 */
import React from 'react';
import { Card, Empty, Collapse, Tag, Badge, Image } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  AimOutlined,
  EditOutlined,
  SwapOutlined,
  RollbackOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  ArrowsAltOutlined,
  PushpinOutlined,
  DoubleRightOutlined,
  CompressOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useVoiceStore } from '../store/voiceStore.js';
import type { ExecutionStep, ActionType } from '../types/index.js';

// 动作类型图标映射
const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  Launch: <RocketOutlined />,
  Tap: <AimOutlined />,
  Type: <EditOutlined />,
  Swipe: <SwapOutlined />,
  Back: <RollbackOutlined />,
  Home: <HomeOutlined />,
  Wait: <ClockCircleOutlined />,
  Scroll: <ArrowsAltOutlined />,
  LongPress: <PushpinOutlined />,
  DoubleTap: <DoubleRightOutlined />,
  Pinch: <CompressOutlined />,
  Screenshot: <CameraOutlined />,
  Unknown: <ThunderboltOutlined />,
};

// 动作类型颜色
const ACTION_COLORS: Record<ActionType, string> = {
  Launch: 'green',
  Tap: 'blue',
  Type: 'purple',
  Swipe: 'orange',
  Back: 'red',
  Home: 'cyan',
  Wait: 'default',
  Scroll: 'geekblue',
  LongPress: 'magenta',
  DoubleTap: 'lime',
  Pinch: 'gold',
  Screenshot: 'volcano',
  Unknown: 'default',
};

export const StepsPanel: React.FC = () => {
  const { currentTask } = useVoiceStore();

  // 空状态
  if (!currentTask) {
    return (
      <Card
        title="操作步骤"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        }}
      >
        <Empty
          image={<ThunderboltOutlined style={{ fontSize: '64px', color: '#999' }} />}
          description="等待任务执行..."
        />
      </Card>
    );
  }

  const { task, status, steps, finalMessage, errorMessage } = currentTask;
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;

  // 生成 Collapse 面板项
  const collapseItems = steps.map((step) => {
    const { stepNumber, thinking, action, status, result, screenshot, duration } = step;

    // 步骤标题
    const header = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 状态图标 */}
        {status === 'completed' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        {status === 'running' && <LoadingOutlined style={{ color: '#1890ff' }} />}
        {status === 'error' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        {status === 'pending' && <ClockCircleOutlined style={{ color: '#d9d9d9' }} />}

        {/* 步骤编号 */}
        <strong>步骤 {stepNumber}</strong>

        {/* 动作标签 */}
        {action && (
          <Tag
            icon={ACTION_ICONS[action.action]}
            color={ACTION_COLORS[action.action]}
          >
            {action.action}
          </Tag>
        )}

        {/* 耗时 */}
        {duration && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
            {duration}ms
          </span>
        )}
      </div>
    );

    // 步骤内容
    const content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 思考过程 */}
        {thinking && (
          <div>
            <strong>💭 思考过程：</strong>
            <pre style={{
              background: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              marginTop: '4px',
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
            }}>
              {thinking}
            </pre>
          </div>
        )}

        {/* 执行动作 */}
        {action && (
          <div>
            <strong>🎯 执行动作：</strong>
            <div style={{ marginTop: '4px' }}>
              {action.description}
              {action.target && <div style={{ fontSize: '12px', color: '#999' }}>目标: {action.target}</div>}
              {action.text && <div style={{ fontSize: '12px', color: '#999' }}>输入: {action.text}</div>}
              {action.app && <div style={{ fontSize: '12px', color: '#999' }}>应用: {action.app}</div>}
            </div>
          </div>
        )}

        {/* 执行结果 */}
        {result && (
          <div>
            <strong>✅ 执行结果：</strong>
            <div style={{ marginTop: '4px', color: '#52c41a' }}>{result}</div>
          </div>
        )}

        {/* 截图 */}
        {screenshot && (
          <div>
            <strong>📸 截图：</strong>
            <div style={{ marginTop: '4px' }}>
              <Image
                src={`data:image/jpeg;base64,${screenshot}`}
                alt={`步骤 ${stepNumber} 截图`}
                style={{ maxWidth: '100%', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}
      </div>
    );

    return {
      key: stepNumber,
      label: header,
      children: content,
    };
  });

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>操作步骤</span>
          {status === 'running' && <Badge status="processing" text="执行中" />}
          {status === 'completed' && <Badge status="success" text="已完成" />}
          {status === 'error' && <Badge status="error" text="执行失败" />}
        </div>
      }
      extra={
        status === 'running' ? (
          <span style={{ fontSize: '12px', color: '#999' }}>
            进度: {completedSteps}/{totalSteps}
          </span>
        ) : null
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{
        body: { flex: 1, overflowY: 'auto', padding: '16px' }
      }}
    >
      {/* 任务描述 */}
      <div style={{
        background: '#f0f2f5',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <strong>📋 任务：</strong> {task}
      </div>

      {/* 步骤列表 */}
      <Collapse
        items={collapseItems}
        defaultActiveKey={[steps.length]} // 默认展开最新步骤
        style={{ marginBottom: '16px' }}
      />

      {/* 最终消息 */}
      {finalMessage && (
        <div style={{
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          padding: '12px',
          borderRadius: '8px',
          color: '#52c41a',
        }}>
          <strong>✅ 任务完成：</strong> {finalMessage}
        </div>
      )}

      {/* 错误消息 */}
      {errorMessage && (
        <div style={{
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          padding: '12px',
          borderRadius: '8px',
          color: '#ff4d4f',
        }}>
          <strong>❌ 执行失败：</strong> {errorMessage}
        </div>
      )}
    </Card>
  );
};
