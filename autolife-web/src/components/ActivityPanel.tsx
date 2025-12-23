/**
 * 饮食看板主容器
 */
import React from 'react';
import { Card, Button, Space } from 'antd';
import { MobileOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore.js';
import { NutritionOverview, MealCard, RecommendationCard } from './DietComponents.js';
import type { Meal, DailyNutrition } from './DietComponents.js';

export const ActivityPanel: React.FC = () => {
  const {
    scrcpyPanelVisible,
    setScrcpyPanelVisible,
    chatPanelVisible,
    setChatPanelVisible,
  } = useAppStore();

  // Mock Data
  const dailyNutrition: DailyNutrition = {
    protein: { current: 95, total: 120, color: '#a855f7' }, // Purple
    carbs: { current: 147, total: 200, color: '#f59e0b' }, // Orange
    fats: { current: 38, total: 60, color: '#3b82f6' }, // Blue
  };

  const meals: Meal[] = [
    {
      id: '1',
      name: '希腊酸奶水果杯',
      time: '08:30',
      calories: 220,
      protein: 12,
      carbs: 35,
      fats: 5,
      restaurant: '轻食小站',
      status: 'completed',
    }
  ];

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px', background: '#f5f7fa' } }}
      title="健康饮食管家"
      extra={
        <Space>
          {!scrcpyPanelVisible && (
            <Button
              type="default"
              onClick={() => setScrcpyPanelVisible(true)}
              style={{
                borderRadius: 20,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <MobileOutlined style={{ marginRight: 4 }} />
              投屏
            </Button>
          )}
          {!chatPanelVisible && (
            <Button
              type="primary"
              onClick={() => setChatPanelVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 20,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <span style={{ marginRight: 4 }}>✨</span>
              AI Copilot
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <NutritionOverview nutrition={dailyNutrition} />

        {meals.map(meal => (
          <MealCard key={meal.id} meal={meal} />
        ))}

        <RecommendationCard />
      </div>
    </Card>
  );
};
