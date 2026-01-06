/**
 * 任务列表Hook - 获取任务列表并关联信息源信息
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import crawlerService from "../services/crawler.service";
import type { GetTasksParams } from "../types";

interface UseTaskListParams extends GetTasksParams {
  /** 是否关联信息源信息，默认true */
  withSource?: boolean;
}

/**
 * 任务列表Hook
 */
export const useTaskList = (params?: UseTaskListParams) => {
  const { withSource = true, ...queryParams } = params || {};

  // 获取任务列表
  const {
    data: tasksData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["crawler", "tasks", queryParams],
    queryFn: () => crawlerService.getTasks(queryParams),
    staleTime: 1000,
  });

  // 获取所有涉及的信息源ID
  const sourceIds = useMemo(() => {
    if (!withSource || !tasksData?.data) return [];
    const ids = tasksData.data
      .map((task) => task.sourceId)
      .filter((id, index, self) => id && self.indexOf(id) === index);
    return ids;
  }, [withSource, tasksData]);

  // 批量获取信息源信息
  const { data: sourcesData } = useQuery({
    queryKey: ["crawler", "sources", "ids", sourceIds],
    queryFn: () =>
      crawlerService.getSources({
        page: 1,
        pageSize: 100,
      }),
    enabled: withSource && sourceIds.length > 0,
    staleTime: 5000,
  });

  // 创建信息源映射
  const sourceMap = useMemo(() => {
    if (!sourcesData?.data) return new Map();
    const map = new Map();
    sourcesData.data.forEach((source) => {
      map.set(source.id, source);
    });
    return map;
  }, [sourcesData]);

  // 关联信息源信息到任务
  const tasks = useMemo(() => {
    if (!tasksData?.data) return [];
    if (!withSource) return tasksData.data;

    return tasksData.data.map((task) => ({
      ...task,
      source: sourceMap.get(task.sourceId),
    }));
  }, [tasksData, withSource, sourceMap]);

  return {
    tasks,
    total: tasksData?.total || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};
