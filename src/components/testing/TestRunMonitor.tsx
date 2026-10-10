import { useMemo, useState } from "react";
import { Activity, Clock3, FlaskConical, Loader2, TimerReset } from "lucide-react";
import { formatDistance } from "date-fns";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProjectTestRun, useProjectTestRunner } from "@/domain/settings";
import type { ProjectTestQueuedResponse, ProjectTestResponse } from "@/lib/api";

interface TestRunMonitorProps {
  projectId: string;
}

function isQueuedResponse(result: ProjectTestResponse | ProjectTestQueuedResponse): result is ProjectTestQueuedResponse {
  return "test_run_id" in result;
}

export function TestRunMonitor({ projectId }: TestRunMonitorProps) {
  const [messagesInput, setMessagesInput] = useState("");
  const [showNodeExecution, setShowNodeExecution] = useState(true);
  const [executionMode, setExecutionMode] = useState<"sync" | "async" | "auto">("auto");
  const [activeTestRunId, setActiveTestRunId] = useState<string | null>(null);

  const testRunner = useProjectTestRunner(projectId);
  const activeTestRun = useProjectTestRun(projectId, activeTestRunId);

  const parsedMessages = useMemo(
    () => messagesInput.split("\n").map((value) => value.trim()).filter(Boolean),
    [messagesInput],
  );

  const latestCompletedResult = activeTestRun.data?.result;

  const handleRunTests = async () => {
    if (parsedMessages.length === 0) {
      toast.error("Add at least one test message");
      return;
    }

    const result = await testRunner.mutateAsync({
      test_messages: parsedMessages,
      show_node_execution: showNodeExecution,
      execution_mode: executionMode,
    });

    if (isQueuedResponse(result)) {
      setActiveTestRunId(result.test_run_id);
      toast.success(`Queued ${result.total_tests} tests`);
      return;
    }

    setActiveTestRunId(null);
    toast.success(`Completed ${result.total_tests} tests`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card className="glass-enhanced p-6 space-y-5">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gradient flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Test Runner
          </h3>
          <p className="text-sm text-muted-foreground">Launch sync or queued test suites with shared orchestration rules.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-messages">Test Messages</Label>
          <Textarea
            id="test-messages"
            value={messagesInput}
            onChange={(event) => setMessagesInput(event.target.value)}
            rows={8}
            className="font-mono text-sm"
            placeholder="One test message per line"
          />
          <p className="text-xs text-muted-foreground">{parsedMessages.length} messages ready</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="execution-mode">Execution Mode</Label>
          <Select value={executionMode} onValueChange={(value) => setExecutionMode(value as typeof executionMode)}>
            <SelectTrigger id="execution-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto Queue</SelectItem>
              <SelectItem value="sync">Sync</SelectItem>
              <SelectItem value="async">Async Queue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <Checkbox id="show-node-execution" checked={showNodeExecution} onCheckedChange={(checked) => setShowNodeExecution(Boolean(checked))} />
          <Label htmlFor="show-node-execution" className="text-sm font-medium">
            Include node execution results
          </Label>
        </div>

        <Button onClick={handleRunTests} disabled={testRunner.isPending} className="w-full" variant="premium">
          {testRunner.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
          Run Test Suite
        </Button>
      </Card>

      <div className="space-y-6">
        <Card className="glass-enhanced p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Queue Monitor
              </h3>
              <p className="text-sm text-muted-foreground">Track queued and running project test suites in real time.</p>
            </div>
            {activeTestRun.data ? (
              <Badge variant="outline" className="border-primary/40 text-primary uppercase tracking-wider">
                {activeTestRun.data.status}
              </Badge>
            ) : null}
          </div>

          {!activeTestRunId ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
              Start a queued run to watch live progress here.
            </div>
          ) : activeTestRun.isLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading latest test run state...
            </div>
          ) : activeTestRun.data ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Queued</p>
                  <p className="mt-2 text-lg font-bold">{formatDistance(new Date(activeTestRun.data.queued_at), new Date(), { addSuffix: true })}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                  <p className="mt-2 text-lg font-bold">
                    {activeTestRun.data.successful_tests + activeTestRun.data.failed_tests}/{activeTestRun.data.total_tests}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Duration</p>
                  <p className="mt-2 text-lg font-bold">{activeTestRun.data.duration_ms ? `${Math.round(activeTestRun.data.duration_ms)} ms` : "Pending"}</p>
                </div>
              </div>

              {activeTestRun.data.error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {activeTestRun.data.error}
                </div>
              ) : null}

              {latestCompletedResult ? (
                <Card className="border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold">Latest Completed Run</h4>
                      <p className="text-sm text-muted-foreground">{latestCompletedResult.successful_tests} passed, {latestCompletedResult.failed_tests} failed</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                      done
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {latestCompletedResult.test_results.map((result) => (
                      <div key={result.test_number} className="rounded-lg border border-white/10 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium">{result.user_message}</p>
                          <Badge variant="outline" className={result.success ? "border-emerald-500/40 text-emerald-400" : "border-destructive/40 text-destructive"}>
                            {result.success ? "success" : "failed"}
                          </Badge>
                        </div>
                        {result.bot_response ? <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{result.bot_response}</p> : null}
                        {result.execution_metadata ? (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1"><Clock3 className="h-3 w-3" /> {Math.round(result.execution_metadata.duration_ms)} ms</span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1"><TimerReset className="h-3 w-3" /> {result.execution_metadata.attempts} attempt(s)</span>
                          </div>
                        ) : null}
                        {result.error ? <p className="mt-2 text-sm text-destructive">{result.error}</p> : null}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
