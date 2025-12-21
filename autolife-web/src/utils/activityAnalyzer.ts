/**
 * 活动分类识别工具
 */
import type { ActivityCategory, TaskExecution } from '../types/index.js';

// 分类关键词映射
const CATEGORY_KEYWORDS: Record<ActivityCategory, string[]> = {
  food: [
    '外卖', '点餐', '订餐', '奶茶', '咖啡', '饿了么', '美团',
    '肯德基', '麦当劳', '星巴克', '瑞幸', '喜茶', '奈雪', '餐厅',
    '订单', '下单', '吃', '食物', '饮料'
  ],
  work: [
    '会议', '邮件', '文档', '日程', '钉钉', '企业微信', '工作',
    '报告', '审批', '表格', 'excel', 'word', 'ppt',
    '项目', '任务', '同事', '老板'
  ],
  life: [
    '购物', '音乐', '视频', '游戏', '运动', '健康', '天气',
    '导航', '支付', '淘宝', '京东', '拼多多', '抖音', '快手',
    '网易云', 'QQ音乐', '跑步', '健身'
  ],
  social: [
    '微信', '聊天', '朋友圈', '分享', '发送', '消息', 'QQ', '微博',
    '联系人', '好友', '群聊', '发朋友圈'
  ],
  other: [],
};

/**
 * 分析任务描述，识别任务分类
 * @param taskDescription 任务描述文本
 * @returns 识别出的分类
 */
export const analyzeTaskCategory = (taskDescription: string): ActivityCategory => {
  const lowerTask = taskDescription.toLowerCase();

  // 遍历所有分类的关键词
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;

    // 检查是否包含该分类的任何关键词
    if (keywords.some(keyword => lowerTask.includes(keyword))) {
      return category as ActivityCategory;
    }
  }

  return 'other';
};

/**
 * 根据任务生成活动标题
 * @param task 任务执行对象
 * @returns 生成的活动标题
 */
export const generateActivityTitle = (task: TaskExecution): string => {
  const category = analyzeTaskCategory(task.task);
  const taskLower = task.task.toLowerCase();

  // 根据分类和任务内容生成更智能的标题
  switch (category) {
    case 'food':
      if (taskLower.includes('外卖')) return '点了外卖';
      if (taskLower.includes('奶茶')) return '订了奶茶';
      if (taskLower.includes('咖啡')) return '订了咖啡';
      if (taskLower.includes('点餐') || taskLower.includes('订餐')) return '订购了美食';
      return '完成了饮食任务';

    case 'work':
      if (taskLower.includes('会议')) return '安排了会议';
      if (taskLower.includes('邮件')) return '发送了邮件';
      if (taskLower.includes('文档')) return '处理了文档';
      if (taskLower.includes('日程')) return '管理了日程';
      return '处理了工作事项';

    case 'life':
      if (taskLower.includes('购物')) return '完成了购物';
      if (taskLower.includes('音乐')) return '播放了音乐';
      if (taskLower.includes('视频')) return '观看了视频';
      if (taskLower.includes('运动') || taskLower.includes('健身')) return '完成了运动';
      return '完成了生活任务';

    case 'social':
      if (taskLower.includes('微信')) return '发送了微信消息';
      if (taskLower.includes('朋友圈')) return '发布了朋友圈';
      if (taskLower.includes('分享')) return '分享了内容';
      return '进行了社交活动';

    default:
      return '完成了任务';
  }
};

/**
 * 判断任务是否应该创建活动记录
 * @param task 任务执行对象
 * @returns 是否应该创建活动记录
 */
export const shouldCreateActivity = (task: TaskExecution): boolean => {
  // 只为成功完成的任务创建活动记录
  if (task.status !== 'completed') {
    return false;
  }

  // 任务至少要有一个步骤
  if (!task.steps || task.steps.length === 0) {
    return false;
  }

  // 识别为有意义的分类（非 other）
  const category = analyzeTaskCategory(task.task);
  if (category === 'other') {
    return false;
  }

  return true;
};

/**
 * 提取任务中的关键信息作为活动描述
 * @param task 任务执行对象
 * @returns 活动描述
 */
export const extractActivityDescription = (task: TaskExecution): string => {
  // 直接使用任务描述
  return task.task;
};
