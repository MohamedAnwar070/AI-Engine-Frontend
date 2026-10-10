import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ProjectTestQueuedResponse, type ProjectTestResponse } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";

export function useHealthStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.healthCheck(),
    enabled,
    retry: 1,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => api.getStats(),
    refetchInterval: 15000,
  });
}

export function useProjectTestRun(projectId?: string, testRunId?: string | null) {
  return useQuery({
    queryKey: queryKeys.testRun(testRunId),
    queryFn: () => api.getTestRun(testRunId!),
    enabled: !!projectId && !!testRunId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 2500 : false;
    },
  });
}

export function useProjectTestRunner(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { test_messages: string[]; show_node_execution: boolean; execution_mode: "sync" | "async" | "auto" }) => {
      return api.testProject(projectId!, payload);
    },
    onSuccess: (result) => {
      if ((result as ProjectTestQueuedResponse).test_run_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        queryClient.invalidateQueries({ queryKey: queryKeys.testRun((result as ProjectTestQueuedResponse).test_run_id) });
      } else {
        const syncResult = result as ProjectTestResponse;
        queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        queryClient.invalidateQueries({ queryKey: queryKeys.executionHistoryRoot(syncResult.project_api_id) });
      }
    },
  });
}
