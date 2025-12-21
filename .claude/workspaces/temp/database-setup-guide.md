# 数据库配置完整指南

*生成时间: 2025-12-20*

## 🎯 数据库方案选择

### 方案一：本地 Docker PostgreSQL（推荐开发使用）

1. 创建 `docker-compose.yml` 文件：
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: investment-research-db
    environment:
      POSTGRES_DB: investment_research
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

2. 启动数据库：
```bash
cd backEnd
docker-compose up -d
```

3. 更新环境变量：
```env
DATABASE_URL=postgresql://postgres:password123@localhost:5432/investment_research
```

### 方案二：使用 Prisma 云数据库（快速开始）

1. 创建 Prisma 云数据库：
```bash
npx create-db
```

2. 复制生成的连接字符串到 `.env` 文件

### 方案三：本地安装 PostgreSQL

1. 安装 PostgreSQL：
   - Mac: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`

2. 创建数据库：
```sql
CREATE DATABASE investment_research;
CREATE USER postgres WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE investment_research TO postgres;
```

3. 配置连接：
```env
DATABASE_URL=postgresql://postgres:password123@localhost:5432/investment_research
```

## 📊 数据库模型概览

系统已设计 5 个核心数据模型，支持完整的「观点 → 决策 → 复盘」闭环：

### 1. User（用户）
- 基本信息：ID、邮箱、姓名
- 时间戳：创建时间、更新时间

### 2. Content（内容）- 投研资料管理
- 支持多种类型：文章、新闻、研报、书籍、视频等
- 标签系统：方便分类和检索
- 内容来源：支持URL和原始文本

### 3. Viewpoint（观点）- 分析和观点
- 关联内容：基于投研资料形成观点
- 信心程度：1-10分量化评估
- 市场展望：看涨/看跌/中性
- 详细分析：支持完整的分析逻辑

### 4. Decision（决策）- 投资决策
- 决策类型：买入/卖出/持有
- 执行状态：计划中/已执行/已完成/已取消
- 决策参数：金额、价格、理由
- 关联观点：连接分析依据

### 5. Review（复盘）- 决策复盘
- 结果量化：盈利/亏损金额和收益率
- 经验总结：教训、错误分析、改进建议
- 关联决策：形成完整的学习闭环

## 🚀 初始化数据库

### 步骤 1：选择并启动数据库

从上面的三种方案中选择一种，配置并启动数据库。

### 步骤 2：配置环境变量

确保 `.env` 文件包含正确的 `DATABASE_URL`：
```env
DATABASE_URL=postgresql://用户名:密码@主机:端口/数据库名
```

### 步骤 3：生成 Prisma 客户端

```bash
cd backEnd
pnpm prisma:generate
```

### 步骤 4：执行数据库迁移

```bash
pnpm prisma:migrate
```

### 步骤 5：（可选）启动数据库管理界面

```bash
pnpm prisma:studio
```

## 📋 常用命令

```bash
# 重新生成 Prisma 客户端
pnpm prisma:generate

# 创建新的数据库迁移
pnpm prisma:migrate

# 重置数据库（删除所有数据）
pnpm prisma:migrate:reset

# 查看数据库内容
pnpm prisma:studio

# 初始化数据库（生成客户端+执行迁移）
pnpm db:setup
```

## 🔧 验证连接

1. 检查环境变量是否正确设置
2. 确保数据库服务正在运行
3. 测试连接：
```bash
npx prisma db push --accept-data-loss
```

## 📝 数据模型关系图

```
User (用户)
├── Content (内容)    1:N
├── Viewpoint (观点)  1:N
├── Decision (决策)   1:N
└── Review (复盘)     1:N

Viewpoint (观点)
├── Content (内容)    N:1 (可选)
└── Decision (决策)   1:N

Decision (决策)
├── Viewpoint (观点)  N:1 (可选)
└── Review (复盘)     1:N

Review (复盘)
└── Decision (决策)   N:1 (可选)
```

## ✅ 下一步

数据库设置完成后，可以：
1. 集成 Prisma 到 NestJS 模块
2. 创建基础的 CRUD API
3. 实现业务逻辑
4. 添加数据验证和错误处理