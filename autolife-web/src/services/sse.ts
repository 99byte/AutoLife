/**
 * SSE (Server-Sent Events) 服务
 * 用于接收后端流式返回的任务执行步骤
 */
import { useAppStore } from '../store/appStore.js';
import { shouldCreateActivity } from '../utils/activityAnalyzer.js';
import type { ExecutionStep, ActionDetail } from '../types/index.js';

export class SSEService {
  private eventSource: EventSource | null = null;
  private errorHandled: boolean = false;  // 防止重复处理错误

  /**
   * 启动 SSE 连接
   * @param _taskId 任务 ID（暂未使用）
   * @param text 用户输入的任务描述
   */
  start(_taskId: string, text: string) {
    const store = useAppStore.getState();

    // 如果已有连接，先断开
    if (this.eventSource) {
      this.stop();
    }

    // 初始化任务
    store.startTask(_taskId, text);
    this.errorHandled = false;  // 重置错误处理标志

    // 建立 SSE 连接
    const url = `/api/agent/stream?taskId=${_taskId}&text=${encodeURIComponent(text)}`;
    this.eventSource = new EventSource(url);

    // 保存连接到 store
    store.connectSSE(this.eventSource);

    // 监听事件
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.eventSource) return;

    const store = useAppStore.getState();

    // 1. 任务开始
    this.eventSource.addEventListener('task_start', (e) => {
      console.log('SSE: Task started', JSON.parse(e.data));
    });

    // 2. 步骤开始
    this.eventSource.addEventListener('step_start', (e) => {
      console.log('SSE: Step started', e.data);
      const data = JSON.parse(e.data);
      const step: ExecutionStep = {
        stepNumber: data.stepNumber,
        status: 'running',
        timestamp: Date.now(),
      };
      store.addStep(step);
    });

    // 3. 思考过程
    this.eventSource.addEventListener('thinking', (e) => {
      console.log('SSE: Thinking', e.data);
      const data = JSON.parse(e.data);
      store.updateStep(data.stepNumber, {
        thinking: data.thinking,
      });
    });

    // 4. 执行动作
    this.eventSource.addEventListener('action', (e) => {
      console.log('SSE: Action', e.data);
      const data = JSON.parse(e.data);
      const action: ActionDetail = {
        action: data.action.action,
        target: data.action.target,
        text: data.action.text,
        direction: data.action.direction,
        app: data.action.app,
        description: data.action.description,
      };
      store.updateStep(data.stepNumber, { action });
    });

    // 5. 步骤完成
    this.eventSource.addEventListener('step_complete', (e) => {
      console.log('SSE: Step complete', e.data);
      const data = JSON.parse(e.data);
      store.updateStep(data.stepNumber, {
        status: 'completed',
        result: data.result,
        screenshot: data.screenshot,
        duration: data.duration,
      });
    });

    // 6. 任务完成
    this.eventSource.addEventListener('task_complete', (e) => {
      console.log('SSE: Task complete', e.data);
      const data = JSON.parse(e.data);
      // 后端发送 result 字段，兼容 message 字段
      const message = data.message || data.result || '任务已完成';
      store.completeTask(message);

      // 添加 AI 回复消息（包含思维链）
      const currentTask = store.currentTask;
      if (currentTask) {
        store.addMessage({
          role: 'assistant',
          content: message,
          steps: currentTask.steps,  // 保存思维链到消息
          taskStatus: currentTask.status,  // 保存任务状态
        });

        // 自动创建活动记录
        if (shouldCreateActivity(currentTask)) {
          store.createActivityFromTask(currentTask);
        }
      }

      this.stop();
    });

    // 7. 错误处理（服务端发送的错误事件）
    this.eventSource.addEventListener('error', (e) => {
      // 防止重复处理
      if (this.errorHandled) return;

      try {
        const data = JSON.parse((e as MessageEvent).data);
        // 后端发送 error 字段，兼容 message 字段
        const errorMessage = data.message || data.error || '任务执行失败';

        this.errorHandled = true;
        store.failTask(errorMessage);

        // 添加错误消息
        store.addMessage({
          role: 'assistant',
          content: `❌ ${errorMessage}`,
        });

        this.stop();
      } catch {
        // 如果解析失败，说明是原生错误事件，由 onerror 处理
      }
    });

    // 8. 连接错误（原生 EventSource 错误）
    this.eventSource.onerror = (error) => {
      // 防止重复处理
      if (this.errorHandled) return;

      console.error('SSE connection error:', error);
      this.errorHandled = true;
      store.failTask('连接中断');

      // 添加连接错误消息
      store.addMessage({
        role: 'assistant',
        content: '❌ 连接中断，请检查网络后重试',
      });

      this.stop();
    };
  }

  /**
   * 停止 SSE 连接
   */
  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const store = useAppStore.getState();
    store.disconnectSSE();
  }

  /**
   * 取消任务
   */
  cancel() {
    const store = useAppStore.getState();
    store.clearCurrentTask();
    this.stop();
  }
}

// 导出单例
export const sseService = new SSEService();
