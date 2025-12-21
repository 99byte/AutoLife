import { ConfigProvider, Layout, Typography, Tag, Space } from 'antd';
import { AudioOutlined, ApiOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import { useState, useEffect } from 'react';
import { ThreeColumnLayout } from './components/ThreeColumnLayout.js';
import { apiService } from './services/api.js';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  // 检查后端连接状态
  useEffect(() => {
    const checkBackend = async () => {
      setChecking(true);
      const isHealthy = await apiService.healthCheck();
      setBackendConnected(isHealthy);
      setChecking(false);
    };

    // 首次检查
    checkBackend();

    // 每 5 秒检查一次
    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 50px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AudioOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              AutoLife 助手
            </Title>
          </div>
          <Space>
            <Tag color="success" icon={<ApiOutlined />}>
              前端已就绪
            </Tag>
            {checking ? (
              <Tag color="processing">检测中...</Tag>
            ) : backendConnected ? (
              <Tag color="success">后端已连接</Tag>
            ) : (
              <Tag color="error">后端未连接</Tag>
            )}
          </Space>
        </Header>

        <Content style={{ padding: '16px', background: '#f0f2f5', height: 'calc(100vh - 110px)' }}>
          <div style={{ height: '100%', maxWidth: '1920px', margin: '0 auto' }}>
            <ThreeColumnLayout />
          </div>
        </Content>

        <Footer style={{ textAlign: 'center', background: '#fff', padding: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            AutoLife 助手 ©2025 | 基于 AutoGLM 开发
          </Text>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

export default App;

