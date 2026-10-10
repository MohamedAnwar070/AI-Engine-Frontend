const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL_STORAGE_KEY = "arffy_api_base_url";
const AUTH_TOKEN_STORAGE_KEY = "arffy_auth_token";

const getStoredApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return API_BASE_URL;
  }

  try {
    const stored = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY);
    return stored || API_BASE_URL;
  } catch {
    return API_BASE_URL;
  }
};

export interface LLMConfig {
  model_name: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  top_k?: number;
  provider_id?: string | null;
  model_override?: string | null;
}

export interface Project {
  id: string;
  project_api_id: string;
  name: string;
  description: string;
  llm_prompt: string;
  llm_config: LLMConfig;
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  name: string;
  description: string;
  llm_prompt: string;
  llm_config: LLMConfig;
  template_id?: string;
  template_variables?: Record<string, unknown>;
}

export type NodeRuntime = "javascript" | "python" | "http";

export interface HttpToolConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  url: string;
  headers?: Record<string, string>;
  body_template?: unknown;
}

export interface Node {
  id: string;
  node_id: string;
  project_api_id: string;
  name: string;
  description: string;
  is_root: boolean;
  dependencies?: string[];
  runtime?: NodeRuntime;
  node_schema: {
    inputs: Record<string, string>;
    outputs: Record<string, string>;
  };
  tool_code: string;
  http_config?: HttpToolConfig | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutionMetadata {
  execution_id: string;
  status: "success" | "error" | "timeout" | "cached";
  worker_id?: string | null;
  cache_hit: boolean;
  attempts: number;
  duration_ms: number;
  timeout_ms: number;
  started_at: string;
  completed_at: string;
  cache_key?: string | null;
  retry_reason?: string | null;
}

export interface ExecutionHistoryItem {
  id: string;
  execution_id: string;
  project_api_id: string;
  node_id: string;
  node_name: string;
  source: "api" | "chat" | "test";
  conversation_id?: string | null;
  test_run_id?: string | null;
  input_data: Record<string, unknown>;
  result: any;
  metadata: ExecutionMetadata;
  created_at: string;
}

export interface NodeVersion {
  id: string;
  version_id: string;
  node_id: string;
  project_api_id: string;
  version_number: number;
  name: string;
  description: string;
  node_schema: {
    inputs: Record<string, string>;
    outputs: Record<string, string>;
  };
  tool_code: string;
  is_root: boolean;
  dependencies: string[];
  created_at: string;
  source: "create" | "update" | "import" | "manual";
}

export interface ProjectTemplate {
  template_id: string;
  name: string;
  category: string;
  description: string;
  llm_prompt: string;
  suggested_nodes: Array<Record<string, unknown>>;
  suggested_test_messages: string[];
}

export interface ProjectTemplatePayload {
  name: string;
  category: string;
  description: string;
  llm_prompt: string;
  suggested_nodes: Array<Record<string, unknown>>;
  suggested_test_messages: string[];
}

export interface PromptPreset {
  preset_id: string;
  project_api_id: string;
  name: string;
  prompt: string;
  test_messages: string[];
  tags: string[];
  created_at: string;
}

export interface PromptPresetPayload {
  name: string;
  prompt: string;
  test_messages: string[];
  tags: string[];
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: "admin" | "editor" | "viewer";
  is_active: boolean;
  created_at: string;
}

export interface UserCreatePayload extends AuthLoginRequest {
  full_name: string;
  role: "admin" | "editor" | "viewer";
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface GovernanceAuditItem {
  id: string;
  audit_id: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface GraphNode {
  node_id: string;
  name: string;
  is_root: boolean;
  dependencies: string[];
  execution_count: number;
  failure_count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "declared" | "observed" | "fallback";
  weight: number;
}

export interface ProjectGraph {
  project_api_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SimulationIssue {
  level: "info" | "warning" | "error";
  code: string;
  message: string;
  node_id?: string | null;
}

export interface SimulationResult {
  project_api_id: string;
  valid: boolean;
  root_node_id?: string | null;
  total_nodes: number;
  issues: SimulationIssue[];
  suggested_entrypoints: string[];
}

export interface ToolAuditItem {
  id: string;
  audit_id: string;
  project_api_id: string;
  conversation_id?: string | null;
  user_message: string;
  llm_action: string;
  node_name?: string | null;
  confidence_score: number;
  fallback_used: boolean;
  recovery_used: boolean;
  reason?: string | null;
  created_at: string;
}

export interface ConversationRecovery {
  project_api_id: string;
  session_id?: string | null;
  recovered: boolean;
  conversation_id?: string | null;
  latest_user_message?: string | null;
  latest_node?: string | null;
  recommended_prompt?: string | null;
  preserved_context?: Record<string, unknown> | null;
}

export interface ProjectHealthMetric {
  project_api_id: string;
  project_name: string;
  health_score: number;
  success_rate: number;
  avg_latency_ms: number;
  failed_runs: number;
  last_activity_at?: string | null;
}

export interface FailedNodeMetric {
  node_name: string;
  failures: number;
  latest_failure_at?: string | null;
}

export interface ControlPlaneOverview {
  project_health: ProjectHealthMetric[];
  failed_nodes: FailedNodeMetric[];
  llm_cost_estimate_usd: number;
  llm_average_latency_ms: number;
  conversation_quality: {
    total_conversations: number;
    recovered_conversations: number;
    avg_messages_per_conversation: number;
    fallback_rate: number;
  };
  timestamp: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  node_executed?: string | null;
  node_result?: any;
  execution_metadata?: ExecutionMetadata | null;
}

export interface Conversation {
  id: string;
  conversation_id: string;
  project_api_id: string;
  session_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_test: boolean;
  reset_from?: string | null;
  preserved_context?: {
    user_email?: string;
    is_authenticated?: boolean;
    recent_context?: string;
  } | null;
  messages: ConversationMessage[];
}

export interface ChatRequest {
  project_api_id: string;
  user_message: string;
  conversation_id?: string;
  session_id?: string;
  force_new?: boolean;
}

export interface ChatResponse {
  conversation_id: string;
  bot_response: string;
  node_executed?: string | null;
  node_result?: any;
  execution_metadata?: ExecutionMetadata | null;
  debug_info?: string | null;
  conversation_reset?: boolean;
  preserved_context?: {
    user_email?: string;
    is_authenticated?: boolean;
    recent_context?: string;
  } | null;
}

export interface ExecuteNodeResponse {
  node_id: string;
  node_name: string;
  result: any;
  executed_at: string;
  metadata: ExecutionMetadata;
}

export interface ProjectTestRequest {
  project_api_id: string;
  test_messages: string[];
  show_node_execution?: boolean;
  execution_mode?: "sync" | "async" | "auto";
}

export interface ProjectTestResult {
  test_number: number;
  user_message: string;
  bot_response?: string;
  action?: "chat" | "call_node";
  node_executed?: string;
  node_result?: any;
  execution_metadata?: ExecutionMetadata | null;
  success: boolean;
  error?: string;
}

export interface ProjectTestResponse {
  status: "completed";
  execution_mode: "sync";
  project_api_id: string;
  project_name: string;
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  test_results: ProjectTestResult[];
  conversation_id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

export interface ProjectTestQueuedResponse {
  status: "queued" | "running";
  execution_mode: "async";
  test_run_id: string;
  project_api_id: string;
  project_name: string;
  total_tests: number;
  queued_at: string;
  poll_url: string;
}

export interface ProjectTestRunResponse {
  id: string;
  test_run_id: string;
  status: "queued" | "running" | "completed" | "failed";
  project_api_id: string;
  project_name: string;
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  queued_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  conversation_id?: string | null;
  result?: ProjectTestResponse | null;
  error?: string | null;
}

export interface StatsResponse {
  total_projects: number;
  active_nodes: number;
  messages_processed: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  cached_executions: number;
  average_latency_ms: number;
  success_rate: number;
  queued_test_runs: number;
  running_test_runs: number;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  mongodb: string;
  redis: string;
  llm_provider: string;
  llm_status?: string;
  environment: string;
  release_version: string;
  auth_enabled: boolean;
  runtimes?: {
    javascript?: Record<string, unknown>;
    python?: Record<string, unknown>;
    http?: Record<string, unknown>;
    supported?: string[];
  };
  timestamp: string;
}

export interface LLMProviderLimits {
  rpm?: number | null;
  rpd?: number | null;
  tpm?: number | null;
  context_window?: number | null;
}

export type LLMProviderKey =
  | "gemini" | "groq" | "openrouter" | "github" | "openai"
  | "anthropic" | "deepseek" | "mistral" | "custom";

export interface LLMProvider {
  id: string;
  provider_id: string;
  name: string;
  provider: string;
  model: string;
  base_url: string;
  api_key_env: string;
  has_api_key: boolean;
  api_key_hint: string;
  extra_params: Record<string, unknown>;
  auth_type: string;
  auth_header: string;
  auth_query_param: string;
  api_format: string;
  default_temperature: number;
  default_max_tokens: number;
  default_top_p: number;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  tier: "free" | "paid" | "trial";
  limits: LLMProviderLimits;
  limits_note: string;
  docs_url: string;
  cost_per_1k_input_usd?: number | null;
  cost_per_1k_output_usd?: number | null;
  total_requests: number;
  total_errors: number;
  last_used_at?: string | null;
  last_tested_at?: string | null;
  last_test_status?: string | null;
  last_test_error?: string | null;
  last_latency_ms?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LLMProviderPayload {
  name: string;
  provider: LLMProviderKey;
  model: string;
  base_url?: string;
  api_key_env?: string;
  api_key?: string;
  extra_params?: Record<string, unknown>;
  auth_type?: "bearer" | "x-api-key" | "query" | "none";
  auth_header?: string;
  auth_query_param?: string;
  api_format?: "chat-completions" | "anthropic-messages" | "responses";
  default_temperature?: number;
  default_max_tokens?: number;
  default_top_p?: number;
  is_active?: boolean;
  priority?: number;
  tier?: "free" | "paid" | "trial";
  limits?: LLMProviderLimits;
  limits_note?: string;
  docs_url?: string;
  cost_per_1k_input_usd?: number | null;
  cost_per_1k_output_usd?: number | null;
}

export interface LLMCatalogEntry {
  key: string;
  label: string;
  provider: string;
  model: string;
  api_key_env: string;
  base_url: string;
  tier: "free" | "paid" | "trial";
  suggested_temperature: number;
  suggested_max_tokens: number;
  limits_note: string;
  docs_url: string;
  console_url: string;
  get_key_url: string;
}

export interface LLMProviderTestResult {
  provider_id: string;
  ok: boolean;
  latency_ms: number;
  model: string;
  sample_text?: string;
  error?: string | null;
  tested_at: string;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    request_id?: string;
    timestamp: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = getStoredApiBaseUrl()) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null) {
    if (typeof window === "undefined") return;
    if (!token) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }

  getAuthToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, url);
      } catch {
        // ignore storage errors
      }
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.getAuthToken() ? { Authorization: `Bearer ${this.getAuthToken()}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`;

      try {
        const errorPayload = (await response.json()) as ErrorEnvelope;
        if (errorPayload?.error?.message) {
          message = errorPayload.error.message;
        }
      } catch {
        // ignore parse errors
      }

      throw new Error(message);
    }

    return response.json();
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  async createProject(data: ProjectPayload): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<ProjectPayload>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/stats');
  }

