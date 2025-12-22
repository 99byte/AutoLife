/**
 * 本地存储工具
 */
import type { ActivityRecord, TodoItem, Message, Conversation } from '../types/index.js';

// 存储键常量
export const STORAGE_KEYS = {
  ACTIVITIES: 'autolife_activities',
  TODOS: 'autolife_todos',
  MESSAGES: 'autolife_messages',
  CONVERSATIONS: 'autolife_conversations',
  CURRENT_CONVERSATION_ID: 'autolife_current_conversation_id',
} as const;

// 数据保留天数（默认保留 30 天）
const DATA_RETENTION_DAYS = 30;

// 消息保留数量（默认保留最近 100 条）
const MAX_MESSAGES = 100;

/**
 * 保存活动记录到 localStorage
 * @param activities 活动记录数组
 */
export const saveActivities = (activities: ActivityRecord[]): void => {
  try {
    const json = JSON.stringify(activities);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, json);
  } catch (error) {
    console.error('保存活动记录失败:', error);
  }
};

/**
 * 从 localStorage 加载活动记录
 * @returns 活动记录数组
 */
export const loadActivities = (): ActivityRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!stored) {
      return [];
    }

    const activities = JSON.parse(stored) as ActivityRecord[];

    // 过滤掉过期的活动记录（超过保留天数）
    const now = Date.now();
    const retentionMs = DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    return activities.filter(activity => {
      return now - activity.timestamp < retentionMs;
    });
  } catch (error) {
    console.error('加载活动记录失败:', error);
    return [];
  }
};

/**
 * 保存待办事项到 localStorage
 * @param todos 待办事项数组
 */
export const saveTodos = (todos: TodoItem[]): void => {
  try {
    const json = JSON.stringify(todos);
    localStorage.setItem(STORAGE_KEYS.TODOS, json);
  } catch (error) {
    console.error('保存待办事项失败:', error);
  }
};

/**
 * 从 localStorage 加载待办事项
 * @returns 待办事项数组
 */
export const loadTodos = (): TodoItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as TodoItem[];
  } catch (error) {
    console.error('加载待办事项失败:', error);
    return [];
  }
};

/**
 * 保存消息到 localStorage
 * @param messages 消息数组
 */
export const saveMessages = (messages: Message[]): void => {
  try {
    // 只保留最近 MAX_MESSAGES 条消息
    const toSave = messages.slice(-MAX_MESSAGES);
    const json = JSON.stringify(toSave);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, json);
  } catch (error) {
    console.error('保存消息失败:', error);
  }
};

/**
 * 从 localStorage 加载消息
 * @returns 消息数组
 */
export const loadMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as Message[];
  } catch (error) {
    console.error('加载消息失败:', error);
    return [];
  }
};

/**
 * 清除所有本地数据
 */
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.TODOS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  } catch (error) {
    console.error('清除数据失败:', error);
  }
};

/**
 * 清理过期的活动记录
 * @returns 清理的记录数量
 */
export const cleanupExpiredActivities = (): number => {
  try {
    const activities = loadActivities();
    const beforeCount = activities.length;

    const now = Date.now();
    const retentionMs = DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const filtered = activities.filter(activity => {
      return now - activity.timestamp < retentionMs;
    });

    saveActivities(filtered);

    return beforeCount - filtered.length;
  } catch (error) {
    console.error('清理过期活动记录失败:', error);
    return 0;
  }
};

/**
 * 获取存储使用情况
 * @returns 存储使用的字节数
 */
export const getStorageUsage = (): { activities: number; todos: number; total: number } => {
  try {
    const activitiesSize = (localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '').length;
    const todosSize = (localStorage.getItem(STORAGE_KEYS.TODOS) || '').length;

    return {
      activities: activitiesSize,
      todos: todosSize,
      total: activitiesSize + todosSize,
    };
  } catch (error) {
    console.error('获取存储使用情况失败:', error);
    return { activities: 0, todos: 0, total: 0 };
  }
};

// 对话历史保留数量（默认保留最近 50 个对话）
const MAX_CONVERSATIONS = 50;

/**
 * 保存对话列表到 localStorage
 * @param conversations 对话列表
 */
export const saveConversations = (conversations: Conversation[]): void => {
  try {
    // 只保留最近 MAX_CONVERSATIONS 个对话
    const toSave = conversations.slice(-MAX_CONVERSATIONS);
    const json = JSON.stringify(toSave);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, json);
  } catch (error) {
    console.error('保存对话列表失败:', error);
  }
};

/**
 * 从 localStorage 加载对话列表
 * @returns 对话列表
 */
export const loadConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) {
      return [];
    }

    return JSON.parse(stored) as Conversation[];
  } catch (error) {
    console.error('加载对话列表失败:', error);
    return [];
  }
};

/**
 * 保存当前对话 ID
 * @param conversationId 对话 ID
 */
export const saveCurrentConversationId = (conversationId: string | null): void => {
  try {
    if (conversationId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, conversationId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
    }
  } catch (error) {
    console.error('保存当前对话 ID 失败:', error);
  }
};

/**
 * 加载当前对话 ID
 * @returns 对话 ID 或 null
 */
export const loadCurrentConversationId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
  } catch (error) {
    console.error('加载当前对话 ID 失败:', error);
    return null;
  }
};

/**
 * 删除指定对话
 * @param conversationId 要删除的对话 ID
 */
export const deleteConversation = (conversationId: string): void => {
  try {
    const conversations = loadConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    saveConversations(filtered);
  } catch (error) {
    console.error('删除对话失败:', error);
  }
};
