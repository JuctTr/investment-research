# CLAUDE 项目配置文件

_最后更新: 2025-12-21_
_版本: v1.0_

本文件为Claude Code (claude.ai/code) 提供项目工作指导。

## 🌏 语言和输出规范

**重要要求**: Claude Code在`.claude`目录下生成的所有文件和报告，必须使用中文表达。**Always Output With Chinese.**

## Project Overview

Personal investment research system implementing a "Viewpoint → Decision → Review" learning loop. Built as a full-stack application with NestJS backend and Next.js frontend.

## Development Commands

### Database Operations

```bash
# Start PostgreSQL database
docker-compose up -d

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Seed database with initial data
pnpm prisma:seed

# Open database management UI
pnpm prisma:studio
```

### Backend Development

```bash
# Start backend in development mode (with hot reload)
pnpm start:dev

# Build backend for production
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

### Frontend Development

```bash
cd client

# Start frontend development server
pnpm dev

# Build frontend for production
pnpm build

# Run linting
pnpm lint
```

## Architecture Overview

### Backend (NestJS)

- **Modular Architecture**: Each business domain is a separate module (content, viewpoint, decision, review, ai)
- **Global Database Module**: PrismaService is globally available via `@Global()` decorator
- **API Versioning**: All endpoints prefixed with `/api/v1`
- **Swagger Documentation**: Available at `/api` when backend is running
- **Validation**: Global DTO validation pipe with auto type conversion

### Database Schema (Prisma)

Core entities and relationships:

```
User → Content → Viewpoint → Decision → Review
```

Key enums:

- `ContentType`: ARTICLE, NEWS, REPORT, BOOK, VIDEO, PODCAST, NOTE
- `OutlookType`: BULLISH, BEARISH, NEUTRAL
- `ActionType`: BUY, SELL, HOLD
- `DecisionStatus`: PLANNING, EXECUTED, COMPLETED, CANCELLED
- `ReviewResult`: PROFIT, LOSS, NEUTRAL, PENDING

### Frontend (Next.js 16)

- **App Router**: Using Next.js 16's app directory structure
- **State Management**: Zustand for client state, React Query for server state
- **UI Framework**: Ant Design 6
- **API Layer**: Axios-based services with interceptors for auth and error handling
- **Type Safety**: Shared TypeScript types between frontend and backend

## Key Configuration

### Environment Variables

Backend `.env`:

```
PORT=3000
DATABASE_URL=postgresql://postgres:password123@localhost:5432/investment_research
JWT_SECRET=your-jwt-secret-key
```

Frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
PORT=3001
```

### Database Configuration

- PostgreSQL 15 running in Docker container
- Port: 5432
- Database: investment_research
- User/Password: postgres/password123

## Development Workflow

1. **Initial Setup**:
   - Start database: `docker-compose up -d`
   - Setup backend: `pnpm install && pnpm prisma:generate && pnpm prisma:migrate`
   - Setup frontend: `cd client && pnpm install`

2. **Daily Development**:
   - Backend: `pnpm start:dev` (runs on port 3000)
   - Frontend: `cd client && pnpm dev` (runs on port 3001)
   - Database UI: `pnpm prisma:studio`

3. **Database Changes**:
   - Modify `prisma/schema.prisma`
   - Run `pnpm prisma:migrate` to apply changes
   - Update types if needed

## Code Organization Rules

- **Module Communication**: Modules must communicate through Services only
- **Database Access**: Use PrismaService, never direct database connections
- **TypeScript**: Strict mode enabled, all code must be typed
- **Package Manager**: Must use pnpm (enforced by package manager config)

## Testing

- Test files: `**/__tests__/**/*.ts` or `**/?(*.)+(spec|test).ts`
- Jest configuration in `jest.config.js`
- E2E tests in separate configuration
- Coverage reports available with `pnpm test:cov`
