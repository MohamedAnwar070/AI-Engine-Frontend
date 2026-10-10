import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Node } from "@/lib/api";
import { Code2, Trash2, Play, Edit2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeCardProps {
  node: Node;
  onView?: () => void;
  onEdit?: () => void;
  onTest?: () => void;
  onDelete?: () => void;
}

export function NodeCard({ node, onView, onEdit, onTest, onDelete }: NodeCardProps) {
  return (
    <Card className={cn(
      "surface-high border-none cloud-shadow p-6 group transition-all duration-300 rounded-[12px] relative overflow-hidden",
      node.is_root && "bg-primary/5 ghost-border border-primary/20"
    )}>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-[8px] transition-all duration-300 group-hover:scale-110 shadow-sm",
            node.is_root ? "bg-primary text-black" : "bg-surface-highest text-primary ghost-border"
          )}>
            {node.is_root ? <Zap className="h-6 w-6" /> : <Code2 className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">{node.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {node.is_root && (
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 ghost-border uppercase text-[9px] font-bold tracking-wider">
                  Root Node
                </Badge>
              )}
              <Badge variant="secondary" className="uppercase text-[9px] font-bold tracking-wider font-mono">
                {node.runtime || "javascript"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm font-sans text-muted-foreground line-clamp-2 mb-8 font-medium leading-relaxed relative z-10">
        {node.description}
      </p>

      {/* Schema Preview */}
      <div className="mb-8 space-y-4 relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" /> Inputs
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(node.node_schema.inputs).length > 0 ? (
              Object.entries(node.node_schema.inputs).map(([key, type]) => (
                <Badge key={key} variant="secondary" className="text-[10px] bg-surface-lowest ghost-border border-transparent text-muted-foreground font-mono rounded-[4px] px-2">
                  {key} <span className="text-primary/70 ml-1">:{type}</span>
                </Badge>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground italic font-sans">None specified</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/50" /> Outputs
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(node.node_schema.outputs).length > 0 ? (
              Object.entries(node.node_schema.outputs).map(([key, type]) => (
                <Badge key={key} variant="secondary" className="text-[10px] bg-surface-lowest ghost-border border-transparent text-muted-foreground font-mono rounded-[4px] px-2">
                  {key} <span className="text-accent/70 ml-1">:{type}</span>
                </Badge>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground italic font-sans">None specified</span>
            )}
          </div>
        </div>
      </div>

      {/* Code Preview */}
      <div className="mb-8 group/code relative z-10">
        <div className="p-4 bg-surface-lowest rounded-[8px] ghost-border transition-colors group-hover/code:bg-surface-highest">
          <pre className="text-[11px] text-muted-foreground line-clamp-3 overflow-hidden font-mono leading-relaxed">
            {node.tool_code}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 relative z-10">
        {onEdit && (
          <Button onClick={onEdit} size="sm" variant="secondary" className="flex-1 rounded-[8px] bg-surface-highest ghost-border border-none hover:bg-surface text-foreground font-bold text-xs">
            <Edit2 className="h-3 w-3 mr-2" />
            Edit
          </Button>
        )}
        {onTest && (
          <Button onClick={onTest} size="sm" variant="outline" className="flex-1 rounded-[8px] ghost-border hover:bg-primary/10 hover:text-primary transition-all font-bold text-xs">
            <Play className="h-3 w-3 mr-2" />
            Test
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={onDelete}
            size="sm"
            variant="ghost"
            className="rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
