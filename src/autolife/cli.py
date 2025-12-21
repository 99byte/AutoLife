"""
AutoLife 命令行接口
"""

import argparse
import os
import sys
from pathlib import Path

# 自动加载 .env 文件
from dotenv import load_dotenv

from autolife.agent import AutoLifeAgent
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
        description="AutoLife - 基于 AutoGLM 的智能助手",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 执行任务
  autolife "打开微信"

  # 指定 API 配置
  autolife --api-key YOUR_KEY --base-url https://api.example.com/v1

环境变量:
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

    # 任务参数
    parser.add_argument("task", nargs="?", help="要执行的任务描述")

    # 设备配置
    parser.add_argument(
        "--device-id", default=os.getenv("PHONE_AGENT_DEVICE_ID"), help="ADB 设备 ID"
    )

    # 其他选项
    parser.add_argument("--max-steps", type=int, default=100, help="每个任务的最大步骤数")
    parser.add_argument("--lang", choices=["cn", "en"], default="cn", help="语言设置")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出模式")

    args = parser.parse_args()

    # 验证输入
    if not args.task:
        parser.print_help()
        sys.exit(1)

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

    # 创建助手
    try:
        agent = AutoLifeAgent(
            model_config=model_config,
            agent_config=agent_config,
        )

        # 执行任务
        result = agent.run(args.task)
        print(f"\n✅ 任务完成: {result}")

    except Exception as e:
        print(f"\n❌ 错误: {e}", file=sys.stderr)
        if args.verbose:
            import traceback

            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
