/**
 * 活动卡片组件
 */
import React from 'react';
import { Card, Tag, Space, Typography } from 'antd';
import type { ActivityRecord, ActivityCategory } from '../types/index.js';

const { Text } = Typography;

// 分类图标
const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  food: '🍔',
  work: '💼',
  life: '🏠',
  social: '💬',
  other: '📌',
};

// 分类颜色
const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  food: 'orange',
  work: 'blue',
  life: 'green',
  social: 'purple',
  other: 'default',
};

// 分类名称
const CATEGORY_NAMES: Record<ActivityCategory, string> = {
  food: '饮食',
  work: '工作',
  life: '生活',
  social: '社交',
  other: '其他',
};

interface ActivityCardProps {
  activity: ActivityRecord;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  // 格式化耗时
  const formatDuration = (duration?: number) => {
    if (!duration) return null;

    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}秒`;

    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        borderLeft: `3px solid ${CATEGORY_COLORS[activity.category]}`,
      }}
    >
      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        {/* 分类标签 */}
        <Tag color={CATEGORY_COLORS[activity.category]} icon={<span>{CATEGORY_ICONS[activity.category]}</span>}>
          {CATEGORY_NAMES[activity.category]}
        </Tag>

        {/* 标题 */}
        <Text strong>{activity.title}</Text>

        {/* 描述 */}
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {activity.description}
        </Text>

        {/* 元信息 */}
        {(activity.duration || activity.metadata?.steps) && (
          <Space size="small">
            {activity.duration && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ⏱️ 耗时 {formatDuration(activity.duration)}
              </Text>
            )}
            {activity.metadata?.steps && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                📝 {activity.metadata.steps} 个步骤
              </Text>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
};
