"""
Agent 路由
处理任务执行请求
"""
import os
import json
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from autolife.agent import AutoLifeAgent
from autolife.api.dependencies import get_agent
from autolife.api.models import ApiResponse

router = APIRouter(prefix="/api/agent", tags=["agent"])

# 是否启用模拟模式（用于测试）
MOCK_MODE = os.getenv("AUTOLIFE_MOCK_MODE", "false").lower() == "true"

# 任务取消管理
_cancelled_tasks: Set[str] = set()  # 已取消的任务ID集合
_current_task_id: str | None = None  # 当前正在执行的任务ID


def is_task_cancelled(task_id: str) -> bool:
    """检查任务是否已被取消"""
    return task_id in _cancelled_tasks


def cancel_task(task_id: str) -> bool:
    """取消指定任务"""
    _cancelled_tasks.add(task_id)
    return True


def clear_cancelled_task(task_id: str):
    """清理已取消的任务记录"""
    _cancelled_tasks.discard(task_id)


class RunRequest(BaseModel):
    task: str


class RunResult(BaseModel):
    result: str


class CancelRequest(BaseModel):
    taskId: str


@router.post("/cancel", response_model=ApiResponse)
async def cancel_running_task(request: CancelRequest):
    """
    取消正在执行的任务
    """
    global _current_task_id

    task_id = request.taskId

    # 标记任务为已取消
    cancel_task(task_id)

    # 如果是当前任务，也标记
    if _current_task_id == task_id:
        _current_task_id = None

    return ApiResponse(success=True, data={"message": f"任务 {task_id} 已标记为取消"})


@router.post("/run", response_model=ApiResponse[RunResult])
async def run_task(
    request: RunRequest,
    agent: AutoLifeAgent = Depends(get_agent)
):
    """
    执行任务
    """
    try:
        if MOCK_MODE:
            result = f"[模拟模式] 已收到任务：{request.task}"
        else:
            result = agent.run(request.task)
        return ApiResponse(success=True, data=RunResult(result=result))
    except Exception as e:
        return ApiResponse(success=False, error=str(e))