  async getProjectNodes(projectId: string): Promise<Node[]> {
    return this.request<Node[]>(`/api/projects/${projectId}/nodes`);
  }

  async getNode(id: string): Promise<Node> {
    return this.request<Node>(`/api/nodes/${id}`);
  }

  async createNode(data: Omit<Node, 'id' | 'node_id' | 'created_at' | 'updated_at'>): Promise<Node> {
    return this.request<Node>('/api/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNode(id: string, data: Partial<Node>): Promise<Node> {
    return this.request<Node>(`/api/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNode(id: string): Promise<void> {
    return this.request<void>(`/api/nodes/${id}`, {
      method: 'DELETE',
    });
  }

  async executeNode(
    projectId: string,
    nodeName: string | undefined,
    inputData: Record<string, unknown>,
    toolCode?: string,
  ): Promise<ExecuteNodeResponse> {
    return this.request<ExecuteNodeResponse>('/api/execute-node', {
      method: 'POST',
      body: JSON.stringify({
        project_api_id: projectId,
        node_name: nodeName,
        input_data: inputData,
        tool_code: toolCode,
      }),
    });
  }

  async getExecutionHistory(projectId: string, limit = 50): Promise<ExecutionHistoryItem[]> {
    return this.request<ExecutionHistoryItem[]>(`/api/projects/${projectId}/executions?limit=${limit}`);
  }

  async replayExecution(executionId: string): Promise<ExecuteNodeResponse> {
    return this.request<ExecuteNodeResponse>(`/api/executions/${executionId}/replay`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getNodeVersions(nodeId: string): Promise<NodeVersion[]> {
    return this.request<NodeVersion[]>(`/api/nodes/${nodeId}/versions`);
  }

  async rollbackNodeVersion(projectId: string, nodeId: string, versionId: string): Promise<Node> {
    return this.request<Node>(`/api/projects/${projectId}/nodes/${nodeId}/rollback/${versionId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return this.request<ProjectTemplate[]>('/api/templates/projects');
  }

  async createProjectTemplate(payload: ProjectTemplatePayload): Promise<ProjectTemplate> {
    return this.request<ProjectTemplate>('/api/templates/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProjectTemplate(templateId: string, payload: ProjectTemplatePayload): Promise<ProjectTemplate> {
    return this.request<ProjectTemplate>(`/api/templates/projects/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getPromptPresets(projectId: string): Promise<PromptPreset[]> {
    return this.request<PromptPreset[]>(`/api/projects/${projectId}/presets`);
  }

  async createPromptPreset(projectId: string, payload: PromptPresetPayload): Promise<PromptPreset> {
    return this.request<PromptPreset>(`/api/projects/${projectId}/presets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProjectGraph(projectId: string): Promise<ProjectGraph> {
    return this.request<ProjectGraph>(`/api/projects/${projectId}/graph`);
  }

  async simulateProject(projectId: string): Promise<SimulationResult> {
    return this.request<SimulationResult>(`/api/projects/${projectId}/simulate`);
  }

  async getToolAudits(projectId: string, limit = 100): Promise<ToolAuditItem[]> {
    return this.request<ToolAuditItem[]>(`/api/projects/${projectId}/audits?limit=${limit}`);
  }

  async recoverConversation(projectId: string, sessionId?: string): Promise<ConversationRecovery> {
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
    return this.request<ConversationRecovery>(`/api/projects/${projectId}/recovery${query}`);
  }

  async getControlPlaneOverview(): Promise<ControlPlaneOverview> {
    return this.request<ControlPlaneOverview>('/api/control-plane/overview');
  }

  async login(payload: AuthLoginRequest): Promise<TokenResponse> {
    return this.request<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async registerUser(payload: UserCreatePayload): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  async getGovernanceAudits(limit = 200): Promise<GovernanceAuditItem[]> {
    return this.request<GovernanceAuditItem[]>(`/api/governance/audits?limit=${limit}`);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/api/conversations/${id}`);
  }

  async testProject(projectId: string, request: Omit<ProjectTestRequest, 'project_api_id'>): Promise<ProjectTestResponse | ProjectTestQueuedResponse> {
    return this.request<ProjectTestResponse | ProjectTestQueuedResponse>(`/api/projects/${projectId}/test`, {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        project_api_id: projectId,
      }),
    });
  }

  async getTestRun(testRunId: string): Promise<ProjectTestRunResponse> {
    return this.request<ProjectTestRunResponse>(`/api/test-runs/${testRunId}`);
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getLLMCatalog(): Promise<{ providers: LLMCatalogEntry[] }> {
    return this.request<{ providers: LLMCatalogEntry[] }>('/api/llm-providers/catalog');
  }

  async getLLMProviders(): Promise<LLMProvider[]> {
    return this.request<LLMProvider[]>('/api/llm-providers');
  }

  async getLLMProvider(providerId: string): Promise<LLMProvider> {
    return this.request<LLMProvider>(`/api/llm-providers/${providerId}`);
  }

  async createLLMProvider(payload: LLMProviderPayload): Promise<LLMProvider> {
    return this.request<LLMProvider>('/api/llm-providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateLLMProvider(providerId: string, payload: Partial<LLMProviderPayload & { is_default?: boolean }>): Promise<LLMProvider> {
    return this.request<LLMProvider>(`/api/llm-providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteLLMProvider(providerId: string): Promise<void> {
    return this.request<void>(`/api/llm-providers/${providerId}`, {
      method: 'DELETE',
    });
  }

  async setDefaultLLMProvider(providerId: string): Promise<LLMProvider> {
    return this.request<LLMProvider>(`/api/llm-providers/${providerId}/set-default`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async testLLMProvider(providerId: string): Promise<LLMProviderTestResult> {
    return this.request<LLMProviderTestResult>(`/api/llm-providers/${providerId}/test`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async testUnsavedLLMProvider(payload: LLMProviderPayload): Promise<LLMProviderTestResult> {
    return this.request<LLMProviderTestResult>('/api/llm-providers/test-connection', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getLLMProviderModels(providerId: string): Promise<{ provider_id: string; models: string[] }> {
    return this.request<{ provider_id: string; models: string[] }>(`/api/llm-providers/${providerId}/models`);
  }

  async getLLMProviderProjects(providerId: string): Promise<Project[]> {
    return this.request<Project[]>(`/api/llm-providers/${providerId}/projects`);
  }

  async bindLLMProviderProject(providerId: string, projectId: string): Promise<Project> {
    return this.request<Project>(`/api/llm-providers/${providerId}/projects`, {
      method: 'POST',
      body: JSON.stringify({ project_api_id: projectId }),
    });
  }

  async unbindLLMProviderProject(providerId: string, projectId: string): Promise<Project> {
    return this.request<Project>(`/api/llm-providers/${providerId}/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async exportProject(projectId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/projects/${projectId}/export`);
  }

  async exportWorkspace(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/api/workspace/export');
  }

  async importPackage(payload: Record<string, unknown>): Promise<{
    projects_imported: number;
    results: Array<{
      project_api_id: string;
      name: string;
      nodes_created: number;
      nodes_skipped: number;
      node_errors: string[];
    }>;
  }> {
    return this.request('/api/packages/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
