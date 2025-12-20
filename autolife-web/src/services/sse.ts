/**
 * SSE (Server-Sent Events) 服务
 * 用于接收后端流式返回的任务执行步骤
 */
import { useVoiceStore } from '../store/voiceStore.js';
import type { SSEEventType, ExecutionStep, ActionDetail } from '../types/index.js';

export class SSEService {
  private eventSource: EventSource | null = null;
  private taskId: string = '';

  /**
   * 启动 SSE 连接
   * @param taskId 任务 ID
   * @param text 用户输入的任务描述
   */
  start(taskId: string, text: string) {
    const store = useVoiceStore.getState();

    // 如果已有连接，先断开
    if (this.eventSource) {
      this.stop();
    }

    this.taskId = taskId;

    // 初始化任务
    store.startTask(taskId, text);

    // 建立 SSE 连接
    const url = `/api/voice/stream?taskId=${taskId}&text=${encodeURIComponent(text)}`;
    this.eventSource = new EventSource(url);

    // 保存连接到 store
    store.connectSSE(this.eventSource);

    // 监听事件
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.eventSource) return;

    const store = useVoiceStore.getState();

    // 1. 任务开始
    this.eventSource.addEventListener('task_start', (e) => {
      console.log('SSE: Task started', e.data);
    });

    // 2. 步骤开始
    this.eventSource.addEventListener('step_start', (e) => {
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
      const data = JSON.parse(e.data);
      store.updateStep(data.stepNumber, {
        thinking: data.thinking,
      });
    });

    // 4. 执行动作
    this.eventSource.addEventListener('action', (e) => {
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
      const data = JSON.parse(e.data);
      store.completeTask(data.message);
      this.stop();
    });

    // 7. 错误处理
    this.eventSource.addEventListener('error', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      store.failTask(data.message || '任务执行失败');
      this.stop();
    });

    // 8. 连接错误
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      store.failTask('连接中断');
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

    const store = useVoiceStore.getState();
    store.disconnectSSE();
  }

  /**
   * 取消任务
   */
  cancel() {
    const store = useVoiceStore.getState();
    store.clearCurrentTask();
    this.stop();
  }
}

// 导出单例
export const sseService = new SSEService();
