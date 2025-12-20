/**
 * Mock SSE 测试工具
 * 用于在没有真实后端的情况下测试任务执行流程
 */
import { useVoiceStore } from '../store/voiceStore.js';
import type { ExecutionStep } from '../types/index.js';

/**
 * 模拟任务执行
 * @param taskId 任务 ID
 * @param task 任务描述
 */
export function mockTaskExecution(taskId: string, task: string) {
  const store = useVoiceStore.getState();

  // 1. 开始任务
  store.startTask(taskId, task);

  // 2. 模拟步骤 1：打开应用
  setTimeout(() => {
    const step1: ExecutionStep = {
      stepNumber: 1,
      status: 'running',
      timestamp: Date.now(),
    };
    store.addStep(step1);

    setTimeout(() => {
      store.updateStep(1, {
        thinking: '我需要打开微信应用来发送消息',
        action: {
          action: 'Launch',
          app: '微信',
          description: '打开微信应用',
        },
        status: 'completed',
        result: '成功打开微信',
        duration: 1200,
      });
    }, 1000);
  }, 500);

  // 3. 模拟步骤 2：点击联系人
  setTimeout(() => {
    const step2: ExecutionStep = {
      stepNumber: 2,
      status: 'running',
      timestamp: Date.now(),
    };
    store.addStep(step2);

    setTimeout(() => {
      store.updateStep(2, {
        thinking: '我需要找到联系人"张三"',
        action: {
          action: 'Tap',
          target: '通讯录',
          description: '点击通讯录',
        },
        status: 'completed',
        result: '进入通讯录',
        duration: 800,
      });
    }, 1000);
  }, 2500);

  // 4. 模拟步骤 3：搜索联系人
  setTimeout(() => {
    const step3: ExecutionStep = {
      stepNumber: 3,
      status: 'running',
      timestamp: Date.now(),
    };
    store.addStep(step3);

    setTimeout(() => {
      store.updateStep(3, {
        thinking: '在搜索框中输入"张三"',
        action: {
          action: 'Type',
          target: '搜索框',
          text: '张三',
          description: '输入联系人姓名',
        },
        status: 'completed',
        result: '找到联系人张三',
        duration: 600,
      });
    }, 1000);
  }, 4500);

  // 5. 模拟步骤 4：点击联系人
  setTimeout(() => {
    const step4: ExecutionStep = {
      stepNumber: 4,
      status: 'running',
      timestamp: Date.now(),
    };
    store.addStep(step4);

    setTimeout(() => {
      store.updateStep(4, {
        thinking: '点击搜索结果中的"张三"',
        action: {
          action: 'Tap',
          target: '张三',
          description: '点击联系人',
        },
        status: 'completed',
        result: '打开聊天窗口',
        duration: 700,
      });
    }, 1000);
  }, 6500);

  // 6. 模拟步骤 5：发送消息
  setTimeout(() => {
    const step5: ExecutionStep = {
      stepNumber: 5,
      status: 'running',
      timestamp: Date.now(),
    };
    store.addStep(step5);

    setTimeout(() => {
      store.updateStep(5, {
        thinking: '在输入框中输入消息并发送',
        action: {
          action: 'Type',
          target: '消息输入框',
          text: '你好',
          description: '输入并发送消息',
        },
        status: 'completed',
        result: '消息发送成功',
        duration: 900,
      });
    }, 1000);
  }, 8500);

  // 7. 完成任务
  setTimeout(() => {
    store.completeTask('消息已成功发送给张三');
  }, 10500);
}

/**
 * 模拟任务失败
 * @param taskId 任务 ID
 * @param task 任务描述
 */
export function mockTaskError(taskId: string, task: string) {
  const store = useVoiceStore.getState();

  // 1. 开始任务
  store.startTask(taskId, task);

  // 2. 模拟步骤 1：打开应用
  setTimeout(() => {
    const step1: ExecutionStep = {
      stepNumber: 1,
      status: 'running',
      timestamp: Date.now(),
    };
    store.addStep(step1);

    setTimeout(() => {
      store.updateStep(1, {
        thinking: '尝试打开应用',
        action: {
          action: 'Launch',
          app: '不存在的应用',
          description: '打开应用',
        },
        status: 'error',
        result: '应用不存在',
        duration: 500,
      });
    }, 1000);
  }, 500);

  // 3. 任务失败
  setTimeout(() => {
    store.failTask('找不到指定的应用');
  }, 2500);
}

/**
 * 清空当前任务
 */
export function clearMockTask() {
  const store = useVoiceStore.getState();
  store.clearCurrentTask();
}
