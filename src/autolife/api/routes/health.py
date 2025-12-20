"""
健康检查路由
用于监控服务运行状态
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    健康检查端点
    返回服务运行状态
    """
    return {"status": "ok"}
