/**
 * 语音控制面板组件
 * 包含录音按钮、模式切换、文本输入等
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Progress,
  message,
  Input,
  Radio,
  Divider,
  Typography,
  Tag,
} from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  SendOutlined,
  ClearOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import { useVoiceStore } from '../store/voiceStore.js';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { apiService } from '../services/api.js';
import type { InteractionMode } from '../types/index.js';

const { Text } = Typography;

export const VoiceControl: React.FC = () => {
  const {
    interactionMode,
    setInteractionMode,
    recordingStatus,
    setRecordingStatus,
    isListening,
    toggleListening,
    addMessage,
    clearMessages,
    config,
  } = useVoiceStore();

  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { state, startRecording, stopRecording } = useAudioRecorder();

  // 录音进度百分比
  const recordingProgress = Math.min(
    (state.duration / config.recordingDuration) * 100,
    100
  );

  /**
   * 发送文本指令
   */
  const handleSendText = async () => {
    if (!textInput.trim()) {
      message.warning('请输入指令');
      return;
    }

    // 添加用户消息
    addMessage({
      role: 'user',
      content: textInput,
    });

    setIsProcessing(true);

    try {
      // 调用 API
      const response = await apiService.sendTextCommand(textInput);

      if (response.success && response.data) {
        // 添加 AI 响应
        addMessage({
          role: 'assistant',
          content: response.data.text,
        });
        message.success('指令执行成功');
      } else {
        throw new Error(response.error || '指令执行失败');
      }
    } catch (error: any) {
      message.error(error.message || '发送失败');
      addMessage({
        role: 'assistant',
        content: `抱歉，执行失败：${error.message}`,
      });
    } finally {
      setIsProcessing(false);
      setTextInput('');
    }
  };

  /**
   * 单次录音交互
   */
  const handleSingleRecording = async () => {
    if (state.isRecording) {
      // 停止录音
      setRecordingStatus('processing');
      const audioBlob = await stopRecording();

      if (audioBlob) {
        try {
          // 添加用户消息（占位）
          addMessage({
            role: 'user',
            content: '🎤 语音输入中...',
            isTyping: true,
          });

          // 调用 API
          const response = await apiService.sendSingleVoice(audioBlob);

          if (response.success && response.data) {
            // 更新用户消息为 ASR 识别结果
            addMessage({
              role: 'user',
              content: response.data.asrResult?.text || '语音识别失败',
              confidence: response.data.asrResult?.confidence,
            });

            // 添加 AI 响应
            addMessage({
              role: 'assistant',
              content: response.data.text,
            });

            message.success('语音交互完成');
          } else {
            throw new Error(response.error || '语音交互失败');
          }
        } catch (error: any) {
          message.error(error.message || '语音交互失败');
          addMessage({
            role: 'assistant',
            content: `抱歉，语音交互失败：${error.message}`,
          });
        } finally {
          setRecordingStatus('idle');
        }
      }
    } else {
      // 开始录音
      await startRecording();
      setRecordingStatus('recording');

      // 自动在指定时长后停止
      setTimeout(async () => {
        if (state.isRecording) {
          await handleSingleRecording();
        }
      }, config.recordingDuration * 1000);
    }
  };

  /**
   * 持续对话模式切换
   */
  const handleToggleContinuous = () => {
    toggleListening();
    if (!isListening) {
      message.info('持续对话模式已开启');
      // TODO: 连接 WebSocket
    } else {
      message.info('持续对话模式已关闭');
      // TODO: 断开 WebSocket
    }
  };

  /**
   * 清空对话历史
   */
  const handleClearMessages = () => {
    clearMessages();
    message.success('对话历史已清空');
  };

  return (
    <Card title="控制面板" style={{ height: '100%' }}>
      <Space vertical size="middle" style={{ width: '100%' }}>
        {/* 交互模式选择 */}
        <div>
          <Text strong>交互模式</Text>
          <Radio.Group
            value={interactionMode}
            onChange={(e) => setInteractionMode(e.target.value)}
            style={{ marginTop: '8px', display: 'block' }}
          >
            <Space vertical>
              <Radio value="text">文本模式</Radio>
              <Radio value="single">单次语音</Radio>
              <Radio value="continuous" disabled>
                持续对话 <Tag color="orange">开发中</Tag>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* 文本输入模式 */}
        {interactionMode === 'text' && (
          <div>
            <Text strong>文本输入</Text>
            <Sender
              placeholder="输入指令，如：打开微信"
              value={textInput}
              onChange={setTextInput}
              onSubmit={handleSendText}
              loading={isProcessing}
              style={{ marginTop: '8px' }}
            />
          </div>
        )}

        {/* 单次录音模式 */}
        {interactionMode === 'single' && (
          <div>
            <Text strong>单次录音</Text>
            <div style={{ marginTop: '8px' }}>
              <Button
                type="primary"
                size="large"
                icon={state.isRecording ? <StopOutlined /> : <AudioOutlined />}
                onClick={handleSingleRecording}
                loading={recordingStatus === 'processing'}
                danger={state.isRecording}
                block
              >
                {state.isRecording
                  ? `录音中... (${state.duration.toFixed(1)}s)`
                  : `按住录音 (${config.recordingDuration}秒)`}
              </Button>

              {state.isRecording && (
                <Progress
                  percent={recordingProgress}
                  status="active"
                  style={{ marginTop: '8px' }}
                  format={(percent) =>
                    `${state.duration.toFixed(1)}s / ${config.recordingDuration}s`
                  }
                />
              )}

              {state.error && (
                <Text type="danger" style={{ display: 'block', marginTop: '8px' }}>
                  {state.error}
                </Text>
              )}
            </div>
          </div>
        )}

        {/* 持续对话模式 */}
        {interactionMode === 'continuous' && (
          <div>
            <Text strong>持续对话</Text>
            <Button
              type="primary"
              size="large"
              icon={isListening ? <StopOutlined /> : <SoundOutlined />}
              onClick={handleToggleContinuous}
              danger={isListening}
              block
              style={{ marginTop: '8px' }}
            >
              {isListening ? '停止监听' : '开始监听'}
            </Button>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
              持续对话模式需要 WebSocket 支持，需要先启动后端服务
            </Text>
          </div>
        )}

        <Divider style={{ margin: '8px 0' }} />

        {/* 操作按钮 */}
        <Space style={{ width: '100%' }} vertical>
          <Button icon={<ClearOutlined />} onClick={handleClearMessages} block>
            清空历史
          </Button>
        </Space>

        {/* 状态显示 */}
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            状态: {recordingStatus === 'idle' && '空闲'}
            {recordingStatus === 'recording' && '录音中'}
            {recordingStatus === 'processing' && '处理中'}
            {recordingStatus === 'completed' && '完成'}
            {recordingStatus === 'error' && '错误'}
          </Text>
        </div>
      </Space>
    </Card>
  );
};
