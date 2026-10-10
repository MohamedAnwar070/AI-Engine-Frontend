import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";
import {
  buildProjectPackage,
  downloadJson,
  normalizePackage,
  type ProjectPackage,
} from "@/domain/packageFormat";

export function useDataWorkflows() {
  const queryClient = useQueryClient();

  const exportProjects = useMutation({
    mutationFn: async (): Promise<ProjectPackage> => {
      // Prefer backend export so runtime/http_config are always correct
      try {
        const payload = await api.exportWorkspace();
        return payload as ProjectPackage;
      } catch {
        const projects = await api.getProjects();
        const entries = await Promise.all(
          projects.map(async (project) => {
            const nodes = await api.getProjectNodes(project.project_api_id);
            const pkg = buildProjectPackage(project, nodes);
            return { project: pkg.project!, nodes: pkg.nodes || [] };
          }),
        );
        return {
          version: 2,
          kind: "perfect_engine_workspace",
          exported_at: new Date().toISOString(),
          meta: { format: "perfect_engine_package_v2", project_count: entries.length },
          projects: entries,
        };
      }
    },
  });

  const importProjects = useMutation({
    mutationFn: async (payload: unknown) => {
      // Prefer backend import (creates project + nodes with full fields)
      try {
        const result = await api.importPackage(payload as Record<string, unknown>);
        return {
          projects_imported: result.projects_imported,
          nodes_created: result.results.reduce((sum, r) => sum + r.nodes_created, 0),
          nodes_skipped: result.results.reduce((sum, r) => sum + r.nodes_skipped, 0),
          results: result.results,
          via: "api" as const,
        };
      } catch {
        // Client-side fallback
        const entries = normalizePackage(payload);
        let projects_imported = 0;
        let nodes_created = 0;
        let nodes_skipped = 0;
        const results: Array<{
          project_api_id: string;
          name: string;
          nodes_created: number;
          nodes_skipped: number;
          node_errors: string[];
        }> = [];

        for (const entry of entries) {
          const created = await api.createProject({
            name: entry.project.name,
            description: entry.project.description,
            llm_prompt: entry.project.llm_prompt,
            llm_config: entry.project.llm_config,
          });
          let createdNodes = 0;
          let skipped = 0;
          const errors: string[] = [];
          for (const node of entry.nodes) {
            try {
              await api.createNode({
                project_api_id: created.project_api_id,
                name: node.name,
                description: node.description,
                node_schema: node.node_schema,
                runtime: node.runtime,
                tool_code: node.tool_code,
                http_config: node.http_config ?? null,
                is_root: node.is_root,
                dependencies: node.dependencies,
              });
              createdNodes += 1;
            } catch (err) {
              skipped += 1;
              errors.push(`${node.name}: ${err instanceof Error ? err.message : "failed"}`);
            }
          }
          projects_imported += 1;
          nodes_created += createdNodes;
          nodes_skipped += skipped;
          results.push({
            project_api_id: created.project_api_id,
            name: created.name,
            nodes_created: createdNodes,
            nodes_skipped: skipped,
            node_errors: errors,
          });
        }

        return {
          projects_imported,
          nodes_created,
          nodes_skipped,
          results,
          via: "client" as const,
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });

  const exportAndDownloadWorkspace = useMutation({
    mutationFn: async () => {
      const payload = await exportProjects.mutateAsync();
      downloadJson(
        `perfect-engine-workspace-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
        payload,
      );
      return payload;
    },
  });

  return {
    exportProjects,
    importProjects,
    exportAndDownloadWorkspace,
  };
}
