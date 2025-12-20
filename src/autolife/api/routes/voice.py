"""
语音交互路由
处理文本指令和语音交互请求
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import tempfile
import os
import asyncio

from ..models import TextRequest, VoiceResponse, ApiResponse
from ..dependencies import get_voice_agent
from autolife.voice_agent.agent import VoiceAgent

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/text", response_model=ApiResponse)
async def text_command(
    request: TextRequest,
    agent: VoiceAgent = Depends(get_voice_agent)
):
    """
    处理文本指令

    Args:
        request: 包含文本指令的请求
        agent: VoiceAgent 实例（依赖注入）

    Returns:
        ApiResponse: 包含执行结果的响应
    """
    try:
        # 使用 asyncio.to_thread 在线程池中执行同步操作
        result = await asyncio.to_thread(agent.run_from_text, request.text)

        return ApiResponse(
            success=True,
            data={"text": result, "duration": 0}
        )
    except Exception as e:
        return ApiResponse(
            success=False,
            error=str(e)
        )


@router.post("/single", response_model=ApiResponse)
async def single_voice(
    audio: UploadFile = File(...),
    agent: VoiceAgent = Depends(get_voice_agent)
):
    """
    处理单次语音交互

    Args:
        audio: 上传的音频文件
        agent: VoiceAgent 实例（依赖注入）

    Returns:
        ApiResponse: 包含 ASR 识别结果和执行结果的响应
    """
    try:
        # 保存上传的音频文件到临时目录
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # 使用 asyncio.to_thread 在线程池中执行同步操作
            result = await asyncio.to_thread(agent.run_from_voice, tmp_path)

            return ApiResponse(
                success=True,
                data={
                    "text": result,
                    "duration": 0
                }
            )
        finally:
            # 清理临时文件
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    except Exception as e:
        return ApiResponse(
            success=False,
            error=str(e)
        )


@router.post("/upload", response_model=ApiResponse)
async def upload_audio(
    audio: UploadFile = File(...),
    agent: VoiceAgent = Depends(get_voice_agent)
):
    """
    处理音频文件上传（与 single 相同的实现）

    Args:
        audio: 上传的音频文件
        agent: VoiceAgent 实例（依赖注入）

    Returns:
        ApiResponse: 包含 ASR 识别结果和执行结果的响应
    """
    return await single_voice(audio, agent)
