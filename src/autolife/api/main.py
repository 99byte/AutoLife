"""
FastAPI 应用主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import health, agent, scrcpy

# 创建 FastAPI 应用
app = FastAPI(
    title="AutoLife API",
    description="AutoLife 智能助手 REST API",
    version="0.1.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router)
app.include_router(agent.router)
app.include_router(scrcpy.router)


@app.get("/")
async def root():
    """
    根路径，返回 API 信息
    """
    return {
        "message": "AutoLife API",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
