"""
Agent 路由
处理任务执行请求
"""
import os
import json
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from autolife.agent import AutoLifeAgent
from autolife.api.dependencies import get_agent
from autolife.api.models import ApiResponse

router = APIRouter(prefix="/api/agent", tags=["agent"])

# 是否启用模拟模式（用于测试）
MOCK_MODE = os.getenv("AUTOLIFE_MOCK_MODE", "false").lower() == "true"


class RunRequest(BaseModel):
    task: str


class RunResult(BaseModel):
    result: str


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
    async def event_generator():
        # 发送任务开始事件
        yield f"event: task_start\ndata: {json.dumps({'taskId': taskId})}\n\n"

        try:
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

                # 先发送步骤开始事件
                yield f"event: step_start\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number})}\n\n"

                # 执行步骤
                result = await loop.run_in_executor(
                    None, agent.phone_agent.step, text
                )

                # 发送步骤结果事件
                if result.thinking:
                    yield f"event: thinking\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'thinking': result.thinking})}\n\n"

                if result.action:
                    action_data = {
                        'action': result.action.get('action', 'Unknown'),
                        'description': result.action.get('message', str(result.action)),
                        **{k: v for k, v in result.action.items() if k not in ['_metadata', 'action', 'message']}
                    }
                    yield f"event: action\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'action': action_data})}\n\n"

                yield f"event: step_complete\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'result': result.message or '步骤完成'})}\n\n"

                # 检查是否已完成
                if result.finished:
                    final_message = result.message or "任务完成"
                else:
                    # 后续步骤循环
                    max_steps = 100
                    while not result.finished and agent.phone_agent.step_count < max_steps:
                        step_number += 1

                        # 先发送步骤开始事件
                        yield f"event: step_start\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number})}\n\n"

                        # 执行步骤
                        result = await loop.run_in_executor(
                            None, agent.phone_agent.step, None
                        )

                        # 发送步骤结果事件
                        if result.thinking:
                            yield f"event: thinking\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'thinking': result.thinking})}\n\n"

                        if result.action:
                            action_data = {
                                'action': result.action.get('action', 'Unknown'),
                                'description': result.action.get('message', str(result.action)),
                                **{k: v for k, v in result.action.items() if k not in ['_metadata', 'action', 'message']}
                            }
                            yield f"event: action\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'action': action_data})}\n\n"

                        yield f"event: step_complete\ndata: {json.dumps({'taskId': taskId, 'stepNumber': step_number, 'result': result.message or '步骤完成'})}\n\n"

                        if result.finished:
                            final_message = result.message or "任务完成"
                            break

                    if not result.finished:
                        final_message = "已达到最大步数限制"

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
