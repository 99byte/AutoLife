"""
测试音频录制功能

验证 AudioRecorder 类的各项功能
"""

from pathlib import Path
from autolife.voice_agent.audio import AudioRecorder
import time


def test_audio_system():
    """测试 1：测试音频系统"""
    print("\n" + "=" * 50)
    print("测试 1：测试音频系统")
    print("=" * 50)

    try:
        AudioRecorder.test_audio()
        print("✅ 音频系统正常")
        return True
    except Exception as e:
        print(f"❌ 音频系统测试失败: {e}")
        return False


def test_list_devices():
    """测试 2：列出可用设备"""
    print("\n" + "=" * 50)
    print("测试 2：列出可用音频设备")
    print("=" * 50)

    try:
        recorder = AudioRecorder()
        devices = recorder.get_available_devices()

        print(f"\n找到 {len(devices)} 个音频设备:\n")
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0:
                print(f"  [{i}] {device['name']}")
                print(f"      输入通道: {device['max_input_channels']}")
                print(f"      采样率: {device['default_samplerate']} Hz")

        print("\n✅ 设备列表获取成功")
        return True
    except Exception as e:
        print(f"❌ 获取设备列表失败: {e}")
        return False


def test_record_for_duration():
    """测试 3：定时录音"""
    print("\n" + "=" * 50)
    print("测试 3：定时录音（3 秒）")
    print("=" * 50)

    try:
        recorder = AudioRecorder()
        output_path = Path("test_recording_duration.wav")

        print("\n⚠️  请准备麦克风，录音将在 2 秒后开始...")
        time.sleep(2)

        # 录制 3 秒
        audio = recorder.record_for_duration(3.0)

        # 保存到文件
        recorder.save_to_file(audio, output_path)

        # 验证文件
        if output_path.exists():
            file_size = output_path.stat().st_size
            print(f"✅ 录音成功")
            print(f"   文件: {output_path}")
            print(f"   大小: {file_size} 字节")
            print(f"   音频长度: {len(audio)} 采样点")
            return True
        else:
            print("❌ 录音文件未创建")
            return False

    except Exception as e:
        print(f"❌ 定时录音失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_start_stop_recording():
    """测试 4：实时录音（手动控制）"""
    print("\n" + "=" * 50)
    print("测试 4：实时录音（手动控制，5 秒）")
    print("=" * 50)

    try:
        recorder = AudioRecorder()
        output_path = Path("test_recording_realtime.wav")

        print("\n⚠️  请准备麦克风，录音将在 2 秒后开始...")
        time.sleep(2)

        # 开始录音
        recorder.start_recording()

        # 录制 5 秒
        print("[录音中] 请说话...")
        time.sleep(5)

        # 停止录音
        audio = recorder.stop_recording()

        # 保存到文件
        recorder.save_to_file(audio, output_path)

        # 验证文件
        if output_path.exists():
            file_size = output_path.stat().st_size
            print(f"✅ 实时录音成功")
            print(f"   文件: {output_path}")
            print(f"   大小: {file_size} 字节")
            print(f"   音频长度: {len(audio)} 采样点")
            return True
        else:
            print("❌ 录音文件未创建")
            return False

    except Exception as e:
        print(f"❌ 实时录音失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_asr_integration():
    """测试 5：与 ASR 集成"""
    print("\n" + "=" * 50)
    print("测试 5：录音 + ASR 识别集成")
    print("=" * 50)

    try:
        from autolife.voice_agent.asr import ZhipuASR

        recorder = AudioRecorder()
        asr = ZhipuASR()
        output_path = Path("test_recording_asr.wav")

        print("\n⚠️  请准备麦克风，录音将在 2 秒后开始...")
        print("   请说: '你好，我是智能助手'")
        time.sleep(2)

        # 录制 3 秒
        audio = recorder.record_for_duration(3.0)
        recorder.save_to_file(audio, output_path)

        # 使用 ASR 识别
        print("\n[ASR] 正在识别...")
        result = asr.transcribe(output_path)

        print(f"✅ 集成测试成功")
        print(f"   识别结果: {result.text}")
        print(f"   置信度: {result.confidence}")

        return True

    except Exception as e:
        print(f"❌ 集成测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("音频录制功能测试")
    print("=" * 60)

    results = []

    # 运行测试
    results.append(("音频系统测试", test_audio_system()))
    results.append(("列出可用设备", test_list_devices()))

    # 询问是否继续录音测试
    print("\n" + "=" * 60)
    print("⚠️  接下来将进行麦克风录音测试")
    print("   请确保麦克风已连接并授权")
    print("=" * 60)

    response = input("\n是否继续录音测试？(y/n): ").strip().lower()

    if response == 'y':
        results.append(("定时录音", test_record_for_duration()))
        results.append(("实时录音", test_start_stop_recording()))
        results.append(("录音+ASR集成", test_asr_integration()))
    else:
        print("\n⏭️  跳过录音测试")

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
        print("\n🎉 所有测试通过！音频录制功能正常。")
    else:
        print(f"\n⚠️  有 {total - passed} 个测试失败，请检查错误信息。")

    # 清理测试文件（可选）
    cleanup = input("\n是否删除测试音频文件？(y/n): ").strip().lower()
    if cleanup == 'y':
        import os
        test_files = [
            "test_recording_duration.wav",
            "test_recording_realtime.wav",
            "test_recording_asr.wav"
        ]
        for file in test_files:
            try:
                if Path(file).exists():
                    os.remove(file)
                    print(f"  已删除: {file}")
            except Exception as e:
                print(f"  删除失败 {file}: {e}")


if __name__ == "__main__":
    main()
