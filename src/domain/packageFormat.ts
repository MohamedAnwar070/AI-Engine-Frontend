import type { HttpToolConfig, LLMConfig, Node, NodeRuntime, Project } from "@/lib/api";

/** Canonical Perfect Engine package (v2). */
export interface PortableProject {
  name: string;
  description: string;
  llm_prompt: string;
  llm_config: LLMConfig;
}

export interface PortableNode {
  name: string;
  description: string;
  node_schema: {
    inputs: Record<string, string>;
    outputs: Record<string, string>;
  };
  runtime: NodeRuntime;
  tool_code: string;
  http_config?: HttpToolConfig | null;
  is_root: boolean;
  dependencies: string[];
}

export interface ProjectPackage {
  version: number;
  kind: "perfect_engine_project" | "perfect_engine_workspace";
  exported_at?: string;
  meta?: Record<string, unknown>;
  project?: PortableProject;
  nodes?: PortableNode[];
  projects?: Array<{
    project: PortableProject;
    nodes: PortableNode[];
  }>;
}

export interface NormalizedEntry {
  project: PortableProject;
  nodes: PortableNode[];
}

const DEFAULT_LLM: LLMConfig = {
  model_name: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9,
  top_k: 40,
};

function asProject(raw: Partial<Project> & Record<string, unknown>): PortableProject {
  return {
    name: String(raw.name || "Imported Project"),
    description: String(raw.description || "Imported from package"),
    llm_prompt: String(raw.llm_prompt || "You are a helpful assistant."),
    llm_config: {
      ...DEFAULT_LLM,
      ...(raw.llm_config || {}),
    },
  };
}

function asNode(raw: Partial<Node> & Record<string, unknown>): PortableNode | null {
  const name = String(raw.name || "").trim();
  if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) return null;

  const schema = (raw.node_schema || raw.schema || { inputs: {}, outputs: {} }) as {
    inputs?: Record<string, string>;
    outputs?: Record<string, string>;
  };

  const runtime = (String(raw.runtime || "javascript").toLowerCase() as NodeRuntime) || "javascript";

  return {
    name,
    description: String(raw.description || name),
    node_schema: {
      inputs: schema.inputs || {},
      outputs: schema.outputs || {},
    },
    runtime: ["javascript", "python", "http"].includes(runtime) ? runtime : "javascript",
    tool_code: String(raw.tool_code || ""),
    http_config: (raw.http_config as HttpToolConfig | null | undefined) ?? null,
    is_root: Boolean(raw.is_root),
    dependencies: Array.isArray(raw.dependencies) ? raw.dependencies.map(String) : [],
  };
}

/** Parse any supported export shape into project entries. */
export function normalizePackage(raw: unknown): NormalizedEntry[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Package must be a JSON object");
  }
  const data = raw as Record<string, unknown>;
  const entries: NormalizedEntry[] = [];

  if (Array.isArray(data.projects) && data.projects.length > 0) {
    for (const item of data.projects) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const projectRaw = (row.project && typeof row.project === "object" ? row.project : row) as Record<string, unknown>;
      const nodesRaw = Array.isArray(row.nodes) ? row.nodes : [];
      if (!projectRaw.name) continue;
      entries.push({
        project: asProject(projectRaw as never),
        nodes: nodesRaw
          .map((n) => asNode((n || {}) as never))
          .filter(Boolean) as PortableNode[],
      });
    }
    if (entries.length) return entries;
  }

  if (data.project && typeof data.project === "object") {
    const project = asProject(data.project as never);
    const nodes = (Array.isArray(data.nodes) ? data.nodes : [])
      .map((n) => asNode((n || {}) as never))
      .filter(Boolean) as PortableNode[];
    return [{ project, nodes }];
  }

  if (data.name && (data.llm_prompt !== undefined || data.nodes)) {
    const project = asProject(data as never);
    const nodes = (Array.isArray(data.nodes) ? data.nodes : [])
      .map((n) => asNode((n || {}) as never))
      .filter(Boolean) as PortableNode[];
    return [{ project, nodes }];
  }

  throw new Error("Invalid package: expected { project, nodes } or { projects: [...] }");
}

export function buildProjectPackage(project: Project, nodes: Node[]): ProjectPackage {
  return {
    version: 2,
    kind: "perfect_engine_project",
    exported_at: new Date().toISOString(),
    meta: {
      format: "perfect_engine_package_v2",
      source_project_api_id: project.project_api_id,
    },
    project: asProject(project as never),
    nodes: nodes
      .map((n) => asNode(n as never))
      .filter(Boolean) as PortableNode[],
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
