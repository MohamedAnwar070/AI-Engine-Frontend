import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bot, Gauge, User } from "lucide-react";
import { formatDistance } from "date-fns";
import { cn } from "@/lib/utils";
import type { ExecutionMetadata } from "@/lib/api";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  node_executed?: string | null;
  node_result?: any;
  execution_metadata?: ExecutionMetadata | null;
}

export function ChatMessage({ role, content, timestamp, node_executed, node_result, execution_metadata }: ChatMessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className={isUser ? "bg-primary" : isSystem ? "bg-muted" : "bg-accent"}>
        <AvatarFallback>
          {isUser ? (
            <User className="h-5 w-5 text-primary-foreground" />
          ) : isSystem ? (
            <Gauge className="h-5 w-5 text-foreground" />
          ) : (
            <Bot className="h-5 w-5 text-accent-foreground" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <Card className={cn(
          "p-5 shadow-2xl transition-all duration-300",
          isUser
            ? "bg-primary/20 backdrop-blur-md border border-primary/20 text-foreground font-medium rounded-2xl rounded-tr-none shadow-[0_4px_20px_hsla(var(--primary),0.15)]"
            : isSystem
            ? "bg-muted/20 border border-white/10 rounded-2xl"
            : "glass-enhanced rounded-2xl rounded-tl-none border-white/5"
        )}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed tracking-wide">{content}</p>
        </Card>

        {(node_executed || execution_metadata) && (
          <div className="mt-2 space-y-2">
            <details className="text-xs">
              <summary className="cursor-pointer">
                <Badge variant="outline" className="border-primary text-primary">
                  {node_executed ? `Tool: ${node_executed}` : "Execution"}
                  {execution_metadata ? ` (${Math.round(execution_metadata.duration_ms)}ms)` : ""}
                </Badge>
              </summary>
              <Card className="mt-2 p-3 bg-card/60 backdrop-blur-md border-primary/20">
                <div className="space-y-4">
                  {execution_metadata ? (
                    <div>
                      <p className="font-bold text-primary mb-1 uppercase tracking-widest text-[10px]">Metadata:</p>
                      <pre className="text-xs overflow-auto text-muted-foreground p-2 bg-black/20 rounded-md">
                        {JSON.stringify(execution_metadata, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                  {node_result !== undefined ? (
                    <div>
                      <p className="font-bold text-accent mb-1 uppercase tracking-widest text-[10px]">Result:</p>
                      <pre className="text-xs overflow-auto text-white p-2 bg-black/20 rounded-md">
                        {JSON.stringify(node_result, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </Card>
            </details>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-1">
          {formatDistance(new Date(timestamp), new Date(), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
