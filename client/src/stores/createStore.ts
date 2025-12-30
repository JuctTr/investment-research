import { create, type StateCreator, type StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { isServer } from '@/utils/env';

/**
 * 创建 SSR 安全的 Zustand Store
 *
 * 问题：
 * 在 SSR 环境下，Zustand Store 可能被多个请求共享，导致状态污染。
 *
 * 解决方案：
 * 1. 服务端不使用单例，每次请求创建新的 Store
 * 2. 客户端使用单例，保持状态一致性
 * 3. 通过 props 传递服务端数据，客户端 hydrate 时初始化
 *
 * @example
 * ```tsx
 * // stores/useUserStore.ts
 * import { createStore } from '@/stores/createStore';
 * import type { User } from '@/types';
 *
 * interface UserState {
 *   user: User | null;
 *   setUser: (user: User) => void;
 * }
 *
 * export const useUserStore = createStore<UserState>((set) => ({
 *   user: null,
 *   setUser: (user) => set({ user }),
 * }));
 * ```
 */
export function createStore<T extends object>(
  stateCreator: StateCreator<T>,
  name: string
) {
  if (isServer()) {
    // 服务端：返回创建函数，每次调用创建新实例
    return () =>
      create<T>()(
        devtools(stateCreator, {
          name,
          enabled: process.env.NODE_ENV === 'development',
        })
      );
  }

  // 客户端：使用单例模式
  const useStore = create<T>()(
    devtools(stateCreator, {
      name,
      enabled: process.env.NODE_ENV === 'development',
    })
  );

  return useStore;
}

/**
 * 从服务端传递的状态创建客户端 Store
 * 用于 SSR Hydration
 *
 * @example
 * ```tsx
 * // app/page.tsx (服务端组件)
 * import { useUserStore } from '@/stores/useUserStore';
 * import { UserPage } from '@/components/UserPage';
 *
 * export default async function Page() {
 *   const user = await fetchUser();
 *
 *   return <UserPage initialState={{ user }} />;
 * }
 *
 * // components/UserPage.tsx (客户端组件)
 * 'use client';
 * import { useUserStore } from '@/stores/useUserStore';
 * import { hydrateStore } from '@/stores/createStore';
 *
 * type Props = {
 *   initialState: Partial<UserState>;
 * };
 *
 * export function UserPage({ initialState }: Props) {
 *   hydrateStore(useUserStore, initialState);
 *   const user = useUserStore((state) => state.user);
 *   return <div>{user?.name}</div>;
 * }
 * ```
 */
export function hydrateStore<T extends object>(
  store: StoreApi<T>,
  initialState: Partial<T>
): void {
  if (isServer()) {
    console.warn('hydrateStore should not be called on the server');
    return;
  }

  // 只在首次加载时 hydrate
  const currentState = store.getState();
  const isHydrated = Object.keys(initialState).every(
    (key) => key in currentState
  );

  if (!isHydrated) {
    store.setState(initialState as Partial<T>, false);
  }
}

