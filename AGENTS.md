# 公有契约（Public Contract）

_最后更新: 2025-12-23_
_版本: v1.0_

## 1. 文件目的（Purpose）

本文件是 **写给 AI Code Agent 的项目级说明书**。

目标是让任何进入本仓库的 AI Agent 能在 **最少上下文补充** 的情况下，理解：

- 项目的整体技术架构
- 各模块职责与边界
- 开发 / 构建 / 测试 / 提交规范
- 修改代码时必须遵守的工程约束

> ⚠️ 本文件不包含任何特定 AI 工具（如 Claude Code、Gemini CLI）的私有能力或语法约定。

---

## 2. 项目定位与整体架构

### 2.1 项目类型

- 类型：Web 应用（前端为主，包含必要的后端能力）
- 架构风格：前后端解耦 / BFF（如存在）
- 主要使用场景：中大型业务系统 / 工程化工具链

### 2.2 技术栈概览

**Frontend**

- Framework：React（函数组件 + Hooks）
- Language：TypeScript（严格模式）
- Build Tool：Vite
- Styling：CSS Modules / Tailwind（以项目实际为准）
- State：React Query / Zustand（避免全局 Redux 滥用）

**Backend（如存在）**

- Runtime：Node.js
- Framework：NestJS / Express
- API Style：REST（必要时 GraphQL）
- Auth：JWT / Session（以项目配置为准）

**Infrastructure**

- Package Manager：pnpm
- Monorepo（如适用）：pnpm workspace
- CI：GitHub Actions

---

## 3. 目录职责约定

> Agent 在新增或修改代码时，必须遵循以下职责划分。（指职责划分，而不是说强制目录结构）

```text
.
├── apps/                # 应用层（可部署单元）
│   ├── web/             # Web 前端应用
│   └── api/             # 后端 API（如存在）
│
├── packages/            # 可复用模块 / 工具库
│   ├── ui/              # 通用 UI 组件
│   ├── utils/           # 工具函数（无副作用）
│   └── config/          # 共享配置
│
├── scripts/             # 工程脚本（构建 / 校验）
├── docs/                # 面向人类的文档
└── AGENTS.md            # 本文件
```

**禁止行为：**

- 将业务逻辑直接写入 UI 组件
- 在 `utils` 中引入业务状态或副作用
- 跨层级直接 import（如 web 直接依赖 api 内部实现）

---

## 4. 开发与运行规范

### 4.1 安装依赖

```bash
pnpm install
```

### 4.2 本地开发

```bash
pnpm dev
```

> Agent 不应假设开发服务器端口，需从配置文件中读取。

### 4.3 构建

```bash
pnpm build
```

---

## 5. 测试策略（Agent 必须遵守）

### 5.1 测试分层

- Unit Test：工具函数、纯逻辑
- Component Test：复杂组件交互
- E2E Test：关键业务路径（如存在）

### 5.2 Agent 行为约束

- 修改核心逻辑 → 必须补充或更新测试
- 仅做 UI 文案 / 样式微调 → 可不强制补测试
- 不得为了“通过测试”而删除测试用例

---

## 6. 代码规范（高优先级）

### 6.1 核心开发原则

- **TypeScript准确性**: TypeScript类型定义要准确完善，提高开发效率，便于维护，减少潜在问题
- **避免过度封装**: 业务迭代快速，过度封装导致代码复杂度急剧上升，最终难以维护
- **代码简洁性**: 避免炫技，编写简单易懂的代码，注重可读性
- **逻辑清晰性**: 保持逻辑清晰、代码简单易读、组织结构合理，便于团队长期高效维护
- **注释有效性**: 编写清晰有用的注释，避免无用或冗余的注释
- **路由设计**: 页面避免使用参数化路由，URL路径参数应使用query参数传递

### 6.2 React组件开发规范

- **组件类型**: 函数组件使用`FC<Props>`类型定义
- **组件形式**: 优先使用函数组件和React Hooks，避免类组件
- **性能优化**: 使用`memo`包装组件避免不必要的重新渲染
- **Props解构**: 使用解构赋值提取props，提高代码可读性
- **命名方式**: 组件名使用PascalCase格式
- **定义方式**: 优先使用函数声明而非箭头函数定义组件
- **默认值**: 为组件属性提供合理的默认值
- **函数优化**: 避免在渲染过程中创建函数，使用`useCallback`优化

### 6.2 命名规范标准

- **文件名**: 使用小写kebab-case格式，如`user-profile.tsx`
- **React组件**: 使用PascalCase格式，如`UserProfile`
- **Hooks函数**: 使用camelCase格式，以use开头，如`useUserData`
- **普通函数**: 使用camelCase格式，如`calculateTotal`
- **常量**: 使用SNAKE_CASE格式，如`MAX_RETRY_COUNT`
- **类型定义**: 使用PascalCase格式，如`UserData`
- **接口定义**: 使用PascalCase格式，如`ApiResponse`
- **枚举定义**: 使用PascalCase格式，如`OrderStatus`

---

## 7. Git 与提交规范

### 7.1 分支策略

- master：稳定分支
- feature/\*：功能开发
- fix/\*：问题修复

### 7.2 Commit Message（Agent 必须遵守）

```text
type(scope): summary

# type:
# feat | fix | refactor | chore | docs | test
```

示例：

```text
feat(auth): add token refresh logic
```

---

## 8. Agent 行为边界（非常重要）

AI Agent **可以做的**：

- 重构已有代码以提升可读性
- 补充缺失的类型与测试
- 按既定架构新增模块

AI Agent **不可以做的**：

- 大规模重写架构而未说明原因
- 引入未经允许的新技术栈
- 删除已有功能以“简化实现”

如遇不确定决策，**必须优先提出假设或说明风险，而不是擅自修改。**

---

## 9. 与其他上下文文件的关系

- AGENTS.md：**跨 Agent 的通用工程契约**
- 其他文件（如 CLAUDE.md）：**工具私有能力扩展**

当两者冲突时：

> **以 AGENTS.md 为基础规则，私有文件仅做增强，不可覆盖核心约定。**

---

## 10. 最终原则（给 Agent 的一句话）

> **请像一名资深工程师一样修改这个项目：
> 尊重历史、控制影响面、为下一个维护者负责。如果你觉得有更好的公有契约可以写进该文档，那么欢迎提出宝贵的建议**

_本规范适用于所有前后端项目，确保代码质量和团队协作效率。_
