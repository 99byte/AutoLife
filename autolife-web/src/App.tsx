import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import { ThreeColumnLayout } from './components/ThreeColumnLayout.js';
import { useAppStore } from './store/appStore.js';
import './App.css';

function App() {
  const { loadPersistedData } = useAppStore();

  // 初始化：加载本地持久化数据
  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

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
      <div style={{ height: '100vh', background: '#f0f2f5' }}>
        <ThreeColumnLayout />
      </div>
    </ConfigProvider>
  );
}

export default App;
