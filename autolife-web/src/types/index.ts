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
  audioUrl?: string;  // 语音消息的音频 URL
  confidence?: number; // ASR 识别置信度
  isTyping?: boolean;  // 是否正在输入（AI 响应中）
}

// 对话会话接口
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 录音状态
export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

// 交互模式
export type InteractionMode = 'text' | 'single' | 'continuous';

// 设备信息
export interface Device {
  id: string;
  name: string;
  type: 'android' | 'harmony';
  status: 'connected' | 'disconnected';
}

// ASR 识别结果
export interface ASRResult {
  text: string;
  confidence: number;
  duration: number;
}

// TTS 配置
export interface TTSConfig {
  voice?: string;    // 音色选择
  speed?: number;    // 语速 (0.5 - 2.0)
  volume?: number;   // 音量 (0 - 1.0)
}

// VAD 状态
export interface VADStatus {
  isActive: boolean;  // 是否检测到语音活动
  volume: number;     // 当前音量
}

// WebSocket 消息类型
export type WSMessageType = 'asr' | 'response' | 'vad' | 'error';

export interface WSMessage {
  type: WSMessageType;
  data: any;
  timestamp: number;
}

// API 响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 语音交互请求
export interface VoiceRequest {
  mode: InteractionMode;
  audio?: Blob;
  text?: string;
  config?: TTSConfig;
}

// 语音交互响应
export interface VoiceResponse {
  text: string;           // 执行结果文本
  audioUrl?: string;      // TTS 音频 URL
  asrResult?: ASRResult;  // ASR 识别结果
  duration: number;       // 总耗时（毫秒）
}

// 系统配置
export interface SystemConfig {
  apiBaseUrl: string;
  wsUrl: string;
  deviceId?: string;
  enableVoiceFeedback: boolean;
  recordingDuration: number;  // 单次录音时长（秒）
  ttsConfig: TTSConfig;
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
