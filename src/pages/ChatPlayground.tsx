import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Puzzle, Shield, Zap } from "lucide-react";

import { ChatConversationPanel } from "@/components/chat/ChatConversationPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { AsyncState } from "@/components/state/AsyncState";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChatSession } from "@/domain/chat";
import { useProjectNodes } from "@/domain/nodes";
import { useProjects } from "@/domain/projects";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100 },
  },
};

export default function ChatPlayground() {
  const [projectId, setProjectId] = useState<string>("");
  const projectsQuery = useProjects();
  const nodesQuery = useProjectNodes(projectId);
  const chatSession = useChatSession(projectId);

  if (projectsQuery.isLoading) {
    return <PageSkeleton title="Chat Playground" description="Loading chat orchestration" cards={2} />;
  }

  if (projectsQuery.error) {
    return (
      <PageContainer title="Chat Playground" description="Test your bot nodes in a live chat environment">
        <AsyncState title="Unable to load projects" description="Select-project chat orchestration is currently unavailable." actionLabel="Retry" onAction={() => projectsQuery.refetch()} />
      </PageContainer>
    );
  }

  const projects = projectsQuery.data || [];
  const nodes = nodesQuery.data || [];

  return (
    <PageContainer title="Chat Playground" description="Test your bot nodes in a live chat environment">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
          <Card className="glass-enhanced p-4 border-white/10">
            <h3 className="text-sm font-black uppercase italic tracking-tighter text-primary mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> System Control
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Active Project</label>
                <select
                  value={projectId}
                  onChange={(event) => {
                    setProjectId(event.target.value);
                    chatSession.resetSession();
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-primary/50 transition-all outline-none"
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map((project) => (
                    <option key={project.project_api_id} value={project.project_api_id} className="bg-slate-900">
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => chatSession.resetSession()}>
                Reset Session
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase italic tracking-tighter text-primary flex items-center gap-2">
              <Zap className="h-4 w-4" /> Available Nodes
            </h3>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {nodes.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground p-8 text-center glass-enhanced rounded-xl border-dashed border-white/10">
                    {projectId ? "No nodes found in this project" : "Select a project to see active nodes"}
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                    {nodes.map((node) => (
                      <motion.div key={node.node_id} variants={itemVariants} className="group relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Card className="glass-enhanced p-4 border-white/5 group-hover:border-primary/30 transition-all bg-card/20 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:shadow-glow-sm transition-all">
                              <Cpu className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold group-hover:text-primary transition-colors">{node.name}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {Object.keys(node.node_schema.inputs).slice(0, 3).map((input) => (
                                  <span key={input} className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/5 font-mono">
                                    ${input}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {projectId ? (
            <ChatConversationPanel
              messages={chatSession.messages}
              onSend={(message) => chatSession.sendMessage(message)}
              isSending={chatSession.isSending}
              placeholder="Type a message to test your bot..."
              emptyTitle="System Ready"
              emptyDescription="Send a message to test your project prompt and node triggers."
              heightClassName="h-[calc(100vh-12rem)]"
            />
          ) : (
            <Card className="glass-enhanced flex h-[calc(100vh-12rem)] flex-col items-center justify-center text-center border-white/10 shadow-2xl">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse-glow">
                <Puzzle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-gradient">Engine Offline</h3>
              <p className="text-muted-foreground font-medium">Select a project from the left to start building.</p>
            </Card>
          )}
        </motion.div>
      </div>
    </PageContainer>
  );
}
