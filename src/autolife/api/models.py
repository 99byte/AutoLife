"""
Pydantic 数据模型定义
用于 FastAPI 请求和响应的数据验证
"""
from pydantic import BaseModel
from typing import Optional


class TextRequest(BaseModel):
    """文本指令请求"""
    text: str


class ASRResult(BaseModel):
    """ASR 识别结果"""
    text: str
    confidence: float
    duration: float


class VoiceResponse(BaseModel):
    """语音交互响应"""
    text: str
    asrResult: Optional[ASRResult] = None
    duration: int


class ApiResponse(BaseModel):
    """统一 API 响应格式"""
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    error: Optional[str] = None
