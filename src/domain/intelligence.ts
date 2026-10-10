import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type PromptPresetPayload } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";

export function useProjectTemplates() {
  return useQuery({
    queryKey: ["project-templates"],
    queryFn: () => api.getProjectTemplates(),
    staleTime: 60000,
  });
}

export function useProjectTemplateMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["project-templates"] });

  const createTemplate = useMutation({
    mutationFn: api.createProjectTemplate,
    onSuccess: invalidate,
  });

  const updateTemplate = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: Parameters<typeof api.updateProjectTemplate>[1] }) => api.updateProjectTemplate(templateId, payload),
    onSuccess: invalidate,
  });

  return { createTemplate, updateTemplate };
}

export function useProjectGraph(projectId?: string) {
  return useQuery({
    queryKey: ["project-graph", projectId],
    queryFn: () => api.getProjectGraph(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectSimulation(projectId?: string) {
  return useQuery({
    queryKey: ["project-simulation", projectId],
    queryFn: () => api.simulateProject(projectId!),
    enabled: !!projectId,
  });
}

export function usePromptPresets(projectId?: string) {
  return useQuery({
    queryKey: ["prompt-presets", projectId],
    queryFn: () => api.getPromptPresets(projectId!),
    enabled: !!projectId,
  });
}

export function usePromptPresetMutation(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromptPresetPayload) => api.createPromptPreset(projectId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-presets", projectId] });
    },
  });
}

export function useToolAudits(projectId?: string, limit = 100) {
  return useQuery({
    queryKey: ["tool-audits", projectId, limit],
    queryFn: () => api.getToolAudits(projectId!, limit),
    enabled: !!projectId,
    // No aggressive poll — refresh when project changes / window focus
    staleTime: 20_000,
  });
}

export function useConversationRecovery(projectId?: string, sessionId?: string) {
  return useQuery({
    queryKey: ["conversation-recovery", projectId, sessionId],
    queryFn: () => api.recoverConversation(projectId!, sessionId),
    enabled: !!projectId,
  });
}

export function useNodeVersions(nodeId?: string) {
  return useQuery({
    queryKey: ["node-versions", nodeId],
    queryFn: () => api.getNodeVersions(nodeId!),
    enabled: !!nodeId,
  });
}

export function useRollbackNodeVersion(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, versionId }: { nodeId: string; versionId: string }) => api.rollbackNodeVersion(projectId!, nodeId, versionId),
    onSuccess: (node) => {
      queryClient.invalidateQueries({ queryKey: ["node-versions", node.node_id] });
      queryClient.invalidateQueries({ queryKey: ["nodes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["execution-history", projectId] });
    },
  });
}

export function useReplayExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (executionId: string) => api.replayExecution(executionId),
    onSuccess: (_result, executionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: ["execution-history"] });
    },
  });
}

export function useControlPlaneOverview() {
  return useQuery({
    queryKey: ["control-plane-overview"],
    queryFn: () => api.getControlPlaneOverview(),
    // Ops dashboard: gentle poll only while page is mounted
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useGovernanceAudits(limit = 200) {
  return useQuery({
    queryKey: ["governance-audits", limit],
    queryFn: () => api.getGovernanceAudits(limit),
    staleTime: 30_000,
  });
}
