## 通用开发规范标准

*最后更新: 2025-09-17*
*版本: v2.0*

### 代码质量规范
- **提交信息**: 遵循约定式提交规范 (feat, fix, chore等)
- **代码检查**: 使用Airbnb + TypeScript + Next.js配置
- **类型安全**: TypeScript严格模式，确保全面的类型安全
- **测试覆盖**: Jest单元测试，包含适当的mock和组件测试
- **代码格式**: Prettier配合Husky预提交钩子

### 核心开发原则
- **TypeScript准确性**: TypeScript类型定义要准确完善，提高开发效率，便于维护，减少潜在问题
- **避免过度封装**: 业务迭代快速，过度封装导致代码复杂度急剧上升，最终难以维护
- **代码简洁性**: 避免炫技，编写简单易懂的代码，注重可读性
- **逻辑清晰性**: 保持逻辑清晰、代码简单易读、组织结构合理，便于团队长期高效维护
- **注释有效性**: 编写清晰有用的注释，避免无用或冗余的注释
- **路由设计**: 页面避免使用参数化路由，URL路径参数应使用query参数传递

### 命名规范标准
- **文件名**: 使用小写kebab-case格式，如`user-profile.tsx`
- **React组件**: 使用PascalCase格式，如`UserProfile`
- **Hooks函数**: 使用camelCase格式，以use开头，如`useUserData`
- **普通函数**: 使用camelCase格式，如`calculateTotal`
- **常量**: 使用SNAKE_CASE格式，如`MAX_RETRY_COUNT`
- **类型定义**: 使用PascalCase格式，如`UserData`
- **接口定义**: 使用PascalCase格式，如`ApiResponse`
- **枚举定义**: 使用PascalCase格式，如`OrderStatus`

### 页面组件结构规范
```
pages/user-profile/
├── index.tsx                    # 页面主入口文件
├── user-profile.module.css      # 页面样式文件
├── components/                  # 页面专用组件
│   ├── profile-header.tsx
│   └── profile-settings.tsx
└── hooks/                       # 页面专用hooks
    └── use-profile-data.ts
```

### 模块导入规范
- **导入顺序**: React库 > Next.js框架 > 第三方库 > FunUI组件库 > 项目内部模块 > 样式文件
- **路径别名**: 使用配置的路径别名，如`@/utils`、`@/components`
- **类型导入**: 类型定义使用`import type { UserType } from 'module'`语法
- **多项导入**: 从同一库导入多个内容时使用解构语法
- **避免相对路径**: 禁止使用`../../../`形式的相对路径，必须使用路径别名

### 导入示例
```typescript
// ✅ 正确的导入顺序和格式
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { clsx } from 'clsx';
import { Button, Input } from '@funui/pc.core';
import { useUserData } from '@/hooks/use-user-data';
import type { UserProfile } from '@/types/user';
import styles from './user-profile.module.css';
```

### 代码格式规范
- **缩进**: 使用2个空格缩进，不使用Tab
- **引号**: 统一使用单引号，字符串和JSX属性都使用单引号
- **行宽**: 代码行宽不超过100个字符
- **分号**: 语句结尾必须使用分号
- **尾随逗号**: 对象、数组等多行结构使用尾随逗号
- **格式化工具**: 严格遵循项目Prettier配置

### TypeScript开发规范
- **严格模式**: 启用TypeScript严格模式 (`strict: true`)
- **类型覆盖**: 所有组件、函数、变量都必须有明确的类型定义
- **接口命名**: 使用PascalCase格式，如`UserProfile`
- **类型别名**: 使用PascalCase格式，如`ApiResponseType`
- **type vs interface**: 优先使用`type`定义类型别名，只有需要声明合并时使用`interface`
- **Props类型**: 组件Props类型命名为`ComponentNameProps`格式
- **类型断言**: 优先使用`as`语法而非尖括号语法
- **React类型**: 使用React提供的类型定义，如`FC`、`ReactNode`、`MouseEvent`等

### TypeScript示例
```typescript
// ✅ 正确的TypeScript类型定义
import type { FC, ReactNode, MouseEvent } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const Button: FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  return <button className={`btn btn--${variant}`} {...props}>{children}</button>;
};
```

### React组件开发规范
- **组件类型**: 函数组件使用`FC<Props>`类型定义
- **组件形式**: 优先使用函数组件和React Hooks，避免类组件
- **性能优化**: 使用`memo`包装组件避免不必要的重新渲染
- **Props解构**: 使用解构赋值提取props，提高代码可读性
- **样式处理**: 使用`clsx`工具处理条件类名
- **命名方式**: 组件名使用PascalCase格式
- **定义方式**: 优先使用函数声明而非箭头函数定义组件
- **默认值**: 为组件属性提供合理的默认值
- **函数优化**: 避免在渲染过程中创建函数，使用`useCallback`优化

### React组件示例
```typescript
import React, { FC, memo, useCallback } from 'react';
import { clsx } from 'clsx';

interface UserCardProps {
  name: string;
  avatar?: string;
  isActive?: boolean;
  onUserClick?: (name: string) => void;
}

const UserCard: FC<UserCardProps> = memo(({
  name,
  avatar,
  isActive = false,
  onUserClick
}) => {
  const handleClick = useCallback(() => {
    onUserClick?.(name);
  }, [name, onUserClick]);

  return (
    <div
      className={clsx('user-card', { 'user-card--active': isActive })}
      onClick={handleClick}
    >
      {avatar && <img src={avatar} alt={`${name}头像`} />}
      <span className='user-card__name'>{name}</span>
    </div>
  );
});

UserCard.displayName = 'UserCard';
export default UserCard;
```

### 性能优化最佳实践
- **React.memo**: 合理使用memo优化组件渲染性能
- **useCallback**: 优化事件处理函数，避免子组件不必要的重新渲染
- **useMemo**: 优化复杂计算，缓存计算结果
- **代码分割**: 使用动态导入实现组件懒加载
- **图片优化**: 使用Next.js的Image组件进行图片优化
- **资源预加载**: 对关键资源进行预加载，提升用户体验


---

*本规范适用于SHEIN品牌独立站monorepo中的所有前端项目，确保代码质量和团队协作效率。*