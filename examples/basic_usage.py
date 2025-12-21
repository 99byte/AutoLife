"""
基础使用示例
"""

from autolife import AutoLifeAgent


def example_text_mode():
    """示例 1: 文本模式使用"""
    print("\n=== 示例 1: 文本模式 ===\n")

    # 创建助手
    agent = AutoLifeAgent()

    # 文本控制
    task = "打开微信"
    print(f"执行任务: {task}")
    result = agent.run(task)
    print(f"结果: {result}")


if __name__ == "__main__":
    # 运行所有示例
    example_text_mode()