@router.get("/stream")
async def stream_task(
    taskId: str,
    text: str,
    agent: AutoLifeAgent = Depends(get_agent)
):
    """
    流式执行任务
    """
    global _current_task_id

    async def event_generator():
        global _current_task_id

        # 设置当前任务ID
        _current_task_id = taskId

        # 发送任务开始事件
        yield f"event: task_start\ndata: {json.dumps({'taskId': taskId})}\n\n"

        try:
            # 检查任务是否在开始前就被取消了
            if is_task_cancelled(taskId):
                yield f"event: task_cancelled\ndata: {json.dumps({'taskId': taskId, 'message': '任务已取消'})}\n\n"
                clear_cancelled_task(taskId)
                return

            if MOCK_MODE:
                # 模拟模式：返回模拟响应
                await asyncio.sleep(1)  # 模拟处理延迟

                # 模拟步骤
                yield f"event: step_start\ndata: {json.dumps({'taskId': taskId, 'stepNumber': 1})}\n\n"
                await asyncio.sleep(0.5)

                yield f"event: thinking\ndata: {json.dumps({'taskId': taskId, 'stepNumber': 1, 'thinking': f'正在分析任务：{text}'})}\n\n"
                await asyncio.sleep(0.5)

                yield f"event: action\ndata: {json.dumps({'taskId': taskId, 'stepNumber': 1, 'action': {'action': 'Launch', 'app': '小红书', 'description': '打开小红书应用'}})}\n\n"
                await asyncio.sleep(0.5)

                yield f"event: step_complete\ndata: {json.dumps({'taskId': taskId, 'stepNumber': 1, 'result': '已完成步骤 1', 'duration': 1500})}\n\n"

                # 发送任务完成事件
                result = f"[模拟模式] 任务「{text}」已完成！这是一个模拟响应，用于测试前后端通信。"
                yield f"event: task_complete\ndata: {json.dumps({'taskId': taskId, 'message': result})}\n\n"
            else:
                # 真实模式：流式执行，逐步返回步骤信息
                loop = asyncio.get_running_loop()
                step_number = 0
                final_message = "任务完成"

                # 重置 agent 状态
                agent.phone_agent.reset()

                # 第一步（带任务描述）
                step_number = 1

                # 立即发送步骤开始事件（不带 action，让前端立即显示"处理中..."）
                yield f"event: step_start\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number})}\n\n"

                # 执行步骤（获取 AI 决策和执行结果）
                result = await loop.run_in_executor(
                    None, agent.phone_agent.step, text
                )

                # 构建 action 数据并发送
                if result.action:
                    action_data = {
                        'action': result.action.get('action', 'Unknown'),
                        'description': result.action.get('message', str(result.action)),
                        **{k: v for k, v in result.action.items() if k not in ['_metadata', 'action', 'message']}
                    }
                    yield f"event: action\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'action': action_data})}\n\n"

                # 发送思考过程
                if result.thinking:
                    yield f"event: thinking\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'thinking': result.thinking})}\n\n"

                # 发送步骤完成
                yield f"event: step_complete\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'result': result.message or '步骤完成'})}\n\n"

                # 检查任务是否被取消
                if is_task_cancelled(taskId):
                    yield f"event: task_cancelled\ndata: {json.dumps({'taskId': taskId, 'message': '任务已取消'})}\n\n"
                    clear_cancelled_task(taskId)
                    _current_task_id = None
                    return

                # Collect steps for report generation
                steps_summary_list = []
                if result.thinking:
                    steps_summary_list.append(f"Step {step_number} Thinking: {result.thinking}")
                if result.action:
                    steps_summary_list.append(f"Step {step_number} Action: {result.action.get('message', str(result.action))}")

                # 检查是否已完成
                if result.finished:
                    final_message = result.message or "任务完成"
                    # 任务在第一步就完成，也需要生成报告
                else:
                    # 后续步骤循环
                    max_steps = 100
                    while not result.finished and agent.phone_agent.step_count < max_steps:
                        # 检查任务是否被取消
                        if is_task_cancelled(taskId):
                            yield f"event: task_cancelled\ndata: {json.dumps({'taskId': taskId, 'message': '任务已取消'})}\n\n"
                            clear_cancelled_task(taskId)
                            _current_task_id = None
                            return

                        step_number += 1

                        # 立即发送步骤开始事件（不带 action，让前端立即显示"处理中..."）
                        yield f"event: step_start\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number})}\n\n"

                        # 执行步骤（获取 AI 决策和执行结果）
                        result = await loop.run_in_executor(
                            None, agent.phone_agent.step, None
                        )

                        # 构建 action 数据并发送
                        if result.action:
                            action_data = {
                                'action': result.action.get('action', 'Unknown'),
                                'description': result.action.get('message', str(result.action)),
                                **{k: v for k, v in result.action.items() if k not in ['_metadata', 'action', 'message']}
                            }
                            yield f"event: action\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'action': action_data})}\n\n"

                        # 发送思考过程
                        if result.thinking:
                            yield f"event: thinking\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'thinking': result.thinking})}\n\n"

                        # 发送步骤完成
                        yield f"event: step_complete\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'result': result.message or '步骤完成'})}\n\n"

                        # Collect step info for report (包含 thinking 和 action)
                        if result.thinking:
                            steps_summary_list.append(f"Step {step_number} Thinking: {result.thinking}")
                        if result.action:
                            steps_summary_list.append(f"Step {step_number} Action: {result.action.get('message', str(result.action))}")

                        if result.finished:
                            final_message = result.message or "任务完成"
                            break

                    if not result.finished and not is_task_cancelled(taskId):
                        final_message = "已达到最大步数限制"

                # Generate task report (无论是第一步完成还是多步完成)
                try:
                    # 添加最终结果消息到摘要
                    if final_message:
                        steps_summary_list.append(f"Final Result: {final_message}")

                    steps_summary = "\n".join(steps_summary_list)  # 传递完整摘要
                    report = await loop.run_in_executor(
                        None, agent.generate_task_report, text, steps_summary
                    )
                    yield f"event: task_result\ndata: {json.dumps({'taskId': taskId, 'report': report}, ensure_ascii=False)}\n\n"
                except Exception as e:
                    print(f"Failed to generate task report: {e}")
                    # Don't fail the task if report generation fails

                # 发送任务完成事件
                yield f"event: task_complete\ndata: {json.dumps({'taskId': taskId, 'message': final_message})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'taskId': taskId, 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用 nginx 缓冲
        }
    )
