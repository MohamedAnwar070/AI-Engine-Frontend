import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { CheckCircle2, Download, Save, Upload, Workflow, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataWorkflows } from "@/domain/workflows";
import { useHealthStatus } from "@/domain/settings";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "arffy_theme";
const FONT_SIZE_STORAGE_KEY = "arffy_font_size";

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(() => api.getBaseUrl());
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === "undefined") return "medium";
    return window.localStorage.getItem(FONT_SIZE_STORAGE_KEY) || "medium";
  });
  const [healthEnabled, setHealthEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const healthQuery = useHealthStatus(healthEnabled);
  const { exportProjects, importProjects } = useDataWorkflows();

  useEffect(() => {
    if (typeof document === "undefined") return;

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);

    const root = document.documentElement;
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.fontSize = sizeMap[fontSize] || "16px";

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (theme === "dark" || (theme === "auto" && prefersDark)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, fontSize]);

  const testConnection = async () => {
    api.setBaseUrl(apiUrl);
    setHealthEnabled(true);
    const result = await healthQuery.refetch();
    const status = result.data?.status;
    if (status === "healthy" || status === "degraded") {
      toast.success(
        status === "healthy"
          ? "Connection successful"
          : `Connected (degraded): LLM ${result.data?.llm_status || "unknown"}`,
      );
    } else {
      toast.error("Connection failed");
    }
  };

  const handleSave = () => {
    api.setBaseUrl(apiUrl);
    toast.success("Settings saved successfully");
  };

  const handleExport = async () => {
    try {
      const payload = await exportProjects.mutateAsync();
      const count = Array.isArray(payload.projects)
        ? payload.projects.length
        : payload.project
          ? 1
          : 0;
      if (!count) {
        toast.info("No projects to export");
        return;
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `perfect-engine-workspace-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} project package${count === 1 ? "" : "s"} (v2)`);
    } catch {
      toast.error("Failed to export workspace");
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const result = await importProjects.mutateAsync(parsed);
        toast.success(
          `Imported ${result.projects_imported} project(s), ${result.nodes_created} nodes` +
            (result.nodes_skipped ? ` (${result.nodes_skipped} skipped)` : ""),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to import projects");
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

  const connectionStatus =
    healthQuery.data?.status === "healthy" || healthQuery.data?.status === "degraded"
      ? "success"
      : healthQuery.isError
        ? "error"
        : "idle";
  const connectionMessage = healthQuery.data
    ? `Backend ${healthQuery.data.status} · LLM ${healthQuery.data.llm_provider} (${healthQuery.data.llm_status || "n/a"}) · Redis ${healthQuery.data.redis} · Runtimes: ${(healthQuery.data.runtimes?.supported || ["javascript"]).join(", ")}.`
    : healthQuery.isError
      ? "Could not reach backend. Check the URL and Redis/Mongo services."
      : "Run a health check to verify backend orchestration.";

  return (
    <PageContainer title="Settings" description="Configure orchestration, health, and import/export workflows">
      <div className="max-w-4xl space-y-8 pb-20">
        
        {/* API CONFIG */}
        <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">API Configuration</h2>
              <p className="text-sm font-sans text-muted-foreground">Manage backend connectivity for the orchestration engine.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="apiUrl" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Backend Primary URL</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  id="apiUrl" 
                  value={apiUrl} 
                  onChange={(e) => setApiUrl(e.target.value)} 
                  placeholder="http://localhost:8000" 
                  className="flex-1 bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-sans"
                />
                <Button onClick={testConnection} disabled={healthQuery.isFetching} variant="outline" className="h-12 px-8 rounded-[8px] font-bold">
                  {healthQuery.isFetching ? "Verifying..." : "Verify Connection"}
                </Button>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-4 p-5 rounded-[8px] ghost-border transition-colors",
              connectionStatus === "success" ? "bg-emerald-500/5 text-emerald-400" : connectionStatus === "error" ? "bg-destructive/5 text-destructive" : "bg-surface-lowest"
            )}>
              <div className="mt-1">
                <CheckCircle2 className={cn("h-5 w-5", connectionStatus === "success" ? "text-emerald-400" : connectionStatus === "error" ? "text-destructive" : "text-primary")} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-sans font-medium leading-relaxed">{connectionMessage}</p>
                {connectionStatus === "success" && <p className="text-[10px] uppercase font-bold tracking-widest mt-1.5 opacity-70">Orchestration status: ACTIVE</p>}
              </div>
            </div>

            <Button onClick={handleSave} variant="premium" className="w-full sm:w-auto h-12 px-10 rounded-[8px] font-bold uppercase tracking-tight">
              <Save className="h-4 w-4 mr-2" />
              Save Environment
            </Button>
          </div>
        </Card>

        {/* APPEARANCE */}
        <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Visual Language</h2>
              <p className="text-sm font-sans text-muted-foreground">Adjust the obsidian aesthetic and information density.</p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="theme" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Theme Protocol</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme" className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-high ghost-border border-none rounded-[12px]">
                  <SelectItem value="light" className="font-sans font-medium focus:bg-primary/10">Light Obsidian</SelectItem>
                  <SelectItem value="dark" className="font-sans font-medium focus:bg-primary/10">Dark Digital Obsidian</SelectItem>
                  <SelectItem value="auto" className="font-sans font-medium focus:bg-primary/10">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="fontSize" className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Information Density</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger id="fontSize" className="bg-surface-lowest ghost-border border-transparent h-12 rounded-[8px] font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-high ghost-border border-none rounded-[12px]">
                  <SelectItem value="small" className="font-sans font-medium focus:bg-primary/10">High Density (Small)</SelectItem>
                  <SelectItem value="medium" className="font-sans font-medium focus:bg-primary/10">Balanced (Medium)</SelectItem>
                  <SelectItem value="large" className="font-sans font-medium focus:bg-primary/10">Focus Mode (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* DATA WORKFLOWS */}
        <Card className="surface-high border-none cloud-shadow p-8 rounded-[12px]">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-2 rounded-[8px] bg-surface-highest ghost-border text-primary shrink-0">
               <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Data Portability</h2>
              <p className="text-sm font-sans text-muted-foreground">Import and export complete project portfolios through orchestration bundles.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-[12px] bg-surface-lowest ghost-border group hover:bg-surface-high transition-colors">
              <Label className="font-bold font-sans text-foreground">Export Portfolio</Label>
              <p className="text-xs text-muted-foreground mt-2 mb-6 leading-relaxed">Download all projects and nodes as one versioned JSON archive for backup or migration.</p>
              <Button variant="outline" onClick={handleExport} disabled={exportProjects.isPending} className="w-full rounded-[8px] font-bold h-10 ghost-border group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all">
                <Download className="h-4 w-4 mr-2" />
                {exportProjects.isPending ? "Archiving..." : "Export Archive"}
              </Button>
            </div>

            <div className="p-6 rounded-[12px] bg-surface-lowest ghost-border group hover:bg-surface-high transition-colors">
              <Label className="font-bold font-sans text-foreground">Restore Workspace</Label>
              <p className="text-xs text-muted-foreground mt-2 mb-6 leading-relaxed">Restore projects from an exported bundle. Warning: this may overwrite existing orchestration nodes.</p>
              <Button variant="outline" onClick={handleImportButtonClick} disabled={importProjects.isPending} className="w-full rounded-[8px] font-bold h-10 ghost-border group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all">
                <Upload className="h-4 w-4 mr-2" />
                {importProjects.isPending ? "Restoring..." : "Import Workspace"}
              </Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFileChange} />
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
