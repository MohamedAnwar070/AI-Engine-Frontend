import { useRef, useState, type ChangeEventHandler } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistance } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Search, Bot, Calendar, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { AsyncState } from "@/components/state/AsyncState";
import { useProjects } from "@/domain/projects";
import { useDataWorkflows } from "@/domain/workflows";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectsQuery = useProjects();
  const { importProjects } = useDataWorkflows();
  const projects = projectsQuery.data || [];

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
          projectsQuery.refetch();
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

  if (projectsQuery.isLoading) {
    return <PageSkeleton title="Projects" description="Loading project workflows" cards={6} />;
  }

  if (projectsQuery.error) {
    return (
      <PageContainer title="Projects" description="Manage all your bot projects">
        <AsyncState
          title="Unable to load projects"
          description="Project orchestration data could not be fetched right now."
          actionLabel="Retry"
          onAction={() => projectsQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <PageContainer
      title="Projects"
      description="Import a package to create a full bot, or build a project from scratch"
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFileChange}
          />
          {/* Import first — creates project + nodes + system prompt */}
          <Button
            variant="premium"
            onClick={handleImportClick}
            disabled={importProjects.isPending}
            className="font-bold uppercase tracking-tight"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importProjects.isPending ? "Importing…" : "Import package"}
          </Button>
          <Button asChild variant="secondary" className="font-bold uppercase tracking-tight">
            <Link to="/projects/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create blank
            </Link>
          </Button>
        </div>
      }
    >
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-surface-highest border-transparent rounded-[12px] focus:ring-primary/50 transition-all font-sans"
          />
        </div>
        <p className="text-xs text-muted-foreground font-sans px-1">
          <strong className="text-foreground">Import package</strong> loads a v2 JSON (project + system prompt +
          nodes) in one step — e.g.{" "}
          <code className="text-primary">AI_DOC_PROJECT_PACKAGE.json</code>. Use{" "}
          <strong className="text-foreground">Create blank</strong> only when you want an empty project.
        </p>
      </motion.div>

      {filteredProjects.length === 0 ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="surface-high border-none cloud-shadow p-16 text-center rounded-[12px]">
            <div className="h-20 w-20 bg-surface-highest rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3 text-foreground">
              {searchQuery ? "No matches found" : "Start with an import"}
            </h3>
            <p className="text-muted-foreground font-sans mb-8 max-w-md mx-auto font-medium">
              {searchQuery
                ? `We couldn't find any projects matching "${searchQuery}".`
                : "Import a package JSON first to create a complete bot (prompt + tools). Or create a blank project and build manually."}
            </p>
            {!searchQuery && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="premium"
                  size="lg"
                  className="px-8 font-bold uppercase rounded-[8px]"
                  onClick={handleImportClick}
                  disabled={importProjects.isPending}
                >
                  <Upload className="h-5 w-5 mr-3" />
                  Import package
                </Button>
                <Button asChild variant="secondary" size="lg" className="px-8 font-bold uppercase rounded-[8px]">
                  <Link to="/projects/new">
                    <PlusCircle className="h-5 w-5 mr-3" />
                    Create blank
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.project_api_id}
                variants={itemVariants}
                layout
                initial="hidden"
                animate="visible"
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Link to={`/projects/${project.project_api_id}`}>
                  <Card className="interactive-card border-none cloud-shadow p-6 h-full group relative overflow-hidden rounded-[12px]">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-surface-highest text-primary group-hover:bg-primary/10 transition-all duration-300">
                        <Bot className="h-8 w-8 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-center">
                        <span className="px-3 py-1 rounded-[8px] ghost-border bg-surface-lowest text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                          {project.llm_config.model_name}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold font-display text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>

                    <p className="text-sm font-sans text-muted-foreground line-clamp-3 mb-8 font-medium leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                        View <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </PageContainer>
  );
}
