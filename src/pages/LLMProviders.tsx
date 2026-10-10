import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FlaskConical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/PageContainer";
import { AsyncState } from "@/components/state/AsyncState";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLLMCatalog, useLLMProviders, useLLMProviderMutations } from "@/domain/llmProviders";
import { useProjects } from "@/domain/projects";
import { api, type LLMProvider, type LLMProviderKey, type LLMProviderPayload } from "@/lib/api";

type AuthType = "bearer" | "x-api-key" | "query" | "none";
type ApiFormat = "chat-completions" | "anthropic-messages" | "responses";

const API_FORMAT_OPTIONS: Array<{ value: ApiFormat; label: string }> = [
  { value: "anthropic-messages", label: "Anthropic messages (/v1/messages)" },
  { value: "chat-completions", label: "Chat completions (/chat/completions)" },
  { value: "responses", label: "Responses (/responses)" },
];

const PROVIDER_OPTIONS: LLMProviderKey[] = [
  "gemini", "groq", "openrouter", "github", "openai",
  "anthropic", "deepseek", "mistral", "custom",
];

const VENDOR_BASE_URLS: Record<string, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  github: "https://models.github.ai/inference",
};

interface ProviderGroup {
  key: string;
  provider: string;
  label: string;
  isCustom: boolean;
  baseUrl: string;
  apiKeyEnv: string;
  authType: AuthType;
  apiFormat: ApiFormat;
  getKeyUrl: string;
  docsUrl: string;
  tier: string;
  enabled: boolean;
  keyHint: string;
  rows: LLMProvider[];
}

