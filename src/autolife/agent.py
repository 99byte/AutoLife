"""
AutoLife Agent - 整合 AutoGLM 的智能助手
"""

import os
import sys
from pathlib import Path
from typing import Callable, Generator

from openai import OpenAI

# 添加 Open-AutoGLM 到 Python 路径
AUTOGLM_PATH = Path(__file__).parent.parent.parent / "Open-AutoGLM"
sys.path.insert(0, str(AUTOGLM_PATH))

from phone_agent import PhoneAgent
from phone_agent.agent import AgentConfig, StepResult
from phone_agent.model import ModelConfig


class AutoLifeAgent:
    """
    AutoLife 智能助手

    整合 AutoGLM 的手机控制能力,
    通过文本指令控制手机完成各种任务。

    特性:
    - 文本指令执行
    - 屏幕视觉理解
    - 任务规划与执行

    示例:
        >>> from autolife import AutoLifeAgent
        >>>
        >>> # 创建助手
        >>> agent = AutoLifeAgent()
        >>>
        >>> # 执行任务
        >>> agent.run("帮我搜索附近的餐厅")
    """

    def __init__(
        self,
        # AutoGLM 配置
        model_config: ModelConfig | None = None,
        agent_config: AgentConfig | None = None,
        # 回调函数
        confirmation_callback: Callable[[str], bool] | None = None,
        takeover_callback: Callable[[str], None] | None = None,
    ):
        """
        初始化助手

        Args:
            model_config: AutoGLM 模型配置
            agent_config: AutoGLM 代理配置
            confirmation_callback: 敏感操作确认回调
            takeover_callback: 人工接管回调
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

        # 会话状态
        self.conversation_history = []

    def run(self, task: str) -> str:
        """
        执行任务

        Args:
            task: 任务描述

        Returns:
            str: 执行结果消息
        """
        print(f"\n[用户] {task}")

        # 执行任务
        result = self.phone_agent.run(task)

        print(f"[助手] {result}")

        # 记录历史
        self.conversation_history.append({"role": "user", "content": task})
        self.conversation_history.append({"role": "assistant", "content": result})

        return result

    def run_streaming(self, task: str, max_steps: int = 100) -> Generator[StepResult, None, str]:
        """
        流式执行任务，逐步返回执行结果

        Args:
            task: 任务描述
            max_steps: 最大步数

        Yields:
            StepResult: 每一步的执行结果

        Returns:
            str: 最终结果消息
        """
        print(f"\n[用户] {task}")

        # 重置 agent 状态
        self.phone_agent.reset()

        # 第一步（带任务描述）
        result = self.phone_agent.step(task)
        yield result

        if result.finished:
            final_message = result.message or "任务完成"
            # 记录历史
            self.conversation_history.append({"role": "user", "content": task})
            self.conversation_history.append({"role": "assistant", "content": final_message})
            print(f"[助手] {final_message}")
            return final_message

        # 后续步骤
        while self.phone_agent.step_count < max_steps:
            result = self.phone_agent.step()
            yield result

            if result.finished:
                final_message = result.message or "任务完成"
                # 记录历史
                self.conversation_history.append({"role": "user", "content": task})
                self.conversation_history.append({"role": "assistant", "content": final_message})
                print(f"[助手] {final_message}")
                return final_message

        final_message = "已达到最大步数限制"
        self.conversation_history.append({"role": "user", "content": task})
        self.conversation_history.append({"role": "assistant", "content": final_message})
        print(f"[助手] {final_message}")
        return final_message

    def clear_history(self) -> None:
        """清空对话历史"""
        self.conversation_history = []
        print("[助手] 对话历史已清空")

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

    def generate_task_report(self, task: str, steps_summary: str) -> str:
        """
        Generate a task result report in Markdown format.

        Args:
            task: Original task description
            steps_summary: Summary of executed steps

        Returns:
            str: Markdown formatted task report
        """
        prompt = f"""用户任务：{task}

执行过程与观察内容：
{steps_summary}

请根据以上信息，生成一份对用户有价值的 Markdown 格式报告。

要求：
1. 理解用户的真实目的（如搜索美食 → 用户想要美食攻略）
2. 从 Thinking 中提取 AI 观察到的关键信息（搜索结果、推荐内容、价格等）
3. 整理成对用户有用的报告，而非简单罗列步骤
4. 使用清晰的 Markdown 结构（标题、列表、表格）
5. 使用中文，长度适中（300-500字）

报告示例（搜索类任务）：
```markdown
# 丽江美食攻略

## 推荐美食
1. **腊排骨** - 丽江特色，推荐店铺：xxx
2. **鸡豆凉粉** - 纳西族传统小吃
3. **纳西烤肉** - 古城必吃

## 推荐笔记
- 「丽江3天2晚美食地图」- 收藏量 2.3w
```

报告示例（订餐类任务）：
```markdown
# 订餐成功

## 订单信息
- **商家**: 麦当劳
- **商品**: 巨无霸套餐 × 1
- **价格**: ¥35.00
```

请生成报告："""

        try:
            # Use ZhipuAI GLM model for report generation
            api_key = os.getenv("ZHIPUAI_API_KEY", "")
            if not api_key:
                return f"# 任务完成\n\n任务「{task}」已成功执行。"

            client = OpenAI(
                base_url="https://open.bigmodel.cn/api/paas/v4",
                api_key=api_key,
            )

            # Use GLM-4.7 with deep thinking disabled
            model_name = os.getenv("REPORT_MODEL", "glm-4.7")

            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个任务报告生成助手，擅长提取关键信息并生成简洁的 Markdown 报告。",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1000,  # 支持更长的报告
                temperature=0.3,
                extra_body={"thinking": {"type": "disabled"}},  # 关闭深度思考
            )

            if not response.choices:
                return f"# 任务完成\n\n任务「{task}」已成功执行。"

            raw_content = response.choices[0].message.content
            if not raw_content:
                return f"# 任务完成\n\n任务「{task}」已成功执行。"

            report = raw_content.strip()

            # Clean up the report (remove code block markers if present)
            if report.startswith("```markdown"):
                report = report[len("```markdown"):].strip()
            if report.startswith("```"):
                report = report[3:].strip()
            if report.endswith("```"):
                report = report[:-3].strip()

            return report

        except Exception as e:
            print(f"Failed to generate report: {e}")
            # Fallback to simple report
            return f"# 任务完成\n\n任务「{task}」已成功执行。"
