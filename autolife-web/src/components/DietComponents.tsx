import React from 'react';
import { Card, Progress, Space, Typography, Badge, Button, Row, Col, Avatar } from 'antd';
import { RocketOutlined, SyncOutlined, CheckCircleFilled, SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// --- Types ---
export interface Meal {
    id: string;
    name: string;
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    restaurant: string;
    status: 'completed' | 'pending' | 'recommending';
    imageUrl?: string; // Optional image
}

export interface DailyNutrition {
    protein: { current: number; total: number; color: string };
    carbs: { current: number; total: number; color: string };
    fats: { current: number; total: number; color: string };
}

// --- Components ---

/**
 * 营养元素进度条组件
 */
export const NutritionOverview: React.FC<{ nutrition: DailyNutrition }> = ({ nutrition }) => {
    return (
        <Card
            bordered={false}
            className="glass-card"
            style={{ marginBottom: 16 }}
            styles={{ body: { padding: '12px 16px' } }}
        >
            <Title level={5} style={{ marginBottom: 16, marginTop: 0 }}>营养元素</Title>

            {/* 蛋白质 */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>蛋白质</Text>
                    <Text>
                        <Text strong>{nutrition.protein.current}</Text>
                        <Text type="secondary">/{nutrition.protein.total}g</Text>
                    </Text>
                </div>
                <Progress
                    percent={(nutrition.protein.current / nutrition.protein.total) * 100}
                    showInfo={false}
                    strokeColor={nutrition.protein.color}
                    trailColor="#f0f0f0"
                    size="small"
                />
            </div>

            {/* 碳水化合物 */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>碳水化合物</Text>
                    <Text>
                        <Text strong>{nutrition.carbs.current}</Text>
                        <Text type="secondary">/{nutrition.carbs.total}g</Text>
                    </Text>
                </div>
                <Progress
                    percent={(nutrition.carbs.current / nutrition.carbs.total) * 100}
                    showInfo={false}
                    strokeColor={nutrition.carbs.color}
                    trailColor="#f0f0f0"
                    size="small"
                />
            </div>

            {/* 脂肪 */}
            <div style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>脂肪</Text>
                    <Text>
                        <Text strong>{nutrition.fats.current}</Text>
                        <Text type="secondary">/{nutrition.fats.total}g</Text>
                    </Text>
                </div>
                <Progress
                    percent={(nutrition.fats.current / nutrition.fats.total) * 100}
                    showInfo={false}
                    strokeColor={nutrition.fats.color}
                    trailColor="#f0f0f0"
                    size="small"
                />
            </div>
        </Card>
    );
};

/**
 * 膳食卡片组件
 */
const MacroBadge: React.FC<{ label: string; value: string | number; color: string; bgColor: string }> = ({ label, value, color, bgColor }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        borderRadius: 8,
        padding: '4px 12px',
        flex: 1
    }}>
        <Text strong style={{ color: color, fontSize: 14 }}>{value}</Text>
        <Text style={{ color: color, fontSize: 10 }}>{label}</Text>
    </div>
);

export const MealCard: React.FC<{ meal: Meal }> = ({ meal }) => {
    return (
        <Card bordered={false} className="glass-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>{meal.time}</Text>
                    <Badge color={meal.status === 'completed' ? '#52c41a' : '#1890ff'} />
                    <Text style={{ fontSize: 12, color: meal.status === 'completed' ? '#52c41a' : '#1890ff' }}>
                        {meal.status === 'completed' ? '已完成' : '推荐中'}
                    </Text>
                </Space>

                <div>
                    <Text strong style={{ fontSize: 20 }}>{meal.calories}</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 2 }}>千卡</Text>
                </div>
            </div>

            <Title level={4} style={{ margin: '0 0 4px 0' }}>{meal.name}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{meal.restaurant}</Text>

            <div style={{ display: 'flex', gap: 8 }}>
                <MacroBadge label="蛋白质" value={`${meal.protein}g`} color="#722ed1" bgColor="#f9f0ff" />
                <MacroBadge label="碳水" value={`${meal.carbs}g`} color="#fa8c16" bgColor="#fff7e6" />
                <MacroBadge label="脂肪" value={`${meal.fats}g`} color="#1890ff" bgColor="#e6f7ff" />
            </div>
        </Card>
    );
};

/**
 * AI 推荐状态组件
 */
export const RecommendationCard: React.FC = () => {
    return (
        <Card
            bordered={false}
            className="glass-card"
            style={{
                marginBottom: 16,
                border: '2px dashed #52c41a', // Dashed border to indicate active/recommendation state
                background: '#fff'
            }}
            styles={{ body: { padding: '20px' } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Space>
                    <Text type="secondary">12:30</Text>
                    <TagPill>AI推荐中</TagPill>
                </Space>
                <div>
                    <Text strong style={{ fontSize: 20 }}>450</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 2 }}>千卡</Text>
                </div>
            </div>

            <Title level={4} style={{ margin: '0 0 8px 0' }}>鸡胸肉沙拉</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>正在为您寻找最佳选项...</Text>

            {/* AI Action Status Area */}
            <div style={{
                backgroundColor: '#f0fdf4', // Light green bg
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
            }}>
                <Space style={{ display: 'flex', marginBottom: 12 }} align="center">
                    <SyncOutlined spin style={{ color: '#52c41a', fontSize: 18 }} />
                    <Text style={{ color: '#135200', fontSize: 15, fontWeight: 500 }}>正在搜索健康轻食...</Text>
                </Space>
                <Space direction="vertical" size={4} style={{ marginLeft: 26 }}>
                    <Space>
                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>打开美团</Text>
                    </Space>
                    <Space>
                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>定位健康餐厅</Text>
                    </Space>
                </Space>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <Button
                    type="primary"
                    block
                    size="large"
                    style={{
                        backgroundColor: '#10b981', // Green button
                        borderRadius: 8,
                        height: 48,
                        fontSize: 16
                    }}
                >
                    立即订购
                </Button>
                <Button
                    block
                    size="large"
                    style={{
                        borderRadius: 8,
                        height: 48,
                        width: '120px'
                    }}
                >
                    换一个
                </Button>
            </div>

        </Card>
    );
}

const TagPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span style={{
        backgroundColor: '#d9f7be',
        color: '#135200',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500
    }}>
        {children}
    </span>
);
