/**
 * 信息源列表Hook - 使用React Query管理
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import crawlerService from "../services/crawler.service";
import type {
  CreateSourceDto,
  GetSourcesParams,
  UpdateSourceDto,
} from "../types";

/**
 * 信息源列表Hook
 */
export const useSourceList = (params?: GetSourcesParams) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // 获取信息源列表
  const {
    data: sourcesData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["crawler", "sources", params],
    queryFn: () => crawlerService.getSources(params),
    staleTime: 10000, // 10秒内数据视为新鲜
  });

  // 创建信息源
  const createMutation = useMutation({
    mutationFn: (dto: CreateSourceDto) => crawlerService.createSource(dto),
    onSuccess: () => {
      message.success("信息源创建成功");
      queryClient.invalidateQueries({ queryKey: ["crawler", "sources"] });
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`);
    },
  });

  // 更新信息源
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSourceDto }) =>
      crawlerService.updateSource(id, dto),
    onSuccess: () => {
      message.success("信息源更新成功");
      queryClient.invalidateQueries({ queryKey: ["crawler", "sources"] });
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`);
    },
  });

  // 删除信息源
  const deleteMutation = useMutation({
    mutationFn: (id: string) => crawlerService.deleteSource(id),
    onSuccess: () => {
      message.success("信息源删除成功");
      queryClient.invalidateQueries({ queryKey: ["crawler", "sources"] });
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`);
    },
  });

  // 批量删除信息源
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => crawlerService.deleteSource(id)));
    },
    onSuccess: () => {
      message.success(
        `成功删除${deleteMutation.variables?.length || 0}个信息源`
      );
      queryClient.invalidateQueries({ queryKey: ["crawler", "sources"] });
    },
    onError: (error: Error) => {
      message.error(`批量删除失败: ${error.message}`);
    },
  });

  // 启动信息源爬取
  const startMutation = useMutation({
    mutationFn: (id: string) => crawlerService.startSource(id),
    onSuccess: () => {
      message.success("爬取任务已启动");
      queryClient.invalidateQueries({ queryKey: ["crawler", "sources"] });
      queryClient.invalidateQueries({ queryKey: ["crawler", "tasks"] });
    },
    onError: (error: Error) => {
      message.error(`启动失败: ${error.message}`);
    },
  });

  // 停止信息源爬取
  const stopMutation = useMutation({
    mutationFn: (id: string) => crawlerService.stopSource(id),
    onSuccess: () => {
      message.success("爬取任务已停止");
      queryClient.invalidateQueries({ queryKey: ["crawler", "sources"] });
      queryClient.invalidateQueries({ queryKey: ["crawler", "tasks"] });
    },
    onError: (error: Error) => {
      message.error(`停止失败: ${error.message}`);
    },
  });

  return {
    sources: sourcesData?.data || [],
    total: sourcesData?.total || 0,
    isLoading,
    isFetching,
    error,
    refetch,

    // Mutations
    createSource: createMutation.mutate,
    updateSource: updateMutation.mutate,
    deleteSource: deleteMutation.mutate,
    batchDeleteSources: batchDeleteMutation.mutate,
    startSource: startMutation.mutate,
    stopSource: stopMutation.mutate,

    // Loading状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
};
