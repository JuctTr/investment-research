# CLAUDE 项目配置文件

*最后更新: 2025-12-20*
*版本: v1.0*

本文件为Claude Code (claude.ai/code) 提供项目工作指导。

## 🌏 语言和输出规范

**重要要求**: Claude Code在`.claude`目录下生成的所有文件和报告，必须使用中文表达。**Always Output With Chinese.**

# Project Overview

这是一个个人投研分析系统的 MVP 实现，
目标是工程化验证「观点 → 决策 → 复盘」的学习闭环。

当前阶段：**基础架构搭建**
不追求功能完整，仅搭建可演进的骨架。

---

# Tech Stack

Frontend:
- React + TypeScript
- Vite
- Ant Design
- React Query
- Zustand

Backend:
- Node.js
- NestJS
- Prisma
- PostgreSQL

Architecture:
- Modular Monolith
- 单实例部署

---

# Directory Structure

举个例子，实际看看官方框架的目录情况：

backend/
  src/
    modules/
      content/
      viewpoint/
      decision/
      review/
      ai/
    scheduler/
    common/

frontend/
  src/
    pages/
    components/
    stores/
    services/

---

# Development Workflow

当执行任务时，请遵循以下顺序：

1. 明确当前属于：
   - 架构搭建
   - 模块骨架
   - API 定义
   - 数据模型
2. 优先生成：
   - 接口定义
   - 类型定义
   - 模块边界
3. 暂不实现复杂业务逻辑，除非明确要求

---

# Coding Rules

- 所有代码必须使用 TypeScript
- 模块之间只能通过 Service 调用
- 禁止跨模块直接访问数据库
- 不提前实现未在 TDD 中出现的功能
- 包管理器必须使用pnpm

---

# How to Work With This Repo

- 如果需求不明确，必须先提出假设
- 如果实现可能违反 Constitution，必须停止并说明原因
- 所有生成的代码应可直接运行或清晰标注 TODO

---

*本配置文件确保Claude Code能够正确理解和应用项目规范，提供高质量的开发支持。*