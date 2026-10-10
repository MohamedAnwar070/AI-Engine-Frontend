import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type LLMProviderPayload } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";

export const llmProviderKeys = {
  all: ["llm-providers"] as const,
  catalog: ["llm-providers", "catalog"] as const,
};

export function useLLMCatalog() {
  return useQuery({
    queryKey: llmProviderKeys.catalog,
    queryFn: () => api.getLLMCatalog(),
    staleTime: 60_000,
  });
}

export function useLLMProviders() {
  return useQuery({
    queryKey: llmProviderKeys.all,
    queryFn: () => api.getLLMProviders(),
    refetchInterval: 15_000,
  });
}

export function useLLMProviderProjects(providerId?: string, enabled = true) {
  return useQuery({
    queryKey: [...llmProviderKeys.all, providerId, "projects"],
    queryFn: () => api.getLLMProviderProjects(providerId!),
    enabled: !!providerId && enabled,
    staleTime: 10_000,
  });
}

export function useLLMProviderModels(providerId?: string, enabled = false) {
  return useQuery({
    queryKey: [...llmProviderKeys.all, providerId, "models"],
    queryFn: () => api.getLLMProviderModels(providerId!),
    enabled: !!providerId && enabled,
    staleTime: 30_000,
  });
}

export function useLLMProviderMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: llmProviderKeys.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  };
  const create = useMutation({
    mutationFn: (payload: LLMProviderPayload) => api.createLLMProvider(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ providerId, payload }: { providerId: string; payload: Partial<LLMProviderPayload & { is_default?: boolean }> }) =>
      api.updateLLMProvider(providerId, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (providerId: string) => api.deleteLLMProvider(providerId),
    onSuccess: invalidate,
  });
  const setDefault = useMutation({
    mutationFn: (providerId: string) => api.setDefaultLLMProvider(providerId),
    onSuccess: invalidate,
  });
  const test = useMutation({
    mutationFn: (providerId: string) => api.testLLMProvider(providerId),
    onSuccess: invalidate,
  });
  const testUnsaved = useMutation({
    mutationFn: (payload: LLMProviderPayload) => api.testUnsavedLLMProvider(payload),
  });
  const bindProject = useMutation({
    mutationFn: ({ providerId, projectId }: { providerId: string; projectId: string }) =>
      api.bindLLMProviderProject(providerId, projectId),
    onSuccess: invalidate,
  });
  const unbindProject = useMutation({
    mutationFn: ({ providerId, projectId }: { providerId: string; projectId: string }) =>
      api.unbindLLMProviderProject(providerId, projectId),
    onSuccess: invalidate,
  });

  return { create, update, remove, setDefault, test, testUnsaved, bindProject, unbindProject };
}
