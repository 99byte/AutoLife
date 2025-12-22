# 前端架构文档

本文档描述 AutoLife 前端的技术架构和功能实现。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 7.x | 构建工具 |
| Ant Design | 6.x | UI 组件库 |
| Ant Design X | 2.x | AI 交互组件 |
| Zustand | 5.x | 状态管理 |
| react-resizable-panels | - | 可拖拽布局 |

## 项目结构

```
autolife-web/
├── src/
│   ├── components/          # React 组件
│   │   ├── TwoColumnLayout.tsx      # 两栏可拖拽布局
│   │   ├── ActivityPanel.tsx        # 活动面板（左侧）
│   │   ├── ActivityTimeline.tsx     # 活动时间线
│   │   ├── ActivityCard.tsx         # 活动卡片
│   │   ├── CategoryFilter.tsx       # 分类筛选
│   │   ├── TodoList.tsx             # 待办事项列表
│   │   ├── TodoItem.tsx             # 待办事项项
│   │   ├── TodoForm.tsx             # 待办事项表单
│   │   ├── EnhancedChatPanel.tsx    # AI 对话面板（右侧）
│   │   ├── ConversationHistory.tsx  # 对话历史（Ant Design X）
│   │   └── QuickActions.tsx         # 快捷问题
│   ├── services/            # 服务层
│   │   ├── api.ts                   # REST API 封装
│   │   └── sse.ts                   # SSE 流式通信
│   ├── store/               # 状态管理
│   │   └── appStore.ts              # Zustand Store
│   ├── types/               # TypeScript 类型
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── storage.ts               # localStorage 持久化
│   │   └── activityAnalyzer.ts      # 活动智能分析
│   ├── App.tsx              # 应用入口
│   └── main.tsx             # React 入口
├── vite.config.ts           # Vite 配置
└── package.json
```

## 核心功能

### 1. 两栏布局

使用 `react-resizable-panels` 实现可拖拽的两栏布局：

- **左侧（70%）**: 活动面板 - 显示今日活动和待办事项
- **右侧（30%）**: AI 助手面板 - 对话交互

支持面板显示/隐藏：
- 点击 AI 助手面板的关闭按钮隐藏
- 隐藏后在活动面板右上角显示 "✨ AI Copilot" 按钮重新打开

### 2. 活动记录管理

自动记录通过 AI 助手完成的任务：

**活动分类**:
- 🍔 饮食（外卖、订餐、奶茶）
- 💼 工作（会议、邮件、文档）
- 🏠 生活（购物、音乐、运动）
- 💬 社交（微信、聊天、分享）
- 📌 其他

**智能分析** (`activityAnalyzer.ts`):
- 根据任务关键词自动识别分类
- 自动生成活动标题和描述

### 3. 待办事项管理

完整的 CRUD 功能：
- 添加/编辑/删除待办事项
- 设置优先级（高/中/低）
- 设置截止日期
- 状态切换（待办/进行中/已完成）

### 4. 多对话会话管理

使用 Ant Design X 的 `Conversations` 组件：

**功能**:
- 创建新对话（+ 按钮）
- 查看对话历史（💬 按钮，Popover 弹出）
- 切换对话
- 删除对话（右键菜单）
- 按日期分组（今天、昨天、更早）

**数据持久化**:
- 对话列表保存到 localStorage（最多 50 个）
- 消息保存到 localStorage（每个对话最多 100 条）
- 刷新页面自动恢复

### 5. SSE 流式通信

与后端通过 Server-Sent Events 通信：

**事件类型**:
| 事件 | 说明 |
|------|------|
| `task_start` | 任务开始 |
| `step_start` | 步骤开始 |
| `thinking` | AI 思考过程 |
| `action` | 执行动作 |
| `step_complete` | 步骤完成 |
| `task_complete` | 任务完成 |
| `error` | 错误 |

**错误处理**:
- 服务端错误事件
- 连接中断处理
- 防止重复错误消息

## 状态管理 (Zustand)

### Store 结构

```typescript
interface AppStore {
  // 对话状态
  currentConversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  chatPanelVisible: boolean;

  // 任务执行状态
  currentTask: TaskExecution | null;
  isTaskRunning: boolean;

  // 生活助手状态
  activityRecords: ActivityRecord[];
  todoItems: TodoItem[];
  activityFilter: ActivityCategory | 'all';

  // Actions...
}
```

### 数据持久化

| 数据 | Storage Key | 限制 |
|------|-------------|------|
| 对话列表 | `autolife_conversations` | 最多 50 个 |
| 消息 | `autolife_messages` | 最多 100 条 |
| 活动记录 | `autolife_activities` | 保留 30 天 |
| 待办事项 | `autolife_todos` | 无限制 |

## API 代理配置

Vite 开发服务器代理配置 (`vite.config.ts`):

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run typecheck
```

## 组件依赖关系

```
App
└── TwoColumnLayout
    ├── ActivityPanel
    │   ├── ActivityTimeline
    │   │   ├── CategoryFilter
    │   │   └── ActivityCard
    │   └── TodoList
    │       ├── TodoItem
    │       └── TodoForm
    └── EnhancedChatPanel
        ├── Welcome (Ant Design X)
        ├── QuickActions
        ├── Bubble (Ant Design X)
        ├── Sender (Ant Design X)
        └── ConversationHistory
            └── Conversations (Ant Design X)
```
