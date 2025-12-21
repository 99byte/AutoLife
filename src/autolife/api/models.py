"""
Pydantic 数据模型定义
用于 FastAPI 请求和响应的数据验证
"""
from pydantic import BaseModel
from typing import Optional, Generic, TypeVar, Any

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一 API 响应格式"""
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[str] = None
