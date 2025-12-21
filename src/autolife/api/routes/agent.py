"""
Agent 路由
处理任务执行请求
"""
import json
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from autolife.agent import AutoLifeAgent
from autolife.api.dependencies import get_agent
from autolife.api.models import ApiResponse

router = APIRouter(prefix="/api/agent", tags=["agent"])


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
        # Yield task start
        yield f"event: task_start\ndata: {json.dumps({'taskId': taskId})}\n\n"

        try:
            # Run task in thread pool to avoid blocking
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, agent.run, text)

            # Yield task complete
            yield f"event: task_complete\ndata: {json.dumps({'taskId': taskId, 'result': result})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'taskId': taskId, 'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
