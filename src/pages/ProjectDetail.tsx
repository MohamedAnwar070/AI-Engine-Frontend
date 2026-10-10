import { useMemo, useRef, useState, type ChangeEventHandler } from "react";
import { formatDistance } from "date-fns";
import { Calendar, Download, Edit, MessageSquare, Network, Settings2, Upload, Workflow } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ChatConversationPanel } from "@/components/chat/ChatConversationPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { NodeCard } from "@/components/nodes/NodeCard";
import { AsyncState } from "@/components/state/AsyncState";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { TestRunMonitor } from "@/components/testing/TestRunMonitor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatSession } from "@/domain/chat";
import { useExecutionHistory, useNodeMutations, useProjectNodes } from "@/domain/nodes";
import { useProject } from "@/domain/projects";
import { buildProjectPackage, downloadJson, normalizePackage } from "@/domain/packageFormat";
import { api } from "@/lib/api";
import type { Node } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const queryClient = useQueryClient();
  const projectQuery = useProject(id);
  const nodesQuery = useProjectNodes(id);
  const chatSession = useChatSession(id);
  const { createNode } = useNodeMutations(id);

  // Only fetch/poll executions while that tab is open (not on Chat/Overview)
  const executionHistoryQuery = useExecutionHistory(id, 20, {
    enabled: activeTab === "executions",
    poll: activeTab === "executions",
    pollIntervalMs: 15000,
  });

  const project = projectQuery.data;
  const nodes = nodesQuery.data || [];
  const rootNode = useMemo(() => nodes.find((node) => node.is_root), [nodes]);

  const handleExportProject = async () => {
    if (!project || !id) return;
    setIsExporting(true);
    try {
      let payload: Record<string, unknown>;
      try {
        payload = await api.exportProject(id);
      } catch {
        payload = buildProjectPackage(project, nodes) as unknown as Record<string, unknown>;
      }
      const safeName = project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      downloadJson(`perfect-engine-${safeName || id}.json`, payload);
      toast.success("Project package exported (prompt + nodes + runtimes)");
    } catch {
      toast.error("Failed to export project");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportButtonClick = () => fileInputRef.current?.click();

  const handleImportFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result));

        // Full package with project+nodes → create NEW project(s) via API
        const looksLikeFullPackage =
          (data?.project && data?.nodes) ||
          (Array.isArray(data?.projects) && data.projects.length > 0);

        if (looksLikeFullPackage && data?.project?.llm_prompt) {
          const result = await api.importPackage(data);
          await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
          const first = result.results[0];
          toast.success(
            first
              ? `Imported project "${first.name}" with ${first.nodes_created} nodes`
              : `Imported ${result.projects_imported} project(s)`,
          );
          if (first?.project_api_id) {
            navigate(`/projects/${first.project_api_id}`);
          }
          return;
        }

        // Nodes-only merge into current project
        const entries = normalizePackage(
          data.nodes
            ? { project: { name: project?.name || "temp", description: "x", llm_prompt: project?.llm_prompt || "x", llm_config: project?.llm_config }, nodes: data.nodes }
            : data,
        );
        const importedNodes = entries[0]?.nodes || [];
        if (!importedNodes.length) {
          toast.error("Invalid import file: need project+nodes package or nodes array");
          return;
        }

        let createdCount = 0;
        let skipped = 0;
        for (const node of importedNodes) {
          try {
            await createNode.mutateAsync({
              project_api_id: id,
              name: node.name,
              description: node.description,
              node_schema: node.node_schema,
              runtime: node.runtime,
              tool_code: node.tool_code,
              http_config: node.http_config ?? null,
              is_root: Boolean(node.is_root),
              dependencies: node.dependencies,
            });
            createdCount += 1;
          } catch {
            skipped += 1;
          }
        }

        await queryClient.invalidateQueries({ queryKey: queryKeys.nodes(id) });
        toast.success(
          createdCount > 0
            ? `Imported ${createdCount} node${createdCount === 1 ? "" : "s"}${skipped ? ` (${skipped} skipped)` : ""} into this project`
            : "No nodes were imported",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to import package");
      } finally {
        setIsImporting(false);
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read import file");
      setIsImporting(false);
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  if (projectQuery.isLoading || nodesQuery.isLoading) {
    return <PageSkeleton title="Project" description="Loading project orchestration" cards={4} />;
  }

  if (!project || projectQuery.error) {
    return (
      <PageContainer title="Project" description="Project orchestration workspace">
        <AsyncState title="Project not found" description="This project could not be loaded or no longer exists." actionLabel="Back to Projects" onAction={() => navigate("/projects")} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={project.name}
      description={project.description}
      actions={
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <Button variant="secondary" className="surface-highest font-bold uppercase tracking-tight rounded-[8px]" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="premium" className="rounded-[8px]" onClick={() => setActiveTab("chat")}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="font-bold tracking-tight uppercase">Test Chat</span>
          </Button>
          <Button variant="outline" className="rounded-[8px]" onClick={handleExportProject} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            variant="outline"
            className="rounded-[8px]"
            onClick={handleImportButtonClick}
            disabled={isImporting || createNode.isPending}
            title="Merge nodes into this project, or import a full package as a new project"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import nodes"}
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFileChange} />
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 surface-low p-1 max-w-4xl rounded-[12px] ghost-border">
          <TabsTrigger value="overview" className="rounded-[8px]">Overview</TabsTrigger>
          <TabsTrigger value="nodes" className="rounded-[8px]">Nodes ({nodes.length})</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-[8px]">Chat</TabsTrigger>
          <TabsTrigger value="testing" className="rounded-[8px]">Test Runs</TabsTrigger>
          <TabsTrigger value="executions" className="rounded-[8px]">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="surface-high border-none cloud-shadow p-6 group rounded-[12px]">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-[8px] ghost-border bg-surface-highest text-primary"><Network className="h-5 w-5" /></div><h3 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Total Nodes</h3></div>
              <p className="text-4xl font-display font-black leading-none text-foreground">{nodes.length}</p>
            </Card>
            <Card className="surface-high border-none cloud-shadow p-6 group rounded-[12px]">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-[8px] ghost-border bg-surface-highest text-primary"><Settings2 className="h-5 w-5" /></div><h3 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">LLM Model</h3></div>
              <p className="text-xl font-display font-bold line-clamp-1">{project.llm_config.model_name}</p>
            </Card>
            <Card className="surface-high border-none cloud-shadow p-6 group rounded-[12px]">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-[8px] ghost-border bg-surface-highest text-primary"><Calendar className="h-5 w-5" /></div><h3 className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Created</h3></div>
              <p className="text-sm font-sans font-semibold">{formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}</p>
            </Card>
          </div>

          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h3 className="text-lg font-display font-bold mb-4 text-foreground">System Prompt</h3>
            <pre className="text-sm bg-surface-lowest p-5 rounded-[8px] overflow-auto whitespace-pre-wrap ghost-border font-mono leading-relaxed">{project.llm_prompt}</pre>
          </Card>

          {rootNode ? (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" />Root Node</h3>
              <NodeCard node={rootNode} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="nodes" className="space-y-8">
          <div className="flex justify-between items-center bg-surface-low p-4 rounded-[12px] ghost-border">
            <p className="text-sm font-sans font-medium text-muted-foreground">Connect your API nodes to build complex bot behaviors.</p>
            <Button asChild variant="premium" className="rounded-[8px]">
              <Link to={`/projects/${id}/nodes/new`}><span className="font-bold tracking-tight uppercase">Add Node</span></Link>
            </Button>
          </div>

          {nodes.length === 0 ? (
            <AsyncState title="No nodes yet" description="Create your first API integration node and start building your bot's intelligence." actionLabel="Create Node" onAction={() => navigate(`/projects/${id}/nodes/new`)} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nodes.map((node) => (
                <NodeCard key={node.node_id} node={node} onEdit={() => navigate(`/projects/${id}/nodes/${node.node_id}/edit`)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <ChatConversationPanel
            messages={chatSession.messages}
            onSend={(message) => chatSession.sendMessage(message)}
            isSending={chatSession.isSending}
            placeholder="Type your message to test the bot..."
            emptyTitle="Ready to test?"
            emptyDescription="Send a message below to start a conversation with your bot."
            heightClassName="min-h-[620px]"
          />
        </TabsContent>

        <TabsContent value="testing">
          <TestRunMonitor projectId={id!} />
        </TabsContent>

        <TabsContent value="executions">
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-[8px] ghost-border bg-surface-highest text-primary">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Execution History</h3>
                <p className="text-sm font-sans text-muted-foreground">Recent node runs with latency, cache, and retry metadata.</p>
              </div>
            </div>

            {executionHistoryQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-[12px] bg-surface-lowest animate-pulse" />
                ))}
              </div>
            ) : executionHistoryQuery.data?.length ? (
              <div className="space-y-4">
                {executionHistoryQuery.data.map((execution) => (
                  <div key={execution.execution_id} className="rounded-[12px] ghost-border bg-surface-lowest p-5 transition-colors hover:bg-surface">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-display font-bold text-base">{execution.node_name}</p>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mt-1">{execution.source} • {formatDistance(new Date(execution.created_at), new Date(), { addSuffix: true })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans font-bold text-foreground">{Math.round(execution.metadata.duration_ms)} ms</p>
                        <span className="px-2 py-0.5 mt-1 rounded-[4px] bg-surface-highest text-[10px] font-bold uppercase tracking-wider text-muted-foreground inline-block">{execution.metadata.status}</span>
                      </div>
                    </div>
                    <pre className="mt-4 overflow-auto rounded-[8px] bg-background p-4 text-[11px] text-muted-foreground font-mono leading-relaxed ghost-border">{JSON.stringify(execution.result, null, 2)}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <AsyncState title="No executions yet" description="Run chat or project tests to build execution history for this project." />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
