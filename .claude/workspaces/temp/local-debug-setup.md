# 本地调试环境配置指南

*生成时间: 2025-12-20*

## 🚀 快速启动

最小化配置即可启动应用：

### 1. 必须配置的环境变量

```env
# 应用配置
PORT=3000
NODE_ENV=development

# JWT 配置 (必须修改)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 2. 数据库配置（可选）

如果你没有 PostgreSQL 数据库，可以暂时注释掉：
```env
# DATABASE_URL=postgresql://username:password@localhost:5432/investment_research
```

### 3. AI 服务配置（可选）

如果没有 OpenAI API Key，可以暂时留空：
```env
# OPENAI_API_KEY=your-openai-api-key
# OPENAI_MODEL=gpt-4
```

## 📋 环境变量详细说明

### 应用基础配置
- `PORT`: 服务端口（默认 3000）
- `NODE_ENV`: 运行环境（development/production）

### 数据库配置
- `DATABASE_URL`: PostgreSQL 连接字符串
  - 格式：`postgresql://用户名:密码@主机:端口/数据库名`
  - 示例：`postgresql://postgres:password@localhost:5432/investment_research`

### JWT 认证配置
- `JWT_SECRET`: JWT 签名密钥（生产环境必须使用强密钥）
- `JWT_EXPIRES_IN`: Token 过期时间（如：7d、24h、1h）

### AI 服务配置
- `OPENAI_API_KEY`: OpenAI API 密钥
- `OPENAI_MODEL`: 使用的模型（gpt-4、gpt-3.5-turbo）

### 日志配置
- `LOG_LEVEL`: 日志级别（info、debug、warn、error）
- `LOG_FILE`: 日志文件路径

## 🛠️ 数据库设置（可选）

### 使用 Docker 快速启动 PostgreSQL

1. 创建 Docker Compose 文件：
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: investment_research
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. 启动数据库：
```bash
docker-compose up -d
```

3. 更新环境变量：
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/investment_research
```

## 🎯 启动应用

```bash
cd backEnd

# 安装依赖（如果还没安装）
pnpm install

# 启动开发服务器
pnpm run start:dev
```

应用启动后访问：
- API 服务：http://localhost:3000/api/v1
- 健康检查：http://localhost:3000/api/v1/health

## 🔍 常见问题

### 端口被占用
如果 3000 端口被占用，可以修改 `PORT` 变量：
```env
PORT=3001
```

### 无数据库连接
没有数据库时，应用会报数据库连接错误，但仍可以测试基础 API。

### 无 OpenAI API Key
没有 API Key 时，AI 相关功能会报错，但不影响其他模块。