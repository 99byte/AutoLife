/**
 * AutoLife 前端类型定义
 */

// 消息类型
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息接口
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isTyping?: boolean;  // 是否正在输入（AI 响应中）
  steps?: ExecutionStep[];  // 执行步骤（保存思维链）
  taskStatus?: TaskStatus;  // 任务状态（如果消息包含任务执行结果）
}

// 对话会话接口
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 设备信息
export interface Device {
  id: string;
  name: string;
  type: 'android' | 'harmony';
  status: 'connected' | 'disconnected';
}

// API 响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 系统配置
export interface SystemConfig {
  apiBaseUrl: string;
  deviceId?: string;
}

// ==================== 任务执行相关类型 ====================

// 任务状态
export type TaskStatus = 'idle' | 'running' | 'completed' | 'error';

// 动作类型（AutoGLM 支持的操作）
export type ActionType =
  | 'Launch'      // 启动应用
  | 'Tap'         // 点击
  | 'Type'        // 输入文本
  | 'Swipe'       // 滑动
  | 'Back'        // 返回
  | 'Home'        // 主屏幕
  | 'Wait'        // 等待
  | 'Scroll'      // 滚动
  | 'LongPress'   // 长按
  | 'DoubleTap'   // 双击
  | 'Pinch'       // 捏合
  | 'Screenshot'  // 截图
  | 'Unknown';    // 未知操作

// 动作详情
export interface ActionDetail {
  action: ActionType;                              // 动作类型
  target?: string;                                 // 目标元素描述
  text?: string;                                   // 输入文本（Type 动作）
  direction?: 'up' | 'down' | 'left' | 'right';   // 滑动方向
  app?: string;                                    // 应用名称（Launch 动作）
  description: string;                             // 动作描述
}

// 执行步骤
export interface ExecutionStep {
  stepNumber: number;                              // 步骤编号（从 1 开始）
  thinking?: string;                               // 思考过程（可选）
  action?: ActionDetail;                           // 执行动作
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;                                 // 执行结果描述
  screenshot?: string;                             // Base64 截图（可选）
  timestamp: number;                               // 时间戳
  duration?: number;                               // 耗时（毫秒）
}

// 任务执行上下文
export interface TaskExecution {
  taskId: string;                                  // 任务 ID
  task: string;                                    // 用户输入的任务描述
  status: TaskStatus;                              // 任务状态
  steps: ExecutionStep[];                          // 步骤列表
  startTime: number;                               // 开始时间
  endTime?: number;                                // 结束时间
  errorMessage?: string;                           // 错误信息（失败时）
  finalMessage?: string;                           // 最终消息（完成时）
}

// SSE 事件类型
export type SSEEventType =
  | 'task_start'      // 任务开始
  | 'step_start'      // 步骤开始
  | 'thinking'        // 思考过程
  | 'action'          // 执行动作
  | 'step_complete'   // 步骤完成
  | 'task_complete'   // 任务完成
  | 'error';          // 错误

// SSE 消息
export interface SSEMessage {
  type: SSEEventType;
  taskId: string;
  stepNumber?: number;
  data?: any;                                      // 具体数据（根据 type 不同而不同）
  timestamp: number;
}

// ==================== 生活助手相关类型 ====================

// 活动分类
export type ActivityCategory =
  | 'food'      // 饮食（外卖、订餐、奶茶）
  | 'work'      // 工作（会议、邮件、文档）
  | 'life'      // 生活（购物、音乐、运动）
  | 'social'    // 社交（微信、聊天、分享）
  | 'other';    // 其他

// 活动状态
export type ActivityStatus = 'completed' | 'failed' | 'cancelled';

// 活动记录接口
export interface ActivityRecord {
  id: string;                          // 唯一标识
  title: string;                       // 活动标题（如："点了外卖"）
  description: string;                 // 活动详情（如："麦当劳套餐"）
  category: ActivityCategory;          // 活动分类
  status: ActivityStatus;              // 活动状态
  timestamp: number;                   // 完成时间戳
  taskId?: string;                     // 关联的任务 ID
  duration?: number;                   // 执行耗时（毫秒）
  metadata?: {                         // 扩展元数据
    app?: string;                      // 使用的应用
    steps?: number;                    // 执行步骤数
    [key: string]: any;
  };
}

// 待办优先级
export type TodoPriority = 'high' | 'medium' | 'low';

// 待办状态
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// 待办事项接口
export interface TodoItem {
  id: string;                          // 唯一标识
  title: string;                       // 待办标题
  description?: string;                // 详细描述
  category?: ActivityCategory;         // 分类（可选）
  priority: TodoPriority;              // 优先级
  status: TodoStatus;                  // 状态
  createdAt: number;                   // 创建时间
  updatedAt: number;                   // 更新时间
  dueDate?: number;                    // 截止时间（可选）
  completedAt?: number;                // 完成时间
  relatedActivityId?: string;          // 关联的活动记录 ID
}
