"""
测试 TTS 功能

验证智谱 AI TTS API 集成是否正常工作
"""

from pathlib import Path
from autolife.voice_agent.tts import ZhipuTTS, TTSConfig


def test_tts_synthesize():
    """测试 1：合成音频"""
    print("\n" + "=" * 50)
    print("测试 1：合成音频")
    print("=" * 50)

    try:
        tts = ZhipuTTS()
        audio_data = tts.synthesize("你好，我是智能语音助手")
        print(f"✅ 音频数据大小: {len(audio_data)} 字节")
        return True
    except Exception as e:
        print(f"❌ 合成失败: {e}")
        return False


def test_tts_save_to_file():
    """测试 2：保存到文件"""
    print("\n" + "=" * 50)
    print("测试 2：保存到文件")
    print("=" * 50)

    try:
        tts = ZhipuTTS()
        output_path = Path("test_output.wav")
        tts.save_to_file("这是一个测试", output_path)

        if output_path.exists():
            file_size = output_path.stat().st_size
            print(f"✅ 已保存到 {output_path}")
            print(f"   文件大小: {file_size} 字节")
            return True
        else:
            print(f"❌ 文件未创建")
            return False
    except Exception as e:
        print(f"❌ 保存失败: {e}")
        return False


def test_tts_speak():
    """测试 3：直接播放"""
    print("\n" + "=" * 50)
    print("测试 3：直接播放")
    print("=" * 50)

    try:
        tts = ZhipuTTS()
        print("开始播放：'打开微信'")
        tts.speak("打开微信")
        print("✅ 播放完成")
        return True
    except ImportError as e:
        print(f"⚠️  缺少音频库: {e}")
        print("   请运行: uv add sounddevice soundfile")
        return False
    except Exception as e:
        print(f"❌ 播放失败: {e}")
        return False


def test_tts_with_config():
    """测试 4：自定义配置"""
    print("\n" + "=" * 50)
    print("测试 4：自定义配置（男声、语速 1.2 倍）")
    print("=" * 50)

    try:
        tts = ZhipuTTS()
        config = TTSConfig(
            voice="male",    # 男声
            speed=1.2,       # 语速 1.2 倍
            volume=0.8       # 音量 80%
        )
        print("开始播放：'这是男声，语速稍快'")
        tts.speak("这是男声，语速稍快", config)
        print("✅ 播放完成")
        return True
    except Exception as e:
        print(f"❌ 播放失败: {e}")
        return False


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("智谱 AI TTS 功能测试")
    print("=" * 60)

    results = []

    # 运行测试
    results.append(("合成音频", test_tts_synthesize()))
    results.append(("保存到文件", test_tts_save_to_file()))
    results.append(("直接播放", test_tts_speak()))
    results.append(("自定义配置", test_tts_with_config()))

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
        print("\n🎉 所有测试通过！TTS 功能正常。")
    else:
        print(f"\n⚠️  有 {total - passed} 个测试失败，请检查错误信息。")


if __name__ == "__main__":
    main()
