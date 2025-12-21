# AutoLife 项目结构

## 目录结构

```
AutoLife/
├── README.md                          # 项目主文档
├── pyproject.toml                     # 项目配置和依赖管理
├── .env.example                      # 环境变量模板
│
├── Open-AutoGLM/                     # AutoGLM子模块 (git submodule)
│
├── src/                              # 源代码目录
│   └── autolife/                     # AutoLife主项目
│       ├── __init__.py               # 包初始化
│       ├── cli.py                    # 命令行接口
│       ├── agent.py                  # AutoLifeAgent主类
│       │
│       ├── api/                      # FastAPI REST API 服务
│       │   ├── main.py               # FastAPI 应用入口
│       │   ├── dependencies.py       # 依赖注入
│       │   └── routes/               # API 路由
│       │       ├── health.py         # 健康检查
│       │       └── agent.py          # 任务执行路由
│
├── autolife-web/                     # 前端应用
│
├── docs/                             # 中文文档
│
└── tests/                            # 测试文件
```
