export const queryKeys = {
  projects: ["projects"] as const,
  project: (projectId?: string) => ["project", projectId] as const,
  nodes: (projectId?: string) => ["nodes", projectId] as const,
  node: (nodeId?: string) => ["node", nodeId] as const,
  conversation: (conversationId?: string | null) => ["conversation", conversationId] as const,
  stats: ["stats"] as const,
  health: ["health"] as const,
  executionHistoryRoot: (projectId?: string) => ["execution-history", projectId] as const,
  executionHistory: (projectId?: string, limit = 50) => ["execution-history", projectId, limit] as const,
  testRun: (testRunId?: string | null) => ["test-run", testRunId] as const,
};
