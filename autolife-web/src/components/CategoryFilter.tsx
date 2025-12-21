/**
 * 分类筛选器组件
 */
import React from 'react';
import { Segmented } from 'antd';
import type { ActivityCategory } from '../types/index.js';
import { useAppStore } from '../store/appStore.js';

// 筛选选项
const FILTER_OPTIONS = [
  { label: '🌟 全部', value: 'all' },
  { label: '🍔 饮食', value: 'food' },
  { label: '💼 工作', value: 'work' },
  { label: '🏠 生活', value: 'life' },
  { label: '💬 社交', value: 'social' },
  { label: '📌 其他', value: 'other' },
];

export const CategoryFilter: React.FC = () => {
  const { activityFilter, setActivityFilter } = useAppStore();

  const handleChange = (value: string | number) => {
    setActivityFilter(value as ActivityCategory | 'all');
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Segmented
        options={FILTER_OPTIONS}
        value={activityFilter}
        onChange={handleChange}
        block
        style={{ marginTop: 8 }}
      />
    </div>
  );
};
