import { useMemo, useState } from "react";
import { formatDistance } from "date-fns";
import {
  Activity,
  Bot,
  Brain,
  CircuitBoard,
  GitBranch,
  HeartPulse,
  History,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/PageContainer";
import { GraphCanvas } from "@/components/operations/GraphCanvas";
import { TestRunMonitor } from "@/components/testing/TestRunMonitor";
import { AsyncState } from "@/components/state/AsyncState";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "@/domain/projects";
import { useDashboardStats, useHealthStatus } from "@/domain/settings";
import { useExecutionHistory } from "@/domain/nodes";
import {
  useControlPlaneOverview,
  useConversationRecovery,
  useProjectGraph,
  useProjectSimulation,
  useProjectTemplateMutations,
  useProjectTemplates,
  usePromptPresetMutation,
  usePromptPresets,
  useReplayExecution,
  useRollbackNodeVersion,
  useToolAudits,
  useGovernanceAudits,
  useNodeVersions,
} from "@/domain/intelligence";
import { useProjectNodes } from "@/domain/nodes";

export default function Operations() {
  const projectsQuery = useProjects();
  const statsQuery = useDashboardStats();
  const healthQuery = useHealthStatus(true);
  const controlPlaneQuery = useControlPlaneOverview();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templatePrompt, setTemplatePrompt] = useState("");
  const [templateNodesJson, setTemplateNodesJson] = useState("[]");
  const [templateTestsJson, setTemplateTestsJson] = useState("[]");
  const [presetName, setPresetName] = useState("");
  const [presetPrompt, setPresetPrompt] = useState("");
  const [presetMessages, setPresetMessages] = useState("");

  const templatesQuery = useProjectTemplates();
  const { createTemplate, updateTemplate } = useProjectTemplateMutations();
  const graphQuery = useProjectGraph(selectedProjectId || undefined);
  const simulationQuery = useProjectSimulation(selectedProjectId || undefined);
  const presetsQuery = usePromptPresets(selectedProjectId || undefined);
  const projectNodesQuery = useProjectNodes(selectedProjectId || undefined);
  const executionHistoryQuery = useExecutionHistory(selectedProjectId || undefined, 15, {
    enabled: !!selectedProjectId,
    poll: !!selectedProjectId,
    pollIntervalMs: 20000,
  });
  const auditsQuery = useToolAudits(selectedProjectId || undefined, 15);
  const governanceAuditsQuery = useGovernanceAudits(20);
  const nodeVersionsQuery = useNodeVersions(selectedNodeId || undefined);
  const recoveryQuery = useConversationRecovery(selectedProjectId || undefined);
  const createPreset = usePromptPresetMutation(selectedProjectId || undefined);
  const replayExecution = useReplayExecution();
  const rollbackNodeVersion = useRollbackNodeVersion(selectedProjectId || undefined);

  const projects = projectsQuery.data || [];
  const selectedProject = useMemo(() => projects.find((project) => project.project_api_id === selectedProjectId), [projects, selectedProjectId]);

  if (projectsQuery.isLoading && statsQuery.isLoading && controlPlaneQuery.isLoading) {
    return <PageSkeleton title="Operations" description="Loading control-plane intelligence" cards={6} />;
  }

  if (projectsQuery.error || statsQuery.error || controlPlaneQuery.error) {
    return (
      <PageContainer title="Operations" description="Live control-plane monitoring and orchestration workflows">
        <AsyncState
          title="Operations unavailable"
          description="Control-plane data could not be loaded."
          actionLabel="Retry"
          onAction={() => {
            projectsQuery.refetch();
            statsQuery.refetch();
            controlPlaneQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const controlPlane = controlPlaneQuery.data;

  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templatesQuery.data?.find((item) => item.template_id === templateId);
    if (!template) return;
    setTemplateName(template.name);
    setTemplateCategory(template.category);
    setTemplateDescription(template.description);
    setTemplatePrompt(template.llm_prompt);
    setTemplateNodesJson(JSON.stringify(template.suggested_nodes, null, 2));
    setTemplateTestsJson(JSON.stringify(template.suggested_test_messages, null, 2));
  };

  const resetTemplateForm = () => {
    setSelectedTemplateId("");
    setTemplateName("");
    setTemplateCategory("");
    setTemplateDescription("");
    setTemplatePrompt("");
    setTemplateNodesJson("[]");
    setTemplateTestsJson("[]");
  };

  const handleSaveTemplate = async () => {
    let suggestedNodes: Array<Record<string, unknown>> = [];
    let suggestedTests: string[] = [];

    try {
      suggestedNodes = JSON.parse(templateNodesJson);
      suggestedTests = JSON.parse(templateTestsJson);
    } catch {
      toast.error("Template JSON must be valid");
      return;
    }

    const payload = {
      name: templateName,
      category: templateCategory,
      description: templateDescription,
      llm_prompt: templatePrompt,
      suggested_nodes: suggestedNodes,
      suggested_test_messages: suggestedTests,
    };

    if (selectedTemplateId) {
      await updateTemplate.mutateAsync({ templateId: selectedTemplateId, payload });
      toast.success("Template updated");
    } else {
      await createTemplate.mutateAsync(payload);
      toast.success("Template created");
    }
    resetTemplateForm();
  };

  const handleCreatePreset = async () => {
    if (!selectedProjectId || !presetName.trim() || !presetPrompt.trim()) {
      toast.error("Choose a project and fill the preset fields first");
      return;
    }
    await createPreset.mutateAsync({
      name: presetName,
      prompt: presetPrompt,
      test_messages: presetMessages.split("\n").map((value) => value.trim()).filter(Boolean),
      tags: [],
    });
    toast.success("Prompt preset saved");
    setPresetName("");
    setPresetPrompt("");
  };

  return (
    <PageContainer title="Operations" description="Live control-plane monitoring and orchestration workflows">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="surface-high border-none cloud-shadow p-6 space-y-4 rounded-[12px]">
            <div>
              <h2 className="text-lg font-display font-bold flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary" /> Platform Status</h2>
              <p className="text-sm font-sans text-muted-foreground mt-1 leading-relaxed">Choose a project to inspect graph health, audits, presets, and live test runs.</p>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="operations-project" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Project</Label>
              <select
                id="operations-project"
                value={selectedProjectId}
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                  setSelectedNodeId("");
                }}
                className="w-full bg-surface-highest ghost-border border-transparent rounded-[8px] px-4 py-2.5 text-sm outline-none font-sans text-foreground transition-all hover:bg-surface focus:ring-primary/50"
              >
                <option value="" disabled>Select a project</option>
                {projects.map((project) => (
                  <option key={project.project_api_id} value={project.project_api_id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 pt-4 border-t border-surface-highest">
              <div className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Backend Health</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">{healthQuery.data?.status || "checking"}</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">MongoDB: {healthQuery.data?.mongodb || "unknown"}</p>
              </div>
              <div className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">LLM Cost Estimate</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">${controlPlane?.llm_cost_estimate_usd.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">Avg latency {Math.round(controlPlane?.llm_average_latency_ms || 0)} ms</p>
              </div>
              <div className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Conversation Quality</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">{controlPlane?.conversation_quality.fallback_rate || 0}% fallback</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">Recovered {controlPlane?.conversation_quality.recovered_conversations || 0} conversations</p>
              </div>
              <div className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Governance Events</p>
                <p className="mt-2 text-lg font-display font-bold text-foreground">{governanceAuditsQuery.data?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1 font-sans">Latest global audit stream</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="surface-high border-none cloud-shadow p-5 rounded-[12px]"><p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-2">Projects</p><p className="text-3xl font-display font-black text-foreground">{statsQuery.data?.total_projects || 0}</p></Card>
            <Card className="surface-high border-none cloud-shadow p-5 rounded-[12px]"><p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-2">Executions</p><p className="text-3xl font-display font-black text-foreground">{statsQuery.data?.total_executions || 0}</p></Card>
            <Card className="surface-high border-none cloud-shadow p-5 rounded-[12px]"><p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-2">Queued Tests</p><p className="text-3xl font-display font-black text-foreground">{(statsQuery.data?.queued_test_runs || 0) + (statsQuery.data?.running_test_runs || 0)}</p></Card>
            <Card className="surface-high border-none cloud-shadow p-5 rounded-[12px]"><p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-2">Success Rate</p><p className="text-3xl font-display font-black text-foreground">{statsQuery.data?.success_rate || 0}%</p></Card>
            <Card className="surface-high border-none cloud-shadow p-5 rounded-[12px] md:col-span-2"><h3 className="font-display font-bold flex items-center gap-2 mb-4"><ShieldCheck className="h-4 w-4 text-primary" /> Weakest Projects</h3><div className="space-y-3">{controlPlane?.project_health.slice(0, 4).map((project) => <div key={project.project_api_id} className="flex items-center justify-between text-sm py-2 border-b border-surface-highest last:border-0 font-sans"><span>{project.project_name}</span><span className="text-muted-foreground font-bold">{project.health_score}</span></div>)}</div></Card>
            <Card className="surface-high border-none cloud-shadow p-5 rounded-[12px] md:col-span-2"><h3 className="font-display font-bold flex items-center gap-2 mb-4"><Bot className="h-4 w-4 text-primary" /> Failed Nodes</h3><div className="space-y-3">{controlPlane?.failed_nodes.slice(0, 4).map((node) => <div key={node.node_name} className="flex items-center justify-between text-sm py-2 border-b border-surface-highest last:border-0 font-sans"><span>{node.node_name}</span><span className="text-muted-foreground font-bold">{node.failures} fail</span></div>)}</div></Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {selectedProjectId ? (
            <TestRunMonitor projectId={selectedProjectId} />
          ) : (
            <Card className="surface-high border-none cloud-shadow p-6 flex flex-col items-center justify-center min-h-[420px] text-center text-muted-foreground rounded-[12px]">
              <Activity className="h-10 w-10 text-primary/40 mb-4 animate-pulse-glow" />
              <p className="font-sans font-medium">Select a project to launch monitored test runs.</p>
            </Card>
          )}

          <div className="space-y-6">
            <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
              <h3 className="font-display font-bold flex items-center gap-2 mb-6"><Sparkles className="h-5 w-5 text-primary" /> Template Library</h3>
              <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {templatesQuery.data?.map((template) => (
                  <button key={template.template_id} type="button" onClick={() => handleLoadTemplate(template.template_id)} className="w-full rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4 text-left transition hover:bg-surface-highest hover:text-primary group">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold font-sans text-sm group-hover:text-primary transition-colors">{template.name}</p>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground group-hover:text-primary/70">{template.category}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{template.description}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-4 rounded-[8px] bg-surface-lowest ghost-border p-5">
                <Input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Template name" className="bg-surface-highest border-transparent rounded-[8px] ghost-border h-10" />
                <Input value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)} placeholder="Category" className="bg-surface-highest border-transparent rounded-[8px] ghost-border h-10" />
                <Textarea value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} rows={3} placeholder="Description" className="bg-surface-highest border-transparent rounded-[8px] ghost-border resize-none" />
                <Textarea value={templatePrompt} onChange={(event) => setTemplatePrompt(event.target.value)} rows={5} placeholder="LLM prompt" className="bg-surface-highest border-transparent rounded-[8px] ghost-border resize-none" />
                <Textarea value={templateNodesJson} onChange={(event) => setTemplateNodesJson(event.target.value)} rows={6} className="bg-surface-highest border-transparent rounded-[8px] ghost-border font-mono text-[11px] leading-relaxed resize-none" placeholder="Suggested nodes JSON" />
                <Textarea value={templateTestsJson} onChange={(event) => setTemplateTestsJson(event.target.value)} rows={4} className="bg-surface-highest border-transparent rounded-[8px] ghost-border font-mono text-[11px] leading-relaxed resize-none" placeholder="Suggested test messages JSON array" />
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending} className="rounded-[8px] font-bold">{selectedTemplateId ? "Update Template" : "Create Template"}</Button>
                  <Button variant="outline" onClick={resetTemplateForm} className="rounded-[8px] font-bold">Clear</Button>
                </div>
              </div>
            </Card>

            <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
              <h3 className="font-display font-bold flex items-center gap-2 mb-6"><Brain className="h-5 w-5 text-primary" /> Prompt Presets</h3>
              {selectedProject ? (
                <>
                  <div className="space-y-4 mb-6 rounded-[8px] bg-surface-lowest ghost-border p-5">
                    <Input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Preset name" className="bg-surface-highest border-transparent rounded-[8px] ghost-border h-10" />
                    <Textarea value={presetPrompt} onChange={(event) => setPresetPrompt(event.target.value)} rows={4} placeholder="Prompt preset" className="bg-surface-highest border-transparent rounded-[8px] ghost-border resize-none" />
                    <Textarea value={presetMessages} onChange={(event) => setPresetMessages(event.target.value)} rows={3} placeholder="One test message per line" className="bg-surface-highest border-transparent rounded-[8px] ghost-border resize-none" />
                    <Button onClick={handleCreatePreset} disabled={createPreset.isPending} className="rounded-[8px] font-bold mt-2">Save Preset</Button>
                  </div>
                  <div className="space-y-3">
                    {presetsQuery.data?.map((preset) => (
                      <div key={preset.preset_id} className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4">
                        <p className="font-bold text-sm">{preset.name}</p>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap font-sans leading-relaxed">{preset.prompt}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-sans text-muted-foreground p-4 bg-surface-lowest rounded-[8px] text-center border border-dashed border-white/5">Select a project to manage prompt presets.</p>
              )}
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h3 className="font-display font-bold flex items-center gap-2 mb-6"><GitBranch className="h-5 w-5 text-primary" /> Dependency Graph</h3>
            {selectedProjectId ? (
              graphQuery.isLoading ? (
                <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-16 rounded-[8px] bg-surface-highest animate-pulse" />)}</div>
              ) : (
                graphQuery.data ? <GraphCanvas graph={graphQuery.data} /> : null
              )
            ) : (
              <p className="text-sm font-sans text-muted-foreground p-4 bg-surface-lowest rounded-[8px] text-center border border-dashed border-white/5">Select a project to inspect its node dependency graph.</p>
            )}
          </Card>

          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h3 className="font-display font-bold flex items-center gap-2 mb-6"><CircuitBoard className="h-5 w-5 text-primary" /> Simulation + Recovery</h3>
            {selectedProjectId ? (
              <div className="space-y-4">
                <div className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-bold text-sm">Simulation Status</p>
                    <span className={`px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${simulationQuery.data?.valid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{simulationQuery.data?.valid ? "valid" : "needs fixes"}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {simulationQuery.data?.issues.length ? (
                      simulationQuery.data.issues.map((issue, index) => (
                        <p key={`${issue.code}-${index}`} className="text-xs text-muted-foreground font-sans bg-surface p-2 rounded-[4px] border border-surface-highest">[{issue.level}] {issue.message}</p>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground font-sans">No simulation issues found.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-5">
                  <p className="font-bold text-sm mb-3">Conversation Recovery</p>
                  {recoveryQuery.data?.recovered ? (
                    <div className="text-xs text-muted-foreground font-sans space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="font-semibold text-foreground/70">Conversation:</span> <span className="font-mono text-[10px]">{recoveryQuery.data.conversation_id}</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="font-semibold text-foreground/70">Latest node:</span> <span>{recoveryQuery.data.latest_node || "none"}</span></div>
                      <div className="flex flex-col gap-1"><span className="font-semibold text-foreground/70">Latest user format:</span> <span className="italic line-clamp-2 bg-surface p-2 rounded border border-white/5">{recoveryQuery.data.latest_user_message || "n/a"}</span></div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-sans p-2 bg-surface rounded border border-white/5">No recoverable conversation state found.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm font-sans text-muted-foreground p-4 bg-surface-lowest rounded-[8px] text-center border border-dashed border-white/5">Select a project to validate graph readiness and recovery context.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="font-display font-bold flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Execution Replay</h3>
              <Button variant="outline" size="sm" className="rounded-[8px] font-bold h-8" onClick={() => executionHistoryQuery.refetch()}><RefreshCcw className="h-3 w-3 mr-2" />Refresh</Button>
            </div>
            {selectedProjectId ? (
              <div className="space-y-3">
                {executionHistoryQuery.data?.map((execution) => (
                  <div key={execution.execution_id} className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4 transition-colors hover:bg-surface">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm tracking-tight">{execution.node_name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{formatDistance(new Date(execution.created_at), new Date(), { addSuffix: true })}</p>
                      </div>
                      <Button size="sm" variant="secondary" className="rounded-[6px] h-7 text-xs font-bold" disabled={replayExecution.isPending} onClick={() => replayExecution.mutate(execution.execution_id, { onSuccess: () => toast.success("Execution replayed") })}>Replay</Button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-[4px] bg-surface-highest text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{execution.metadata.status}</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">{Math.round(execution.metadata.duration_ms)} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-sans text-muted-foreground p-4 bg-surface-lowest rounded-[8px] text-center border border-dashed border-white/5">Select a project to replay historical executions.</p>
            )}
          </Card>

          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h3 className="font-display font-bold flex items-center gap-2 mb-6"><Activity className="h-5 w-5 text-primary" /> Tool Audit Trail</h3>
            {selectedProjectId ? (
              <div className="space-y-3">
                {auditsQuery.data?.map((audit) => (
                  <div key={audit.audit_id} className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4 transition-colors hover:bg-surface">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-sm">{audit.node_name || audit.llm_action}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider ${audit.confidence_score >= 0.8 ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>{Math.round(audit.confidence_score * 100)}% Match</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed p-2 bg-surface rounded border border-white/5">{audit.user_message}</p>
                    <div className="mt-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Fallback: <span className={audit.fallback_used ? 'text-amber-400' : 'text-foreground/50'}>{audit.fallback_used ? "YES" : "NO"}</span></span>
                      <span>Recovery: <span className={audit.recovery_used ? 'text-emerald-400' : 'text-foreground/50'}>{audit.recovery_used ? "YES" : "NO"}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-sans text-muted-foreground p-4 bg-surface-lowest rounded-[8px] text-center border border-dashed border-white/5">Select a project to inspect LLM routing decisions and confidence scores.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h3 className="font-display font-bold flex items-center gap-2 mb-6"><GitBranch className="h-5 w-5 text-primary" /> Node Version Rollback</h3>
            {selectedProjectId ? (
              <div className="space-y-5">
                <select value={selectedNodeId} onChange={(event) => setSelectedNodeId(event.target.value)} className="w-full bg-surface-highest ghost-border border-transparent rounded-[8px] px-4 py-2.5 text-sm outline-none font-sans transition-all hover:bg-surface focus:ring-primary/50">
                  <option value="">Select node</option>
                  {projectNodesQuery.data?.map((node) => <option key={node.node_id} value={node.node_id}>{node.name}</option>)}
                </select>
                <div className="space-y-3">
                  {nodeVersionsQuery.data?.map((version) => (
                    <div key={version.version_id} className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4 transition-colors hover:bg-surface">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm tracking-tight"><span className="text-primary mr-1">v{version.version_number}</span> {version.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{formatDistance(new Date(version.created_at), new Date(), { addSuffix: true })}</p>
                        </div>
                        <Button size="sm" variant="secondary" className="rounded-[6px] h-7 text-xs font-bold" disabled={rollbackNodeVersion.isPending || !selectedProjectId} onClick={() => rollbackNodeVersion.mutate({ nodeId: version.node_id, versionId: version.version_id }, { onSuccess: () => toast.success("Node version rolled back") })}>Rollback</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm font-sans text-muted-foreground p-4 bg-surface-lowest rounded-[8px] text-center border border-dashed border-white/5">Select a project to manage node versions.</p>}
          </Card>

          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h3 className="font-display font-bold flex items-center gap-2 mb-6"><ShieldCheck className="h-5 w-5 text-primary" /> Governance Audit Log</h3>
            <div className="space-y-3">
              {governanceAuditsQuery.data?.map((audit) => (
                <div key={audit.audit_id} className="rounded-[8px] bg-surface-lowest ghost-border border-transparent p-4 transition-colors hover:bg-surface">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-sm">{audit.action}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{formatDistance(new Date(audit.created_at), new Date(), { addSuffix: true })}</span>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground font-sans">
                    <p className="bg-surface px-2 py-1 rounded-[4px] border border-white/5"><span className="text-foreground/60">{audit.resource_type}</span> {audit.resource_id || ""}</p>
                    <p className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> {audit.actor_email || "system"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
