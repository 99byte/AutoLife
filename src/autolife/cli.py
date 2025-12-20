"""
AutoLife 命令行接口
"""

import argparse
import os
import sys
from pathlib import Path

# 自动加载 .env 文件
from dotenv import load_dotenv

from autolife.voice_agent.agent import VoiceAgent
from phone_agent.agent import AgentConfig
from phone_agent.model import ModelConfig


def main():
    """CLI 主入口"""
    # 加载 .env 文件（从当前目录或项目根目录）
    env_path = Path.cwd() / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"[配置] 已加载环境变量: {env_path}")
    else:
        # 尝试从项目根目录加载
        project_root = Path(__file__).parent.parent.parent.parent
        env_path = project_root / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            print(f"[配置] 已加载环境变量: {env_path}")
        else:
            print("[提示] 未找到 .env 文件，将使用命令行参数或系统环境变量")

    parser = argparse.ArgumentParser(
        description="AutoLife - 基于 AutoGLM 的语音智能助手",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 文本模式运行单次任务
  autolife --text "打开微信"

  # 单次语音交互（录音 5 秒）
  autolife --listen single

  # 持续对话模式（自动检测语音停顿）
  autolife --listen continuous

  # 指定 API 配置
  autolife --api-key YOUR_KEY --base-url https://api.example.com/v1

环境变量:
  ZHIPUAI_API_KEY          智谱 AI API 密钥
  AUTOGLM_BASE_URL         AutoGLM 模型 API 地址
  AUTOGLM_MODEL            AutoGLM 模型名称
  PHONE_AGENT_DEVICE_ID    ADB 设备 ID
        """,
    )

    # 模型配置
    parser.add_argument(
        "--base-url",
        default=os.getenv("AUTOGLM_BASE_URL", "http://localhost:8000/v1"),
        help="模型 API 基础 URL",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("AUTOGLM_MODEL", "autoglm-phone-9b"),
        help="模型名称",
    )
    parser.add_argument("--api-key", default=os.getenv("AUTOGLM_API_KEY", "EMPTY"), help="API 密钥")

    # 运行模式
    parser.add_argument("--text", "-t", help="文本模式: 直接执行指定任务")
    parser.add_argument(
        "--listen",
        "-l",
        choices=["single", "continuous"],
        help="语音交互模式: single=单次交互(5秒), continuous=持续对话(自动分段)",
    )
    parser.add_argument("--audio", "-a", help="音频文件模式: 从音频文件识别并执行任务")

    # 设备配置
    parser.add_argument(
        "--device-id", default=os.getenv("PHONE_AGENT_DEVICE_ID"), help="ADB 设备 ID"
    )

    # 语音配置
    parser.add_argument(
        "--no-voice-feedback", action="store_true", help="禁用语音反馈,仅文本输出"
    )

    # 其他选项
    parser.add_argument("--max-steps", type=int, default=100, help="每个任务的最大步骤数")
    parser.add_argument("--lang", choices=["cn", "en"], default="cn", help="语言设置")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出模式")

    args = parser.parse_args()

    # 验证运行模式
    if not any([args.text, args.listen, args.audio]):
        parser.error("请指定运行模式: --text, --listen 或 --audio")

    # 配置模型
    model_config = ModelConfig(
        base_url=args.base_url, model_name=args.model, api_key=args.api_key
    )

    # 配置代理
    agent_config = AgentConfig(
        max_steps=args.max_steps,
        device_id=args.device_id,
        lang=args.lang,
        verbose=args.verbose,
    )

    # 创建语音助手
    try:
        agent = VoiceAgent(
            model_config=model_config,
            agent_config=agent_config,
            enable_voice_feedback=not args.no_voice_feedback,
        )

        # 根据模式运行
        if args.text:
            # 文本模式
            result = agent.run_from_text(args.text)
            print(f"\n✅ 任务完成: {result}")

        elif args.audio:
            # 音频文件模式
            result = agent.run_from_voice(args.audio)
            print(f"\n✅ 任务完成: {result}")

        elif args.listen:
            # 语音交互模式
            if args.listen == "single":
                # 单次交互
                print("\n[单次交互模式] 点击按钮开始录音...")
                result = agent.run_single_interaction()
                print(f"\n✅ 任务完成: {result}")
            else:
                # 持续对话
                try:
                    agent.run_continuous_interaction()
                except KeyboardInterrupt:
                    print("\n\n正在退出...")
                    agent.stop_listening()

    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        if args.verbose:
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
