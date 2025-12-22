/**
 * AutoLife 状态管理（Zustand）
 */
import { create } from 'zustand';
import type {
  Message,
  Conversation,
  Device,
  SystemConfig,
  TaskExecution,
  ExecutionStep,
  TaskStatus,
  ActivityRecord,
  TodoItem,
  ActivityCategory,
  TodoStatus,
} from '../types/index.js';
import {
  saveActivities,
  saveTodos,
  loadActivities,
  loadTodos,
  saveMessages,
  loadMessages,
  saveConversations,
  loadConversations,
  saveCurrentConversationId,
  loadCurrentConversationId,
} from '../utils/storage.js';
import {
  analyzeTaskCategory,
  generateActivityTitle,
  extractActivityDescription,
} from '../utils/activityAnalyzer.js';

interface AppStore {
  // 状态
  currentConversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  devices: Device[];
  currentDevice: Device | null;
  config: SystemConfig;
  chatPanelVisible: boolean;

  // 任务执行状态
  currentTask: TaskExecution | null;
  taskHistory: TaskExecution[];
  sseConnection: EventSource | null;
  isTaskRunning: boolean;

  // 生活助手状态
  activityRecords: ActivityRecord[];
  todoItems: TodoItem[];
  activityFilter: ActivityCategory | 'all';

  // Actions - 对话管理
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  loadConversation: (conversationId: string) => void;
  createConversation: () => void;
  deleteConversation: (conversationId: string) => void;
  setChatPanelVisible: (visible: boolean) => void;

  // Actions - 设备管理
  setDevices: (devices: Device[]) => void;
  selectDevice: (deviceId: string) => void;

  // Actions - 配置
  updateConfig: (config: Partial<SystemConfig>) => void;

  // Actions - 任务执行
  startTask: (taskId: string, taskDescription: string) => void;
  addStep: (step: ExecutionStep) => void;
  updateStep: (stepNumber: number, updates: Partial<ExecutionStep>) => void;
  completeTask: (finalMessage?: string) => void;
  failTask: (errorMessage: string) => void;
  connectSSE: (eventSource: EventSource) => void;
  disconnectSSE: () => void;
  clearCurrentTask: () => void;

  // Actions - 活动记录管理
  addActivity: (activity: Omit<ActivityRecord, 'id' | 'timestamp'>) => void;
  updateActivity: (id: string, updates: Partial<ActivityRecord>) => void;
  deleteActivity: (id: string) => void;
  getTodayActivities: () => ActivityRecord[];
  getActivitiesByCategory: (category: ActivityCategory) => ActivityRecord[];
  setActivityFilter: (filter: ActivityCategory | 'all') => void;
  createActivityFromTask: (task: TaskExecution) => void;

  // Actions - 待办事项管理
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoStatus: (id: string) => void;
  getTodosByStatus: (status: TodoStatus) => TodoItem[];

  // Actions - 数据持久化
  loadPersistedData: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // 初始状态
  currentConversation: null,
  conversations: [],
  messages: [],
  devices: [],
  currentDevice: null,
  config: {
    apiBaseUrl: '/api',
  },
  chatPanelVisible: true,

  // 任务执行初始状态
  currentTask: null,
  taskHistory: [],
  sseConnection: null,
  isTaskRunning: false,

  // 生活助手初始状态
  activityRecords: [],
  todoItems: [],
  activityFilter: 'all',

