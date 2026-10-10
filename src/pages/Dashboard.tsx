import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Boxes, Clock3, PlusCircle, Workflow } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { AsyncState } from "@/components/state/AsyncState";
import { useProjects } from "@/domain/projects";
import { useDashboardStats } from "@/domain/settings";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100 },
  },
};

export default function Dashboard() {
  const statsQuery = useDashboardStats();
  const projectsQuery = useProjects();

  if (statsQuery.isLoading && projectsQuery.isLoading) {
    return <PageSkeleton title="Dashboard" description="Loading orchestration metrics" cards={6} />;
  }

  if (statsQuery.error || projectsQuery.error) {
    return (
      <PageContainer title="Dashboard" description="Overview of your bot engine">
        <AsyncState
          title="Unable to load dashboard"
          description="The metrics or project workflows could not be fetched right now."
          actionLabel="Retry"
          onAction={() => {
            statsQuery.refetch();
            projectsQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const stats = statsQuery.data;
  const projects = projectsQuery.data || [];

  return (
    <PageContainer title="Dashboard" description="Overview of your bot engine">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <motion.div variants={itemVariants}>
            <StatCard title="Total Projects" value={stats?.total_projects || 0} icon={Boxes} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Active Nodes" value={stats?.active_nodes || 0} icon={Workflow} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Executions" value={stats?.total_executions || 0} icon={Activity} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Success Rate" value={`${stats?.success_rate || 0}%`} icon={PlusCircle} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Avg Latency" value={`${Math.round(stats?.average_latency_ms || 0)} ms`} icon={Clock3} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Queued Tests" value={(stats?.queued_test_runs || 0) + (stats?.running_test_runs || 0)} icon={ArrowRight} />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="surface-high border-none cloud-shadow p-6 rounded-[12px]">
            <h2 className="text-xl font-display font-bold mb-6 text-foreground">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="premium" className="h-auto flex-col gap-3 py-8 rounded-[12px]">
                <Link to="/projects/new">
                  <PlusCircle className="h-10 w-10" />
                  <span className="text-sm font-bold tracking-tight uppercase">Create Project</span>
                </Link>
              </Button>
              <Button asChild variant="premium" className="h-auto flex-col gap-3 py-8 rounded-[12px]">
                <Link to="/projects">
                  <Boxes className="h-10 w-10" />
                  <span className="text-sm font-bold tracking-tight uppercase">View Projects</span>
                </Link>
              </Button>
              <Button asChild variant="secondary" className="surface-highest border-none h-auto flex-col gap-3 py-8 rounded-[12px] hover:bg-surface-low transition-colors">
                <Link to="/projects">Run Test Suites</Link>
              </Button>
              <Button asChild variant="secondary" className="surface-highest border-none h-auto flex-col gap-3 py-8 rounded-[12px] hover:bg-surface-low transition-colors">
                <Link to="/settings">Health And Settings</Link>
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="surface-high border-none cloud-shadow p-6 overflow-hidden rounded-[12px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-foreground">Recent Projects</h2>
              <Button asChild variant="ghost" size="sm" className="hover:text-primary transition-colors">
                <Link to="/projects">View All</Link>
              </Button>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <Boxes className="h-20 w-20 mx-auto text-primary/40 mb-6 animate-pulse-glow" />
                <h3 className="text-2xl font-black italic tracking-tighter mb-3 uppercase">No projects yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto font-medium">Start your journey with AI Engine by creating your first bot project.</p>
                <Button asChild variant="premium" size="lg">
                  <Link to="/projects/new">
                    <PlusCircle className="h-5 w-5 mr-3" />
                    <span className="uppercase font-black italic tracking-tighter">Create First Project</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.project_api_id} to={`/projects/${project.project_api_id}`} className="flex items-center justify-between p-4 rounded-[8px] hover:bg-surface-highest transition-all duration-300 group border border-transparent">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Boxes className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
