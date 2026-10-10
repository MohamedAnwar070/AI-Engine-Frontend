import { useState, useEffect, useRef, type ChangeEventHandler } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { useProjectTemplates } from "@/domain/intelligence";
import { useProject, useProjectMutations } from "@/domain/projects";
import { useLLMProviders } from "@/domain/llmProviders";
import { useDataWorkflows } from "@/domain/workflows";
import { toast } from "sonner";
import { Save, X, ChevronDown, Monitor, Cpu, Terminal, Upload } from "lucide-react";

const LLM_MODELS = ["gpt-4", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet", "llama-2", "mistral"];

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { createProject, updateProject } = useProjectMutations();
  const { importProjects } = useDataWorkflows();
  const templatesQuery = useProjectTemplates();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    llm_prompt: "",
    template_id: "",
    provider_id: "",
    model_name: "gpt-4",
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
    top_k: 40,
  });
  const llmProvidersQuery = useLLMProviders();

  // Load project if editing
  const existingProjectQuery = useProject(id);
  const existingProject = existingProjectQuery.data;

  // Update form when data is loaded
  useEffect(() => {
    if (existingProject) {
      setFormData({
        name: existingProject.name,
        description: existingProject.description,
        llm_prompt: existingProject.llm_prompt,
        template_id: "",
        provider_id: existingProject.llm_config.provider_id || "",
        model_name: existingProject.llm_config.model_name,
        temperature: existingProject.llm_config.temperature,
        max_tokens: existingProject.llm_config.max_tokens,
        top_p: existingProject.llm_config.top_p || 0.9,
        top_k: existingProject.llm_config.top_k || 40,
      });
    }
  }, [existingProject]);

  const isPending = createProject.isPending || updateProject.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      name: formData.name,
      description: formData.description,
      llm_prompt: formData.llm_prompt,
      llm_config: {
        model_name: formData.model_name,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        top_p: formData.top_p,
        top_k: formData.top_k,
        provider_id: formData.provider_id || null,
      },
      template_id: formData.template_id || undefined,
      template_variables: {},
    };

    const request = isEdit ? updateProject.mutateAsync({ projectId: id!, payload: projectData }) : createProject.mutateAsync(projectData);
    request
      .then(() => {
        toast.success(isEdit ? "Project updated successfully" : "Project created successfully");
        navigate("/projects");
      })
      .catch(() => {
        toast.error("Failed to save project");
      });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const result = await importProjects.mutateAsync(parsed);
        const first = result.results[0];
        toast.success(
          `Imported ${result.projects_imported} project(s), ${result.nodes_created} nodes` +
            (result.nodes_skipped ? ` (${result.nodes_skipped} skipped)` : ""),
        );
        if (first?.project_api_id) {
          navigate(`/projects/${first.project_api_id}`);
        } else {
          navigate("/projects");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to import package");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read import file");
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  if (isEdit && existingProjectQuery.isLoading) {
    return <PageSkeleton title="Edit Project" description="Loading project configuration" cards={2} />;
  }

  return (
    <PageContainer
      title={isEdit ? "Update Project Engine" : "Initialize New Project"}
      description={
        isEdit
          ? `Modifying configuration for ${existingProject?.name || "active project"}`
          : "Prefer importing a package when you have one — it creates project, system prompt, and nodes together."
      }
    >
      <div className="max-w-4xl space-y-8 pb-20">
        {!isEdit && (
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px] border-l-4 border-l-primary">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Import package first
                </h2>
                <p className="text-sm text-muted-foreground font-sans mt-1">
                  Upload a v2 JSON package (e.g. AI-DOC) to create the full bot before filling this blank form.
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportFileChange}
                />
                <Button
                  type="button"
                  variant="premium"
                  className="font-bold uppercase tracking-tight rounded-[8px]"
                  onClick={handleImportClick}
                  disabled={importProjects.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importProjects.isPending ? "Importing…" : "Import package"}
                </Button>
              </div>
            </div>
          </Card>
        )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Information */}
        <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Identity & Scope</h2>
              <p className="text-sm font-sans text-muted-foreground">Define the project's purpose and initial context.</p>
            </div>
          </div>

          {!isEdit && templatesQuery.data?.length ? (
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              {templatesQuery.data.slice(0, 2).map((template) => (
                <button
                  key={template.template_id}
                  type="button"
                  onClick={() => setFormData((current) => ({ ...current, template_id: template.template_id, name: current.name || template.name, description: current.description || template.description, llm_prompt: current.llm_prompt || template.llm_prompt }))}
                  className="rounded-[10px] bg-surface-lowest ghost-border p-4 text-left transition hover:bg-surface-highest hover:text-primary group"
                >
                  <p className="font-bold font-sans text-sm group-hover:text-primary transition-colors">{template.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed">{template.description}</p>
                </button>
              ))}
            </div>
          ) : null}
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., JobPortal Intelligence Engine"
                className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-sans"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Strategic Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the orchestration goals..."
                rows={4}
                className="bg-surface-lowest ghost-border border-transparent rounded-[8px] font-sans resize-none leading-relaxed"
                required
              />
              <div className="flex justify-end pr-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formData.description.length} chars</span>
              </div>
            </div>
          </div>
        </Card>

        {/* LLM Configuration */}
        <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Intelligence Framework</h2>
              <p className="text-sm font-sans text-muted-foreground">Configure the core LLM parameters and system prompt.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="llm_prompt" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">System Orchestration Prompt</Label>
              <Textarea
                id="llm_prompt"
                value={formData.llm_prompt}
                onChange={(e) => setFormData({ ...formData, llm_prompt: e.target.value })}
                placeholder="You are the central intelligence unit for..."
                rows={8}
                className="bg-surface-lowest ghost-border border-transparent rounded-[8px] font-mono text-[13px] leading-relaxed resize-none"
                required
              />
              <div className="flex justify-end pr-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formData.llm_prompt.length} chars</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="llm_provider" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Assigned LLM Provider</Label>
              <Select
                value={formData.provider_id || "global"}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value === "global" ? "" : value })}
              >
                <SelectTrigger id="llm_provider" className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-sans">
                  <SelectValue placeholder="Global default chain" />
                </SelectTrigger>
                <SelectContent className="bg-surface-high border-none rounded-[8px] ghost-border">
                  <SelectItem value="global" className="focus:bg-primary/10">
                    Global default chain
                  </SelectItem>
                  {(llmProvidersQuery.data || []).filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.provider_id} value={p.provider_id} className="focus:bg-primary/10">
                      {p.name} — {p.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] font-sans text-muted-foreground leading-relaxed italic ml-1">
                Pinned projects chat ONLY through this provider. Global default uses the fallback chain. Manage providers in Model Settings.
              </p>
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-12 bg-surface-lowest hover:bg-surface-highest rounded-[8px] ghost-border group">
                  <span className="font-bold font-display text-sm tracking-tight flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    ADVANCED MODEL PARAMETERS
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 p-6 mt-2 rounded-[8px] bg-surface-lowest ghost-border">
                <div className="space-y-2">
                  <Label htmlFor="model" className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Model Protocol</Label>
                  <Select
                    value={formData.model_name}
                    onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                  >
                    <SelectTrigger id="model" className="bg-surface-highest border-transparent rounded-[6px] h-10 font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-high border-none rounded-[8px] ghost-border">
                      {LLM_MODELS.map((model) => (
                        <SelectItem key={model} value={model} className="focus:bg-primary/10">
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="temperature" className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                      Temperature Control
                    </Label>
                    <span className="text-xs font-bold text-primary">{formData.temperature}</span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[formData.temperature]}
                    onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                    className="py-2"
                  />
                  <p className="text-[10px] font-sans text-muted-foreground leading-relaxed italic">
                    Lower values = Deterministic; Higher values = Creative exploration.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                   <div className="space-y-2">
                    <Label htmlFor="max_tokens" className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Max Sequence Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={formData.max_tokens}
                      onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                      min={1}
                      max={8192}
                      className="bg-surface-highest border-transparent rounded-[6px] h-10 font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="top_k" className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Top K Sampling</Label>
                    <Input
                      id="top_k"
                      type="number"
                      value={formData.top_k}
                      onChange={(e) => setFormData({ ...formData, top_k: parseInt(e.target.value) })}
                      min={1}
                      max={100}
                      className="bg-surface-highest border-transparent rounded-[6px] h-10 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="top_p" className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Top P Nucleus</Label>
                    <span className="text-xs font-bold text-primary">{formData.top_p}</span>
                  </div>
                  <Slider
                    id="top_p"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[formData.top_p]}
                    onValueChange={([value]) => setFormData({ ...formData, top_p: value })}
                    className="py-2"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button type="submit" disabled={isPending} variant="premium" className="flex-1 h-14 rounded-[10px] font-bold uppercase tracking-tight text-base">
            <Save className="h-5 w-5 mr-3" />
            {isPending ? "Executing Update..." : isEdit ? "Deploy Project Changes" : "Initialize Project Alpha"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/projects")}
            className="sm:w-48 h-14 rounded-[10px] font-bold uppercase tracking-tight text-sm bg-surface-high hover:bg-surface-highest text-foreground border-none"
          >
            <X className="h-4 w-4 mr-2" />
            Abort
          </Button>
        </div>
      </form>
      </div>
    </PageContainer>
  );
}