  // 对话管理
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    set((state) => {
      const updatedMessages = [...state.messages, newMessage];

      // 更新当前对话
      let updatedConversation = state.currentConversation;
      let updatedConversations = state.conversations;

      if (updatedConversation) {
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
          updatedAt: Date.now(),
          // 根据第一条用户消息生成标题
          title: updatedConversation.title === '新对话' && message.role === 'user'
            ? message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
            : updatedConversation.title,
        };

        // 更新对话列表中的当前对话
        updatedConversations = state.conversations.map(c =>
          c.id === updatedConversation!.id ? updatedConversation! : c
        );

        // 持久化
        saveConversations(updatedConversations);
      }

      saveMessages(updatedMessages);
      return {
        messages: updatedMessages,
        currentConversation: updatedConversation,
        conversations: updatedConversations,
      };
    });
  },

  updateMessage: (id, updates) => {
    set((state) => {
      const updated = state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      );
      saveMessages(updated);
      return { messages: updated };
    });
  },

  clearMessages: () => {
    saveMessages([]);
    set({ messages: [] });
  },

  loadConversation: (conversationId) => {
    const state = get();
    const conversation = state.conversations.find((c) => c.id === conversationId);
    if (conversation) {
      saveCurrentConversationId(conversationId);
      saveMessages(conversation.messages);
      set({
        currentConversation: conversation,
        messages: conversation.messages,
      });
    }
  },

  createConversation: () => {
    const state = get();
    const now = Date.now();

    // 创建新对话
    const newConversation: Conversation = {
      id: now.toString(),
      title: '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    // 更新对话列表
    const updatedConversations = [...state.conversations, newConversation];

    // 持久化
    saveConversations(updatedConversations);
    saveCurrentConversationId(newConversation.id);
    saveMessages([]);

    set({
      conversations: updatedConversations,
      currentConversation: newConversation,
      messages: [],
    });
  },

  deleteConversation: (conversationId) => {
    set((state) => {
      const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
      saveConversations(updatedConversations);

      // 如果删除的是当前对话，切换到最新的对话或清空
      if (state.currentConversation?.id === conversationId) {
        const latestConversation = updatedConversations[updatedConversations.length - 1] || null;
        saveCurrentConversationId(latestConversation?.id || null);
        saveMessages(latestConversation?.messages || []);
        return {
          conversations: updatedConversations,
          currentConversation: latestConversation,
          messages: latestConversation?.messages || [],
        };
      }

      return { conversations: updatedConversations };
    });
  },

  setChatPanelVisible: (visible) => {
    set({ chatPanelVisible: visible });
  },

  // 设备管理
  setDevices: (devices) => {
    set({ devices });
    // 如果当前没有选中设备，自动选择第一个已连接的设备
    const currentDevice = get().currentDevice;
    if (!currentDevice && devices.length > 0) {
      const connectedDevice = devices.find((d) => d.status === 'connected');
      if (connectedDevice) {
        set({ currentDevice: connectedDevice });
      }
    }
  },

  selectDevice: (deviceId) => {
    const device = get().devices.find((d) => d.id === deviceId);
    if (device) {
      set({ currentDevice: device });
    }
  },

  // 配置
  updateConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },

  // 任务执行
  startTask: (taskId, taskDescription) =>
    set({
      currentTask: {
        taskId,
        task: taskDescription,
        status: 'running',
        steps: [],
        startTime: Date.now(),
      },
      isTaskRunning: true,
    }),

  addStep: (step) =>
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            steps: [...state.currentTask.steps, step],
          }
        : null,
    })),

  updateStep: (stepNumber, updates) =>
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            steps: state.currentTask.steps.map((s) =>
              s.stepNumber === stepNumber ? { ...s, ...updates } : s
            ),
          }
        : null,
    })),

  completeTask: (finalMessage) =>
    set((state) => {
      const completed = state.currentTask
        ? {
            ...state.currentTask,
            status: 'completed' as TaskStatus,
            endTime: Date.now(),
            finalMessage,
          }
        : null;

      return {
        currentTask: completed,
        isTaskRunning: false,
        taskHistory: completed
          ? [...state.taskHistory, completed]
          : state.taskHistory,
      };
    }),

  failTask: (errorMessage) =>
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            status: 'error' as TaskStatus,
            endTime: Date.now(),
            errorMessage,
          }
        : null,
      isTaskRunning: false,
    })),

  connectSSE: (eventSource) =>
    set({ sseConnection: eventSource }),

  disconnectSSE: () =>
    set((state) => {
      state.sseConnection?.close();
      return { sseConnection: null };
    }),

  clearCurrentTask: () =>
    set({ currentTask: null, isTaskRunning: false }),

  // 活动记录管理
  addActivity: (activity) => {
    const newActivity: ActivityRecord = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    set((state) => {
      const updated = [...state.activityRecords, newActivity];
      saveActivities(updated);
      return { activityRecords: updated };
    });
  },

  updateActivity: (id, updates) => {
    set((state) => {
      const updated = state.activityRecords.map((activity) =>
        activity.id === id ? { ...activity, ...updates } : activity
      );
      saveActivities(updated);
      return { activityRecords: updated };
    });
  },

  deleteActivity: (id) => {
    set((state) => {
      const updated = state.activityRecords.filter((activity) => activity.id !== id);
      saveActivities(updated);
      return { activityRecords: updated };
    });
  },

  getTodayActivities: () => {
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);

    return get().activityRecords.filter((activity) => activity.timestamp >= todayStart);
  },

  getActivitiesByCategory: (category) => {
    return get().activityRecords.filter((activity) => activity.category === category);
  },

  setActivityFilter: (filter) => {
    set({ activityFilter: filter });
  },

  createActivityFromTask: (task) => {
    const category = analyzeTaskCategory(task.task);
    const title = generateActivityTitle(task);
    const description = extractActivityDescription(task);

    const activity: Omit<ActivityRecord, 'id' | 'timestamp'> = {
      title,
      description,
      category,
      status: task.status as 'completed' | 'failed',
      taskId: task.taskId,
      duration: task.endTime && task.startTime ? task.endTime - task.startTime : undefined,
      metadata: {
        steps: task.steps.length,
      },
    };

    get().addActivity(activity);
  },

  // 待办事项管理
  addTodo: (todo) => {
    const now = Date.now();
    const newTodo: TodoItem = {
      ...todo,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const updated = [...state.todoItems, newTodo];
      saveTodos(updated);
      return { todoItems: updated };
    });
  },

  updateTodo: (id, updates) => {
    set((state) => {
      const updated = state.todoItems.map((todo) =>
        todo.id === id
          ? { ...todo, ...updates, updatedAt: Date.now() }
          : todo
      );
      saveTodos(updated);
      return { todoItems: updated };
    });
  },

  deleteTodo: (id) => {
    set((state) => {
      const updated = state.todoItems.filter((todo) => todo.id !== id);
      saveTodos(updated);
      return { todoItems: updated };
    });
  },

  toggleTodoStatus: (id) => {
    set((state) => {
      const updated = state.todoItems.map((todo) => {
        if (todo.id === id) {
          const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed';
          return {
            ...todo,
            status: newStatus,
            updatedAt: Date.now(),
            completedAt: newStatus === 'completed' ? Date.now() : undefined,
          };
        }
        return todo;
      });
      saveTodos(updated);
      return { todoItems: updated };
    });
  },

  getTodosByStatus: (status) => {
    return get().todoItems.filter((todo) => todo.status === status);
  },

  // 数据持久化
  loadPersistedData: () => {
    const activities = loadActivities();
    const todos = loadTodos();
    const conversations = loadConversations();
    const currentConversationId = loadCurrentConversationId();

    // 恢复当前对话
    let currentConversation: Conversation | null = null;
    let messages: Message[] = [];

    if (currentConversationId) {
      currentConversation = conversations.find(c => c.id === currentConversationId) || null;
      messages = currentConversation?.messages || loadMessages();
    } else if (conversations.length > 0) {
      // 如果没有保存的当前对话 ID，使用最新的对话
      currentConversation = conversations[conversations.length - 1];
      messages = currentConversation.messages;
    } else {
      // 没有任何对话，加载旧的消息格式（兼容性）
      messages = loadMessages();
    }

    set({
      activityRecords: activities,
      todoItems: todos,
      conversations,
      currentConversation,
      messages,
    });
  },
}));
