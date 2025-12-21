/**
 * AutoLife API 服务封装
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Device,
  Conversation,
  SystemConfig,
} from '../types/index.js';
import { sseService } from './sse.js';

class ApiService {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 执行任务
   */
  async runTask(task: string): Promise<ApiResponse<{ result: string }>> {
    try {
      const response = await this.client.post<ApiResponse<{ result: string }>>(
        '/agent/run',
        { task }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '执行任务失败',
      };
    }
  }

  /**
   * 发送任务指令（流式）
   * 使用 SSE 接收任务执行步骤
   */
  runTaskStream(task: string): string {
    const taskId = `task_${Date.now()}`;
    sseService.start(taskId, task);
    return taskId;
  }

  /**
   * 获取设备列表
   */
  async getDevices(): Promise<ApiResponse<Device[]>> {
    try {
      const response = await this.client.get<ApiResponse<Device[]>>('/devices');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || '获取设备列表失败',
      };
    }
  }

  /**
   * 选择设备
   */
  async selectDevice(deviceId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post<ApiResponse<void>>('/devices/select', {
        deviceId,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '选择设备失败',
      };
    }
  }

  /**
   * 获取对话历史
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await this.client.get<ApiResponse<Conversation[]>>(
        '/conversations'
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || '获取对话历史失败',
      };
    }
  }

  /**
   * 获取系统配置
   */
  async getConfig(): Promise<ApiResponse<SystemConfig>> {
    try {
      const response = await this.client.get<ApiResponse<SystemConfig>>('/config');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '获取配置失败',
      };
    }
  }

  /**
   * 更新系统配置
   */
  async updateConfig(config: Partial<SystemConfig>): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post<ApiResponse<void>>('/config', config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '更新配置失败',
      };
    }
  }

  /**
   * 清空对话历史
   */
  async clearHistory(): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>('/conversations');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '清空对话历史失败',
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 健康检查端点在根路径，不使用 /api 前缀
      const response = await axios.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// 导出单例
export const apiService = new ApiService();
export default apiService;
