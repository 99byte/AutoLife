#!/bin/bash
# AutoLife 项目构建验证脚本

set -e

echo "=========================================="
echo "AutoLife 项目构建验证"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

# 1. 检查 Python 版本
echo "1. 检查 Python 环境"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python 版本: $PYTHON_VERSION"

    MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
        echo -e "${GREEN}✓${NC} Python 版本符合要求 (>=3.10)"
    else
        echo -e "${RED}✗${NC} Python 版本过低，需要 3.10 或更高版本"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} 未找到 Python 3"
    exit 1
fi
echo ""

# 2. 检查 uv
echo "2. 检查 uv 包管理器"
check_command uv
echo ""

# 3. 检查虚拟环境
echo "3. 检查虚拟环境"
if [ -d ".venv" ]; then
    echo -e "${GREEN}✓${NC} 虚拟环境已创建 (.venv)"
else
    echo -e "${YELLOW}!${NC} 虚拟环境未创建"
    echo "运行: uv venv"
fi
echo ""

# 4. 检查 Git 子模块
echo "4. 检查 Git 子模块"
if [ -d "Open-AutoGLM/phone_agent" ]; then
    echo -e "${GREEN}✓${NC} Open-AutoGLM 子模块已初始化"
else
    echo -e "${RED}✗${NC} Open-AutoGLM 子模块未初始化"
    echo "运行: git submodule update --init --recursive"
    exit 1
fi
echo ""

# 5. 检查环境变量配置
echo "5. 检查环境变量配置"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env 文件存在"

    # 检查必需的环境变量
    if grep -q "ZHIPUAI_API_KEY=" .env && ! grep -q "ZHIPUAI_API_KEY=your_zhipuai_api_key_here" .env; then
        echo -e "${GREEN}✓${NC} ZHIPUAI_API_KEY 已配置"
    else
        echo -e "${YELLOW}!${NC} ZHIPUAI_API_KEY 未配置或使用默认值"
        echo "请编辑 .env 文件并设置你的 API 密钥"
    fi
else
    echo -e "${YELLOW}!${NC} .env 文件不存在"
    echo "运行: cp .env.example .env"
    echo "然后编辑 .env 文件填写配置"
fi
echo ""

# 6. 检查 ADB/HDC
echo "6. 检查设备控制工具"
if check_command adb; then
    DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l)
    if [ $DEVICE_COUNT -gt 0 ]; then
        echo -e "${GREEN}✓${NC} 检测到 $DEVICE_COUNT 个 ADB 设备"
        adb devices
    else
        echo -e "${YELLOW}!${NC} 未检测到 ADB 设备"
    fi
elif check_command hdc; then
    HDC_DEVICES=$(hdc list targets)
    if [ ! -z "$HDC_DEVICES" ]; then
        echo -e "${GREEN}✓${NC} 检测到 HDC 设备"
        hdc list targets
    else
        echo -e "${YELLOW}!${NC} 未检测到 HDC 设备"
    fi
else
    echo -e "${YELLOW}!${NC} ADB 和 HDC 均未安装"
fi
echo ""

# 7. 测试 CLI 入口
echo "7. 测试 CLI 入口"
if uv run autolife --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} CLI 入口正常"
else
    echo -e "${RED}✗${NC} CLI 入口测试失败"
    exit 1
fi
echo ""

# 8. 检查依赖安装
echo "8. 检查 Python 依赖"
if [ -f "uv.lock" ]; then
    echo -e "${GREEN}✓${NC} 依赖锁文件存在 (uv.lock)"

    # 尝试导入核心依赖
    if uv run python -c "import openai; import PIL" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} 核心依赖 (openai, pillow) 已安装"
    else
        echo -e "${RED}✗${NC} 核心依赖未完全安装"
        echo "运行: uv sync"
        exit 1
    fi
else
    echo -e "${YELLOW}!${NC} 依赖锁文件不存在"
    echo "运行: uv sync"
fi
echo ""

# 总结
echo "=========================================="
echo "验证完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 如果未配置 .env，请运行: cp .env.example .env 并编辑"
echo "2. 如果设备未连接，请参考文档配置设备"
echo "3. 测试基础功能: uv run autolife --help"
echo "4. 运行示例: uv run autolife --text '你好' --verbose"
echo ""
