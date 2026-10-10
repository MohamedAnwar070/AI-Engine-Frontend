import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SchemaBuilder, SchemaField } from "@/components/nodes/SchemaBuilder";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { useNode, useNodeMutations } from "@/domain/nodes";
import { toast } from "sonner";
import { NodeTestDialog } from "@/components/nodes/NodeTestDialog";
import type { HttpToolConfig, NodeRuntime } from "@/lib/api";
import { Save, X, Play, Code2, Layers, Settings2, Globe } from "lucide-react";

const DEFAULT_JS_CODE = `async function executeNode(inputs) {
  // Access inputs: inputs.field_name
  // fetch is available; require() is allowlisted (http/https/crypto/...)

  return {
    success: true,
    echo: inputs,
  };
}`;

const DEFAULT_PYTHON_CODE = `def execute_node(inputs):
    # Prefer stdlib allowlisted modules only
    return {
        "success": True,
        "echo": inputs,
    }
`;

export default function NodeForm() {
  const { projectId, nodeId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!nodeId;
  const { createNode, updateNode } = useNodeMutations(projectId);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_root: false,
    dependencies: "",
    runtime: "javascript" as NodeRuntime,
    inputs: [] as SchemaField[],
    outputs: [] as SchemaField[],
    tool_code: DEFAULT_JS_CODE,
    http_method: "POST" as HttpToolConfig["method"],
    http_url: "",
    http_headers: '{\n  "Content-Type": "application/json"\n}',
    http_body: "",
  });

  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const existingNodeQuery = useNode(nodeId);
  const existingNode = existingNodeQuery.data;

  useEffect(() => {
    if (existingNode) {
      const http = existingNode.http_config;
      setFormData({
        name: existingNode.name,
        description: existingNode.description,
        is_root: existingNode.is_root,
        dependencies: (existingNode.dependencies || []).join(", "),
        runtime: existingNode.runtime || "javascript",
        inputs: Object.entries(existingNode.node_schema.inputs).map(([name, type]) => ({ name, type })),
        outputs: Object.entries(existingNode.node_schema.outputs).map(([name, type]) => ({ name, type })),
        tool_code: existingNode.tool_code || (existingNode.runtime === "python" ? DEFAULT_PYTHON_CODE : DEFAULT_JS_CODE),
        http_method: http?.method || "POST",
        http_url: http?.url || "",
        http_headers: JSON.stringify(http?.headers || { "Content-Type": "application/json" }, null, 2),
        http_body:
          http?.body_template !== undefined && http?.body_template !== null
            ? JSON.stringify(http.body_template, null, 2)
            : "",
      });
    }
  }, [existingNode]);

  const isPending = createNode.isPending || updateNode.isPending;

  const handleRuntimeChange = (runtime: NodeRuntime) => {
    setFormData((current) => {
      let tool_code = current.tool_code;
      if (runtime === "javascript" && (!tool_code || tool_code === DEFAULT_PYTHON_CODE)) {
        tool_code = DEFAULT_JS_CODE;
      }
      if (runtime === "python" && (!tool_code || tool_code === DEFAULT_JS_CODE)) {
        tool_code = DEFAULT_PYTHON_CODE;
      }
      return { ...current, runtime, tool_code };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Node name is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
      toast.error("Node name must be alphanumeric (no spaces). Use underscores if needed.");
      return;
    }

    if (formData.runtime === "http") {
      if (!formData.http_url.trim()) {
        toast.error("HTTP URL is required for http runtime");
        return;
      }
    } else if (!formData.tool_code.trim()) {
      toast.error("Tool code is required");
      return;
    }

    const arrayToSchema = (fields: SchemaField[]) => {
      const schema: Record<string, string> = {};
      fields.forEach((field) => {
        if (field.name && field.name.trim()) {
          schema[field.name.trim()] = field.type;
        }
      });
      return schema;
    };

    let http_config: HttpToolConfig | null = null;
    if (formData.runtime === "http") {
      let headers: Record<string, string> = {};
      try {
        headers = formData.http_headers.trim() ? JSON.parse(formData.http_headers) : {};
      } catch {
        toast.error("HTTP headers must be valid JSON");
        return;
      }
      let body_template: unknown = undefined;
      if (formData.http_body.trim()) {
        try {
          body_template = JSON.parse(formData.http_body);
        } catch {
          toast.error("HTTP body template must be valid JSON");
          return;
        }
      }
      http_config = {
        method: formData.http_method,
        url: formData.http_url.trim(),
        headers,
        body_template,
      };
    }

    const nodeData = {
      project_api_id: projectId!,
      name: formData.name,
      description: formData.description,
      is_root: formData.is_root,
      dependencies: formData.dependencies
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      runtime: formData.runtime,
      node_schema: {
        inputs: arrayToSchema(formData.inputs),
        outputs: arrayToSchema(formData.outputs),
      },
      tool_code: formData.runtime === "http" ? "" : formData.tool_code,
      http_config,
    };

    const request = isEdit
      ? updateNode.mutateAsync({ nodeId: nodeId!, payload: nodeData })
      : createNode.mutateAsync(nodeData);
    request
      .then(() => {
        toast.success(isEdit ? "Node updated successfully" : "Node created successfully");
        navigate(`/projects/${projectId}`);
      })
      .catch((error: Error) => {
        toast.error(error?.message || "Failed to save node");
      });
  };

  if (isEdit && existingNodeQuery.isLoading) {
    return <PageSkeleton title="Edit Node" description="Loading node configuration" cards={3} />;
  }

  return (
    <PageContainer
      title={isEdit ? "Configure Operation Node" : "Initialize Semantic Node"}
      description={
        isEdit
          ? `Modifying operational logic for ${formData.name}`
          : "Define a new execution unit within the orchestration workspace."
      }
    >
      <form onSubmit={handleSubmit} className="max-w-6xl space-y-8 pb-20">
        <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Node Metadata</h2>
              <p className="text-sm font-sans text-muted-foreground">
                Functional naming, runtime, and structural positioning.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">
                  Symbolic Identifier
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. SearchJobs_Primary"
                  className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="runtime" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">
                  Runtime
                </Label>
                <select
                  id="runtime"
                  value={formData.runtime}
                  onChange={(e) => handleRuntimeChange(e.target.value as NodeRuntime)}
                  className="w-full h-12 rounded-[8px] bg-surface-lowest ghost-border border-transparent px-3 font-sans text-sm"
                >
                  <option value="javascript">JavaScript (Node) — warm, default</option>
                  <option value="python">Python — lazy pool (scale to zero)</option>
                  <option value="http">HTTP — call Java / any external API</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dependencies" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">
                Upstream Dependencies
              </Label>
              <Input
                id="dependencies"
                value={formData.dependencies}
                onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                placeholder="Comma-separated node names"
                className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">
                Operational Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the logic intended for this semantic unit..."
                rows={3}
                className="bg-surface-lowest ghost-border border-transparent rounded-[8px] font-sans resize-none leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center p-4 rounded-[8px] bg-surface-lowest ghost-border border-transparent">
              <Checkbox
                id="is_root"
                checked={formData.is_root}
                onCheckedChange={(checked) => setFormData({ ...formData, is_root: checked as boolean })}
                className="data-[state=checked]:bg-primary data-[state=checked]:text-black border-white/20"
              />
              <Label htmlFor="is_root" className="ml-3 cursor-pointer font-bold font-sans text-sm tracking-tight">
                INITIAL ENTRY POINT (ROOT)
              </Label>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="surface-high p-8 rounded-[12px] cloud-shadow relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-bold">Input Schema</h2>
            </div>
            <SchemaBuilder fields={formData.inputs} onChange={(inputs) => setFormData({ ...formData, inputs })} />
          </div>
          <div className="surface-high p-8 rounded-[12px] cloud-shadow relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Layers className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-display font-bold">Output Schema</h2>
            </div>
            <SchemaBuilder fields={formData.outputs} onChange={(outputs) => setFormData({ ...formData, outputs })} />
          </div>
        </div>

        {formData.runtime === "http" ? (
          <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">HTTP Tool</h2>
                <p className="text-sm font-sans text-muted-foreground">
                  Call Java services, APIs, or any polyglot backend. Use {"{{field}}"} templates from inputs.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Method</Label>
                <select
                  value={formData.http_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      http_method: e.target.value as HttpToolConfig["method"],
                    })
                  }
                  className="w-full h-12 rounded-[8px] bg-surface-lowest ghost-border border-transparent px-3"
                >
                  {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">URL</Label>
                <Input
                  value={formData.http_url}
                  onChange={(e) => setFormData({ ...formData, http_url: e.target.value })}
                  placeholder="https://api.example.com/jobs?q={{query}}"
                  className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-mono text-sm"
                />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Headers (JSON)</Label>
              <Textarea
                value={formData.http_headers}
                onChange={(e) => setFormData({ ...formData, http_headers: e.target.value })}
                className="font-mono text-[13px] min-h-[120px] bg-black/40 border-none rounded-[8px] p-4"
              />
            </div>
            <div className="mt-6 space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Body template (JSON, optional — defaults to inputs)
              </Label>
              <Textarea
                value={formData.http_body}
                onChange={(e) => setFormData({ ...formData, http_body: e.target.value })}
                placeholder='{"query": "{{query}}"}'
                className="font-mono text-[13px] min-h-[160px] bg-black/40 border-none rounded-[8px] p-4"
              />
            </div>
          </Card>
        ) : (
          <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Logic Engine</h2>
                  <p className="text-sm font-sans text-muted-foreground">
                    {formData.runtime === "python"
                      ? "Define execute_node(inputs) — lazy Python pool."
                      : "Define executeNode(inputs) — warm Node pool."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestDialogOpen(true)}
                className="rounded-[8px] ghost-border h-10 font-bold px-4 hover:bg-primary hover:text-black transition-all"
              >
                <Play className="h-3 w-3 mr-2" />
                DEBUG EXECUTION
              </Button>
            </div>

            <Textarea
              value={formData.tool_code}
              onChange={(e) => setFormData({ ...formData, tool_code: e.target.value })}
              className="font-mono text-[13px] min-h-[500px] bg-black/40 border-none ghost-border rounded-[8px] p-6 focus:ring-1 focus:ring-primary/50 transition-all text-emerald-400/90 leading-relaxed custom-scrollbar"
              required
            />
            <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
              <span>
                {formData.runtime === "python"
                  ? "Sandbox: allowlisted stdlib imports only"
                  : "Sandbox: fetch + allowlisted require modules"}
              </span>
              <span className="ml-auto">Runtime: {formData.runtime}</span>
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            variant="premium"
            className="flex-1 h-14 rounded-[10px] font-bold uppercase tracking-tight text-base shadow-lg"
          >
            <Save className="h-5 w-5 mr-3" />
            {isPending ? "Executing Update..." : isEdit ? "Deploy Node Logic" : "Initialize Semantic Node"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="sm:w-48 h-14 rounded-[10px] font-bold uppercase tracking-tight text-sm bg-surface-high hover:bg-surface-highest text-foreground border-none"
          >
            <X className="h-4 w-4 mr-2" />
            Abort
          </Button>
        </div>
      </form>

      <NodeTestDialog
        isOpen={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        schema={formData.inputs}
        toolCode={formData.tool_code}
        projectId={projectId!}
        nodeName={formData.name}
      />
    </PageContainer>
  );
}
