/**
 * jMuxer 类型声明
 * H.264 视频流解码库
 */
declare module 'jmuxer' {
  interface JMuxerOptions {
    /** 目标 video 元素 */
    node: HTMLVideoElement;
    /** 模式：video, audio, both */
    mode: 'video' | 'audio' | 'both';
    /** 缓冲刷新时间（毫秒），0 表示立即刷新 */
    flushingTime?: number;
    /** 帧率 */
    fps?: number;
    /** 是否启用调试日志 */
    debug?: boolean;
    /** 错误回调 */
    onError?: (error: Error) => void;
    /** 准备就绪回调 */
    onReady?: () => void;
    /** 缓冲满回调 */
    onBufferFull?: () => void;
  }

  interface FeedData {
    /** 视频数据 */
    video?: Uint8Array;
    /** 音频数据 */
    audio?: Uint8Array;
    /** 时间戳（毫秒） */
    duration?: number;
  }

  class JMuxer {
    constructor(options: JMuxerOptions);
    /** 喂入数据 */
    feed(data: FeedData): void;
    /** 重置解码器 */
    reset(): void;
    /** 销毁实例 */
    destroy(): void;
  }

  export default JMuxer;
}
