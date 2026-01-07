#!/bin/bash

################################################################################
# 投资研究系统 - 全栈启动脚本
#
# 功能：
# 1. 启动 PostgreSQL 和 Redis 数据库服务
# 2. 等待数据库健康检查通过
# 3. 生成 Prisma Client
# 4. 运行数据库迁移
# 5. 启动后端开发服务器 (后台运行)
# 6. 启动前端开发服务器 (后台运行)
# 7. 显示服务访问地址
################################################################################

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo -e "${CYAN}▶${NC} $1"
}

# 打印带颜色的标题
print_title() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

################################################################################
# 清理函数
################################################################################
cleanup() {
    echo ""
    print_title "停止所有服务"

    log_info "停止前端服务..."
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_success "前端服务已停止"
    fi

    log_info "停止后端服务..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_success "后端服务已停止"
    fi

    log_info "停止数据库服务..."
    docker-compose down 2>/dev/null || true
    log_success "数据库服务已停止"

    log_success "所有服务已停止"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

################################################################################
# 主流程
################################################################################

print_title "🚀 投资研究系统 - 全栈启动"

################################################################################
# 步骤 1: 检查 Docker 是否运行
################################################################################
log_info "检查 Docker 环境..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi
log_success "Docker 运行正常"

################################################################################
# 步骤 2: 启动数据库服务
################################################################################
print_title "📦 步骤 1/5: 启动数据库服务"

log_info "清理旧容器(如果存在)..."
docker rm -f investment-research-db investment-research-redis 2>/dev/null || true

log_info "启动 PostgreSQL 和 Redis..."
docker-compose up -d

# 等待容器启动
log_info "等待容器启动..."
sleep 3

# 检查容器状态
if ! docker-compose ps | grep -q "Up"; then
    log_error "数据库容器启动失败"
    docker-compose logs
    exit 1
fi

log_success "数据库容器已启动"

# 等待数据库健康检查
log_info "等待数据库健康检查通过..."
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if docker-compose ps | grep -q "healthy"; then
        log_success "数据库健康检查通过"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done

echo ""

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    log_warn "数据库健康检查超时，继续启动..."
fi

################################################################################
# 步骤 3: 初始化数据库
################################################################################
print_title "🔧 步骤 2/5: 初始化数据库"

log_info "生成 Prisma Client..."
if pnpm prisma:generate; then
    log_success "Prisma Client 生成完成"
else
    log_error "Prisma Client 生成失败"
    exit 1
fi

log_info "运行数据库迁移..."
if pnpm prisma:migrate; then
    log_success "数据库迁移完成"
else
    log_error "数据库迁移失败"
    exit 1
fi

################################################################################
# 步骤 4: 启动后端服务
################################################################################
print_title "🎯 步骤 3/5: 启动后端服务"

log_info "启动 NestJS 开发服务器(后台运行)..."

# 创建日志目录
mkdir -p logs

# 后台启动后端服务
pnpm start:dev > logs/backend.log 2>&1 &
BACKEND_PID=$!

log_info "后端 PID: $BACKEND_PID"

# 等待后端启动
log_info "等待后端服务启动..."
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3000/api > /dev/null 2>&1; then
        log_success "后端服务启动成功"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done

echo ""

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    log_warn "后端服务启动超时，请检查日志: logs/backend.log"
    tail -20 logs/backend.log
fi

################################################################################
# 步骤 5: 启动前端服务
################################################################################
print_title "🌐 步骤 4/5: 启动前端服务"

# 检查前端依赖
if [ ! -d "client/node_modules" ]; then
    log_info "前端依赖未安装，正在安装..."
    cd client
    pnpm install
    cd ..
    log_success "前端依赖安装完成"
fi

log_info "启动 Next.js 开发服务器(后台运行)..."

# 后台启动前端服务
cd client
pnpm dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

log_info "前端 PID: $FRONTEND_PID"

# 等待前端启动
log_info "等待前端服务启动..."
MAX_WAIT=40
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        log_success "前端服务启动成功"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done

echo ""

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    log_warn "前端服务启动超时，请检查日志: logs/frontend.log"
    tail -20 logs/frontend.log
fi

################################################################################
# 步骤 6: 显示服务状态
################################################################################
print_title "✅ 步骤 5/5: 所有服务已启动"

echo ""
log_success "服务访问地址:"
echo ""
echo -e "  ${CYAN}前端应用:${NC}     http://localhost:3001"
echo -e "  ${CYAN}后端 API:${NC}    http://localhost:3000"
echo -e "  ${CYAN}API 文档:${NC}    http://localhost:3000/api"
echo -e "  ${CYAN}数据库管理:${NC}  运行 ${YELLOW}pnpm db:studio${NC}"
echo ""
echo -e "  ${GREEN}后端日志:${NC}    logs/backend.log"
echo -e "  ${GREEN}前端日志:${NC}    logs/frontend.log"
echo ""

log_info "进程信息:"
echo -e "  后端 PID: ${YELLOW}$BACKEND_PID${NC}"
echo -e "  前端 PID: ${YELLOW}$FRONTEND_PID${NC}"
echo ""

log_warn "按 Ctrl+C 停止所有服务"
echo ""

################################################################################
# 保持脚本运行，显示日志
################################################################################
log_info "实时日志 (Ctrl+C 退出):"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 合并显示前后端日志
tail -f logs/backend.log logs/frontend.log 2>/dev/null &
TAIL_PID=$!

# 等待用户按下 Ctrl+C
wait