function formatContext(ctx?: number | null): string | null {
  if (ctx == null || ctx <= 0) return null;
  if (ctx >= 1000) {
    const k = ctx / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return String(ctx);
}

export default function LLMProviders() {
  const providersQuery = useLLMProviders();
  const catalogQuery = useLLMCatalog();
  const mutations = useLLMProviderMutations();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [providerDialog, setProviderDialog] = useState(false);
  const [modelDialog, setModelDialog] = useState<null | { row?: LLMProvider }>(null);

  const [form, setForm] = useState<LLMProviderPayload>({
    name: "My custom endpoint",
    provider: "custom",
    model: "",
    base_url: "https://api.example.com/v1",
    api_key_env: "",
    api_key: "",
    auth_type: "bearer",
    api_format: "chat-completions",
    is_active: true,
    priority: 100,
    tier: "paid",
  });
  const [modelForm, setModelForm] = useState({ model: "", temperature: 0.4, max_tokens: 1024, priority: 100, context_window: "" });
  const [baseUrlDraft, setBaseUrlDraft] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [authDraft, setAuthDraft] = useState<AuthType>("bearer");
  const [formatDraft, setFormatDraft] = useState<ApiFormat>("chat-completions");
  const [modelsCache, setModelsCache] = useState<string[]>([]);
  const providers = useMemo(() => providersQuery.data || [], [providersQuery.data]);
  const catalog = catalogQuery.data?.providers || [];
  const allProjects = useProjects().data || [];
  const [bindPicker, setBindPicker] = useState("");

  const groups: ProviderGroup[] = useMemo(() => {
    const map = new Map<string, ProviderGroup>();
    for (const row of providers) {
      const isCustom = row.provider === "custom";
      const key = isCustom ? `custom:${row.base_url}` : `vendor:${row.provider}`;
      let group = map.get(key);
      if (!group) {
        const preset = catalog.find((c) => c.provider === row.provider);
        group = {
          key,
          provider: row.provider,
          label: isCustom ? row.name : preset?.label || row.provider,
          isCustom,
          baseUrl: isCustom ? row.base_url : VENDOR_BASE_URLS[row.provider] || "",
          apiKeyEnv: row.api_key_env,
          authType: (row.auth_type as AuthType) || "bearer",
          apiFormat: (row.api_format as ApiFormat) || "chat-completions",
          getKeyUrl: preset?.get_key_url || "",
          docsUrl: row.docs_url || preset?.docs_url || "",
          tier: row.tier,
          enabled: false,
          keyHint: "",
          rows: [],
        };
        map.set(key, group);
      }
      group.rows.push(row);
      if (row.is_active) group.enabled = true;
      if (!group.keyHint && row.api_key_hint) group.keyHint = row.api_key_hint;
      if (isCustom && group.rows.length === 1) group.label = row.name;
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [providers, catalog]);

  useEffect(() => {
    if (!groups.length) {
      setSelectedKey(null);
      return;
    }
    if (!selectedKey || !groups.some((g) => g.key === selectedKey)) {
      const def = groups.find((g) => g.rows.some((r) => r.is_default)) || groups[0];
      setSelectedKey(def.key);
    }
  }, [groups, selectedKey]);

  const selected = groups.find((g) => g.key === selectedKey) || null;

  useEffect(() => {
    setBaseUrlDraft(selected?.baseUrl || "");
    setKeyDraft("");
    setAuthDraft(selected?.authType || "bearer");
    setFormatDraft(selected?.apiFormat || "chat-completions");
    setModelsCache([]);
    setBindPicker("");
  }, [selected?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (providersQuery.isLoading) {
    return <PageSkeleton title="Model Settings" description="Loading model providers" cards={3} />;
  }
  if (providersQuery.error) {
    return (
      <PageContainer title="Model Settings" description="Manage custom model providers. Once configured, they can be selected in chat.">
        <AsyncState title="Providers unavailable" description="Could not load model providers." actionLabel="Retry" onAction={() => providersQuery.refetch()} />
      </PageContainer>
    );
  }

  const openAddProvider = (presetKey?: string) => {
    const preset = catalog.find((c) => c.key === presetKey);
    setForm({
      name: preset ? preset.label : "My custom endpoint",
      provider: (preset?.provider as LLMProviderKey) || "custom",
      model: preset && !preset.model.startsWith("openai/your-") ? preset.model : "",
      base_url: preset?.base_url || (preset?.provider === "custom" ? "https://api.example.com/v1" : ""),
      api_key_env: preset?.api_key_env || "",
      api_key: "",
      auth_type: "bearer",
      api_format: "chat-completions",
      default_temperature: preset?.suggested_temperature ?? 0.4,
      default_max_tokens: preset?.suggested_max_tokens ?? 1024,
      is_active: true,
      priority: 100,
      tier: preset?.tier || "paid",
      docs_url: preset?.docs_url || "",
      limits_note: preset?.limits_note || "",
    });
    setProviderDialog(true);
  };

  const handleSaveProvider = async () => {
    if (!form.name.trim() || !form.model.trim()) {
      toast.error("Name and first model are required");
      return;
    }
    if (form.provider === "custom" && !(form.base_url || "").trim()) {
      toast.error("Custom providers require a base URL (root only, e.g. https://host/v1)");
      return;
    }
    try {
      const created = await mutations.create.mutateAsync(form);
      toast.success("Provider added");
      setProviderDialog(false);
      const key = created.provider === "custom" ? `custom:${created.base_url}` : `vendor:${created.provider}`;
      setSelectedKey(key);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleToggleGroup = async (group: ProviderGroup, enabled: boolean) => {
    try {
      await Promise.all(
        group.rows.map((r) => mutations.update.mutateAsync({ providerId: r.provider_id, payload: { is_active: enabled } }))
      );
      toast.success(enabled ? "Provider enabled" : "Provider disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleApplyBaseUrl = async () => {
    if (!selected || !selected.isCustom) return;
    if (!baseUrlDraft.trim()) {
      toast.error("Base URL cannot be empty");
      return;
    }
    try {
      await Promise.all(
        selected.rows.map((r) => mutations.update.mutateAsync({ providerId: r.provider_id, payload: { base_url: baseUrlDraft.trim() } }))
      );
      toast.success("Endpoint updated for all models in this provider");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleApplyKey = async () => {
    if (!selected || !keyDraft.trim()) {
      toast.error("Enter a key first");
      return;
    }
    try {
      await Promise.all(
        selected.rows.map((r) => mutations.update.mutateAsync({ providerId: r.provider_id, payload: { api_key: keyDraft.trim() } }))
      );
      toast.success("Key updated for all models in this provider");
      setKeyDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleApplyAuth = async (value: AuthType) => {
    if (!selected) return;
    setAuthDraft(value);
    try {
      await Promise.all(
        selected.rows.map((r) => mutations.update.mutateAsync({ providerId: r.provider_id, payload: { auth_type: value } }))
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleApplyFormat = async (value: ApiFormat) => {
    if (!selected) return;
    setFormatDraft(value);
    try {
      await Promise.all(
        selected.rows.map((r) => mutations.update.mutateAsync({ providerId: r.provider_id, payload: { api_format: value } }))
      );
      toast.success("API format updated for all models in this provider");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const openAddModel = () => {
    setModelForm({ model: "", temperature: 0.4, max_tokens: 1024, priority: 100, context_window: "" });
    setModelDialog({});
  };

  const openEditModel = (row: LLMProvider) => {
    setModelForm({
      model: row.model,
      temperature: row.default_temperature,
      max_tokens: row.default_max_tokens,
      priority: row.priority,
      context_window: row.limits?.context_window ? String(row.limits.context_window) : "",
    });
    setModelDialog({ row });
  };

  const handleSaveModel = async () => {
    if (!selected || !modelForm.model.trim()) {
      toast.error("Model id is required");
      return;
    }
    const ctx = modelForm.context_window.trim() ? Number(modelForm.context_window) : null;
    if (modelForm.context_window.trim() && (!ctx || ctx <= 0)) {
      toast.error("Context window must be a positive number of tokens");
      return;
    }
    try {
      if (modelDialog?.row) {
        const row = modelDialog.row;
        await mutations.update.mutateAsync({
          providerId: row.provider_id,
          payload: {
            model: modelForm.model.trim(),
            default_temperature: modelForm.temperature,
            default_max_tokens: modelForm.max_tokens,
            priority: modelForm.priority,
            limits: { ...(row.limits || {}), context_window: ctx },
          },
        });
        toast.success("Model updated");
      } else {
        const first = selected.rows[0];
        await mutations.create.mutateAsync({
          name: `${selected.label} — ${modelForm.model.trim()}`,
          provider: selected.provider as LLMProviderKey,
          model: modelForm.model.trim(),
          base_url: selected.isCustom ? selected.baseUrl : "",
          api_key_env: first.api_key_env,
          api_key: "",
          auth_type: selected.authType,
          api_format: selected.apiFormat,
          default_temperature: modelForm.temperature,
          default_max_tokens: modelForm.max_tokens,
          priority: modelForm.priority,
          tier: selected.tier as "free" | "paid" | "trial",
          limits_note: "",
          ...(ctx ? { limits: { context_window: ctx } } : {}),
        });
        toast.success("Model added — it shares this provider's endpoint and key");
      }
      setModelDialog(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const selectedRowIds = useMemo(
    () => new Set((selected?.rows || []).map((r) => r.provider_id)),
    [selected]
  );
  const boundProjects = useMemo(
    () => allProjects.filter((p) => p.llm_config?.provider_id && selectedRowIds.has(p.llm_config.provider_id)),
    [allProjects, selectedRowIds]
  );
  const unboundProjects = useMemo(
    () => allProjects.filter((p) => !p.llm_config?.provider_id),
    [allProjects]
  );
  const anchorRow = selected?.rows.find((r) => r.is_active) || selected?.rows[0] || null;

  const handleBindProject = async () => {
    if (!anchorRow || !bindPicker) {
      toast.error("Choose a project first");
      return;
    }
    try {
      await mutations.bindProject.mutateAsync({ providerId: anchorRow.provider_id, projectId: bindPicker });
      toast.success("Project pinned — its chat now uses only this provider");
      setBindPicker("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bind failed");
    }
  };

  const handleUnbindProject = async (projectId: string, ownerProviderId?: string | null) => {
    if (!ownerProviderId) return;
    try {
      await mutations.unbindProject.mutateAsync({ providerId: ownerProviderId, projectId });
      toast.success("Project released back to the default chain");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unbind failed");
    }
  };

  const handleTestRow = async (row: LLMProvider) => {
    try {
      const result = await mutations.test.mutateAsync(row.provider_id);
      if (result.ok) toast.success(`${row.model}: OK in ${Math.round(result.latency_ms)} ms`);
      else toast.error(result.error || "Connection failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    }
  };

  const handleBrowseModels = async () => {
    if (!selected) return;
    const row = selected.rows.find((r) => r.is_active) || selected.rows[0];
    if (!row) return;
    try {
      const result = await api.getLLMProviderModels(row.provider_id);
      setModelsCache(result.models);
      if (!result.models.length) toast.error("Endpoint returned no models");
      else toast.success(`${result.models.length} models found — click one to fill the Add Model form`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Model listing failed");
    }
  };

  return (
    <PageContainer title="Model Settings" description="Manage custom model providers. Once configured, they can be selected in chat.">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left: provider list */}
        <Card className="surface-high border-none cloud-shadow p-4 rounded-[12px] h-fit">
          <div className="space-y-1">
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setSelectedKey(group.key)}
                className={`w-full flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-sans text-left transition ${
                  group.key === selectedKey ? "bg-surface-highest text-foreground" : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${group.enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                <span className="flex-1 truncate font-semibold">{group.label}</span>
                <span className="text-[10px] text-muted-foreground">{group.rows.length}</span>
              </button>
            ))}
            {groups.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">No providers yet.</p>
            )}
          </div>
          <div className="mt-4 border-t border-surface-highest pt-4">
            <p className="px-3 text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-2">Custom Providers</p>
            <div className="px-1">
              <select
                className="w-full bg-surface-highest rounded-[8px] px-3 py-2 text-sm mb-2"
                defaultValue=""
                onChange={(e) => e.target.value && openAddProvider(e.target.value)}
              >
                <option value="">Add from preset…</option>
                {catalog.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <Button variant="outline" className="w-full rounded-[8px]" onClick={() => openAddProvider()}>
                <Plus className="h-4 w-4 mr-2" /> Add Provider
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: detail panel */}
        {selected ? (
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px] space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-display font-bold">{selected.label}</h2>
              <div className="flex items-center gap-2">
                {selected.rows.some((r) => r.is_default) && <Badge>default in use</Badge>}
                <Badge variant="outline">{selected.tier}</Badge>
                <Switch checked={selected.enabled} onCheckedChange={(v) => handleToggleGroup(selected, v)} />
                <span className="text-xs font-bold text-muted-foreground">{selected.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Base URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={selected.isCustom ? baseUrlDraft : selected.baseUrl}
                    readOnly={!selected.isCustom}
                    onChange={(e) => setBaseUrlDraft(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="font-mono text-xs"
                  />
                  {selected.isCustom && <Button variant="outline" onClick={handleApplyBaseUrl}>Apply</Button>}
                </div>
                {selected.isCustom && (
                  <p className="text-[11px] text-muted-foreground mt-1">Root only — the engine appends /chat/completions, /v1/messages, or /responses per the API format below.</p>
                )}
              </div>

              <div>
                <Label>API format</Label>
                <Select value={formatDraft} onValueChange={(v) => handleApplyFormat(v as ApiFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {API_FORMAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Auth</Label>
                  <Select value={authDraft} onValueChange={(v) => handleApplyAuth(v as AuthType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer">bearer (default)</SelectItem>
                      <SelectItem value="x-api-key">x-api-key header</SelectItem>
                      <SelectItem value="query">query param</SelectItem>
                      <SelectItem value="none">none (open endpoint)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>API Key</Label>
                  {selected.getKeyUrl && (
                    <a href={selected.getKeyUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={keyDraft}
                    onChange={(e) => setKeyDraft(e.target.value)}
                    placeholder={selected.keyHint ? `Saved (${selected.keyHint}) — enter to replace` : "Enter API Key"}
                  />
                  <Button variant="outline" onClick={handleApplyKey}>Apply</Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">One key covers every model below. Stored encrypted.</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold">Projects</Label>
              <p className="text-[11px] text-muted-foreground mt-1 mb-3">Pinned projects chat ONLY through this provider. Others use the global default chain.</p>
              {boundProjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {boundProjects.map((p) => (
                    <span key={p.project_api_id} className="flex items-center gap-2 rounded-[8px] bg-surface-lowest px-3 py-1.5 text-xs font-semibold">
                      {p.name}
                      <button
                        type="button"
                        title="Release project"
                        onClick={() => handleUnbindProject(p.project_api_id, p.llm_config?.provider_id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select
                  value={bindPicker}
                  onChange={(e) => setBindPicker(e.target.value)}
                  className="flex-1 bg-surface-lowest rounded-[8px] px-3 py-2 text-sm"
                >
                  <option value="">Pin a project to this provider…</option>
                  {unboundProjects.map((p) => (
                    <option key={p.project_api_id} value={p.project_api_id}>{p.name}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={handleBindProject} disabled={!anchorRow}>Pin</Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-bold">Model List</Label>
                <Button size="sm" variant="outline" onClick={handleBrowseModels}>Browse endpoint models</Button>
              </div>
              {modelsCache.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {modelsCache.slice(0, 20).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="text-[11px] font-mono px-2 py-1 rounded bg-surface-highest hover:text-primary"
                      onClick={() => {
                        setModelForm((f) => ({ ...f, model: m }));
                        setModelDialog({});
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {selected.rows.length === 0 && (
                  <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-5 text-center text-xs text-muted-foreground">
                    No models are configured. Add a model to use it in chat.
                  </div>
                )}
                {selected.rows.map((row) => (
                  <div key={row.provider_id} className="flex items-center gap-3 rounded-[8px] bg-surface-lowest px-4 py-2.5">
                    <button
                      type="button"
                      title={row.is_default ? "Default model" : "Set as default"}
                      onClick={() => mutations.setDefault.mutate(row.provider_id, { onSuccess: () => toast.success("Default updated") })}
                    >
                      <Star className={`h-4 w-4 ${row.is_default ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40"}`} />
                    </button>
                    <span className="flex-1 truncate font-mono text-xs">{row.model}</span>
                    {formatContext(row.limits?.context_window) && (
                      <Badge variant="outline" className="text-[10px]">{formatContext(row.limits?.context_window)}</Badge>
                    )}
                    {row.last_test_status === "error" && <Badge variant="outline" className="text-[10px] text-amber-400">test failed</Badge>}
                    <button type="button" title="Test" onClick={() => handleTestRow(row)} className="text-muted-foreground hover:text-primary">
                      <FlaskConical className="h-4 w-4" />
                    </button>
                    <button type="button" title="Edit" onClick={() => openEditModel(row)} className="text-muted-foreground hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => mutations.remove.mutate(row.provider_id, { onSuccess: () => toast.success("Model removed") })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={openAddModel}>
                <Plus className="h-3 w-3 mr-1" /> Add Model
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px] flex items-center justify-center text-sm text-muted-foreground min-h-[300px]">
            Add your first provider to get started.
          </Card>
        )}
      </div>

      {/* Add provider dialog */}
      <Dialog open={providerDialog} onOpenChange={setProviderDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Provider</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="TokenHarbor" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v as LLMProviderKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROVIDER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as "free" | "paid" | "trial" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="free">free</SelectItem><SelectItem value="paid">paid</SelectItem><SelectItem value="trial">trial</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>First model id (add more later via Add Model)</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="claude-haiku-5.5:free" className="font-mono text-xs" /></div>
            <div><Label>Base URL (root only — custom requires it)</Label><Input value={form.base_url || ""} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.example.com/v1" className="font-mono text-xs" /></div>
            <div>
              <Label>API format</Label>
              <Select value={form.api_format || "chat-completions"} onValueChange={(v) => setForm({ ...form, api_format: v as LLMProviderPayload["api_format"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {API_FORMAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>API key env (optional)</Label><Input value={form.api_key_env || ""} onChange={(e) => setForm({ ...form, api_key_env: e.target.value })} placeholder="TOKENHARBOR_API_KEY" /></div>
              <div><Label>Auth</Label>
                <Select value={form.auth_type || "bearer"} onValueChange={(v) => setForm({ ...form, auth_type: v as LLMProviderPayload["auth_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bearer">bearer</SelectItem>
                    <SelectItem value="x-api-key">x-api-key</SelectItem>
                    <SelectItem value="query">query param</SelectItem>
                    <SelectItem value="none">none</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>API key (stored encrypted)</Label><Input type="password" value={form.api_key || ""} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="thk_live_..." /></div>
            <Button onClick={handleSaveProvider} disabled={mutations.create.isPending}>Save provider</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / edit model dialog */}
      <Dialog open={modelDialog !== null} onOpenChange={(open) => !open && setModelDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{modelDialog?.row ? "Edit Model" : "Add Model"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Shares {selected?.label || "this provider"}'s endpoint and key.</p>
            <div><Label>Model id (exactly as the endpoint expects it)</Label><Input value={modelForm.model} onChange={(e) => setModelForm({ ...modelForm, model: e.target.value })} placeholder="claude-haiku-5.5:free" className="font-mono text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Temperature</Label><Input type="number" step="0.1" value={modelForm.temperature} onChange={(e) => setModelForm({ ...modelForm, temperature: Number(e.target.value) })} /></div>
              <div><Label>Max tokens</Label><Input type="number" value={modelForm.max_tokens} onChange={(e) => setModelForm({ ...modelForm, max_tokens: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Priority (lower = tried first)</Label><Input type="number" value={modelForm.priority} onChange={(e) => setModelForm({ ...modelForm, priority: Number(e.target.value) })} /></div>
              <div><Label>Context window (tokens, optional)</Label><Input value={modelForm.context_window} onChange={(e) => setModelForm({ ...modelForm, context_window: e.target.value })} placeholder="200000" /></div>
            </div>
            <Button onClick={handleSaveModel} disabled={mutations.create.isPending || mutations.update.isPending}>Save model</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
