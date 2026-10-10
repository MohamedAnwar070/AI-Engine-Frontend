import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type Node } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";

type NodePayload = Omit<Node, "id" | "node_id" | "created_at" | "updated_at">;

export function useProjectNodes(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.nodes(projectId),
    queryFn: () => api.getProjectNodes(projectId!),
    enabled: !!projectId,
  });
}

export function useNode(nodeId?: string) {
  return useQuery({
    queryKey: queryKeys.node(nodeId),
    queryFn: () => api.getNode(nodeId!),
    enabled: !!nodeId,
  });
}

export function useExecutionHistory(
  projectId?: string,
  limit = 50,
  options?: {
    /** When false, skip the request entirely (e.g. user is on Chat tab). */
    enabled?: boolean;
    /**
     * Live polling. Default false — refresh on mount/focus/invalidate only.
     * Poll only while the Executions panel is visible.
     */
    poll?: boolean;
    pollIntervalMs?: number;
  },
) {
  const enabled = options?.enabled ?? true;
  const poll = options?.poll ?? false;
  const pollIntervalMs = options?.pollIntervalMs ?? 15000;

  return useQuery({
    queryKey: queryKeys.executionHistory(projectId, limit),
    queryFn: () => api.getExecutionHistory(projectId!, limit),
    enabled: !!projectId && enabled,
    // No blind 10s polling — only when caller opts in (Executions tab open)
    refetchInterval: poll ? pollIntervalMs : false,
    refetchOnWindowFocus: poll,
    staleTime: poll ? 5_000 : 30_000,
  });
}

export function useNodeMutations(projectId?: string) {
  const queryClient = useQueryClient();

  const createNode = useMutation({
    mutationFn: (payload: NodePayload) => api.createNode(payload),
    onSuccess: (createdNode) => {
      queryClient.setQueryData<Node[]>(queryKeys.nodes(createdNode.project_api_id), (current = []) => [...current, createdNode]);
      queryClient.setQueryData(queryKeys.node(createdNode.node_id), createdNode);
    },
  });

  const updateNode = useMutation({
    mutationFn: ({ nodeId, payload }: { nodeId: string; payload: NodePayload }) => api.updateNode(nodeId, payload),
    onMutate: async ({ nodeId, payload }) => {
      const activeProjectId = projectId || payload.project_api_id;
      await queryClient.cancelQueries({ queryKey: queryKeys.nodes(activeProjectId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.node(nodeId) });

      const previousNodes = queryClient.getQueryData<Node[]>(queryKeys.nodes(activeProjectId));
      const previousNode = queryClient.getQueryData<Node>(queryKeys.node(nodeId));

      if (previousNodes) {
        queryClient.setQueryData(
          queryKeys.nodes(activeProjectId),
          previousNodes.map((node) =>
            node.node_id === nodeId ? { ...node, ...payload, updated_at: new Date().toISOString() } : node,
          ),
        );
      }

      if (previousNode) {
        queryClient.setQueryData(queryKeys.node(nodeId), {
          ...previousNode,
          ...payload,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousNodes, previousNode, activeProjectId, nodeId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.nodes(context.activeProjectId), context.previousNodes);
      queryClient.setQueryData(queryKeys.node(context.nodeId), context.previousNode);
    },
    onSuccess: (updatedNode) => {
      queryClient.setQueryData(queryKeys.node(updatedNode.node_id), updatedNode);
      queryClient.setQueryData<Node[]>(queryKeys.nodes(updatedNode.project_api_id), (current = []) =>
        current.map((node) => (node.node_id === updatedNode.node_id ? updatedNode : node)),
      );
    },
  });

  return { createNode, updateNode };
}
