/**
 * UI状态管理 - Zustand Store
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CrawlerSource, CrawlerTask } from '../types';

/**
 * UI状态接口
 */
interface UIState {
  // 信息源管理相关UI状态
  sourceModalVisible: boolean;
  editingSource: CrawlerSource | null;
  selectedSourceIds: string[];

  // 任务相关UI状态
  taskDetailVisible: boolean;
  currentTask: CrawlerTask | null;
  previewDrawerVisible: boolean;
  previewTaskId: string | null;

  // Actions
  openSourceModal: (source?: CrawlerSource) => void;
  closeSourceModal: () => void;
  setSelectedSources: (ids: string[]) => void;

  openTaskDetail: (task: CrawlerTask) => void;
  closeTaskDetail: () => void;
  openPreviewDrawer: (taskId: string) => void;
  closePreviewDrawer: () => void;

  reset: () => void;
}

/**
 * 初始状态
 */
const initialState = {
  sourceModalVisible: false,
  editingSource: null,
  selectedSourceIds: [],
  taskDetailVisible: false,
  currentTask: null,
  previewDrawerVisible: false,
  previewTaskId: null,
};

/**
 * 创建UI状态store
 */
export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // 信息源Modal操作
      openSourceModal: (source) =>
        set({
          sourceModalVisible: true,
          editingSource: source || null,
        }),

      closeSourceModal: () =>
        set({
          sourceModalVisible: false,
          editingSource: null,
        }),

      // 选中信息源操作
      setSelectedSources: (ids) =>
        set({ selectedSourceIds: ids }),

      // 任务详情Modal操作
      openTaskDetail: (task) =>
        set({
          taskDetailVisible: true,
          currentTask: task,
        }),

      closeTaskDetail: () =>
        set({
          taskDetailVisible: false,
          currentTask: null,
        }),

      // 预览Drawer操作
      openPreviewDrawer: (taskId) =>
        set({
          previewDrawerVisible: true,
          previewTaskId: taskId,
        }),

      closePreviewDrawer: () =>
        set({
          previewDrawerVisible: false,
          previewTaskId: null,
        }),

      // 重置所有状态
      reset: () => set(initialState),
    }),
    {
      name: 'crawler-ui-store',
    },
  ),
);
