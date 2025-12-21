/**
 * recorder-js 类型定义
 * 参考: https://github.com/recobus/recorder-js
 */

declare module 'recorder-js' {
  export interface RecorderConfig {
    // 采样率（默认 44100）
    sampleRate?: number;
    // 比特率
    bitRate?: number;
    // 通道数（1 = 单声道，2 = 立体声）
    numChannels?: number;
  }

  export interface RecordingResult {
    blob: Blob;
    buffer: Float32Array[];
  }

  export default class Recorder {
    constructor(audioContext: AudioContext, config?: RecorderConfig);

    // 初始化录音器
    init(stream: MediaStream): Promise<void>;

    // 开始录音
    start(): Promise<void>;

    // 停止录音并返回结果
    stop(): Promise<RecordingResult>;

    // 暂停录音
    pause(): void;

    // 恢复录音
    resume(): void;

    // 获取音频流
    stream: MediaStream | null;

    // 音频上下文
    context: AudioContext;

    // 录音配置
    config: RecorderConfig;
  }
}
