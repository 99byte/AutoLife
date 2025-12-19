"""
端到端集成测试

测试 VoiceAgent 的完整功能
"""

from pathlib import Path
from autolife.voice_agent.agent import VoiceAgent
from autolife.voice_agent.tts import ZhipuTTS
from unittest.mock import Mock, patch


def test_voice_agent_initialization():
    """测试 1：VoiceAgent 初始化"""
    print("\n" + "=" * 50)
    print("测试 1：VoiceAgent 初始化")
    print("=" * 50)

    try:
        agent = VoiceAgent(enable_voice_feedback=False)

        print("✅ VoiceAgent 初始化成功")
        print(f"   ASR 客户端: {type(agent.asr).__name__}")
        print(f"   TTS 客户端: {type(agent.tts).__name__}")
        print(f"   唤醒词检测器: {type(agent.wake_word).__name__}")
        print(f"   语音反馈: {'启用' if agent.enable_voice_feedback else '禁用'}")

        assert agent.asr is not None, "ASR 客户端未初始化"
        assert agent.tts is not None, "TTS 客户端未初始化"
        assert agent.wake_word is not None, "唤醒词检测器未初始化"

        return True
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_voice_agent_run_from_text_mock():
    """测试 2：文本模式（模拟 PhoneAgent）"""
    print("\n" + "=" * 50)
    print("测试 2：文本模式（模拟 PhoneAgent）")
    print("=" * 50)

    try:
        # 模拟 PhoneAgent.run() 方法
        with patch('autolife.voice_agent.agent.PhoneAgent') as MockPhoneAgent:
            mock_instance = MockPhoneAgent.return_value
            mock_instance.run.return_value = "任务完成：已打开微信"

            agent = VoiceAgent(enable_voice_feedback=False)
            result = agent.run_from_text("打开微信")

            print(f"✅ 文本模式测试通过")
            print(f"   输入: '打开微信'")
            print(f"   输出: '{result}'")
            print(f"   对话历史长度: {len(agent.conversation_history)}")

            assert result == "任务完成：已打开微信", "返回结果不正确"
            assert len(agent.conversation_history) == 2, "对话历史记录不正确"

            return True
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_voice_agent_run_from_voice():
    """测试 3：语音模式（使用真实 ASR）"""
    print("\n" + "=" * 50)
    print("测试 3：语音模式（使用真实 ASR）")
    print("=" * 50)

    try:
        # 准备测试音频
        test_file = Path("test_e2e_audio.wav")
        if not test_file.exists():
            print("生成测试音频...")
            tts = ZhipuTTS()
            tts.save_to_file("打开设置", test_file)

        # 模拟 PhoneAgent.run() 方法
        with patch('autolife.voice_agent.agent.PhoneAgent') as MockPhoneAgent:
            mock_instance = MockPhoneAgent.return_value
            mock_instance.run.return_value = "任务完成：已打开设置"

            agent = VoiceAgent(enable_voice_feedback=False)
            result = agent.run_from_voice(test_file)

            print(f"✅ 语音模式测试通过")
            print(f"   音频文件: {test_file}")
            print(f"   输出: '{result}'")

            assert result == "任务完成：已打开设置", "返回结果不正确"

            # 清理
            test_file.unlink(missing_ok=True)

            return True
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_conversation_history():
    """测试 4：对话历史管理"""
    print("\n" + "=" * 50)
    print("测试 4：对话历史管理")
    print("=" * 50)

    try:
        with patch('autolife.voice_agent.agent.PhoneAgent') as MockPhoneAgent:
            mock_instance = MockPhoneAgent.return_value
            mock_instance.run.return_value = "任务完成"

            agent = VoiceAgent(enable_voice_feedback=False)

            # 执行多次任务
            agent.run_from_text("打开微信")
            agent.run_from_text("发送消息")
            agent.run_from_text("打开设置")

            print(f"✅ 对话历史测试通过")
            print(f"   执行任务数: 3")
            print(f"   对话记录数: {len(agent.conversation_history)}")

            assert len(agent.conversation_history) == 6, "对话历史记录数量不正确"

            # 测试清空历史
            agent.clear_history()
            assert len(agent.conversation_history) == 0, "清空历史失败"
            print(f"   清空后记录数: {len(agent.conversation_history)}")

            return True
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_voice_feedback():
    """测试 5：语音反馈功能"""
    print("\n" + "=" * 50)
    print("测试 5：语音反馈功能")
    print("=" * 50)

    try:
        # 测试启用语音反馈
        with patch('autolife.voice_agent.agent.PhoneAgent') as MockPhoneAgent:
            mock_instance = MockPhoneAgent.return_value
            mock_instance.run.return_value = "测试完成"

            # 模拟 TTS.speak() 方法
            with patch.object(ZhipuTTS, 'speak') as mock_speak:
                agent = VoiceAgent(enable_voice_feedback=True)
                agent.run_from_text("测试")

                # 验证 speak 被调用
                mock_speak.assert_called_once_with("测试完成")
                print(f"✅ 语音反馈已启用，TTS.speak() 被正确调用")

        # 测试禁用语音反馈
        with patch('autolife.voice_agent.agent.PhoneAgent') as MockPhoneAgent:
            mock_instance = MockPhoneAgent.return_value
            mock_instance.run.return_value = "测试完成"

            with patch.object(ZhipuTTS, 'speak') as mock_speak:
                agent = VoiceAgent(enable_voice_feedback=False)
                agent.run_from_text("测试")

                # 验证 speak 未被调用
                mock_speak.assert_not_called()
                print(f"✅ 语音反馈已禁用，TTS.speak() 未被调用")

        return True
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("AutoLife 端到端集成测试")
    print("=" * 60)

    results = []

    # 运行测试
    results.append(("VoiceAgent 初始化", test_voice_agent_initialization()))
    results.append(("文本模式", test_voice_agent_run_from_text_mock()))
    results.append(("语音模式", test_voice_agent_run_from_voice()))
    results.append(("对话历史管理", test_conversation_history()))
    results.append(("语音反馈功能", test_voice_feedback()))

    # 输出结果
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} - {name}")

    print("\n" + "-" * 60)
    print(f"总计: {passed}/{total} 测试通过")
    print("=" * 60)

    if passed == total:
        print("\n🎉 所有测试通过！端到端集成测试完成。")
        print("\n✅ 阶段 1 任务完成：ASR/TTS API 集成和测试")
        print("   - ASR API 实现 ✅")
        print("   - TTS API 实现 ✅")
        print("   - ASR 功能测试 ✅")
        print("   - TTS 功能测试 ✅")
        print("   - 端到端集成测试 ✅")
    else:
        print(f"\n⚠️  有 {total - passed} 个测试失败，请检查错误信息。")


if __name__ == "__main__":
    main()
