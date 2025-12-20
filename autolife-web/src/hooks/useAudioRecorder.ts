/**
 * 音频录制 Hook
 * 封装浏览器录音功能
 */
import { useState, useRef, useCallback } from 'react';
import Recorder from 'recorder-js';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

export interface UseAudioRecorderReturn {
  state: AudioRecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
  });

  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 创建 AudioContext
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // 创建 Recorder 实例
      const recorder = new Recorder(audioContext, {
        // 可以配置录音参数
        numChannels: 1, // 单声道
      });
      recorderRef.current = recorder;

      // 初始化并开始录音
      await recorder.init(stream);
      await recorder.start();

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      });

      // 启动计时器
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.duration + 0.1,
        }));
      }, 100);

      console.log('录音已开始');
    } catch (error: any) {
      console.error('启动录音失败:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || '无法访问麦克风',
      }));
    }
  }, []);

  /**
   * 停止录音并返回音频 Blob
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current) return null;

    try {
      // 停止录音
      const { buffer } = await recorderRef.current.stop();

      // 停止计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 停止所有音频轨道
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // 关闭 AudioContext
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // 将 buffer 转换为 Blob
      const audioBlob = new Blob(buffer, { type: 'audio/wav' });

      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        error: null,
      });

      console.log('录音已停止，大小:', audioBlob.size, 'bytes');
      return audioBlob;
    } catch (error: any) {
      console.error('停止录音失败:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || '停止录音失败',
      }));
      return null;
    }
  }, []);

  /**
   * 暂停录音
   */
  const pauseRecording = useCallback(() => {
    if (!recorderRef.current || !state.isRecording) return;

    recorderRef.current.pause();
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));

    // 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    console.log('录音已暂停');
  }, [state.isRecording]);

  /**
   * 恢复录音
   */
  const resumeRecording = useCallback(() => {
    if (!recorderRef.current || !state.isPaused) return;

    recorderRef.current.resume();
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));

    // 重新启动计时器
    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        duration: prev.duration + 0.1,
      }));
    }, 100);

    console.log('录音已恢复');
  }, [state.isPaused]);

  /**
   * 取消录音
   */
  const cancelRecording = useCallback(() => {
    // 停止计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 停止所有音频轨道
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 关闭 AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    recorderRef.current = null;

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      error: null,
    });

    console.log('录音已取消');
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  };
};
