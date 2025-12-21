/**
 * 今日活动时间轴
 */
import React from 'react';
import { Timeline, Empty, Typography } from 'antd';
import { ActivityCard } from './ActivityCard.js';
import { CategoryFilter } from './CategoryFilter.js';
import { useAppStore } from '../store/appStore.js';

const { Text } = Typography;

export const ActivityTimeline: React.FC = () => {
  const { getTodayActivities, activityFilter } = useAppStore();

  // 获取今日活动
  let activities = getTodayActivities();

  // 根据筛选条件过滤
  if (activityFilter !== 'all') {
    activities = activities.filter(activity => activity.category === activityFilter);
  }

  // 按时间倒序排列（最新的在前）
  activities.sort((a, b) => b.timestamp - a.timestamp);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* 分类筛选器 */}
      <CategoryFilter />

      {/* 空状态 */}
      {activities.length === 0 && (
        <Empty
          description={
            activityFilter === 'all'
              ? '今天还没有任何活动记录'
              : `今天还没有${activityFilter}类型的活动`
          }
          style={{ marginTop: 40 }}
        />
      )}

      {/* 时间轴 */}
      {activities.length > 0 && (
        <Timeline
          mode="left"
          style={{ marginTop: 24 }}
          items={activities.map((activity) => ({
            key: activity.id,
            label: (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatTime(activity.timestamp)}
              </Text>
            ),
            children: <ActivityCard activity={activity} />,
          }))}
        />
      )}
    </div>
  );
};
