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
} from '../types/index.js';

interface AppStore {
  // 状态
  currentConversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  devices: Device[];
  currentDevice: Device | null;
  config: SystemConfig;

  // 任务执行状态
  currentTask: TaskExecution | null;
  taskHistory: TaskExecution[];
  sseConnection: EventSource | null;
  isTaskRunning: boolean;

  // Actions - 对话管理
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  loadConversation: (conversationId: string) => void;
  createConversation: () => void;

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

  // 任务执行初始状态
  currentTask: null,
  taskHistory: [],
  sseConnection: null,
  isTaskRunning: false,

  // 对话管理
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  loadConversation: (conversationId) => {
    const conversation = get().conversations.find((c) => c.id === conversationId);
    if (conversation) {
      set({
        currentConversation: conversation,
        messages: conversation.messages,
      });
    }
  },

  createConversation: () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `对话 ${get().conversations.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      conversations: [...state.conversations, newConversation],
      currentConversation: newConversation,
      messages: [],
    }));
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
}));
