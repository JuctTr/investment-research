/**
 * 任务轮询Hook - 支持智能轮询（页面可见时轮询，隐藏时暂停）
 */
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import crawlerService from '../services/crawler.service';
import type { CrawlerTask, GetTasksParams, TaskStatus } from '../types';

/**
 * 任务轮询Hook配置
 */
interface UseTaskPollingOptions {
  /** 轮询间隔（毫秒），默认5000ms */
  interval?: number;
  /** 是否启用轮询，默认true */
  enabled?: boolean;
  /** 仅轮询指定状态的任务 */
  status?: TaskStatus;
}

/**
 * 任务轮询Hook
 */
export const useTaskPolling = (params?: GetTasksParams, options?: UseTaskPollingOptions) => {
  const { interval = 5000, enabled = true, status } = options || {};
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取任务列表
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['crawler', 'tasks', params],
    queryFn: () => crawlerService.getTasks(params),
    refetchInterval: isPolling ? interval : false,
    enabled,
    staleTime: 1000, // 1秒后数据过期，触发重新获取
  });

  // 获取任务详情
  const useTaskDetail = (taskId: string) => {
    return useQuery({
      queryKey: ['crawler', 'tasks', taskId],
      queryFn: () => crawlerService.getTask(taskId),
      enabled: !!taskId && enabled,
      refetchInterval: isPolling ? interval : false,
    });
  };

  // 取消任务
  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => crawlerService.cancelTask(taskId),
    onSuccess: () => {
      message.success('任务已取消');
      queryClient.invalidateQueries({ queryKey: ['crawler', 'tasks'] });
    },
    onError: (error: Error) => {
      message.error(`取消失败: ${error.message}`);
    },
  });

  // 智能轮询 - 使用Page Visibility API
  useEffect(() => {
    if (!enabled) return;

    // 页面可见时开始轮询
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPolling(false);
      } else {
        // 只有当有运行中或待处理的任务时才轮询
        const hasRunningTasks = tasksData?.data?.some(
          (task) => task.status === 'PENDING' || task.status === 'RUNNING',
        );
        setIsPolling(hasRunningTasks || false);
      }
    };

    // 初始化轮询状态
    const hasRunningTasks = tasksData?.data?.some(
      (task) => task.status === 'PENDING' || task.status === 'RUNNING',
    );
    setIsPolling(hasRunningTasks || false);

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, tasksData]);

  // 当有运行中任务时自动启动轮询
  useEffect(() => {
    const hasRunningTasks = tasksData?.data?.some(
      (task) => task.status === 'PENDING' || task.status === 'RUNNING',
    );

    if (hasRunningTasks && !document.hidden && enabled) {
      setIsPolling(true);
    } else if (!hasRunningTasks) {
      setIsPolling(false);
    }
  }, [tasksData, enabled]);

  // 手动控制轮询
  const startPolling = () => setIsPolling(true);
  const stopPolling = () => setIsPolling(false);

  return {
    tasks: tasksData?.data || [],
    total: tasksData?.total || 0,
    isLoading,
    error,
    refetch,
    isPolling,

    // 任务详情
    useTaskDetail,

    // 取消任务
    cancelTask: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,

    // 轮询控制
    startPolling,
    stopPolling,
  };
};
