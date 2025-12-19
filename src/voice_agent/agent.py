"""
语音代理 - 整合 AutoGLM 和语音交互能力
"""

import sys
from pathlib import Path
from typing import Callable

# 添加 Open-AutoGLM 到 Python 路径
AUTOGLM_PATH = Path(__file__).parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))

from phone_agent import PhoneAgent
from phone_agent.agent import AgentConfig
from phone_agent.model import ModelConfig

from autolife.voice_agent.asr import ASRBase, ZhipuASR
from autolife.voice_agent.tts import TTSBase, ZhipuTTS
from autolife.voice_agent.wakeword import WakeWordDetector


class VoiceAgent:
    """
    语音智能助手

    整合 AutoGLM 的手机控制能力和语音交互能力,
    通过语音指令控制手机完成各种任务。

    特性:
    - 语音输入 (ASR)
    - 语音输出 (TTS)
    - 唤醒词检测
    - 多模态理解 (语音 + 屏幕视觉)
    - 连续对话能力

    示例:
        >>> from autolife import VoiceAgent
        >>>
        >>> # 创建语音助手
        >>> agent = VoiceAgent()
        >>>
        >>> # 语音控制手机
        >>> agent.run_from_voice("打开微信")
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
        wake_word_detector: WakeWordDetector | None = None,
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
            wake_word_detector: 唤醒词检测器
            confirmation_callback: 敏感操作确认回调
            takeover_callback: 人工接管回调
            enable_voice_feedback: 是否启用语音反馈
        """
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
        self.wake_word = wake_word_detector or WakeWordDetector()

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

    def start_listening(self) -> None:
        """
        启动语音监听模式

        持续监听语音输入,检测唤醒词后执行任务
        """
        self.is_active = True
        self.wake_word.start()

        print("\n🎤 语音助手已启动,说出唤醒词开始使用...")
        print(f"   唤醒词: {', '.join(self.wake_word.wake_words)}")
        print("   按 Ctrl+C 退出\n")

        # TODO: 实现实际的音频流监听
        # while self.is_active:
        #     # 录制音频
        #     audio_chunk = record_audio()
        #
        #     # 检测唤醒词
        #     if self.wake_word.detect_from_audio(audio_chunk):
        #         # 继续录制完整指令
        #         audio_command = record_command()
        #
        #         # 识别并执行
        #         self.run_from_voice(audio_command)

    def stop_listening(self) -> None:
        """停止语音监听"""
        self.is_active = False
        self.wake_word.stop()
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
