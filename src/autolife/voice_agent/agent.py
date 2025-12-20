"""
语音代理 - 整合 AutoGLM 和语音交互能力
"""

import os
import sys
from pathlib import Path
from typing import Callable

# 添加 Open-AutoGLM 到 Python 路径
AUTOGLM_PATH = Path(__file__).parent.parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))

from phone_agent import PhoneAgent
from phone_agent.agent import AgentConfig
from phone_agent.model import ModelConfig

from autolife.voice_agent.asr import ASRBase, ZhipuASR
from autolife.voice_agent.tts import TTSBase, ZhipuTTS


class VoiceAgent:
    """
    语音智能助手

    整合 AutoGLM 的手机控制能力和语音交互能力,
    通过语音指令控制手机完成各种任务。

    特性:
    - 语音输入 (ASR)
    - 语音输出 (TTS)
    - 单次交互模式（按钮触发）
    - 持续对话模式（自动分段）
    - VAD 语音活动检测
    - 多模态理解 (语音 + 屏幕视觉)
    - 连续对话能力

    示例:
        >>> from autolife import VoiceAgent
        >>>
        >>> # 创建语音助手
        >>> agent = VoiceAgent()
        >>>
        >>> # 单次交互模式
        >>> agent.run_single_interaction()
        >>>
        >>> # 持续对话模式
        >>> agent.run_continuous_interaction()
        >>>
        >>> # 或从文本输入
        >>> agent.run_from_text("帮我搜索附近的餐厅")
    """

    def __init__(
        self,
        # AutoGLM 配置
        model_config: ModelConfig | None = None,
        agent_config: AgentConfig | None = None,
        # 语音模块配置
        asr_client: ASRBase | None = None,
        tts_client: TTSBase | None = None,
        # 回调函数
        confirmation_callback: Callable[[str], bool] | None = None,
        takeover_callback: Callable[[str], None] | None = None,
        # 语音反馈开关
        enable_voice_feedback: bool = True,
    ):
        """
        初始化语音助手

        Args:
            model_config: AutoGLM 模型配置
            agent_config: AutoGLM 代理配置
            asr_client: ASR 客户端,默认使用 ZhipuASR
            tts_client: TTS 客户端,默认使用 ZhipuTTS
            confirmation_callback: 敏感操作确认回调
            takeover_callback: 人工接管回调
            enable_voice_feedback: 是否启用语音反馈
        """
        # 如果没有提供 model_config，从环境变量创建
        if model_config is None:
            model_config = ModelConfig(
                base_url=os.getenv("AUTOGLM_BASE_URL", "http://localhost:8000/v1"),
                api_key=os.getenv("AUTOGLM_API_KEY", "EMPTY"),
                model_name=os.getenv("AUTOGLM_MODEL", "autoglm-phone-9b"),
            )

        # 初始化 AutoGLM
        self.phone_agent = PhoneAgent(
            model_config=model_config,
            agent_config=agent_config,
            confirmation_callback=confirmation_callback,
            takeover_callback=takeover_callback,
        )

        # 初始化语音模块
        self.asr = asr_client or ZhipuASR()
        self.tts = tts_client or ZhipuTTS()

        self.enable_voice_feedback = enable_voice_feedback

        # 会话状态
        self.is_active = False
        self.conversation_history = []

    def run_from_text(self, task: str, speak_result: bool = True) -> str:
        """
        从文本指令执行任务

        Args:
            task: 任务描述
            speak_result: 是否朗读结果

        Returns:
            str: 执行结果消息
        """
        print(f"\n[用户] {task}")

        # 执行任务
        result = self.phone_agent.run(task)

        # 语音反馈
        if speak_result and self.enable_voice_feedback:
            self.tts.speak(result)
        else:
            print(f"[助手] {result}")

        # 记录历史
        self.conversation_history.append({"role": "user", "content": task})
        self.conversation_history.append({"role": "assistant", "content": result})

        return result

    def run_from_voice(self, audio_input) -> str:
        """
        从语音指令执行任务

        Args:
            audio_input: 音频输入 (文件路径或音频数据)

        Returns:
            str: 执行结果消息
        """
        # 语音识别
        asr_result = self.asr.transcribe(audio_input)
        task = asr_result.text

        print(f"\n[语音识别] {task} (置信度: {asr_result.confidence:.2f})")

        # 执行任务
        return self.run_from_text(task, speak_result=True)

    def run_single_interaction(self, duration: float = 5.0) -> str:
        """
        单次语音交互

        前端点击按钮 → 录音 duration 秒 → ASR 识别 → 执行任务 → TTS 反馈

        Args:
            duration: 录音时长（秒），默认 5 秒

        Returns:
            str: 执行结果
        """
        from autolife.voice_agent.audio import AudioRecorder
        import tempfile

        recorder = AudioRecorder()

        print(f"[录音中] 请说出你的指令（{duration} 秒）...")
        audio = recorder.record_for_duration(duration)

        # 保存临时文件
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            temp_path = Path(f.name)
            recorder.save_to_file(audio, temp_path)

        try:
            # ASR 识别并执行
            result = self.run_from_voice(temp_path)
            return result
        finally:
            # 清理临时文件
            temp_path.unlink(missing_ok=True)

    def run_continuous_interaction(self) -> None:
        """
        持续对话模式

        前端点击开始 → 持续监听 → VAD 检测语音停顿 → 自动分段识别 → 执行
        → 继续监听 → 点击停止退出

        使用 VAD（语音活动检测）自动分段，无需唤醒词
        """
        from autolife.voice_agent.audio import AudioRecorder
        import tempfile

        self.is_active = True
        recorder = AudioRecorder()

        print("\n🎤 持续对话模式已启动")
        print("   开始说话，系统会自动检测语音停顿")
        print("   按 Ctrl+C 退出\n")

        try:
            while self.is_active:
                # 使用 VAD 检测语音活动
                audio = self._record_until_silence(recorder)

                if len(audio) > 0:
                    # 保存并识别
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                        temp_path = Path(f.name)
                        recorder.save_to_file(audio, temp_path)

                    try:
                        self.run_from_voice(temp_path)
                    except Exception as e:
                        print(f"[错误] {e}")
                    finally:
                        temp_path.unlink(missing_ok=True)

        except KeyboardInterrupt:
            print("\n\n正在退出...")
            self.stop_listening()

    def _record_until_silence(
        self,
        recorder,
        chunk_duration: float = 0.5,
        silence_threshold: float = 0.01,
        silence_duration: float = 2.0,
    ):
        """
        录音直到检测到静音

        Args:
            recorder: 录音器
            chunk_duration: 每次录音块的时长（秒）
            silence_threshold: 静音阈值（音量）
            silence_duration: 静音持续时长（秒）才停止

        Returns:
            np.ndarray: 录制的音频数据
        """
        import numpy as np

        audio_chunks = []
        silence_chunks = 0
        max_silence_chunks = int(silence_duration / chunk_duration)

        print("[监听中] 等待语音输入...")

        while True:
            # 录制一小段
            chunk = recorder.record_for_duration(chunk_duration)

            # 计算音量
            volume = np.abs(chunk).mean()

            if volume > silence_threshold:
                # 有声音
                audio_chunks.append(chunk)
                silence_chunks = 0
                print(".", end="", flush=True)  # 显示录音中
            else:
                # 静音
                if len(audio_chunks) > 0:
                    # 已经录到声音了，开始计数静音
                    silence_chunks += 1
                    audio_chunks.append(chunk)

                    if silence_chunks >= max_silence_chunks:
                        print("\n[检测到] 语音结束")
                        break

        if len(audio_chunks) == 0:
            return np.array([])

        return np.concatenate(audio_chunks, axis=0)

    def start_listening(self) -> None:
        """
        启动语音监听模式（向后兼容，使用持续对话模式）

        已废弃：请使用 run_continuous_interaction() 代替
        """
        print("[提示] start_listening() 已废弃，使用持续对话模式")
        self.run_continuous_interaction()

    def stop_listening(self) -> None:
        """停止语音监听"""
        self.is_active = False
        print("\n[语音助手] 已停止")

    def clear_history(self) -> None:
        """清空对话历史"""
        self.conversation_history = []
        print("[语音助手] 对话历史已清空")

    def get_conversation_summary(self) -> str:
        """
        获取对话摘要

        Returns:
            str: 对话摘要
        """
        if not self.conversation_history:
            return "暂无对话记录"

        summary = []
        for i, msg in enumerate(self.conversation_history, 1):
            role = "用户" if msg["role"] == "user" else "助手"
            summary.append(f"{i}. [{role}] {msg['content'][:50]}...")

        return "\n".join(summary)
