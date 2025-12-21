/**
 * 本地存储工具
 */
import type { ActivityRecord, TodoItem } from '../types/index.js';

// 存储键常量
export const STORAGE_KEYS = {
  ACTIVITIES: 'autolife_activities',
  TODOS: 'autolife_todos',
} as const;

// 数据保留天数（默认保留 30 天）
const DATA_RETENTION_DAYS = 30;

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
 * 清除所有本地数据
 */
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.TODOS);
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
