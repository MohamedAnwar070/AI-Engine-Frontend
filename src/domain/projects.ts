import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type Project, type ProjectPayload } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.getProjects(),
  });
}

export function useProject(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectMutations() {
  const queryClient = useQueryClient();

  const createProject = useMutation({
    mutationFn: (payload: ProjectPayload) => api.createProject(payload),
    onSuccess: (createdProject) => {
      queryClient.setQueryData<Project[]>(queryKeys.projects, (current = []) => [createdProject, ...current]);
      queryClient.setQueryData(queryKeys.project(createdProject.project_api_id), createdProject);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: ProjectPayload }) => api.updateProject(projectId, payload),
    onMutate: async ({ projectId, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.project(projectId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });

      const previousProject = queryClient.getQueryData<Project>(queryKeys.project(projectId));
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);

      if (previousProject) {
        queryClient.setQueryData(queryKeys.project(projectId), {
          ...previousProject,
          ...payload,
          llm_config: payload.llm_config,
          updated_at: new Date().toISOString(),
        });
      }

      if (previousProjects) {
        queryClient.setQueryData(
          queryKeys.projects,
          previousProjects.map((project) =>
            project.project_api_id === projectId
              ? { ...project, ...payload, llm_config: payload.llm_config, updated_at: new Date().toISOString() }
              : project,
          ),
        );
      }

      return { previousProject, previousProjects, projectId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.project(context.projectId), context.previousProject);
      queryClient.setQueryData(queryKeys.projects, context.previousProjects);
    },
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.project(project.project_api_id), project);
      queryClient.setQueryData<Project[]>(queryKeys.projects, (current = []) =>
        current.map((item) => (item.project_api_id === project.project_api_id ? project : item)),
      );
    },
  });

  return { createProject, updateProject };
}
