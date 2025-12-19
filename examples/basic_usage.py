"""
基础使用示例
"""

from autolife import VoiceAgent
from phone_agent.model import ModelConfig


def example_text_mode():
    """示例 1: 文本模式使用"""
    print("=== 示例 1: 文本模式 ===\n")

    # 创建语音助手
    agent = VoiceAgent(
        model_config=ModelConfig(
            base_url="http://localhost:8000/v1", model="autoglm-phone-9b"
        )
    )

    # 执行文本指令
    tasks = ["打开微信", "搜索附近的餐厅", "查看今天的日程"]

    for task in tasks:
        print(f"\n执行任务: {task}")
        result = agent.run_from_text(task, speak_result=False)
        print(f"结果: {result}")


def example_voice_mode():
    """示例 2: 语音模式使用"""
    print("\n=== 示例 2: 语音模式 ===\n")

    agent = VoiceAgent()

    # 从音频文件识别并执行
    # audio_file = "recording.wav"
    # result = agent.run_from_voice(audio_file)
    # print(f"结果: {result}")

    print("注意: 需要准备音频文件才能运行此示例")


def example_conversation():
    """示例 3: 连续对话"""
    print("\n=== 示例 3: 连续对话 ===\n")

    agent = VoiceAgent()

    # 多轮对话
    tasks = [
        "打开小红书",
        "搜索美食",
        "点开第一个帖子",  # 上下文: 在小红书的搜索结果中
        "分享给微信好友",  # 上下文: 在帖子详情页
    ]

    for task in tasks:
        print(f"\n用户: {task}")
        result = agent.run_from_text(task, speak_result=False)
        print(f"助手: {result}")

    # 查看对话历史
    print("\n对话摘要:")
    print(agent.get_conversation_summary())


def example_custom_asr_tts():
    """示例 4: 自定义 ASR/TTS"""
    print("\n=== 示例 4: 自定义 ASR/TTS ===\n")

    from autolife.voice_agent.asr import ZhipuASR
    from autolife.voice_agent.tts import ZhipuTTS

    # 单独使用 ASR
    asr = ZhipuASR(api_key="your-key")
    # result = asr.transcribe("audio.wav")
    # print(f"ASR 识别: {result.text}")

    # 单独使用 TTS
    tts = ZhipuTTS(api_key="your-key")
    # tts.speak("你好,我是智能助手")

    print("注意: 需要配置 API Key 才能运行此示例")


def example_wake_word():
    """示例 5: 唤醒词检测"""
    print("\n=== 示例 5: 唤醒词检测 ===\n")

    from autolife.voice_agent.wakeword import WakeWordDetector

    # 创建唤醒词检测器
    detector = WakeWordDetector(
        wake_words=["小智", "AutoLife", "智能助手"],
        callback=lambda: print("检测到唤醒词!"),
    )

    # 测试文本检测
    test_texts = [
        "小智,帮我打开微信",
        "今天天气怎么样",
        "AutoLife 搜索附近的餐厅",
        "这是一段普通的文本",
    ]

    for text in test_texts:
        print(f"\n输入: {text}")
        if detector.detect(text):
            print("→ 触发唤醒!")
        else:
            print("→ 未触发")


if __name__ == "__main__":
    # 运行所有示例
    example_text_mode()
    example_voice_mode()
    example_conversation()
    example_custom_asr_tts()
    example_wake_word()
